using ChatAppServer.WebAPI.Dtos;
using ChatAppServer.WebAPI.Models;
using ChatAppServer.WebAPI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Net;
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

        public AuthController(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost]
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
            if (request.File != null)
            {
                avatarUrl = FileService.FileSaveToServer(request.File, "wwwroot/avatar/");
            }

            string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            User user = new()
            {
                Username = request.Username,
                FullName = request.FullName,
                Birthday = request.Birthday,
                Email = request.Email,
                Avatar = avatarUrl,
                PasswordHash = passwordHash,
                Status = "offline"
            };

            await _context.AddAsync(user, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            // Gửi email chào mừng cho người dùng
            SendWelcomeEmail(user.Email, user.Username);

            var result = new
            {
                user.Id,
                user.Username,
                user.FullName,
                user.Birthday,
                user.Email,
                user.Avatar,
                user.Status
            };

            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Login([FromForm] LoginDto request, CancellationToken cancellationToken)
        {
            User? user = await _context.Users.FirstOrDefaultAsync(p => p.Username == request.Username, cancellationToken);

            if (user is null)
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
                user.FullName,
                user.Birthday,
                user.Email,
                user.Avatar,
                user.Status,
            });
        }

        [HttpPost]
        public async Task<IActionResult> Logout([FromForm] Guid userId, CancellationToken cancellationToken)
        {
            User? user = await _context.Users.FirstOrDefaultAsync(p => p.Id == userId, cancellationToken);

            if (user is null)
            {
                return BadRequest(new { Message = "User not found!" });
            }

            user.Status = "offline";
            await _context.SaveChangesAsync(cancellationToken);

            return Ok(new { Message = "User logged out successfully." });
        }

        [HttpPost]
        public async Task<IActionResult> ForgotPassword([FromForm] ForgotPasswordDto request, CancellationToken cancellationToken)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username, cancellationToken);
            if (user == null)
            {
                return BadRequest(new { Message = "Username not found" });
            }

            var token = GenerateResetToken(user);

            // Send the email with the token
            SendResetEmail(user.Email, token);

            return Ok(new { Message = "Password reset email sent." });
        }

        [HttpPost]
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

            return Ok(new { Message = "Password has been reset." });
        }

        private string GenerateJwtToken(User user)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Username),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString())
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Issuer"],
                claims: claims,
                expires: DateTime.Now.AddHours(3),
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

        private void SendResetEmail(string email, string token)
        {
            var resetLink = $"{_configuration["AppSettings:ClientURL"]}/reset-password?token={token}";

            var resetMessage = $@"
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }}
            .container {{
                width: 100%;
                padding: 20px;
                background-color: #ffffff;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                border-radius: 10px;
                max-width: 600px;
                margin: 20px auto;
            }}
            .header {{
                background-color: #4CAF50;
                color: white;
                padding: 10px 0;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }}
            .content {{
                padding: 20px;
            }}
            .content h2 {{
                color: #333333;
            }}
            .content p {{
                line-height: 1.6;
                color: #666666;
            }}
            .footer {{
                margin-top: 20px;
                text-align: center;
                font-size: 12px;
                color: #999999;
            }}
            .footer a {{
                color: #4CAF50;
                text-decoration: none;
            }}
            .button {{
                display: inline-block;
                padding: 10px 20px;
                margin: 20px 0;
                font-size: 16px;
                color: #ffffff;
                background-color: #4CAF50;
                border-radius: 5px;
                text-decoration: none;
                color: white; /* Make sure the text color is white */
            }}
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>Password Reset Request</h1>
            </div>
            <div class='content'>
                <h2>Hello,</h2>
                <p>We received a request to reset your password. Click the button below to reset your password.</p>
                <p><a href='{resetLink}' class='button' style='color: white;'>Reset Password</a></p>
                <p>If you did not request a password reset, please ignore this email.</p>
                <br>
                <p>Best regards,</p>
                <p>The Harmony Team</p>
            </div>
            <div class='footer'>
                <p>&copy; {DateTime.Now.Year} Harmony. All rights reserved.</p>
                <p><a href='https://yourapp.com/privacy'>Privacy Policy</a> | <a href='https://yourapp.com/terms'>Terms of Service</a></p>
            </div>
        </div>
    </body>
    </html>";

            var mailMessage = new MailMessage
            {
                From = new MailAddress("no-reply@yourapp.com"),
                Subject = "Password Reset",
                Body = resetMessage,
                IsBodyHtml = true, // Set IsBodyHtml to true
            };
            mailMessage.To.Add(email);

            using var smtpClient = new SmtpClient(_configuration["Smtp:Host"], int.Parse(_configuration["Smtp:Port"]))
            {
                Credentials = new NetworkCredential(_configuration["Smtp:Username"], _configuration["Smtp:Password"]),
                EnableSsl = true
            };

            smtpClient.Send(mailMessage);
        }



        private bool IsValidEmail(string email)
        {
            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }

        private void SendWelcomeEmail(string email, string username)
        {
            var welcomeMessage = $@"
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }}
            .container {{
                width: 100%;
                padding: 20px;
                background-color: #ffffff;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                border-radius: 10px;
                max-width: 600px;
                margin: 20px auto;
            }}
            .header {{
                background-color: #4CAF50;
                color: white;
                padding: 10px 0;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }}
            .content {{
                padding: 20px;
            }}
            .content h2 {{
                color: #333333;
            }}
            .content p {{
                line-height: 1.6;
                color: #666666;
            }}
            .footer {{
                margin-top: 20px;
                text-align: center;
                font-size: 12px;
                color: #999999;
            }}
            .footer a {{
                color: #4CAF50;
                text-decoration: none;
            }}
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>Welcome to Harmony Chat</h1>
            </div>
            <div class='content'>
                <h2>Hello {username},</h2>
                <p>Thank you for registering at our site! We're excited to have you on board.</p>
                <p>If you have any questions, feel free to <a href='mailto:vietpha157@gmail.com'>contact us</a>.</p>
                <br>
                <p>Best regards,</p>
                <p>The Harmony Team</p>
            </div>
            <div class='footer'>
                <p>&copy; {DateTime.Now.Year} Harmony. All rights reserved.</p>
                <p><a href='https://yourapp.com/privacy'>Privacy Policy</a> | <a href='https://yourapp.com/terms'>Terms of Service</a></p>
            </div>
        </div>
    </body>
    </html>";

            var mailMessage = new MailMessage
            {
                From = new MailAddress("no-reply@yourapp.com"),
                Subject = "Welcome to Harmony",
                Body = welcomeMessage,
                IsBodyHtml = true, // Set IsBodyHtml to true
            };
            mailMessage.To.Add(email);

            using var smtpClient = new SmtpClient(_configuration["Smtp:Host"], int.Parse(_configuration["Smtp:Port"]))
            {
                Credentials = new NetworkCredential(_configuration["Smtp:Username"], _configuration["Smtp:Password"]),
                EnableSsl = true
            };

            smtpClient.Send(mailMessage);
        }
        [HttpPost]
        public async Task<IActionResult> ChangePassword([FromForm] ChangePasswordDto request, CancellationToken cancellationToken)
        {
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
            SendPasswordChangeEmail(user.Email, user.Username);

            return Ok(new { Message = "Password has been changed successfully." });
        }

        private void SendPasswordChangeEmail(string email, string username)
        {
            var changePasswordMessage = $@"
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f4f4f4;
            }}
            .container {{
                width: 100%;
                padding: 20px;
                background-color: #ffffff;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                border-radius: 10px;
                max-width: 600px;
                margin: 20px auto;
            }}
            .header {{
                background-color: #4CAF50;
                color: white;
                padding: 10px 0;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }}
            .content {{
                padding: 20px;
            }}
            .content h2 {{
                color: #333333;
            }}
            .content p {{
                line-height: 1.6;
                color: #666666;
            }}
            .footer {{
                margin-top: 20px;
                text-align: center;
                font-size: 12px;
                color: #999999;
            }}
            .footer a {{
                color: #4CAF50;
                text-decoration: none;
            }}
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h1>Password Changed</h1>
            </div>
            <div class='content'>
                <h2>Hello {username},</h2>
                <p>Your password has been changed successfully. If you did not make this change, please contact our support team immediately.</p>
                <br>
                <p>Best regards,</p>
                <p>The Harmony Team</p>
            </div>
            <div class='footer'>
                <p>&copy; {DateTime.Now.Year} Harmony. All rights reserved.</p>
                <p><a href='https://yourapp.com/privacy'>Privacy Policy</a> | <a href='https://yourapp.com/terms'>Terms of Service</a></p>
            </div>
        </div>
    </body>
    </html>";

            var mailMessage = new MailMessage
            {
                From = new MailAddress("no-reply@yourapp.com"),
                Subject = "Password Changed",
                Body = changePasswordMessage,
                IsBodyHtml = true,
            };
            mailMessage.To.Add(email);

            using var smtpClient = new SmtpClient(_configuration["Smtp:Host"], int.Parse(_configuration["Smtp:Port"]))
            {
                Credentials = new NetworkCredential(_configuration["Smtp:Username"], _configuration["Smtp:Password"]),
                EnableSsl = true
            };

            smtpClient.Send(mailMessage);
        }
    }
}