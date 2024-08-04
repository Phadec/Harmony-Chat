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

        public ChatsController(ApplicationDbContext context, IHubContext<ChatHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        [HttpGet]
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

        [HttpGet]
        public async Task<IActionResult> GetChats(Guid userId, Guid toUserId, CancellationToken cancellationToken)
        {
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
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetGroupChats(Guid groupId, CancellationToken cancellationToken)
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

        [HttpPost]
        public async Task<IActionResult> SendPrivateMessage([FromForm] SendMessageDto request, CancellationToken cancellationToken)
        {
            if (request == null || (string.IsNullOrEmpty(request.Message) && request.Attachment == null))
            {
                return BadRequest(new { Message = "Invalid message data. Message or Attachment is required." });
            }

            // Xử lý tệp đính kèm
            string? attachmentUrl = null;
            if (request.Attachment != null)
            {
                attachmentUrl = FileService.FileSaveToServer(request.Attachment, "wwwroot/uploads/");
            }

            // Kiểm tra xem người dùng có phải là bạn bè hay không
            if (!request.ToUserId.HasValue || !await AreFriends(request.UserId, request.ToUserId.Value, cancellationToken))
            {
                return BadRequest("You can only send messages to users who are your friends.");
            }

            // Tạo và lưu tin nhắn
            Chat chat = new()
            {
                UserId = request.UserId,
                ToUserId = request.ToUserId,
                Message = request.Message,
                AttachmentUrl = attachmentUrl,
                Date = DateTime.UtcNow
            };

            await _context.AddAsync(chat, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            // Gửi tin nhắn qua SignalR
            await _hubContext.Clients.All.SendAsync("ReceivePrivateMessage", new
            {
                chat.Id,
                chat.UserId,
                chat.ToUserId,
                chat.Message,
                chat.AttachmentUrl,
                chat.Date
            });

            return Ok(new
            {
                chat.Id,
                chat.UserId,
                chat.ToUserId,
                chat.Message,
                chat.AttachmentUrl,
                chat.Date
            });
        }

        [HttpPost]
        public async Task<IActionResult> SendGroupMessage([FromForm] SendGroupMessageDto request, CancellationToken cancellationToken)
        {
            if (request == null || (string.IsNullOrEmpty(request.Message) && request.Attachment == null))
            {
                return BadRequest(new { Message = "Invalid message data. Message or Attachment is required." });
            }

            // Kiểm tra xem người dùng có phải là thành viên của nhóm không
            bool isMember = await _context.GroupMembers
                .AnyAsync(gm => gm.GroupId == request.GroupId && gm.UserId == request.UserId, cancellationToken);

            if (!isMember)
            {
                return BadRequest("You can only send messages to groups you are a member of.");
            }

            // Xử lý tệp đính kèm
            string? attachmentUrl = null;
            if (request.Attachment != null)
            {
                attachmentUrl = FileService.FileSaveToServer(request.Attachment, "wwwroot/uploads/");
            }

            // Tạo và lưu tin nhắn nhóm
            Chat chat = new()
            {
                UserId = request.UserId,
                GroupId = request.GroupId,
                Message = request.Message,
                AttachmentUrl = attachmentUrl,
                Date = DateTime.UtcNow
            };

            await _context.AddAsync(chat, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            // Gửi tin nhắn qua SignalR tới tất cả các thành viên của nhóm
            await _hubContext.Clients.All.SendAsync("ReceiveGroupMessage", new
            {
                chat.Id,
                chat.UserId,
                chat.GroupId,
                chat.Message,
                chat.AttachmentUrl,
                chat.Date
            });

            return Ok(new
            {
                chat.Id,
                chat.UserId,
                chat.GroupId,
                chat.Message,
                chat.AttachmentUrl,
                chat.Date
            });
        }

        // Kiểm tra xem hai người dùng có phải là bạn bè không
        private async Task<bool> AreFriends(Guid userId1, Guid userId2, CancellationToken cancellationToken)
        {
            return await _context.Users
                .AnyAsync(u => u.Id == userId1 && u.Friends.Any(f => f.FriendId == userId2), cancellationToken) &&
                   await _context.Users
                .AnyAsync(u => u.Id == userId2 && u.Friends.Any(f => f.FriendId == userId1), cancellationToken);
        }
    }
}
