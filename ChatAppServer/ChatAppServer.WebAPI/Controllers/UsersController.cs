using ChatAppServer.WebAPI.Dtos;
using ChatAppServer.WebAPI.Models;
using ChatAppServer.WebAPI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChatAppServer.WebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<UsersController> _logger;

        public UsersController(ApplicationDbContext context, ILogger<UsersController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("getusers")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _context.Users
                .OrderBy(p => p.Username)
                .Select(p => new
                {
                    p.Id,
                    p.Username,
                    p.FullName,
                    p.Birthday,
                    p.Email,
                    p.Avatar,
                    p.Status
                })
                .ToListAsync();

            return Ok(users);
        }

        // Tìm kiếm người dùng theo tên người dùng
        [HttpGet("search")]
        public async Task<IActionResult> SearchUserByUsername(string username, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(username))
            {
                return BadRequest(new { message = "Username is required" });
            }

            _logger.LogInformation($"Searching for user with username: {username}");

            var user = await _context.Users
                .Where(u => u.Username.ToLower() == username.ToLower())
                .Select(u => new
                {
                    u.Id,
                    u.Username,
                    u.FullName,
                    u.Email,
                    u.Avatar,
                    u.Status
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (user == null)
            {
                _logger.LogWarning($"User with username {username} not found");
                return NotFound(new { message = "User not found" });
            }

            _logger.LogInformation($"User with username {username} found");

            return Ok(user);
        }

        [HttpPut("{userId}")]
        public async Task<IActionResult> UpdateUser(Guid userId, [FromForm] UpdateUserDto request, CancellationToken cancellationToken)
        {
            var user = await _context.Users.FindAsync(new object[] { userId }, cancellationToken);

            if (user == null)
            {
                return NotFound("User not found");
            }

            user.FullName = request.FullName;
            user.Birthday = request.Birthday;
            user.Email = request.Email;

            // Xử lý avatar
            if (request.AvatarFile != null)
            {
                var (savedFileName, originalFileName) = FileService.FileSaveToServer(request.AvatarFile, "wwwroot/avatar/");
                user.Avatar = Path.Combine("avatar", savedFileName).Replace("\\", "/"); // Tạo đường dẫn tương đối từ tên tệp và thay thế gạch chéo ngược bằng gạch chéo
                user.OriginalAvatarFileName = originalFileName;
            }

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation($"User {userId} information updated");

            return Ok(new
            {
                Message = "User information updated successfully",
                user.Id,
                user.Username,
                user.FullName,
                user.Birthday,
                user.Email,
                user.Avatar,
                user.OriginalAvatarFileName
            });
        }



        // Cập nhật trạng thái hoạt động của người dùng
        [HttpPost("{userId}/update-status")]
        public async Task<IActionResult> UpdateStatus(Guid userId, [FromForm] string status, CancellationToken cancellationToken)
        {
            var validStatuses = new List<string> { "online", "offline" };

            if (!validStatuses.Contains(status.ToLower()))
            {
                return BadRequest(new { Message = "Invalid status. Status must be 'online' or 'offline'." });
            }

            var user = await _context.Users.FindAsync(new object[] { userId }, cancellationToken);

            if (user == null)
            {
                return NotFound("User not found");
            }

            user.Status = status.ToLower();
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation($"User {userId} status updated to {status}");

            return Ok(new { Message = "Status updated successfully", user.Status });
        }

        // Cập nhật hiển thị trạng thái hoạt động
        [HttpPost("{userId}/update-status-visibility")]
        public async Task<IActionResult> UpdateStatusVisibility(Guid userId, [FromForm] bool showOnlineStatus, CancellationToken cancellationToken)
        {
            var user = await _context.Users.FindAsync(new object[] { userId }, cancellationToken);

            if (user == null)
            {
                return NotFound("User not found");
            }

            user.ShowOnlineStatus = showOnlineStatus;
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation($"User {userId} show online status updated to {showOnlineStatus}");

            return Ok(new { Message = "Status visibility updated successfully", user.ShowOnlineStatus });
        }

        // Lấy trạng thái hoạt động của người dùng
        [HttpGet("{userId}/status")]
        public async Task<IActionResult> GetStatus(Guid userId, CancellationToken cancellationToken)
        {
            var user = await _context.Users.FindAsync(new object[] { userId }, cancellationToken);

            if (user == null)
            {
                return NotFound("User not found");
            }

            return Ok(new { user.Status });
        }

        // Lấy thông tin người dùng cùng trạng thái
        [HttpGet("{userId}")]
        public async Task<IActionResult> GetUserInfo(Guid userId, CancellationToken cancellationToken)
        {
            var user = await _context.Users.FindAsync(new object[] { userId }, cancellationToken);

            if (user == null)
            {
                return NotFound("User not found");
            }

            return Ok(new
            {
                user.Id,
                user.Username,
                user.FullName,
                user.Birthday,
                user.Email,
                user.Avatar,
                user.Status,
                user.ShowOnlineStatus
            });
        }

    }
}
