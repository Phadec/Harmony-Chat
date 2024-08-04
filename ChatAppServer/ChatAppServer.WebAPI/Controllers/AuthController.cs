using ChatAppServer.WebAPI.Dtos;
using ChatAppServer.WebAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ExternalFileService = GenericFileService.Files.FileService;

namespace ChatAppServer.WebAPI.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public sealed class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AuthController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> Register([FromForm] RegisterDto request, CancellationToken cancellationToken)
        {
            if (request.Password.Length < 8)
            {
                return BadRequest(new { Message = "Password must be at least 8 characters long." });
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

            return Ok(new
            {
                user.Id,
                user.Username,
                user.FullName,
                user.Birthday,
                user.Email,
                user.Avatar,
                user.Status
            });
        }
    }
}
