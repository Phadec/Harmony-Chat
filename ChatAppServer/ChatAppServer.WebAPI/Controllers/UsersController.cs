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

        [HttpGet("search")]
        public async Task<IActionResult> SearchUserByTagName(string tagName, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(tagName))
            {
                return BadRequest(new { message = "TagName is required" });
            }

            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null)
            {
                return Forbid("You are not authorized to search users.");
            }

            _logger.LogInformation($"Searching for user with tagName: {tagName}");

            // Ensure tagName starts with '@'
            if (!tagName.StartsWith("@"))
            {
                tagName = "@" + tagName;
            }

            // Tìm kiếm người dùng theo TagName
            var user = await _context.Users
                .Where(u => u.TagName.ToLower() == tagName.ToLower())
                .Select(u => new
                {
                    u.Id,
                    u.Username,
                    u.FirstName,
                    u.LastName,
                    u.Email,
                    u.Avatar,
                    u.Status,
                    u.TagName // Include TagName in the response
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (user == null)
            {
                _logger.LogWarning($"User with tagName {tagName} not found");
                return NotFound(new { message = "User not found" });
            }

            var authenticatedUserIdGuid = Guid.Parse(authenticatedUserId);

            // Kiểm tra xem người tìm kiếm có bị chặn bởi người dùng được tìm kiếm hoặc ngược lại hay không
            var isBlockedByUser = await _context.UserBlocks
                .AnyAsync(ub => ub.UserId == authenticatedUserIdGuid && ub.BlockedUserId == user.Id, cancellationToken);

            var isBlockedByTarget = await _context.UserBlocks
                .AnyAsync(ub => ub.UserId == user.Id && ub.BlockedUserId == authenticatedUserIdGuid, cancellationToken);

            if (isBlockedByUser || isBlockedByTarget)
            {
                _logger.LogWarning($"User with tagName {tagName} has blocked the authenticated user or vice versa");
                return NotFound(new { message = "User not found" });
            }

            _logger.LogInformation($"User with tagName {tagName} found");

            return Ok(user);
        }
        [HttpPut("{userId}/update-user")]
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

            bool emailChanged = false;
            bool tagNameChanged = false;

            // Update FirstName if provided
            if (!string.IsNullOrEmpty(request.FirstName))
            {
                user.FirstName = request.FirstName;
            }

            // Update LastName if provided
            if (!string.IsNullOrEmpty(request.LastName))
            {
                user.LastName = request.LastName;
            }

            // Update Birthday if provided
            if (request.Birthday != null)
            {
                user.Birthday = request.Birthday.Value;
            }

            // Update Email if provided
            if (!string.IsNullOrEmpty(request.Email) && user.Email != request.Email)
            {
                emailChanged = true;
                user.Email = request.Email;
            }

            // Update Avatar if a new file is provided
            if (request.AvatarFile != null)
            {
                // Check if the user has an existing avatar and delete it
                if (!string.IsNullOrEmpty(user.Avatar))
                {
                    var oldAvatarPath = Path.Combine("wwwroot", user.Avatar);
                    if (System.IO.File.Exists(oldAvatarPath))
                    {
                        System.IO.File.Delete(oldAvatarPath);
                    }
                }

                // Save the new avatar
                var (savedFileName, originalFileName) = FileService.FileSaveToServer(request.AvatarFile, "wwwroot/avatars/");
                user.Avatar = Path.Combine("avatars", savedFileName).Replace("\\", "/");
                user.OriginalAvatarFileName = originalFileName;
            }

            // Update TagName if provided
            if (!string.IsNullOrEmpty(request.TagName) && user.TagName != request.TagName)
            {
                tagNameChanged = true;
                var newTagName = request.TagName.ToLower();
                if (!newTagName.StartsWith("@"))
                {
                    newTagName = "@" + newTagName;
                }

                // Check if the newTagName contains more than one '@'
                if (newTagName.Count(c => c == '@') > 1)
                {
                    return BadRequest(new { Message = "TagName can only contain one '@' at the beginning." });
                }

                if (await _context.Users.AnyAsync(u => u.TagName == newTagName, cancellationToken))
                {
                    return BadRequest(new { Message = "TagName already exists. Please choose a different TagName." });
                }
                user.TagName = newTagName;
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
                user.OriginalAvatarFileName,
                user.TagName
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

        [HttpGet("{userId}/get-user-info")]
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
