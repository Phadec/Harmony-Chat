using ChatAppServer.WebAPI.Dtos;
using ChatAppServer.WebAPI.Models;
using ChatAppServer.WebAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net.Mail;
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
            try
            {
                // Validate the tagName
                if (string.IsNullOrWhiteSpace(tagName))
                {
                    return BadRequest(new { message = "TagName is required" });
                }

                // Authenticate the current user
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

                // Find the user by TagName
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
                        u.TagName
                    })
                    .FirstOrDefaultAsync(cancellationToken);

                if (user == null)
                {
                    _logger.LogWarning($"User with tagName {tagName} not found");
                    return NotFound(new { message = "User not found" });
                }

                var authenticatedUserIdGuid = Guid.Parse(authenticatedUserId);

                // Check if the authenticated user is blocked by or has blocked the searched user
                var isBlockedByUser = await _context.UserBlocks
                    .AnyAsync(ub => ub.UserId == authenticatedUserIdGuid && ub.BlockedUserId == user.Id, cancellationToken);

                var isBlockedByTarget = await _context.UserBlocks
                    .AnyAsync(ub => ub.UserId == user.Id && ub.BlockedUserId == authenticatedUserIdGuid, cancellationToken);

                if (isBlockedByUser || isBlockedByTarget)
                {
                    _logger.LogWarning($"User with tagName {tagName} has blocked the authenticated user or vice versa");
                    return NotFound(new { message = "User not found" });
                }

                // Check if the authenticated user has sent a friend request to the searched user
                var friendRequest = await _context.FriendRequests
                    .FirstOrDefaultAsync(fr => fr.SenderId == authenticatedUserIdGuid && fr.ReceiverId == user.Id && fr.Status == "Pending", cancellationToken);

                var response = new
                {
                    user.Id,
                    user.Username,
                    user.FirstName,
                    user.LastName,
                    user.Email,
                    user.Avatar,
                    user.Status,
                    user.TagName,
                    HasSentRequest = friendRequest != null,
                    RequestId = friendRequest?.Id // Returns null if no friend request was sent
                };

                _logger.LogInformation($"User with tagName {tagName} found with friend request status");

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while searching for user with tagName {TagName}", tagName);
                return StatusCode(500, new { message = "An error occurred while processing your request." });
            }
        }

        [HttpPut("{userId}/update-user")]
        public async Task<IActionResult> UpdateUser(Guid userId, [FromForm] UpdateUserDto request, CancellationToken cancellationToken)
        {
            try
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
                if (!string.IsNullOrEmpty(request.Email) && !request.Email.Equals(user.Email, StringComparison.OrdinalIgnoreCase))
                {
                    if (!IsValidEmail(request.Email))
                    {
                        return BadRequest(new { Message = "Invalid email format." });
                    }
                    emailChanged = true;
                    user.Email = request.Email;
                }

                // Update Avatar if a new file is provided
                if (request.AvatarFile != null)
                {
                    if (request.AvatarFile.Length > 5 * 1024 * 1024) // Giới hạn 5MB
                    {
                        return BadRequest(new { Message = "Avatar file size exceeds the limit of 5MB." });
                    }

                    var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
                    var fileExtension = Path.GetExtension(request.AvatarFile.FileName).ToLower();

                    if (!allowedExtensions.Contains(fileExtension))
                    {
                        return BadRequest(new { Message = "Invalid file format. Only JPG and PNG are allowed." });
                    }

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
                if (!string.IsNullOrEmpty(request.TagName) && !request.TagName.Equals(user.TagName, StringComparison.OrdinalIgnoreCase))
                {
                    tagNameChanged = true;
                    var newTagName = request.TagName.StartsWith("@") ? request.TagName : "@" + request.TagName;

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
            catch (Exception ex)
            {
                _logger.LogError(ex, $"An error occurred while updating user {userId}");
                return StatusCode(500, "An error occurred while updating the user. Please try again later.");
            }
        }


        [HttpPost("{userId}/update-status")]
        public async Task<IActionResult> UpdateStatus(Guid userId, [FromForm] string status, CancellationToken cancellationToken)
        {
            try
            {
                // Xác thực người dùng hiện tại
                var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (authenticatedUserId == null || userId.ToString() != authenticatedUserId)
                {
                    return Forbid("You are not authorized to update this user's status.");
                }

                // Xác định các trạng thái hợp lệ
                var validStatuses = new List<string> { "online", "offline" };
                if (string.IsNullOrWhiteSpace(status) || !validStatuses.Contains(status.ToLower()))
                {
                    return BadRequest(new { Message = "Invalid status. Status must be 'online' or 'offline'." });
                }

                // Tìm kiếm người dùng trong cơ sở dữ liệu
                var user = await _context.Users.FindAsync(new object[] { userId }, cancellationToken);
                if (user == null)
                {
                    return NotFound("User not found");
                }

                // Cập nhật trạng thái người dùng
                user.Status = status.ToLower();
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation($"User {userId} status updated to {status}");

                return Ok(new { Message = "Status updated successfully", user.Status });
            }
            catch (Exception ex)
            {
                // Ghi log lỗi và trả về mã lỗi 500
                _logger.LogError(ex, $"An error occurred while updating status for user {userId}");
                return StatusCode(500, "An error occurred while updating the status. Please try again later.");
            }
        }


        [HttpPost("{userId}/update-status-visibility")]
        public async Task<IActionResult> UpdateStatusVisibility(Guid userId, [FromForm] bool showOnlineStatus, CancellationToken cancellationToken)
        {
            try
            {
                // Xác thực người dùng hiện tại
                var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (authenticatedUserId == null || userId.ToString() != authenticatedUserId)
                {
                    return Forbid("You are not authorized to update this user's status visibility.");
                }

                // Tìm kiếm người dùng trong cơ sở dữ liệu
                var user = await _context.Users.FindAsync(new object[] { userId }, cancellationToken);
                if (user == null)
                {
                    return NotFound(new { Message = "User not found" });
                }

                // Cập nhật trạng thái hiển thị của người dùng
                user.ShowOnlineStatus = showOnlineStatus;
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation($"User {userId} show online status updated to {showOnlineStatus}");

                return Ok(new { Message = "Status visibility updated successfully", user.ShowOnlineStatus });
            }
            catch (Exception ex)
            {
                // Ghi log lỗi và trả về mã lỗi 500
                _logger.LogError(ex, $"An error occurred while updating status visibility for user {userId}");
                return StatusCode(500, "An error occurred while updating the status visibility. Please try again later.");
            }
        }

        [HttpGet("{userId}/status")]
        public async Task<IActionResult> GetStatus(Guid userId, CancellationToken cancellationToken)
        {
            try
            {
                // Xác thực người dùng hiện tại
                var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (authenticatedUserId == null || userId.ToString() != authenticatedUserId)
                {
                    return Forbid("You are not authorized to view this user's status.");
                }

                // Tìm kiếm người dùng trong cơ sở dữ liệu
                var user = await _context.Users.FindAsync(new object[] { userId }, cancellationToken);
                if (user == null)
                {
                    return NotFound(new { Message = "User not found" });
                }

                return Ok(new { user.Status });
            }
            catch (Exception ex)
            {
                // Ghi log lỗi và trả về mã lỗi 500
                _logger.LogError(ex, $"An error occurred while retrieving the status for user {userId}");
                return StatusCode(500, "An error occurred while retrieving the user status. Please try again later.");
            }
        }


        [HttpGet("{userId}/get-user-info")]
        public async Task<IActionResult> GetUserInfo(Guid userId, CancellationToken cancellationToken)
        {
            try
            {
                // Xác thực người dùng hiện tại
                var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (authenticatedUserId == null || userId.ToString() != authenticatedUserId)
                {
                    return Forbid("You are not authorized to view this user's info.");
                }

                // Tìm kiếm người dùng trong cơ sở dữ liệu
                var user = await _context.Users.FindAsync(new object[] { userId }, cancellationToken);
                if (user == null)
                {
                    return NotFound(new { Message = "User not found" });
                }

                // Trả về thông tin người dùng
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
            catch (Exception ex)
            {
                // Ghi log lỗi và trả về mã lỗi 500
                _logger.LogError(ex, $"An error occurred while retrieving the info for user {userId}");
                return StatusCode(500, "An error occurred while retrieving the user info. Please try again later.");
            }
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