using ChatAppServer.WebAPI.Dtos;
using ChatAppServer.WebAPI.Hubs;
using ChatAppServer.WebAPI.Models;
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
            List<Chat> chats = await _context.Chats
                .Where(p =>
                    (p.UserId == userId && p.ToUserId == toUserId) ||
                    (p.ToUserId == userId && p.UserId == toUserId))
                .OrderBy(p => p.Date)
                .ToListAsync(cancellationToken);

            return Ok(chats);
        }

        [HttpGet]
        public async Task<IActionResult> GetGroupChats(Guid groupId, CancellationToken cancellationToken)
        {
            List<Chat> chats = await _context.Chats
                .Where(p => p.GroupId == groupId)
                .OrderBy(p => p.Date)
                .ToListAsync(cancellationToken);

            return Ok(chats);
        }

        [HttpPost]
        public async Task<IActionResult> SendMessage([FromBody] SendMessageDto request, CancellationToken cancellationToken)
        {
            if (request == null || string.IsNullOrEmpty(request.Message))
            {
                return BadRequest(new { Message = "Invalid message data." });
            }

            // Log received data
            Console.WriteLine($"Received request: UserId={request.UserId}, ToUserId={request.ToUserId}, Message={request.Message}");

            // Validate userId and toUserId
            if (request.UserId == Guid.Empty || request.ToUserId == Guid.Empty)
            {
                return BadRequest(new { Message = "UserId and ToUserId must be valid GUIDs." });
            }

            // Kiểm tra xem người dùng có phải là bạn bè của nhau không

            bool areFriends = await AreFriends(request.UserId, request.ToUserId, cancellationToken);

            if (!areFriends)
            {
                return BadRequest("You can only send messages to users who are your friends.");
            }

            // Tạo và lưu tin nhắn
            Chat chat = new()
            {
                UserId = request.UserId,
                ToUserId = request.ToUserId,
                Message = request.Message,
                Date = DateTime.UtcNow
            };

            await _context.AddAsync(chat, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            // Gửi tin nhắn qua SignalR nếu người nhận đang kết nối
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
            // Kiểm tra xem người dùng có phải là thành viên của nhóm không
            bool isMember = await _context.GroupMembers
                .AnyAsync(gm => gm.GroupId == request.GroupId && gm.UserId == request.UserId, cancellationToken);

            if (!isMember)
            {
                return BadRequest("You can only send messages to groups you are a member of.");
            }

            // Tạo và lưu tin nhắn nhóm
            Chat chat = new()
            {
                UserId = request.UserId,
                GroupId = request.GroupId,
                Message = request.Message,
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

        // Phương thức kiểm tra xem hai người có phải là bạn bè không
        private async Task<bool> AreFriends(Guid userId1, Guid userId2, CancellationToken cancellationToken)
        {
            return await _context.Users
                .AnyAsync(u => u.Id == userId1 && u.Friends.Any(f => f.FriendId == userId2), cancellationToken) &&
                await _context.Users
                .AnyAsync(u => u.Id == userId2 && u.Friends.Any(f => f.FriendId == userId1), cancellationToken);
        }
    }
}
