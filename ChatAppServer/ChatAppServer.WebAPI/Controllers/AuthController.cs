using ChatAppServer.WebAPI.Dtos;
using ChatAppServer.WebAPI.Models;
using GenericFileService.Files;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
            bool isNameExists = await _context.Users.AnyAsync(p => p.Username == request.Username, cancellationToken);

            if (isNameExists)
            {
                return BadRequest(new { Message = "Username existed!" });
            }

            string avatar = request.File != null ? FileService.FileSaveToServer(request.File, "wwwroot/avatar/") : null;

            string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            User user = new()
            {
                Username = request.Username,
                FullName = request.FullName, // Thêm FullName
                Birthday = request.Birthday, // Thêm Birthday
                Email = request.Email, // Thêm Email
                Avatar = avatar,
                PasswordHash = passwordHash,
                Status = "offline" // Hoặc trạng thái mặc định khác nếu cần
            };

            await _context.AddAsync(user, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            return Ok(user);
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
                return BadRequest(new { Message = "Password incorrect!" });
            }

            user.Status = "online";

            await _context.SaveChangesAsync(cancellationToken);

            return Ok(user);
        }
    }
}
