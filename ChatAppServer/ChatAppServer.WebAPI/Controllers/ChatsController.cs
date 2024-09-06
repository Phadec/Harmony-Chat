using ChatAppServer.WebAPI.Dtos;
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
                return BadRequest(new { Message = "Invalid userId." });
            }

            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null || userId.ToString() != authenticatedUserId)
            {
                return Forbid("You are not authorized to view these chats.");
            }

            try
            {
                var authenticatedUserIdGuid = Guid.Parse(authenticatedUserId);

                // Retrieve the latest private chats, only between friends and excluding deleted messages
                var latestPrivateChats = await _context.Chats
                    .Where(c => (c.UserId == userId && c.ToUserId.HasValue) || (c.ToUserId == userId))
                    .Where(c => !_context.UserDeletedMessages.Any(udm => udm.UserId == userId && udm.MessageId == c.Id))
                    .GroupBy(c => c.UserId == userId ? c.ToUserId : c.UserId)
                    .Select(g => g.OrderByDescending(c => c.Date).FirstOrDefault())
                    .ToListAsync(cancellationToken);

                var privateChatResults = new List<object>();
                foreach (var latestChat in latestPrivateChats)
                {
                    if (latestChat != null)
                    {
                        bool isSentByUser = latestChat.UserId == userId;
                        var contactId = isSentByUser ? latestChat.ToUserId : latestChat.UserId;

                        // Check if the contact is a friend
                        var isFriend = await _context.Friendships
                            .AnyAsync(f => (f.UserId == userId && f.FriendId == contactId) || (f.UserId == contactId && f.FriendId == userId), cancellationToken);

                        if (!isFriend)
                        {
                            continue; // Skip if the contact is not a friend
                        }

                        var contact = await _context.Users.FirstOrDefaultAsync(u => u.Id == contactId, cancellationToken);
                        if (contact == null)
                        {
                            continue; // Skip if the contact cannot be found
                        }

                        string contactFullName = $"{contact.FirstName} {contact.LastName}";
                        string contactTagName = contact?.TagName ?? string.Empty;

                        var friendship = await _context.Friendships.FirstOrDefaultAsync(f => (f.UserId == userId && f.FriendId == contact.Id), cancellationToken);
                        string contactNickname = friendship?.Nickname ?? string.Empty;

                        bool hasNewMessage = !isSentByUser && !latestChat.IsRead;

                        // Kiểm tra xem có phản ứng mới nào chưa được xem không
                        bool hasNewReactions = await _context.NewReactionStatuses
                            .AnyAsync(nrs => nrs.ChatId == latestChat.Id && nrs.UserId == userId, cancellationToken);

                        var result = new
                        {
                            RelationshipType = "Private",
                            ChatId = latestChat.Id,
                            ChatDate = latestChat.Date,
                            ContactId = contactId,
                            ContactFullName = contactFullName,
                            ContactTagName = contactTagName,
                            ContactNickname = contactNickname,
                            Status = contact.Status,
                            Avatar = contact.Avatar,
                            LastMessage = latestChat.Message ?? string.Empty,
                            LastAttachmentUrl = latestChat.AttachmentUrl ?? string.Empty,
                            Reaction = latestChat.Reactions,
                            IsDeleted = latestChat.IsDeleted,
                            IsSentByUser = isSentByUser,
                            HasNewMessage = hasNewMessage,
                            HasNewReactions = hasNewReactions // Thêm cờ để chỉ ra phản ứng mới
                        };

                        privateChatResults.Add(result);
                    }
                }

                // Retrieve the latest group chats, excluding deleted messages
                var groupIds = await _context.Chats
                    .Where(c => c.GroupId.HasValue && c.Group.Members.Any(m => m.UserId == userId))
                    .Select(c => c.GroupId.Value)
                    .Distinct()
                    .ToListAsync(cancellationToken);

                var latestGroupChats = new List<object>();
                foreach (var groupId in groupIds)
                {
                    var latestChat = await _context.Chats
                        .Where(c => c.GroupId == groupId)
                        .Where(c => !_context.UserDeletedMessages.Any(udm => udm.UserId == userId && udm.MessageId == c.Id))
                        .OrderByDescending(c => c.Date)
                        .FirstOrDefaultAsync(cancellationToken);

                    if (latestChat != null)
                    {
                        var group = await _context.Groups.FirstOrDefaultAsync(g => g.Id == groupId, cancellationToken);
                        var sender = await _context.Users.FirstOrDefaultAsync(u => u.Id == latestChat.UserId, cancellationToken);

                        if (group == null || sender == null)
                        {
                            continue; // Skip if the group or sender cannot be found
                        }

                        bool hasNewMessage = !await _context.MessageReadStatuses
                            .AnyAsync(mrs => mrs.MessageId == latestChat.Id && mrs.UserId == userId, cancellationToken);

                        // Kiểm tra xem có phản ứng mới nào chưa được xem không
                        bool hasNewReactions = await _context.NewReactionStatuses
                            .AnyAsync(nrs => nrs.ChatId == latestChat.Id && nrs.UserId == userId, cancellationToken);

                        latestGroupChats.Add(new
                        {
                            RelationshipType = "Group",
                            GroupId = group.Id,
                            GroupName = group.Name,
                            Avatar = group.Avatar,
                            ChatId = latestChat.Id,
                            ChatDate = latestChat.Date,
                            LastMessage = latestChat.Message ?? string.Empty,
                            LastAttachmentUrl = latestChat.AttachmentUrl ?? string.Empty,
                            IsSentByUser = latestChat.UserId == userId,
                            SenderId = latestChat.UserId,
                            SenderFullName = $"{sender.FirstName} {sender.LastName}",
                            SenderTagName = sender.TagName ?? string.Empty,
                            HasNewMessage = hasNewMessage,
                            Reaction = latestChat.Reactions,
                            IsDeleted = latestChat.IsDeleted,
                            HasNewReactions = hasNewReactions // Thêm cờ để chỉ ra phản ứng mới
                        });
                    }
                }

                var combinedChats = privateChatResults.Concat(latestGroupChats)
                    .OrderByDescending(chat => ((dynamic)chat).ChatDate)
                    .ToList();

                return Ok(combinedChats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetRelationships for user {UserId}", userId);
                return StatusCode(500, new { Message = "Internal server error. Please try again later." });
            }
        }

        [HttpGet("{userId}/recipient-info/{recipientId}")]
        public async Task<IActionResult> GetRecipientInfo(Guid userId, Guid recipientId, CancellationToken cancellationToken)
        {
            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null || userId.ToString() != authenticatedUserId)
            {
                return Forbid("You are not authorized to view this recipient's information.");
            }

            if (userId == Guid.Empty || recipientId == Guid.Empty)
            {
                return BadRequest("Invalid userId or recipientId.");
            }

            try
            {
                // Case 1: The recipient is the user themselves
                if (userId == recipientId)
                {
                    var user = await _context.Users.FindAsync(new object[] { userId }, cancellationToken);
                    if (user == null)
                    {
                        return NotFound("User not found.");
                    }

                    var selfInfo = new
                    {
                        Id = user.Id,
                        FullName = $"{user.FirstName} {user.LastName}",
                        Nickname = "", // No nickname for oneself
                        Avatar = user.Avatar,
                        TagName = user.TagName,
                        Status = user.Status,
                        Type = "Self"  // Indicate that this is the user's own info
                    };

                    return Ok(selfInfo);
                }

                // Case 2: The recipient is a friend
                var friendship = await _context.Friendships
                    .Include(f => f.Friend)
                    .Include(f => f.User)
                    .FirstOrDefaultAsync(f => (f.UserId == userId && f.FriendId == recipientId), cancellationToken);

                if (friendship != null)
                {
                    var recipient = friendship.UserId == userId ? friendship.Friend : friendship.User;

                    var recipientInfo = new
                    {
                        Id = recipient.Id,
                        FullName = $"{recipient.FirstName} {recipient.LastName}",
                        Nickname = friendship.Nickname,
                        Avatar = recipient.Avatar,
                        TagName = recipient.TagName,
                        Status = recipient.Status,
                        Type = "Private"  // Indicate that this is a friend
                    };

                    return Ok(recipientInfo);
                }

                // Case 3: The recipient is a group
                var group = await _context.Groups
                    .FirstOrDefaultAsync(g => g.Id == recipientId, cancellationToken);

                if (group != null)
                {
                    var groupInfo = new
                    {
                        Id = group.Id,
                        FullName = group.Name,
                        Avatar = group.Avatar,
                        Status = "group", // Special status for groups
                        TagName = "", // Groups don't have tag names
                        Nickname = "", // Groups don't have nicknames
                        Type = "Group"  // Indicate that this is a group

                    };

                    return Ok(groupInfo);
                }

                return NotFound("Recipient not found.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while fetching recipient info for user {UserId} and recipient {RecipientId}.", userId, recipientId);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }
        [HttpPost("{chatId}/mark-as-read")]
        public async Task<IActionResult> MarkAsRead(Guid chatId, CancellationToken cancellationToken)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var userGuid = Guid.Parse(userId);

            // Fetch the message from the database
            var message = await _context.Chats
                .FirstOrDefaultAsync(m => m.Id == chatId, cancellationToken);

            if (message == null)
                return NotFound("Message not found or not authorized to mark as read.");

            // Ensure the user is the intended recipient or a member of the group
            if (message.GroupId.HasValue)
            {
                // Check if the user is a member of the group and not the sender
                var isMember = await _context.GroupMembers
                    .AnyAsync(gm => gm.GroupId == message.GroupId && gm.UserId == userGuid, cancellationToken);

                if (!isMember || message.UserId == userGuid)
                {
                    return Forbid("You are not authorized to mark this message as read.");
                }

                var readStatus = await _context.MessageReadStatuses
                    .FirstOrDefaultAsync(rs => rs.MessageId == message.Id && rs.UserId == userGuid, cancellationToken);

                if (readStatus == null)
                {
                    readStatus = new MessageReadStatus
                    {
                        Id = Guid.NewGuid(),
                        MessageId = message.Id,
                        UserId = userGuid,
                        IsRead = true,
                        ReadAt = DateTime.UtcNow
                    };
                    _context.MessageReadStatuses.Add(readStatus);
                }
                else
                {
                    readStatus.IsRead = true;
                    readStatus.ReadAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync(cancellationToken);

                // Notify the current user (the reader) to update their UI
                await _hubContext.Clients.User(userGuid.ToString()).SendAsync("UpdateRelationships");
            }
            else if (message.ToUserId.HasValue)
            {
                // Ensure the user is the intended recipient and not the sender
                if (message.ToUserId.Value != userGuid || message.UserId == userGuid)
                {
                    return Forbid("You are not authorized to mark this message as read.");
                }

                message.IsRead = true;
                message.ReadAt = DateTime.UtcNow;

                await _context.SaveChangesAsync(cancellationToken);

                await _hubContext.Clients.User(message.UserId.ToString()).SendAsync("MessageRead", message.Id);
            }
            else
            {
                return BadRequest("Invalid message context.");
            }

            return Ok();
        }
        [HttpGet("get-chats")]
        public async Task<IActionResult> GetChats(Guid userId, Guid recipientId, CancellationToken cancellationToken)
        {
            if (userId == Guid.Empty || recipientId == Guid.Empty)
            {
                return BadRequest(new { Message = "Invalid userId or recipientId." });
            }

            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null || userId.ToString() != authenticatedUserId)
            {
                return Forbid("You are not authorized to view these chats.");
            }

            var authenticatedUserIdGuid = Guid.Parse(authenticatedUserId);

            try
            {
                // Kiểm tra nếu là nhóm chat
                bool isGroup = await _context.Groups
                    .AsNoTracking()
                    .AnyAsync(g => g.Id == recipientId, cancellationToken);

                if (!isGroup)
                {
                    // Truy vấn lấy thông tin bạn bè và chủ đề chat
                    var friendship = await _context.Friendships
                        .AsNoTracking()
                        .FirstOrDefaultAsync(f => f.UserId == userId && f.FriendId == recipientId, cancellationToken);

                    var chatTheme = friendship?.ChatTheme ?? "default";

                    // Truy vấn lấy danh sách tin nhắn cá nhân
                    var privateChats = await _context.Chats
                        .AsNoTracking()
                        .Where(c =>
                            ((c.UserId == userId && c.ToUserId == recipientId) ||
                             (c.UserId == recipientId && c.ToUserId == userId)) &&
                            !_context.UserDeletedMessages.Any(udm => udm.UserId == userId && udm.MessageId == c.Id))
                        .OrderBy(c => c.Date)
                        .Select(c => new
                        {
                            c.Id,
                            c.UserId,
                            c.ToUserId,
                            SenderFullName = c.User != null ? (c.User.FirstName + " " + c.User.LastName) : "Unknown",
                            Message = c.Message ?? string.Empty,
                            AttachmentUrl = c.AttachmentUrl ?? string.Empty,
                            AttachmentOriginalName = c.AttachmentOriginalName ?? string.Empty,
                            c.Date,
                            IsRead = c.IsRead,
                            IsDeleted = c.IsDeleted,
                            IsPinned = c.IsPinned,
                            Reactions = c.Reactions.Select(r => new
                            {
                                r.ReactionType,
                                ReactedByUser = new
                                {
                                    r.User.Id,
                                    FullName = r.User.FirstName + " " + r.User.LastName,
                                    r.User.Avatar
                                },
                                r.CreatedAt
                            }).ToList(),
                            RepliedToMessage = c.RepliedToMessageId.HasValue
                                ? _context.Chats
                                    .AsNoTracking()
                                    .Where(r => r.Id == c.RepliedToMessageId.Value)
                                    .Select(r => new
                                    {
                                        r.Id,
                                        r.Message,
                                        r.AttachmentUrl,
                                        r.AttachmentOriginalName,
                                        SenderFullName = r.User != null ? (r.User.FirstName + " " + r.User.LastName) : "Unknown",
                                        SenderTagName = r.User != null ? r.User.TagName : string.Empty
                                    })
                                    .FirstOrDefault()
                                : null
                        })
                        .ToListAsync(cancellationToken);

                    return Ok(new
                    {
                        ChatTheme = chatTheme,
                        Messages = privateChats
                    });
                }
                else
                {
                    // Kiểm tra nếu người dùng là thành viên của nhóm
                    var isMember = await _context.GroupMembers
                        .AsNoTracking()
                        .AnyAsync(gm => gm.GroupId == recipientId && gm.UserId == authenticatedUserIdGuid, cancellationToken);

                    if (!isMember)
                    {
                        return Forbid("You are not authorized to view these group chats.");
                    }

                    // Lấy thông tin nhóm
                    var group = await _context.Groups
                        .AsNoTracking()
                        .FirstOrDefaultAsync(g => g.Id == recipientId, cancellationToken);

                    var chatTheme = group?.ChatTheme ?? "default";

                    // Truy vấn lấy danh sách tin nhắn nhóm
                    var groupChats = await _context.Chats
                        .AsNoTracking()
                        .Where(p => p.GroupId == recipientId &&
                                    !_context.UserDeletedMessages.Any(udm => udm.UserId == userId && udm.MessageId == p.Id))
                        .OrderBy(p => p.Date)
                        .Select(p => new
                        {
                            p.Id,
                            p.UserId,
                            SenderFullName = p.User != null ? (p.User.FirstName + " " + p.User.LastName) : "Unknown",
                            SenderTagName = p.User != null ? p.User.TagName : string.Empty,
                            p.GroupId,
                            Message = p.Message ?? string.Empty,
                            AttachmentUrl = p.AttachmentUrl ?? string.Empty,
                            AttachmentOriginalName = p.AttachmentOriginalName ?? string.Empty,
                            p.Date,
                            IsRead = _context.MessageReadStatuses
                                .AsNoTracking()
                                .Where(mrs => mrs.MessageId == p.Id && mrs.UserId == userId)
                                .Select(mrs => mrs.IsRead)
                                .FirstOrDefault(),
                            IsDeleted = p.IsDeleted,
                            IsPinned = p.IsPinned,
                            Reactions = p.Reactions.Select(r => new
                            {
                                r.ReactionType,
                                ReactedByUser = new
                                {
                                    r.User.Id,
                                    FullName = r.User.FirstName + " " + r.User.LastName,
                                    r.User.Avatar
                                },
                                r.CreatedAt
                            }).ToList(),
                            RepliedToMessage = p.RepliedToMessageId.HasValue
                                ? _context.Chats
                                    .AsNoTracking()
                                    .Where(r => r.Id == p.RepliedToMessageId.Value)
                                    .Select(r => new
                                    {
                                        r.Id,
                                        r.Message,
                                        r.AttachmentUrl,
                                        r.AttachmentOriginalName,
                                        SenderFullName = r.User != null ? (r.User.FirstName + " " + r.User.LastName) : "Unknown",
                                        SenderTagName = r.User != null ? r.User.TagName : string.Empty
                                    })
                                    .FirstOrDefault()
                                : null
                        })
                        .ToListAsync(cancellationToken);

                    return Ok(new
                    {
                        ChatTheme = chatTheme,
                        GroupName = group.Name,
                        Messages = groupChats
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetChats for user {UserId} and recipient {RecipientId}", userId, recipientId);
                return StatusCode(500, new { Message = "Internal server error. Please try again later." });
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
                var sender = await _context.Users
                    .Where(u => u.Id == request.UserId)
                    .Select(u => new { u.FirstName, u.LastName })
                    .FirstOrDefaultAsync(cancellationToken);

                if (sender == null)
                {
                    return NotFound("Sender not found.");
                }

                string senderFullName = $"{sender.FirstName} {sender.LastName}";

                bool isGroup = await _context.Groups.AnyAsync(g => g.Id == request.RecipientId, cancellationToken);
                if (isGroup)
                {
                    bool isMember = await _context.GroupMembers
                        .AnyAsync(gm => gm.GroupId == request.RecipientId && gm.UserId == request.UserId, cancellationToken);

                    if (!isMember)
                    {
                        return BadRequest("You can only send messages to groups you are a member of.");
                    }

                    string? attachmentUrl = null;
                    string? originalFileName = null;
                    if (request.Attachment != null)
                    {
                        var (savedFileName, originalName) = FileService.FileSaveToServer(request.Attachment, "wwwroot/uploads/");
                        attachmentUrl = Path.Combine("uploads", savedFileName).Replace("\\", "/");
                        originalFileName = originalName;
                    }

                    Chat chat = new()
                    {
                        UserId = request.UserId,
                        GroupId = request.RecipientId,
                        Message = request.Message ?? string.Empty,
                        AttachmentUrl = attachmentUrl,
                        AttachmentOriginalName = originalFileName,
                        Date = DateTime.UtcNow,
                        RepliedToMessageId = request.RepliedToMessageId // Gán ID của tin nhắn được reply
                    };

                    await _context.AddAsync(chat, cancellationToken);
                    await _context.SaveChangesAsync(cancellationToken);

                    // Lấy chi tiết của tin nhắn được reply nếu có
                    var repliedToMessage = chat.RepliedToMessageId.HasValue
                        ? await _context.Chats
                            .Where(r => r.Id == chat.RepliedToMessageId.Value)
                            .Select(r => new
                            {
                                r.Id,
                                r.Message,
                                r.AttachmentUrl,
                                r.AttachmentOriginalName,
                                SenderFullName = r.User != null ? (r.User.FirstName + " " + r.User.LastName) : "Unknown",
                                SenderTagName = r.User != null ? r.User.TagName : string.Empty
                            })
                            .FirstOrDefaultAsync(cancellationToken)
                        : null;

                    // Tự động đánh dấu tin nhắn là đã đọc cho người gửi
                    var readStatus = new MessageReadStatus
                    {
                        Id = Guid.NewGuid(),
                        MessageId = chat.Id,
                        UserId = request.UserId,
                        IsRead = true,
                        ReadAt = DateTime.UtcNow
                    };
                    _context.MessageReadStatuses.Add(readStatus);
                    await _context.SaveChangesAsync(cancellationToken);

                    await _hubContext.Clients.Group(request.RecipientId.ToString()).SendAsync("ReceiveGroupMessage", new
                    {
                        chat.Id,
                        chat.UserId,
                        chat.GroupId,
                        chat.Message,
                        chat.AttachmentUrl,
                        chat.AttachmentOriginalName,
                        chat.Date,
                        chat.RepliedToMessageId, // Truyền thêm ID của tin nhắn được reply
                        SenderFullName = senderFullName,
                        RepliedToMessage = repliedToMessage // Truyền chi tiết tin nhắn được reply
                    });

                    return Ok(new
                    {
                        chat.Id,
                        chat.UserId,
                        chat.GroupId,
                        chat.Message,
                        chat.AttachmentUrl,
                        chat.AttachmentOriginalName,
                        chat.Date,
                        chat.RepliedToMessageId, // Trả về ID của tin nhắn được reply
                        SenderFullName = senderFullName,
                        RepliedToMessage = repliedToMessage // Trả về chi tiết tin nhắn được reply
                    });
                }
                else
                {
                    var isBlocked = await _context.UserBlocks.AnyAsync(ub => ub.UserId == request.RecipientId && ub.BlockedUserId == request.UserId, cancellationToken);
                    if (isBlocked)
                    {
                        return Forbid("You cannot send messages to this user as they have blocked you.");
                    }

                    string? attachmentUrl = null;
                    string? originalFileName = null;
                    if (request.Attachment != null)
                    {
                        var (savedFileName, originalName) = FileService.FileSaveToServer(request.Attachment, "wwwroot/uploads/");
                        attachmentUrl = Path.Combine("uploads", savedFileName).Replace("\\", "/");
                        originalFileName = originalName;
                    }

                    Chat chat = new()
                    {
                        UserId = request.UserId,
                        ToUserId = request.RecipientId,
                        Message = request.Message ?? string.Empty,
                        AttachmentUrl = attachmentUrl,
                        AttachmentOriginalName = originalFileName,
                        Date = DateTime.UtcNow,
                        RepliedToMessageId = request.RepliedToMessageId // Gán ID của tin nhắn được reply
                    };

                    await _context.AddAsync(chat, cancellationToken);
                    await _context.SaveChangesAsync(cancellationToken);

                    // Lấy chi tiết của tin nhắn được reply nếu có
                    var repliedToMessage = chat.RepliedToMessageId.HasValue
                        ? await _context.Chats
                            .Where(r => r.Id == chat.RepliedToMessageId.Value)
                            .Select(r => new
                            {
                                r.Id,
                                r.Message,
                                r.AttachmentUrl,
                                r.AttachmentOriginalName,
                                SenderFullName = r.User != null ? (r.User.FirstName + " " + r.User.LastName) : "Unknown",
                                SenderTagName = r.User != null ? r.User.TagName : string.Empty
                            })
                            .FirstOrDefaultAsync(cancellationToken)
                        : null;

                    await _hubContext.Clients.User(request.RecipientId.ToString()).SendAsync("ReceivePrivateMessage", new
                    {
                        chat.Id,
                        chat.UserId,
                        chat.ToUserId,
                        chat.Message,
                        chat.AttachmentUrl,
                        chat.AttachmentOriginalName,
                        chat.Date,
                        chat.RepliedToMessageId, // Truyền thêm ID của tin nhắn được reply
                        SenderFullName = senderFullName,
                        RepliedToMessage = repliedToMessage // Truyền chi tiết tin nhắn được reply
                    });

                    return Ok(new
                    {
                        chat.Id,
                        chat.UserId,
                        chat.ToUserId,
                        chat.Message,
                        chat.AttachmentUrl,
                        chat.AttachmentOriginalName,
                        chat.Date,
                        chat.RepliedToMessageId, // Trả về ID của tin nhắn được reply
                        SenderFullName = senderFullName,
                        RepliedToMessage = repliedToMessage // Trả về chi tiết tin nhắn được reply
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in SendMessage: {ex.Message}");
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }


        [HttpPost("{chatId}/delete-message")]
        [Authorize]
        public async Task<IActionResult> DeleteChatMessage(Guid chatId, CancellationToken cancellationToken)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var userGuid = Guid.Parse(userId);

            // Fetch the chat message from the database
            var chatMessage = await _context.Chats.FirstOrDefaultAsync(m => m.Id == chatId, cancellationToken);

            if (chatMessage == null)
            {
                return NotFound("Message not found.");
            }

            // Ensure the user is the sender of the message
            if (chatMessage.UserId != userGuid)
            {
                return Forbid("You are not authorized to delete this message.");
            }

            // Chỉ cập nhật thuộc tính isDeleted thành true và thay đổi nội dung đoạn chat
            chatMessage.IsDeleted = true;
            chatMessage.Message = "Message has been deleted";
            chatMessage.AttachmentOriginalName = null;
            chatMessage.AttachmentUrl = null;

            await _context.SaveChangesAsync(cancellationToken);

            // Notify the recipient or group members of the message deletion
            if (chatMessage.GroupId.HasValue)
            {
                await _hubContext.Clients.Group(chatMessage.GroupId.ToString()).SendAsync("MessageDeleted", chatMessage.Id);
            }
            else if (chatMessage.ToUserId.HasValue)
            {
                await _hubContext.Clients.User(chatMessage.ToUserId.ToString()).SendAsync("MessageDeleted", chatMessage.Id);
            }

            return Ok(new { Message = "Message has been marked as deleted." });
        }




        [HttpDelete("{userId}/delete-chats/{recipientId}")]
        public async Task<IActionResult> DeleteChats(Guid userId, Guid recipientId, CancellationToken cancellationToken)
        {
            if (userId == Guid.Empty || recipientId == Guid.Empty)
            {
                return BadRequest(new { Message = "Invalid userId or recipientId." });
            }

            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null || userId.ToString() != authenticatedUserId)
            {
                return Forbid("You are not authorized to delete these chats.");
            }

            var authenticatedUserIdGuid = Guid.Parse(authenticatedUserId);

            try
            {
                bool isGroup = await _context.Groups.AnyAsync(g => g.Id == recipientId, cancellationToken);

                if (!isGroup)
                {
                    var privateChats = await _context.Chats
                        .Where(c => (c.UserId == userId && c.ToUserId == recipientId) || (c.UserId == recipientId && c.ToUserId == userId))
                        .ToListAsync(cancellationToken);

                    if (privateChats.Count == 0)
                    {
                        return NotFound("No chats found between the specified users.");
                    }

                    foreach (var chat in privateChats)
                    {

                        // Xóa các Reaction liên quan đến Chat
                        var reactions = await _context.Reactions.Where(r => r.ChatId == chat.Id).ToListAsync(cancellationToken);
                        _context.Reactions.RemoveRange(reactions);

                        if (!await _context.UserDeletedMessages.AnyAsync(udm => udm.UserId == userId && udm.MessageId == chat.Id, cancellationToken))
                        {
                            var deletedMessage = new UserDeletedMessage
                            {
                                Id = Guid.NewGuid(),
                                UserId = userId,
                                MessageId = chat.Id,
                                DeletedAt = DateTime.UtcNow
                            };
                            _context.UserDeletedMessages.Add(deletedMessage);
                        }
                    }
                }
                else
                {
                    var groupChats = await _context.Chats
                        .Where(c => c.GroupId == recipientId)
                        .ToListAsync(cancellationToken);

                    if (groupChats.Count == 0)
                    {
                        return NotFound("No chats found for the specified group.");
                    }

                    foreach (var chat in groupChats)
                    {

                        // Xóa các Reaction liên quan đến Chat
                        var reactions = await _context.Reactions.Where(r => r.ChatId == chat.Id).ToListAsync(cancellationToken);
                        _context.Reactions.RemoveRange(reactions);

                        if (!await _context.UserDeletedMessages.AnyAsync(udm => udm.UserId == userId && udm.MessageId == chat.Id, cancellationToken))
                        {
                            var deletedMessage = new UserDeletedMessage
                            {
                                Id = Guid.NewGuid(),
                                UserId = userId,
                                MessageId = chat.Id,
                                DeletedAt = DateTime.UtcNow
                            };
                            _context.UserDeletedMessages.Add(deletedMessage);
                        }
                    }
                }

                await _context.SaveChangesAsync(cancellationToken);

                return Ok(new { Message = "Chats and associated reactions marked as deleted successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in DeleteChats for user {UserId} and recipient {RecipientId}", userId, recipientId);
                return StatusCode(500, new { Message = "Internal server error. Please try again later." });
            }
        }


        private async Task<bool> AreFriends(Guid userId1, Guid userId2, CancellationToken cancellationToken)
        {
            return await _context.Users
                .AnyAsync(u => u.Id == userId1 && u.Friends.Any(f => f.FriendId == userId2), cancellationToken) &&
                   await _context.Users
                .AnyAsync(u => u.Id == userId2 && u.Friends.Any(f => f.FriendId == userId1), cancellationToken);
        }
        [HttpPost("{chatId}/react")]
        [Authorize]
        public async Task<IActionResult> AddReaction(Guid chatId, [FromBody] AddReactionDto request, CancellationToken cancellationToken)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized(new { Message = "Unauthorized." });
            }

            var chat = await _context.Chats.FirstOrDefaultAsync(c => c.Id == chatId, cancellationToken);
            if (chat == null)
            {
                return NotFound(new { Message = "Chat not found." });
            }

            var existingReaction = await _context.Reactions
                .FirstOrDefaultAsync(r => r.ChatId == chatId && r.UserId == Guid.Parse(userId), cancellationToken);

            if (existingReaction != null)
            {
                existingReaction.ReactionType = request.ReactionType;
                await _context.SaveChangesAsync(cancellationToken);
            }
            else
            {
                var reaction = new Reaction
                {
                    ChatId = chatId,
                    UserId = Guid.Parse(userId),
                    ReactionType = request.ReactionType,
                    Chat = chat
                };

                _context.Reactions.Add(reaction);
                await _context.SaveChangesAsync(cancellationToken);
            }

            // Thông báo qua SignalR cho người dùng bị ảnh hưởng
            if (chat.GroupId.HasValue)
            {
                // Thông báo cho tất cả các thành viên trong nhóm
                var groupMembers = await _context.GroupMembers
                    .Where(gm => gm.GroupId == chat.GroupId)
                    .Select(gm => gm.UserId)
                    .ToListAsync();

                foreach (var memberId in groupMembers)
                {
                    await _hubContext.Clients.User(memberId.ToString()).SendAsync("ReactionAdded", new
                    {
                        ChatId = chatId,
                        ReactionType = request.ReactionType,
                        UserId = userId,
                        HasNewMessage = true // Đánh dấu có phản ứng mới
                    });
                }
            }
            else if (chat.ToUserId.HasValue)
            {
                // Thông báo cho cả hai người dùng trong cuộc trò chuyện riêng tư
                var affectedUsers = new List<Guid> { chat.UserId, chat.ToUserId.Value };

                foreach (var affectedUserId in affectedUsers)
                {
                    await _hubContext.Clients.User(affectedUserId.ToString()).SendAsync("ReactionAdded", new
                    {
                        ChatId = chatId,
                        ReactionType = request.ReactionType,
                        UserId = userId,
                        HasNewMessage = true // Đánh dấu có phản ứng mới
                    });
                }
            }

            return Ok(new { Message = "Reaction added successfully." });
        }




        [HttpGet("{chatId}/reactions")]
        [Authorize]
        public async Task<IActionResult> GetReactions(Guid chatId, CancellationToken cancellationToken)
        {
            var reactions = await _context.Reactions
                .Where(r => r.ChatId == chatId)
                .Select(r => new
                {
                    r.UserId,
                    r.ReactionType,
                    r.CreatedAt
                })
                .ToListAsync(cancellationToken);

            return Ok(reactions);
        }
        [HttpDelete("{chatId}/remove-reaction")]
        [Authorize]
        public async Task<IActionResult> RemoveReaction(Guid chatId, CancellationToken cancellationToken)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized(new { Message = "Unauthorized." });
            }

            // Sử dụng Include để nạp Chat liên quan đến Reaction
            var reaction = await _context.Reactions
                .Include(r => r.Chat)
                .FirstOrDefaultAsync(r => r.ChatId == chatId && r.UserId == Guid.Parse(userId), cancellationToken);

            if (reaction == null)
            {
                return NotFound(new { Message = "Reaction not found." });
            }

            // Ghi nhật ký để kiểm tra giá trị của reaction và reaction.Chat
            _logger.LogInformation("Reaction found: {@Reaction}", reaction);
            _logger.LogInformation("Chat in Reaction: {@Chat}", reaction.Chat);

            // Kiểm tra null cho Chat trước khi sử dụng
            if (reaction.Chat == null)
            {
                return NotFound(new { Message = "Chat associated with the reaction not found." });
            }

            _context.Reactions.Remove(reaction);
            await _context.SaveChangesAsync(cancellationToken);

            // Gửi thông báo qua SignalR cho người dùng bị ảnh hưởng
            if (reaction.Chat.GroupId.HasValue)
            {
                // Thông báo cho tất cả các thành viên trong nhóm
                var groupMembers = await _context.GroupMembers
                    .Where(gm => gm.GroupId == reaction.Chat.GroupId)
                    .Select(gm => gm.UserId)
                    .ToListAsync();

                foreach (var memberId in groupMembers)
                {
                    await _hubContext.Clients.User(memberId.ToString()).SendAsync("ReactionRemoved", new
                    {
                        ChatId = chatId,
                        UserId = userId
                    });
                }
            }
            else if (reaction.Chat.ToUserId.HasValue)
            {
                // Thông báo cho cả hai người dùng trong cuộc trò chuyện riêng tư
                var affectedUsers = new List<Guid> { reaction.Chat.UserId, reaction.Chat.ToUserId.Value };

                foreach (var affectedUserId in affectedUsers)
                {
                    await _hubContext.Clients.User(affectedUserId.ToString()).SendAsync("ReactionRemoved", new
                    {
                        ChatId = chatId,
                        UserId = userId
                    });
                }
            }

            return Ok(new { Message = "Reaction removed successfully." });
        }
        [HttpPost("{chatId}/pin")]
        [Authorize]
        public async Task<IActionResult> PinMessage(Guid chatId, CancellationToken cancellationToken)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var userGuid = Guid.Parse(userId);

            var chatMessage = await _context.Chats.FirstOrDefaultAsync(c => c.Id == chatId, cancellationToken);
            if (chatMessage == null) return NotFound(new { Message = "Chat not found." });

            // Kiểm tra người dùng có quyền ghim tin nhắn không (người gửi hoặc thành viên nhóm)
            if (chatMessage.UserId != userGuid &&
                (chatMessage.GroupId.HasValue && !await _context.GroupMembers.AnyAsync(gm => gm.GroupId == chatMessage.GroupId && gm.UserId == userGuid, cancellationToken)))
            {
                return Forbid("You are not authorized to pin this message.");
            }

            // Ghim tin nhắn
            chatMessage.IsPinned = true;
            await _context.SaveChangesAsync(cancellationToken);

            // Gửi thông báo qua SignalR cho người dùng
            if (chatMessage.GroupId.HasValue)
            {
                await _hubContext.Clients.Group(chatMessage.GroupId.ToString()).SendAsync("MessagePinned", chatMessage.Id);
            }
            else if (chatMessage.ToUserId.HasValue)
            {
                await _hubContext.Clients.User(chatMessage.ToUserId.ToString()).SendAsync("MessagePinned", chatMessage.Id);
            }

            return Ok(new { Message = "Message pinned successfully." });
        }
        [HttpPost("{chatId}/unpin")]
        [Authorize]
        public async Task<IActionResult> UnpinMessage(Guid chatId, CancellationToken cancellationToken)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null) return Unauthorized();

            var userGuid = Guid.Parse(userId);

            var chatMessage = await _context.Chats.FirstOrDefaultAsync(c => c.Id == chatId, cancellationToken);
            if (chatMessage == null) return NotFound(new { Message = "Chat not found." });

            // Kiểm tra người dùng có quyền bỏ ghim tin nhắn không (người gửi hoặc thành viên nhóm)
            if (chatMessage.UserId != userGuid &&
                (chatMessage.GroupId.HasValue && !await _context.GroupMembers.AnyAsync(gm => gm.GroupId == chatMessage.GroupId && gm.UserId == userGuid, cancellationToken)))
            {
                return Forbid("You are not authorized to unpin this message.");
            }

            // Bỏ ghim tin nhắn
            chatMessage.IsPinned = false;
            await _context.SaveChangesAsync(cancellationToken);

            // Gửi thông báo qua SignalR cho người dùng
            if (chatMessage.GroupId.HasValue)
            {
                await _hubContext.Clients.Group(chatMessage.GroupId.ToString()).SendAsync("MessageUnpinned", chatMessage.Id);
            }
            else if (chatMessage.ToUserId.HasValue)
            {
                await _hubContext.Clients.User(chatMessage.ToUserId.ToString()).SendAsync("MessageUnpinned", chatMessage.Id);
            }

            return Ok(new { Message = "Message unpinned successfully." });
        }



    }
}