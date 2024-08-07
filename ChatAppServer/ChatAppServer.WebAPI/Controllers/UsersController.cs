using ChatAppServer.WebAPI.Dtos;
using ChatAppServer.WebAPI.Models;
using ChatAppServer.WebAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ChatAppServer.WebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<UsersController> _logger;
        private readonly IEmailService _emailService;

        public UsersController(ApplicationDbContext context, ILogger<UsersController> logger, IEmailService emailService)
        {
            _context = context;
            _logger = logger;
            _emailService = emailService;
        }

        [Authorize(Roles = "Admin")]
        [HttpGet("getusers")]
        public async Task<IActionResult> GetUsers(CancellationToken cancellationToken)
        {
            var users = await _context.Users
                .OrderBy(p => p.Username)
                .Select(p => new
                {
                    p.Id,
                    p.Username,
                    p.FirstName,
                    p.LastName,
                    p.Birthday,
                    p.Email,
                    p.Avatar,
                    p.Status
                })
                .ToListAsync(cancellationToken);

            return Ok(users);
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchUserByUsername(string username, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(username))
            {
                return BadRequest(new { message = "Username is required" });
            }

            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null)
            {
                return Forbid("You are not authorized to search users.");
            }

            _logger.LogInformation($"Searching for user with username: {username}");

            var user = await _context.Users
                .Where(u => u.Username.ToLower() == username.ToLower())
                .Select(u => new
                {
                    u.Id,
                    u.Username,
                    u.FirstName,
                    u.LastName,
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
            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null || userId.ToString() != authenticatedUserId)
            {
                return Forbid("You are not authorized to update this user.");
            }

            var user = await _context.Users.FindAsync(new object[] { userId }, cancellationToken);

            if (user == null)
            {
                return NotFound("User not found");
            }

            bool emailChanged = user.Email != request.Email;

            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.Birthday = request.Birthday;
            user.Email = request.Email;

            if (request.AvatarFile != null)
            {
                var (savedFileName, originalFileName) = FileService.FileSaveToServer(request.AvatarFile, "wwwroot/avatar/");
                user.Avatar = Path.Combine("avatar", savedFileName).Replace("\\", "/");
                user.OriginalAvatarFileName = originalFileName;
            }

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation($"User {userId} information updated");

            if (emailChanged)
            {
                await _emailService.SendEmailConfirmationAsync(user.Email, user.FirstName, user.LastName);
            }

            return Ok(new
            {
                Message = "User information updated successfully",
                user.Id,
                user.Username,
                user.FirstName,
                user.LastName,
                user.Birthday,
                user.Email,
                user.Avatar,
                user.OriginalAvatarFileName
            });
        }

        [HttpPost("{userId}/update-status")]
        public async Task<IActionResult> UpdateStatus(Guid userId, [FromForm] string status, CancellationToken cancellationToken)
        {
            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null || userId.ToString() != authenticatedUserId)
            {
                return Forbid("You are not authorized to update this user's status.");
            }

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

        [HttpPost("{userId}/update-status-visibility")]
        public async Task<IActionResult> UpdateStatusVisibility(Guid userId, [FromForm] bool showOnlineStatus, CancellationToken cancellationToken)
        {
            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null || userId.ToString() != authenticatedUserId)
            {
                return Forbid("You are not authorized to update this user's status visibility.");
            }

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

        [HttpGet("{userId}/status")]
        public async Task<IActionResult> GetStatus(Guid userId, CancellationToken cancellationToken)
        {
            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null || userId.ToString() != authenticatedUserId)
            {
                return Forbid("You are not authorized to view this user's status.");
            }

            var user = await _context.Users.FindAsync(new object[] { userId }, cancellationToken);

            if (user == null)
            {
                return NotFound("User not found");
            }

            return Ok(new { user.Status });
        }

        [HttpGet("{userId}")]
        public async Task<IActionResult> GetUserInfo(Guid userId, CancellationToken cancellationToken)
        {
            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null || userId.ToString() != authenticatedUserId)
            {
                return Forbid("You are not authorized to view this user's info.");
            }

            var user = await _context.Users.FindAsync(new object[] { userId }, cancellationToken);

            if (user == null)
            {
                return NotFound("User not found");
            }

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
                user.ShowOnlineStatus
            });
        }
    }
}
