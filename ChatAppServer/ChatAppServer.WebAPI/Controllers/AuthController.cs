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
        private readonly ILogger<AuthController> _logger;

        public AuthController(ApplicationDbContext context, IConfiguration configuration, IEmailService emailService, IBackgroundTaskQueue taskQueue, ILogger<AuthController> logger)
        {
            _context = context;
            _configuration = configuration;
            _emailService = emailService;
            _taskQueue = taskQueue;
            _logger = logger;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromForm] RegisterDto request, CancellationToken cancellationToken)
        {
            try
            {
                // Trim whitespace from FirstName and LastName
                string firstName = NormalizeName(request.FirstName?.Trim() ?? string.Empty);
                string lastName = NormalizeName(request.LastName?.Trim() ?? string.Empty);

                // Check if the first name or last name contains special characters
                if (!IsValidName(firstName) || !IsValidName(lastName))
                {
                    return BadRequest(new { Message = "First name or last name contains invalid characters. Only letters and spaces are allowed." });
                }

                if (firstName.Length == 0 || lastName.Length == 0)
                {
                    return BadRequest(new { Message = "First name and last name cannot be empty." });
                }

                if (request.Password.Length < 8 || !IsValidPassword(request.Password))
                {
                    return BadRequest(new { Message = "Password must be at least 8 characters long and contain letters, numbers, and special characters." });
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

                // Check if an email confirmation was sent recently
                var existingPendingUser = await _context.PendingUsers
                    .Where(u => u.Email == request.Email && u.Username == usernameLowerCase)
                    .OrderByDescending(u => u.TokenExpiration)
                    .FirstOrDefaultAsync(cancellationToken);

                if (existingPendingUser != null && (DateTime.UtcNow - existingPendingUser.TokenExpiration).TotalMinutes < 3)
                {
                    return BadRequest(new { Message = "Please wait at least 3 minutes before requesting another confirmation email." });
                }

                // Handle avatar
                string avatarUrl;
                string? originalAvatarFileName = null;
                if (request.File != null)
                {
                    try
                    {
                        var (savedFileName, originalFileName) = FileService.FileSaveToServer(request.File, "wwwroot/avatars/");
                        avatarUrl = Path.Combine("avatars", savedFileName).Replace("\\", "/");
                        originalAvatarFileName = originalFileName;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error saving avatar file for user {Username} with email {Email}", request.Username, request.Email);
                        return StatusCode(500, new { Message = "Error saving avatar file. Please try again later." });
                    }
                }
                else
                {
                    // Set default avatar if none is provided
                    avatarUrl = "avatars/default.jpg";
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
                    TokenExpiration = DateTime.UtcNow.AddMinutes(3) // Set the token expiration to 3 minutes from now
                };

                await _context.PendingUsers.AddAsync(pendingUser, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);

                // Queue background email task for sending the verification email
                _taskQueue.QueueBackgroundWorkItem(async tokenCancellationToken =>
                {
                    try
                    {
                        await _emailService.SendEmailConfirmationTokenAsync(pendingUser.Email, pendingUser.FirstName, pendingUser.LastName, token);
                    }
                    catch (Exception ex)
                    {
                        // Log error or handle as necessary
                        _logger.LogError(ex, "Failed to send email confirmation for user {Username} with email {Email}", pendingUser.Username, pendingUser.Email);
                    }
                });

                return Ok(new { Message = "Registration successful. Please check your email to confirm your account." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred during registration for user {Username}", request.Username);
                return StatusCode(500, new { Message = "An error occurred during registration. Please try again later." });
            }
        }



        // Helper method to normalize names (remove extra spaces)
        private string NormalizeName(string name)
        {
            // Replace multiple spaces with a single space
            return Regex.Replace(name, @"\s+", " ");
        }

        // Helper method to validate names
        private bool IsValidName(string name)
        {
            // Regular expression to allow letters from any language and spaces
            var regex = new Regex(@"^[\p{L}\s]+$", RegexOptions.Compiled);
            return regex.IsMatch(name);
        }


        // Helper method to validate passwords
        private bool IsValidPassword(string password)
        {
            // Password must contain at least one letter, one number, and one special character
            var regex = new Regex(@"^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$");
            return regex.IsMatch(password);
        }

        [HttpGet("confirm-email")]
        public async Task<IActionResult> ConfirmEmail(string token)
        {
            try
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
                    return BadRequest(new { Message = "User not found or token expired." });
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
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database update error while confirming email for token: {Token}", token);
                return StatusCode(500, new { Message = "An error occurred while updating the database. Please try again later." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unexpected error occurred while confirming email for token: {Token}", token);
                return StatusCode(500, new { Message = "An unexpected error occurred. Please try again later." });
            }
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
            try
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
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database update error during login for username: {Username}", request.Username);
                return StatusCode(500, new { Message = "An error occurred while updating the database. Please try again later." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unexpected error occurred during login for username: {Username}", request.Username);
                return StatusCode(500, new { Message = "An unexpected error occurred. Please try again later." });
            }
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout([FromForm] Guid userId, CancellationToken cancellationToken)
        {
            try
            {
                var authenticatedUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                var username = User.FindFirstValue(ClaimTypes.Name);

                if (authenticatedUserId == null || userId.ToString() != authenticatedUserId)
                {
                    return Forbid("You are not authorized to log out this user.");
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
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database update error during logout for userId: {UserId}", userId);
                return StatusCode(500, new { Message = "An error occurred while updating the database. Please try again later." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unexpected error occurred during logout for userId: {UserId}", userId);
                return StatusCode(500, new { Message = "An unexpected error occurred. Please try again later." });
            }
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto request, CancellationToken cancellationToken)
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username, cancellationToken);
                if (user == null)
                {
                    return BadRequest(new { Message = "Username not found" });
                }

                // Kiểm tra thời gian gửi email đặt lại mật khẩu gần nhất
                if (user.LastPasswordResetEmailSentTime != null &&
                    (DateTime.UtcNow - user.LastPasswordResetEmailSentTime.Value).TotalMinutes < 3)
                {
                    return BadRequest(new { Message = "Please wait at least 3 minutes before requesting another password reset email." });
                }

                // Tạo và gửi token
                var token = GenerateResetToken(user);

                // Cập nhật thời gian gửi email gần nhất
                user.LastPasswordResetEmailSentTime = DateTime.UtcNow;
                _context.Users.Update(user);
                await _context.SaveChangesAsync(cancellationToken);

                // Gửi email đặt lại mật khẩu
                _taskQueue.QueueBackgroundWorkItem(async ct =>
                {
                    try
                    {
                        await _emailService.SendResetEmail(user.Email, token);
                    }
                    catch (Exception ex)
                    {
                        // Log lỗi hoặc thực hiện các biện pháp khác
                        _logger.LogError(ex, "Failed to send password reset email to {Email} for user {Username}.", user.Email, user.Username);
                        // Có thể gửi phản hồi khác hoặc lưu thông tin này để thực hiện lại sau nếu cần
                    }
                });

                return Ok(new { Message = "Password reset email sent." });
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database update error during forgot password process for user {Username}.", request.Username);
                return StatusCode(500, new { Message = "An error occurred while updating the database. Please try again later." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unexpected error occurred during forgot password process for user {Username}.", request.Username);
                return StatusCode(500, new { Message = "An unexpected error occurred. Please try again later." });
            }
        }

        [HttpPost("reset-user-password")]
        public async Task<IActionResult> ResetPassword([FromForm] ResetPasswordDto request, CancellationToken cancellationToken)
        {
            try
            {
                // Xác thực token và lấy thông tin người dùng
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

                // Kiểm tra độ mạnh của mật khẩu mới
                if (request.NewPassword.Length < 8 || !IsValidPassword(request.NewPassword))
                {
                    return BadRequest(new { Message = "Password must be at least 8 characters long and contain letters, numbers, and special characters." });
                }

                // Kiểm tra khớp của ConfirmPassword
                if (request.NewPassword != request.ConfirmPassword)
                {
                    return BadRequest(new { Message = "Passwords do not match." });
                }

                // Cập nhật mật khẩu người dùng
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
                await _context.SaveChangesAsync(cancellationToken);

                // Gửi email thông báo thành công
                _taskQueue.QueueBackgroundWorkItem(async token =>
                {
                    try
                    {
                        await _emailService.SendResetSuccessEmail(user.Email, user.Username);
                    }
                    catch (Exception ex)
                    {
                        // Log lỗi hoặc thực hiện các biện pháp khác
                        _logger.LogError(ex, "Failed to send password reset success email to {Email} for user {Username}.", user.Email, user.Username);
                    }
                });

                _logger.LogInformation("Password for user {UserId} has been reset successfully.", userId);

                return Ok(new { Message = "Password has been reset." });
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database update error while resetting password for user {UserId}.", request.Token);
                return StatusCode(500, new { Message = "An error occurred while updating the database. Please try again later." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unexpected error occurred while resetting password for user {UserId}.", request.Token);
                return StatusCode(500, new { Message = "An unexpected error occurred. Please try again later." });
            }
        }

        [HttpPost("change-user-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto request, CancellationToken cancellationToken)
        {
            try
            {
                var authenticatedUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (authenticatedUserId == null || request.UserId.ToString() != authenticatedUserId)
                {
                    return Forbid();
                }

                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
                if (user == null)
                {
                    return NotFound(new { Message = "User not found." });
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

                if (request.NewPassword.Length < 8 || !IsValidPassword(request.NewPassword))
                {
                    return BadRequest(new { Message = "New password must be at least 8 characters long and contain letters, numbers, and special characters." });
                }

                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
                await _context.SaveChangesAsync(cancellationToken);

                _taskQueue.QueueBackgroundWorkItem(async token =>
                {
                    try
                    {
                        await _emailService.SendPasswordChangeEmail(user.Email, user.Username);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to send password change email to {Email} for user {Username}.", user.Email, user.Username);
                    }
                });

                _logger.LogInformation("Password for user {UserId} has been changed successfully.", user.Id);
                return Ok(new { Message = "Password has been changed successfully." });
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database update error while changing password for user {UserId}.", request.UserId);
                return StatusCode(500, new { Message = "An error occurred while updating the database. Please try again later." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unexpected error occurred while changing password for user {UserId}.", request.UserId);
                return StatusCode(500, new { Message = "An unexpected error occurred. Please try again later." });
            }
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
