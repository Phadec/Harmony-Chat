using ChatAppServer.WebAPI.Dtos;
using ChatAppServer.WebAPI.Hubs;
using ChatAppServer.WebAPI.Models;
using ChatAppServer.WebAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ChatAppServer.WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Ensure all endpoints require authorization
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

        [HttpGet("get-relationships")]
        public async Task<IActionResult> GetRelationships(Guid userId, CancellationToken cancellationToken)
        {
            if (userId == Guid.Empty)
            {
                return BadRequest("Invalid userId");
            }

            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null || userId.ToString() != authenticatedUserId)
            {
                return Forbid("You are not authorized to view these chats.");
            }

            try
            {
                var authenticatedUserIdGuid = Guid.Parse(authenticatedUserId);

                // Get the latest message for each private contact
                var latestPrivateChats = await _context.Chats
                    .AsNoTracking()
                    .Where(c => (c.UserId == userId && c.ToUserId.HasValue) || (c.ToUserId == userId))
                    .GroupBy(c => c.UserId == userId ? c.ToUserId : c.UserId)
                    .Select(g => g.OrderByDescending(c => c.Date).FirstOrDefault())
                    .ToListAsync(cancellationToken);

                var privateChatResults = new List<object>();
                foreach (var latestChat in latestPrivateChats)
                {
                    if (latestChat != null)
                    {
                        bool isSentByUser = latestChat.UserId == userId;

                        var contact = await _context.Users
                            .AsNoTracking()
                            .FirstOrDefaultAsync(u => u.Id == (isSentByUser ? latestChat.ToUserId : latestChat.UserId), cancellationToken);

                        string contactFullName = contact != null ? $"{contact.FirstName} {contact.LastName}" : "Unknown Contact";
                        string contactTagName = contact?.TagName ?? string.Empty;

                        var result = new
                        {
                            RelationshipType = "Private",
                            ChatId = latestChat.Id,
                            ChatDate = latestChat.Date,
                            ContactId = isSentByUser ? latestChat.ToUserId : latestChat.UserId,
                            ContactFullName = contactFullName,
                            ContactTagName = contactTagName,
                            LastMessage = latestChat.Message ?? string.Empty,
                            LastAttachmentUrl = latestChat.AttachmentUrl ?? string.Empty,
                            IsSentByUser = isSentByUser,
                        };

                        privateChatResults.Add(result);
                    }
                }

                // Get distinct group IDs
                var groupIds = await _context.Chats
                    .AsNoTracking()
                    .Where(c => c.GroupId.HasValue && c.Group.Members.Any(m => m.UserId == userId))
                    .Select(c => c.GroupId.Value)
                    .Distinct()
                    .ToListAsync(cancellationToken);

                // Get the latest message for each group
                var latestGroupChats = new List<object>();
                foreach (var groupId in groupIds)
                {
                    var latestChat = await _context.Chats
                        .AsNoTracking()
                        .Where(c => c.GroupId == groupId)
                        .OrderByDescending(c => c.Date)
                        .FirstOrDefaultAsync(cancellationToken);

                    if (latestChat != null)
                    {
                        var group = await _context.Groups
                            .AsNoTracking()
                            .FirstOrDefaultAsync(g => g.Id == groupId, cancellationToken);

                        var sender = await _context.Users
                            .AsNoTracking()
                            .FirstOrDefaultAsync(u => u.Id == latestChat.UserId, cancellationToken);

                        latestGroupChats.Add(new
                        {
                            RelationshipType = "Group",
                            GroupId = group?.Id ?? Guid.Empty,
                            GroupName = group?.Name ?? string.Empty,
                            ChatId = latestChat.Id,
                            ChatDate = latestChat.Date,
                            LastMessage = latestChat.Message ?? string.Empty,
                            LastAttachmentUrl = latestChat.AttachmentUrl ?? string.Empty,
                            IsSentByUser = latestChat.UserId == userId,
                            SenderId = latestChat.UserId,
                            SenderFullName = sender != null ? $"{sender.FirstName} {sender.LastName}" : "Unknown",
                            SenderTagName = sender?.TagName ?? string.Empty,
                        });
                    }
                }

                // Combine results and sort by the latest message date
                var combinedChats = privateChatResults.Concat(latestGroupChats)
                    .OrderByDescending(chat => ((dynamic)chat).ChatDate)
                    .ToList();

                return Ok(combinedChats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetRelationships for user {UserId}", userId);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("get-chats")]
        public async Task<IActionResult> GetChats(Guid userId, Guid recipientId, CancellationToken cancellationToken)
        {
            if (userId == Guid.Empty || recipientId == Guid.Empty)
            {
                return BadRequest("Invalid userId or recipientId");
            }

            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null || userId.ToString() != authenticatedUserId)
            {
                return Forbid("You are not authorized to view these chats.");
            }

            var authenticatedUserIdGuid = Guid.Parse(authenticatedUserId);

            try
            {
                bool isGroup = await _context.Groups
                    .AsNoTracking()
                    .AnyAsync(g => g.Id == recipientId, cancellationToken);

                if (!isGroup)
                {
                    var isBlocked = await _context.UserBlocks
                        .AsNoTracking()
                        .AnyAsync(ub => (ub.UserId == authenticatedUserIdGuid && ub.BlockedUserId == recipientId) ||
                                        (ub.UserId == recipientId && ub.BlockedUserId == authenticatedUserIdGuid), cancellationToken);

                    if (isBlocked)
                    {
                        return Forbid("You are not authorized to view these chats.");
                    }

                    var privateChats = await _context.Chats
                        .AsNoTracking()
                        .Where(c => (c.UserId == userId && c.ToUserId == recipientId) || (c.UserId == recipientId && c.ToUserId == userId))
                        .OrderBy(c => c.Date)
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

                    return Ok(privateChats);
                }
                else
                {
                    var isMember = await _context.GroupMembers
                        .AsNoTracking()
                        .AnyAsync(gm => gm.GroupId == recipientId && gm.UserId == authenticatedUserIdGuid, cancellationToken);

                    if (!isMember)
                    {
                        return Forbid("You are not authorized to view these group chats.");
                    }

                    var groupChats = await _context.Chats
                        .AsNoTracking()
                        .Where(p => p.GroupId == recipientId)
                        .Include(p => p.User)
                        .OrderBy(p => p.Date)
                        .Select(chat => new
                        {
                            chat.Id,
                            chat.UserId,
                            SenderFullName = chat.User != null ? $"{chat.User.FirstName} {chat.User.LastName}" : "Unknown",
                            SenderTagName = chat.User != null ? chat.User.TagName : "Unknown",
                            chat.GroupId,
                            Message = chat.Message ?? string.Empty,
                            AttachmentUrl = chat.AttachmentUrl ?? string.Empty,
                            chat.Date
                        })
                        .ToListAsync(cancellationToken);

                    return Ok(groupChats);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetChats for user {UserId} and recipient {RecipientId}", userId, recipientId);
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost("send-message")]
        public async Task<IActionResult> SendMessage([FromForm] SendMessageDto request, CancellationToken cancellationToken)
        {
            if (request == null || (string.IsNullOrEmpty(request.Message) && request.Attachment == null))
            {
                return BadRequest(new { Message = "Invalid message data. Message or Attachment is required." });
            }

            if (request.UserId == Guid.Empty || request.RecipientId == Guid.Empty)
            {
                return BadRequest("Invalid userId or recipientId");
            }

            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null || request.UserId.ToString() != authenticatedUserId)
            {
                return Forbid("You are not authorized to send this message.");
            }

            try
            {
                bool isGroup = await _context.Groups
                    .AsNoTracking()
                    .AnyAsync(g => g.Id == request.RecipientId, cancellationToken);

                if (isGroup)
                {
                    bool isMember = await _context.GroupMembers
                        .AsNoTracking()
                        .AnyAsync(gm => gm.GroupId == request.RecipientId && gm.UserId == request.UserId, cancellationToken);

                    if (!isMember)
                    {
                        return BadRequest("You can only send messages to groups you are a member of.");
                    }

                    string? attachmentUrl = null;
                    string? originalFileName = null;
                    if (request.Attachment != null)
                    {
                        // Improved: Validate attachment before saving
                        if (request.Attachment.Length > 10 * 1024 * 1024) // 10 MB limit
                        {
                            return BadRequest("Attachment size exceeds the limit.");
                        }

                        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".pdf" };
                        var extension = Path.GetExtension(request.Attachment.FileName);
                        if (!allowedExtensions.Contains(extension.ToLower()))
                        {
                            return BadRequest("Unsupported file type.");
                        }

                        var (savedFileName, originalName) = FileService.FileSaveToServer(request.Attachment, "wwwroot/uploads/");
                        attachmentUrl = Path.Combine("uploads", savedFileName).Replace("\\", "/");
                        originalFileName = originalName;
                    }

                    Chat chat = new()
                    {
                        UserId = request.UserId,
                        GroupId = request.RecipientId,
                        Message = request.Message,
                        AttachmentUrl = attachmentUrl,
                        AttachmentOriginalName = originalFileName,
                        Date = DateTime.UtcNow
                    };

                    await _context.AddAsync(chat, cancellationToken);
                    await _context.SaveChangesAsync(cancellationToken);

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
                else
                {
                    var isBlocked = await _context.UserBlocks
                        .AsNoTracking()
                        .AnyAsync(ub => ub.UserId == request.RecipientId && ub.BlockedUserId == request.UserId, cancellationToken);

                    if (isBlocked)
                    {
                        return Forbid("You cannot send messages to this user as they have blocked you.");
                    }

                    string? attachmentUrl = null;
                    string? originalFileName = null;
                    if (request.Attachment != null)
                    {
                        // Improved: Validate attachment before saving
                        if (request.Attachment.Length > 10 * 1024 * 1024) // 10 MB limit
                        {
                            return BadRequest("Attachment size exceeds the limit.");
                        }

                        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".pdf" };
                        var extension = Path.GetExtension(request.Attachment.FileName);
                        if (!allowedExtensions.Contains(extension.ToLower()))
                        {
                            return BadRequest("Unsupported file type.");
                        }

                        var (savedFileName, originalName) = FileService.FileSaveToServer(request.Attachment, "wwwroot/uploads/");
                        attachmentUrl = Path.Combine("uploads", savedFileName).Replace("\\", "/");
                        originalFileName = originalName;
                    }

                    Chat chat = new()
                    {
                        UserId = request.UserId,
                        ToUserId = request.RecipientId,
                        Message = request.Message,
                        AttachmentUrl = attachmentUrl,
                        AttachmentOriginalName = originalFileName,
                        Date = DateTime.UtcNow
                    };

                    await _context.AddAsync(chat, cancellationToken);
                    await _context.SaveChangesAsync(cancellationToken);

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
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in SendMessage for user {UserId} and recipient {RecipientId}", request.UserId, request.RecipientId);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        private async Task<bool> AreFriends(Guid userId1, Guid userId2, CancellationToken cancellationToken)
        {
            return await _context.Users
                .AsNoTracking()
                .AnyAsync(u => u.Id == userId1 && u.Friends.Any(f => f.FriendId == userId2), cancellationToken) &&
                   await _context.Users
                .AsNoTracking()
                .AnyAsync(u => u.Id == userId2 && u.Friends.Any(f => f.FriendId == userId1), cancellationToken);
        }
    }
}
