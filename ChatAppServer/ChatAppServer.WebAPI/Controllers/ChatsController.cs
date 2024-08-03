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
            List<User> users = await _context.Users.OrderBy(p => p.Username).ToListAsync();
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
                        chat.GroupId,
                        Message = chat.Message ?? string.Empty, // Nếu null, trả về chuỗi rỗng
                        AttachmentUrl = chat.AttachmentUrl ?? string.Empty, // Nếu null, trả về chuỗi rỗng
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
                .Include(p => p.User) // Eager load User để có thể lấy Username
                .OrderBy(p => p.Date)
                .Select(chat => new ChatDto
                {
                    Id = chat.Id,
                    UserId = chat.UserId,
                    Username = chat.User.Username, // Assuming Username is a property of User
                    ToUserId = chat.ToUserId,
                    GroupId = chat.GroupId,
                    Message = chat.Message ?? string.Empty,
                    AttachmentUrl = chat.AttachmentUrl ?? string.Empty,
                    Date = chat.Date
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
            var connection = ChatHub.Users.FirstOrDefault(p => p.Value == chat.ToUserId);
            if (connection.Key != null)
            {
                await _hubContext.Clients.Client(connection.Key).SendAsync("Messages", chat);
            }

            return Ok(chat);
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
            var groupMembers = await _context.GroupMembers
                .Where(gm => gm.GroupId == request.GroupId)
                .Select(gm => gm.UserId)
                .ToListAsync(cancellationToken);

            var connections = ChatHub.Users.Where(p => groupMembers.Contains(p.Value));
            foreach (var connection in connections)
            {
                await _hubContext.Clients.Client(connection.Key).SendAsync("GroupMessages", chat);
            }

            return Ok(chat);
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