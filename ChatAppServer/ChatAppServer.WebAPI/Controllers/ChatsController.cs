using ChatAppServer.WebAPI.Dtos;
using ChatAppServer.WebAPI.Hubs;
using ChatAppServer.WebAPI.Models;
using ChatAppServer.WebAPI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ChatAppServer.WebAPI.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    public sealed class ChatsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<ChatHub> _hubContext;
        private readonly ILogger<ChatsController> _logger;

        public ChatsController(ApplicationDbContext context, IHubContext<ChatHub> hubContext, ILogger<ChatsController> logger)
        {
            _context = context;
            _hubContext = hubContext;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetPrivateChats(Guid userId, Guid toUserId, CancellationToken cancellationToken)
        {
            if (userId == Guid.Empty || toUserId == Guid.Empty)
            {
                return BadRequest("Invalid userId or toUserId");
            }

            try
            {
                var chats = await _context.Chats
                    .Where(c => (c.UserId == userId && c.ToUserId == toUserId) || (c.UserId == toUserId && c.ToUserId == userId))
                    .Select(chat => new
                    {
                        chat.Id,
                        chat.UserId,
                        chat.ToUserId,
                        Message = chat.Message ?? string.Empty,
                        AttachmentUrl = chat.AttachmentUrl ?? string.Empty,
                        chat.Date
                    })
                    .ToListAsync(cancellationToken);

                return Ok(chats);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in GetPrivateChats: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetGroupChats(Guid groupId, CancellationToken cancellationToken)
        {
            if (groupId == Guid.Empty)
            {
                return BadRequest("Invalid groupId");
            }

            try
            {
                var chats = await _context.Chats
                    .Where(p => p.GroupId == groupId)
                    .Include(p => p.User)
                    .OrderBy(p => p.Date)
                    .Select(chat => new
                    {
                        chat.Id,
                        chat.UserId,
                        Username = chat.User.Username,
                        chat.GroupId,
                        Message = chat.Message ?? string.Empty,
                        AttachmentUrl = chat.AttachmentUrl ?? string.Empty,
                        chat.Date
                    })
                    .ToListAsync(cancellationToken);

                return Ok(chats);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in GetGroupChats: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost]
        public async Task<IActionResult> SendPrivateChatMessage([FromForm] SendMessageDto request, CancellationToken cancellationToken)
        {
            if (request == null || (string.IsNullOrEmpty(request.Message) && request.Attachment == null))
            {
                return BadRequest(new { Message = "Invalid message data. Message or Attachment is required." });
            }

            if (request.UserId == Guid.Empty || request.ToUserId == Guid.Empty)
            {
                return BadRequest("Invalid userId or toUserId");
            }

            try
            {
                // Handle attachment
                string? attachmentUrl = null;
                string? originalFileName = null;
                if (request.Attachment != null)
                {
                    var (savedFileName, originalName) = FileService.FileSaveToServer(request.Attachment, "wwwroot/uploads/");
                    attachmentUrl = Path.Combine("uploads", savedFileName).Replace("\\", "/");
                    originalFileName = originalName;
                }

                // Check if users are friends
                if (!await AreFriends(request.UserId, request.ToUserId.Value, cancellationToken))
                {
                    return BadRequest("You can only send messages to users who are your friends.");
                }

                // Create and save chat message
                Chat chat = new()
                {
                    UserId = request.UserId,
                    ToUserId = request.ToUserId,
                    Message = request.Message,
                    AttachmentUrl = attachmentUrl,
                    AttachmentOriginalName = originalFileName, // Save original file name
                    Date = DateTime.UtcNow
                };

                await _context.AddAsync(chat, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);

                // Send message via SignalR
                await _hubContext.Clients.All.SendAsync("ReceivePrivateMessage", new
                {
                    chat.Id,
                    chat.UserId,
                    chat.ToUserId,
                    chat.Message,
                    chat.AttachmentUrl,
                    chat.AttachmentOriginalName,
                    chat.Date
                });

                return Ok(new
                {
                    chat.Id,
                    chat.UserId,
                    chat.ToUserId,
                    chat.Message,
                    chat.AttachmentUrl,
                    chat.AttachmentOriginalName,
                    chat.Date
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in SendPrivateChatMessage: {ex.Message}");
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpPost]
        public async Task<IActionResult> SendGroupChatMessage([FromForm] SendGroupMessageDto request, CancellationToken cancellationToken)
        {
            if (request == null || (string.IsNullOrEmpty(request.Message) && request.Attachment == null))
            {
                return BadRequest(new { Message = "Invalid message data. Message or Attachment is required." });
            }

            if (request.UserId == Guid.Empty || request.GroupId == Guid.Empty)
            {
                return BadRequest("Invalid userId or groupId");
            }

            try
            {
                // Check if user is a member of the group
                bool isMember = await _context.GroupMembers
                    .AnyAsync(gm => gm.GroupId == request.GroupId && gm.UserId == request.UserId, cancellationToken);

                if (!isMember)
                {
                    return BadRequest("You can only send messages to groups you are a member of.");
                }

                // Handle attachment
                string? attachmentUrl = null;
                string? originalFileName = null;
                if (request.Attachment != null)
                {
                    var (savedFileName, originalName) = FileService.FileSaveToServer(request.Attachment, "wwwroot/uploads/");
                    attachmentUrl = Path.Combine("uploads", savedFileName).Replace("\\", "/");
                    originalFileName = originalName;
                }

                // Create and save group chat message
                Chat chat = new()
                {
                    UserId = request.UserId,
                    GroupId = request.GroupId,
                    Message = request.Message,
                    AttachmentUrl = attachmentUrl,
                    AttachmentOriginalName = originalFileName, // Save original file name
                    Date = DateTime.UtcNow
                };

                await _context.AddAsync(chat, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);

                // Send message via SignalR to all group members
                await _hubContext.Clients.All.SendAsync("ReceiveGroupMessage", new
                {
                    chat.Id,
                    chat.UserId,
                    chat.GroupId,
                    chat.Message,
                    chat.AttachmentUrl,
                    chat.AttachmentOriginalName,
                    chat.Date
                });

                return Ok(new
                {
                    chat.Id,
                    chat.UserId,
                    chat.GroupId,
                    chat.Message,
                    chat.AttachmentUrl,
                    chat.AttachmentOriginalName,
                    chat.Date
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in SendGroupChatMessage: {ex.Message}");
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        // Check if two users are friends
        private async Task<bool> AreFriends(Guid userId1, Guid userId2, CancellationToken cancellationToken)
        {
            return await _context.Users
                .AnyAsync(u => u.Id == userId1 && u.Friends.Any(f => f.FriendId == userId2), cancellationToken) &&
                   await _context.Users
                .AnyAsync(u => u.Id == userId2 && u.Friends.Any(f => f.FriendId == userId1), cancellationToken);
        }
    }
}
