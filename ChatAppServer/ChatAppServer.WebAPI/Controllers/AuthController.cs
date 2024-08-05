using ChatAppServer.WebAPI.Dtos;
using ChatAppServer.WebAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ExternalFileService = GenericFileService.Files.FileService;

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

            string avatar = request.File != null ? ExternalFileService.FileSaveToServer(request.File, "wwwroot/avatar/") : null;
            string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            User user = new()
            {
                Username = request.Username,
                FullName = request.FullName,
                Birthday = request.Birthday,
                Email = request.Email,
                Avatar = avatar,
                PasswordHash = passwordHash,
                Status = "offline"
            };

            await _context.AddAsync(user, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

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
                Token = token
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
    }
}
