using ChatAppServer.WebAPI.Dtos;
using ChatAppServer.WebAPI.Models;
using ChatAppServer.WebAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Mail;
using System.Security.Claims;
using System.Text;

namespace ChatAppServer.WebAPI.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public sealed class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;
        private readonly IBackgroundTaskQueue _taskQueue;
        public AuthController(ApplicationDbContext context, IConfiguration configuration, IEmailService emailService, IBackgroundTaskQueue taskQueue)
        {
            _context = context;
            _configuration = configuration;
            _emailService = emailService;
            _taskQueue = taskQueue;
        }

        [HttpPost("RegisterUser")]
        public async Task<IActionResult> Register([FromForm] RegisterDto request, CancellationToken cancellationToken)
        {
            if (request.Password.Length < 8)
            {
                return BadRequest(new { Message = "Password must be at least 8 characters long." });
            }

            if (!IsValidEmail(request.Email))
            {
                return BadRequest(new { Message = "Invalid email format." });
            }

            bool isNameExists = await _context.Users.AnyAsync(p => p.Username == request.Username, cancellationToken);
            if (isNameExists)
            {
                return BadRequest(new { Message = "Username already exists!" });
            }

            // Xử lý avatar
            string? avatarUrl = null;
            string? originalAvatarFileName = null;
            if (request.File != null)
            {
                var (savedFileName, originalFileName) = FileService.FileSaveToServer(request.File, "wwwroot/avatar/");
                avatarUrl = Path.Combine("avatar", savedFileName).Replace("\\", "/");
                originalAvatarFileName = originalFileName;
            }

            string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            User user = new()
            {
                Username = request.Username,
                FirstName = request.FirstName,
                LastName = request.LastName,
                Birthday = request.Birthday,
                Email = request.Email,
                Avatar = avatarUrl,
                OriginalAvatarFileName = originalAvatarFileName,
                PasswordHash = passwordHash,
                Status = "offline",
                Role = "User" // Thiết lập vai trò mặc định là "User"
            };

            await _context.AddAsync(user, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            _taskQueue.QueueBackgroundWorkItem(async token =>
            {
                await _emailService.SendWelcomeEmail(user.Email, user.Username);
            });

            var result = new
            {
                user.Id,
                user.Username,
                user.FirstName,
                user.LastName,
                user.Birthday,
                user.Email,
                user.Avatar,
                user.OriginalAvatarFileName,
                user.Status,
                user.Role
            };

            return Ok(result);
        }


        [HttpPost("UserLogin")]
        public async Task<IActionResult> Login([FromForm] LoginDto request, CancellationToken cancellationToken)
        {
            var user = await _context.Users.FirstOrDefaultAsync(p => p.Username == request.Username, cancellationToken);

            if (user == null)
            {
                return BadRequest(new { Message = "Username not found!" });
            }

            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
            if (!isPasswordValid)
            {
                return BadRequest(new { Message = "Password is incorrect!" });
            }

            user.Status = "online";
            await _context.SaveChangesAsync(cancellationToken);

            var token = GenerateJwtToken(user);

            return Ok(new
            {
                user.Id,
                user.Username,
                user.FirstName,
                user.LastName,
                user.Birthday,
                user.Email,
                user.Avatar,
                user.Status,
                Token = token
            });
        }



        [HttpPost("UserLogout")]
        [Authorize]
        public async Task<IActionResult> Logout([FromForm] Guid userId, CancellationToken cancellationToken)
        {
            var authenticatedUserId = User.FindFirstValue(ClaimTypes.NameIdentifier); // Sẽ trả về UserId sau khi sửa
            var username = User.FindFirstValue(ClaimTypes.Name); // Trả về Username

            // In ra console để kiểm tra
            Console.WriteLine($"Authenticated UserId: {authenticatedUserId}");
            Console.WriteLine($"Authenticated Username: {username}");
            Console.WriteLine($"Request UserId: {userId}");

            // So sánh UserId từ token và UserId từ yêu cầu
            if (authenticatedUserId == null || userId.ToString() != authenticatedUserId)
            {
                return Forbid();
            }

            User? user = await _context.Users.FirstOrDefaultAsync(p => p.Id == userId, cancellationToken);
            if (user == null)
            {
                return BadRequest(new { Message = "User not found!" });
            }

            user.Status = "offline";
            await _context.SaveChangesAsync(cancellationToken);

            var tokens = await _context.Tokens.Where(t => t.UserId == user.Id).ToListAsync(cancellationToken);
            _context.Tokens.RemoveRange(tokens);
            await _context.SaveChangesAsync(cancellationToken);

            return Ok(new { Message = "User logged out successfully." });
        }

        [HttpPost("ForgotPassword")]
        public async Task<IActionResult> ForgotPassword([FromForm] ForgotPasswordDto request, CancellationToken cancellationToken)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username, cancellationToken);
            if (user == null)
            {
                return BadRequest(new { Message = "Username not found" });
            }

            var token = GenerateResetToken(user);

            // Send the email with the token
            _taskQueue.QueueBackgroundWorkItem(async ct =>
            {
                await _emailService.SendResetEmail(user.Email, token);
            });
            return Ok(new { Message = "Password reset email sent." });
        }

        [HttpPost("ResetUserPassword")]
        public async Task<IActionResult> ResetPassword([FromForm] ResetPasswordDto request, CancellationToken cancellationToken)
        {
            var principal = GetPrincipalFromExpiredToken(request.Token);
            if (principal == null)
            {
                return BadRequest(new { Message = "Invalid token." });
            }

            var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null)
            {
                return BadRequest(new { Message = "Invalid token." });
            }

            var user = await _context.Users.FindAsync(new Guid(userId));
            if (user == null)
            {
                return BadRequest(new { Message = "User not found." });
            }

            if (request.NewPassword.Length < 8)
            {
                return BadRequest(new { Message = "Password must be at least 8 characters long." });
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            await _context.SaveChangesAsync(cancellationToken);

            // Gửi email thông báo đặt lại mật khẩu thành công
            _taskQueue.QueueBackgroundWorkItem(async token =>
            {
                await _emailService.SendResetSuccessEmail(user.Email, user.Username);
            });

            return Ok(new { Message = "Password has been reset." });
        }

        [HttpPost("ChangeUserPassword")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromForm] ChangePasswordDto request, CancellationToken cancellationToken)
        {
            // Lấy userId từ token đã xác thực
            var authenticatedUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (authenticatedUserId == null || request.UserId.ToString() != authenticatedUserId)
            {
                return Forbid();
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
            if (user == null)
            {
                return BadRequest(new { Message = "User not found." });
            }

            bool isCurrentPasswordValid = BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash);
            if (!isCurrentPasswordValid)
            {
                return BadRequest(new { Message = "Current password is incorrect." });
            }

            if (request.NewPassword.Length < 8)
            {
                return BadRequest(new { Message = "New password must be at least 8 characters long." });
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            await _context.SaveChangesAsync(cancellationToken);

            // Send email notification
            _taskQueue.QueueBackgroundWorkItem(async token =>
            {
                await _emailService.SendPasswordChangeEmail(user.Email, user.Username);
            });

            return Ok(new { Message = "Password has been changed successfully." });
        }

        private string GenerateJwtToken(User user)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new Claim(ClaimTypes.Name, user.Username),
        new Claim(ClaimTypes.Role, user.Role), // Thêm vai trò của người dùng vào claim
        new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
    };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Issuer"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(3),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private string GenerateResetToken(User user)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString())
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Issuer"],
                claims: claims,
                expires: DateTime.Now.AddMinutes(30),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private ClaimsPrincipal GetPrincipalFromExpiredToken(string token)
        {
            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"])),
                ValidateLifetime = false,
                ValidIssuer = _configuration["Jwt:Issuer"],
                ValidAudience = _configuration["Jwt:Issuer"]
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            SecurityToken securityToken;
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out securityToken);
            var jwtSecurityToken = securityToken as JwtSecurityToken;

            if (jwtSecurityToken == null || !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
                throw new SecurityTokenException("Invalid token");

            // Logging các claims để kiểm tra
            foreach (var claim in principal.Claims)
            {
                Console.WriteLine($"Claim Type: {claim.Type}, Claim Value: {claim.Value}");
            }

            return principal;
        }

        private bool IsValidEmail(string email)
        {
            try
            {
                var addr = new MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }
    }
}
