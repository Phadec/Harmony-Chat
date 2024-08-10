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
using System.Text.RegularExpressions;

namespace ChatAppServer.WebAPI.Controllers
{
    [Route("api/[controller]")]
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

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromForm] RegisterDto request, CancellationToken cancellationToken)
        {
            // Trim whitespace from FirstName and LastName
            string firstName = request.FirstName?.Trim() ?? string.Empty;
            string lastName = request.LastName?.Trim() ?? string.Empty;

            // Check if the first name or last name contains special characters
            if (!IsValidName(firstName) || !IsValidName(lastName))
            {
                return BadRequest(new { Message = "First name or last name contains invalid characters. Only letters and spaces are allowed." });
            }

            if (firstName.Length == 0 || lastName.Length == 0)
            {
                return BadRequest(new { Message = "First name and last name cannot be empty." });
            }

            if (request.Password.Length < 8)
            {
                return BadRequest(new { Message = "Password must be at least 8 characters long." });
            }

            if (request.Password != request.RetypePassword)
            {
                return BadRequest(new { Message = "Passwords do not match." });
            }

            if (!IsValidEmail(request.Email))
            {
                return BadRequest(new { Message = "Invalid email format." });
            }

            string usernameLowerCase = request.Username.ToLower();
            bool isNameExists = await _context.Users.AnyAsync(p => p.Username == usernameLowerCase, cancellationToken);
            if (isNameExists)
            {
                return BadRequest(new { Message = "Username already exists!" });
            }

            // Handle avatar
            string? avatarUrl = null;
            string? originalAvatarFileName = null;
            if (request.File != null)
            {
                var (savedFileName, originalFileName) = FileService.FileSaveToServer(request.File, "wwwroot/avatars/");
                avatarUrl = Path.Combine("avatars", savedFileName).Replace("\\", "/");
                originalAvatarFileName = originalFileName;
            }

            string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            var token = GenerateEmailVerificationToken(request.Email);

            PendingUser pendingUser = new()
            {
                Id = Guid.NewGuid(),
                Username = usernameLowerCase,
                FirstName = firstName,
                LastName = lastName,
                Birthday = request.Birthday,
                Email = request.Email,
                Avatar = avatarUrl,
                OriginalAvatarFileName = originalAvatarFileName,
                PasswordHash = passwordHash,
                Token = token,
                TokenExpiration = DateTime.UtcNow.AddHours(3)
            };

            await _context.PendingUsers.AddAsync(pendingUser, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            // Queue background email task for sending the verification email
            _taskQueue.QueueBackgroundWorkItem(async tokenCancellationToken =>
            {
                await _emailService.SendEmailConfirmationTokenAsync(pendingUser.Email, pendingUser.FirstName, pendingUser.LastName, token);
            });

            return Ok(new { Message = "Registration successful. Please check your email to confirm your account." });
        }

        // Helper method to validate names
        private bool IsValidName(string name)
        {
            // Regular expression to allow only letters and spaces
            var regex = new Regex(@"^[a-zA-Z\s]+$");
            return regex.IsMatch(name);
        }


        [HttpGet("confirm-email")]
        public async Task<IActionResult> ConfirmEmail(string token)
        {
            var principal = GetPrincipalFromExpiredToken(token);
            if (principal == null)
            {
                return BadRequest(new { Message = "Invalid token." });
            }

            var email = principal.FindFirst(ClaimTypes.Email)?.Value;
            if (email == null)
            {
                return BadRequest(new { Message = "Invalid token." });
            }

            var pendingUser = await _context.PendingUsers.FirstOrDefaultAsync(u => u.Token == token && u.TokenExpiration >= DateTime.UtcNow);
            if (pendingUser == null)
            {
                return BadRequest(new { Message = "User not found." });
            }

            User user = new()
            {
                Username = pendingUser.Username,
                FirstName = pendingUser.FirstName,
                LastName = pendingUser.LastName,
                Birthday = pendingUser.Birthday,
                Email = pendingUser.Email,
                Avatar = pendingUser.Avatar,
                OriginalAvatarFileName = pendingUser.OriginalAvatarFileName,
                PasswordHash = pendingUser.PasswordHash,
                Status = "offline",
                Role = "User",
                IsEmailConfirmed = true,
                TagName = GenerateUniqueTagName(pendingUser.FirstName, pendingUser.LastName) // Generate unique TagName
            };

            await _context.Users.AddAsync(user);
            _context.PendingUsers.Remove(pendingUser);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Email confirmed successfully." });
        }

        private string GenerateUniqueTagName(string firstName, string lastName)
        {
            string baseTagName = $"@{firstName}{lastName}".ToLower();
            string tagName = baseTagName;
            int counter = 100;

            while (_context.Users.Any(u => u.TagName == tagName))
            {
                tagName = $"{baseTagName}{counter}".ToLower();
                counter++;
            }

            return tagName;
        }

        private string GenerateEmailVerificationToken(string email)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
        new Claim(ClaimTypes.Email, email)
    };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Issuer"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(3),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromForm] LoginDto request, CancellationToken cancellationToken)
        {
            string usernameLowerCase = request.Username.ToLower();
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(p => p.Username == usernameLowerCase, cancellationToken);

            if (user == null)
            {
                return BadRequest(new { Message = "Username not found!" });
            }

            if (user.IsLocked)
            {
                return Unauthorized(new { Message = "Your account has been locked." });
            }

            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
            if (!isPasswordValid)
            {
                return BadRequest(new { Message = "Password is incorrect!" });
            }

            user.Status = "online";
            _context.Users.Update(user);
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
                user.TagName,
                Token = token
            });
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout([FromForm] Guid userId, CancellationToken cancellationToken)
        {
            var authenticatedUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var username = User.FindFirstValue(ClaimTypes.Name);

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
            _context.Users.Update(user);
            await _context.SaveChangesAsync(cancellationToken);

            var tokens = await _context.Tokens.Where(t => t.UserId == user.Id).ToListAsync(cancellationToken);
            _context.Tokens.RemoveRange(tokens);
            await _context.SaveChangesAsync(cancellationToken);

            return Ok(new { Message = "User logged out successfully." });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto request, CancellationToken cancellationToken)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username, cancellationToken);
            if (user == null)
            {
                return BadRequest(new { Message = "Username not found" });
            }

            var token = GenerateResetToken(user);

            _taskQueue.QueueBackgroundWorkItem(async ct =>
            {
                await _emailService.SendResetEmail(user.Email, token);
            });
            return Ok(new { Message = "Password reset email sent." });
        }

        [HttpPost("reset-user-password")]
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

            // Kiểm tra ConfirmPassword
            if (request.NewPassword != request.ConfirmPassword)
            {
                return BadRequest(new { Message = "Passwords do not match." });
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            await _context.SaveChangesAsync(cancellationToken);

            _taskQueue.QueueBackgroundWorkItem(async token =>
            {
                await _emailService.SendResetSuccessEmail(user.Email, user.Username);
            });

            return Ok(new { Message = "Password has been reset." });
        }


        [HttpPost("change-user-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromForm] ChangePasswordDto request, CancellationToken cancellationToken)
        {
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

            // Check if the new password is the same as the current password
            bool isNewPasswordSameAsCurrent = BCrypt.Net.BCrypt.Verify(request.NewPassword, user.PasswordHash);
            if (isNewPasswordSameAsCurrent)
            {
                return BadRequest(new { Message = "New password cannot be the same as the current password." });
            }

            if (request.NewPassword.Length < 8)
            {
                return BadRequest(new { Message = "New password must be at least 8 characters long." });
            }

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            await _context.SaveChangesAsync(cancellationToken);

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
                new Claim(ClaimTypes.Role, user.Role),
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
