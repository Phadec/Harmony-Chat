using ChatAppServer.WebAPI.Dtos;
using ChatAppServer.WebAPI.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Mail;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;

namespace ChatAppServer.WebAPI.Services
{
    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;
        private readonly IBackgroundTaskQueue _taskQueue;
        private readonly ILogger<AuthService> _logger;

        public AuthService(ApplicationDbContext context, IConfiguration configuration, IEmailService emailService, IBackgroundTaskQueue taskQueue, ILogger<AuthService> logger)
        {
            _context = context;
            _configuration = configuration;
            _emailService = emailService;
            _taskQueue = taskQueue;
            _logger = logger;
        }

        public async Task<(bool Success, string Message, string? Token, User? User)> LoginAsync(LoginDto request, CancellationToken cancellationToken)
        {
            try
            {
                string usernameLowerCase = request.Username.ToLower();
                var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(p => p.Username == usernameLowerCase, cancellationToken);

                if (user == null)
                    return (false, "Username not found!", null, null);

                if (user.IsLocked)
                    return (false, "Your account has been locked.", null, null);

                bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
                if (!isPasswordValid)
                    return (false, "Password is incorrect!", null, null);

                user.Status = "online";
                _context.Users.Update(user);
                await _context.SaveChangesAsync(cancellationToken);

                var token = GenerateJwtToken(user);

                return (true, "Login successful", token, user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login for username: {Username}", request.Username);
                return (false, "An error occurred during login. Please try again later.", null, null);
            }
        }

        public async Task<(bool Success, string Message)> RegisterAsync(RegisterDto request, CancellationToken cancellationToken)
        {
            try
            {
                string firstName = NormalizeName(request.FirstName?.Trim() ?? string.Empty);
                string lastName = NormalizeName(request.LastName?.Trim() ?? string.Empty);

                if (!IsValidName(firstName) || !IsValidName(lastName))
                    return (false, "First name or last name contains invalid characters. Only letters and spaces are allowed.");

                if (firstName.Length == 0 || lastName.Length == 0)
                    return (false, "First name and last name cannot be empty.");

                if (request.Password.Length < 8 || !IsValidPassword(request.Password))
                    return (false, "Password must be at least 8 characters long and contain letters, numbers, and special characters.");

                if (request.Password != request.RetypePassword)
                    return (false, "Passwords do not match.");

                if (!IsValidEmail(request.Email))
                    return (false, "Invalid email format.");

                string usernameLowerCase = request.Username.ToLower();
                bool isNameExists = await _context.Users.AnyAsync(p => p.Username == usernameLowerCase, cancellationToken);
                if (isNameExists)
                    return (false, "Username already exists!");

                string avatarUrl = "avatars/default.jpg";
                if (request.File != null)
                {
                    try
                    {
                        var (savedFileName, _) = FileService.FileSaveToServer(request.File, "wwwroot/avatars/");
                        avatarUrl = Path.Combine("avatars", savedFileName).Replace("\\", "/");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error saving avatar file for user {Username} with email {Email}", request.Username, request.Email);
                        return (false, "Error saving avatar file. Please try again later.");
                    }
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
                    PasswordHash = passwordHash,
                    Token = token,
                    TokenExpiration = DateTime.UtcNow.AddMinutes(3)
                };

                await _context.PendingUsers.AddAsync(pendingUser, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);

                _taskQueue.QueueBackgroundWorkItem(async tokenCancellationToken =>
                {
                    try
                    {
                        await _emailService.SendEmailConfirmationTokenAsync(pendingUser.Id, pendingUser.Email, pendingUser.FirstName, pendingUser.LastName, token);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to send email confirmation for user {Username} with email {Email}", pendingUser.Username, pendingUser.Email);
                    }
                });

                return (true, "Registration successful. Please check your email to confirm your account.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred during registration for user {Username}", request.Username);
                return (false, "An error occurred during registration. Please try again later.");
            }
        }
        public async Task<(bool Success, string Message)> LogoutAsync(Guid userId, ClaimsPrincipal currentUser, CancellationToken cancellationToken)
        {
            try
            {
                var authenticatedUserId = currentUser.FindFirstValue(ClaimTypes.NameIdentifier);

                if (authenticatedUserId == null || userId.ToString() != authenticatedUserId)
                    return (false, "You are not authorized to log out this user.");

                var user = await _context.Users.FirstOrDefaultAsync(p => p.Id == userId, cancellationToken);
                if (user == null)
                    return (false, "User not found!");

                user.Status = "offline";
                _context.Users.Update(user);
                await _context.SaveChangesAsync(cancellationToken);

                var tokens = await _context.Tokens.Where(t => t.UserId == user.Id).ToListAsync(cancellationToken);
                _context.Tokens.RemoveRange(tokens);
                await _context.SaveChangesAsync(cancellationToken);

                return (true, "User logged out successfully.");
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database update error during logout for userId: {UserId}", userId);
                return (false, "An error occurred while updating the database. Please try again later.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unexpected error occurred during logout for userId: {UserId}", userId);
                return (false, "An unexpected error occurred. Please try again later.");
            }
        }
        public async Task<(bool Success, string Message)> ForgotPasswordAsync(ForgotPasswordDto request, CancellationToken cancellationToken)
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username, cancellationToken);
                if (user == null)
                {
                    return (false, "Username not found");
                }

                // Kiểm tra thời gian gửi email đặt lại mật khẩu gần nhất
                if (user.LastPasswordResetEmailSentTime != null &&
                    (DateTime.UtcNow - user.LastPasswordResetEmailSentTime.Value).TotalMinutes < 3)
                {
                    return (false, "Please wait at least 3 minutes before requesting another password reset email.");
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
                        _logger.LogError(ex, "Failed to send password reset email to {Email} for user {Username}.", user.Email, user.Username);
                    }
                });

                return (true, "Password reset email sent.");
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database update error during forgot password process for user {Username}.", request.Username);
                return (false, "An error occurred while updating the database. Please try again later.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unexpected error occurred during forgot password process for user {Username}.", request.Username);
                return (false, "An unexpected error occurred. Please try again later.");
            }
        }

        public async Task<(bool Success, string Message)> ConfirmEmailAsync(string token, CancellationToken cancellationToken)
        {
            try
            {
                var principal = GetPrincipalFromExpiredToken(token);
                if (principal == null)
                    return (false, "Invalid token.");

                var email = principal.FindFirst(ClaimTypes.Email)?.Value;
                if (email == null)
                    return (false, "Invalid token.");

                var pendingUser = await _context.PendingUsers.FirstOrDefaultAsync(u => u.Token == token && u.TokenExpiration >= DateTime.UtcNow, cancellationToken);
                if (pendingUser == null)
                    return (false, "User not found or token expired.");

                User user = new()
                {
                    Username = pendingUser.Username,
                    FirstName = pendingUser.FirstName,
                    LastName = pendingUser.LastName,
                    Birthday = pendingUser.Birthday,
                    Email = pendingUser.Email,
                    Avatar = pendingUser.Avatar,
                    PasswordHash = pendingUser.PasswordHash,
                    Status = "offline",
                    Role = "User",
                    IsEmailConfirmed = true,
                    TagName = GenerateUniqueTagName(pendingUser.FirstName, pendingUser.LastName)
                };

                await _context.Users.AddAsync(user, cancellationToken);
                _context.PendingUsers.Remove(pendingUser);
                await _context.SaveChangesAsync(cancellationToken);

                return (true, "Email confirmed successfully.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during email confirmation for token: {Token}", token);
                return (false, "An error occurred during email confirmation. Please try again later.");
            }
        }
        public async Task<(bool Success, string Message)> ResetPasswordAsync(ResetPasswordDto request, CancellationToken cancellationToken)
        {
            try
            {
                // Validate token và lấy thông tin user từ token
                var principal = GetPrincipalFromExpiredToken(request.Token);
                if (principal == null)
                    return (false, "Invalid token.");

                var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (userId == null)
                    return (false, "Invalid token.");

                var user = await _context.Users.FindAsync(new Guid(userId));
                if (user == null)
                    return (false, "User not found.");

                // Kiểm tra độ mạnh của mật khẩu mới
                if (request.NewPassword.Length < 8 || !IsValidPassword(request.NewPassword))
                    return (false, "Password must be at least 8 characters long and contain letters, numbers, and special characters.");

                // Kiểm tra khớp của ConfirmPassword
                if (request.NewPassword != request.ConfirmPassword)
                    return (false, "Passwords do not match.");

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
                        _logger.LogError(ex, "Failed to send password reset success email to {Email} for user {Username}.", user.Email, user.Username);
                    }
                });

                _logger.LogInformation("Password for user {UserId} has been reset successfully.", userId);

                return (true, "Password has been reset.");
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database update error while resetting password for user {UserId}.", request.Token);
                return (false, "An error occurred while updating the database. Please try again later.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unexpected error occurred while resetting password for user {UserId}.", request.Token);
                return (false, "An unexpected error occurred. Please try again later.");
            }
        }
        public async Task<(bool Success, string Message)> ChangePasswordAsync(ChangePasswordDto request, ClaimsPrincipal currentUser, CancellationToken cancellationToken)
        {
            try
            {
                // Lấy userId từ ClaimsPrincipal của người dùng hiện tại
                var authenticatedUserId = currentUser.FindFirstValue(ClaimTypes.NameIdentifier);

                // Kiểm tra userId hợp lệ
                if (authenticatedUserId == null || request.UserId.ToString() != authenticatedUserId)
                {
                    return (false, "You are not authorized to change the password for this user.");
                }

                // Tìm kiếm người dùng trong cơ sở dữ liệu
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);
                if (user == null)
                {
                    return (false, "User not found.");
                }

                // Kiểm tra mật khẩu hiện tại
                bool isCurrentPasswordValid = BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash);
                if (!isCurrentPasswordValid)
                {
                    return (false, "Current password is incorrect.");
                }

                // Kiểm tra mật khẩu mới không giống mật khẩu hiện tại
                bool isNewPasswordSameAsCurrent = BCrypt.Net.BCrypt.Verify(request.NewPassword, user.PasswordHash);
                if (isNewPasswordSameAsCurrent)
                {
                    return (false, "New password cannot be the same as the current password.");
                }

                // Kiểm tra độ mạnh của mật khẩu mới
                if (request.NewPassword.Length < 8 || !IsValidPassword(request.NewPassword))
                {
                    return (false, "New password must be at least 8 characters long and contain letters, numbers, and special characters.");
                }

                // Cập nhật mật khẩu người dùng
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
                _context.Users.Update(user);
                await _context.SaveChangesAsync(cancellationToken);

                // Gửi email xác nhận thay đổi mật khẩu thành công
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

                return (true, "Password has been changed successfully.");
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database update error while changing password for user {UserId}.", request.UserId);
                return (false, "An error occurred while updating the database. Please try again later.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unexpected error occurred while changing password for user {UserId}.", request.UserId);
                return (false, "An unexpected error occurred. Please try again later.");
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
        private string GenerateUniqueTagName(string firstName, string lastName)
        {
            // Loại bỏ dấu tiếng Việt
            firstName = RemoveDiacritics(firstName);
            lastName = RemoveDiacritics(lastName);

            // Loại bỏ khoảng trắng và chuyển thành chữ thường toàn bộ
            string baseTagName = $"@{firstName.Replace(" ", "").ToLower()}{lastName.Replace(" ", "").ToLower()}";
            string tagName = baseTagName;
            int counter = 100;

            // Tạo tag name duy nhất
            while (_context.Users.Any(u => u.TagName == tagName))
            {
                tagName = $"{baseTagName}{counter}".ToLower();
                counter++;
            }

            return tagName;
        }

        // Phương thức loại bỏ dấu tiếng Việt
        private string RemoveDiacritics(string text)
        {
            string normalizedString = text.Normalize(NormalizationForm.FormD);
            StringBuilder stringBuilder = new StringBuilder();

            foreach (char c in normalizedString)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                {
                    stringBuilder.Append(c);
                }
            }

            return stringBuilder.ToString().Normalize(NormalizationForm.FormC);
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
    }

}
