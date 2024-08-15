using ChatAppServer.WebAPI.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Concurrent;
using System.Security.Claims;

public sealed class ChatHub : Hub
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ChatHub> _logger;
    private readonly IServiceProvider _serviceProvider; // Inject IServiceProvider
    // Dictionary để quản lý các ConnectionId theo UserId
    public static ConcurrentDictionary<Guid, List<string>> UserConnections = new();

    public ChatHub(ApplicationDbContext context, ILogger<ChatHub> logger, IServiceProvider serviceProvider)
    {
        _context = context;
        _logger = logger;
        _serviceProvider = serviceProvider;
    }

    // Khi người dùng kết nối
    public async Task Connect(Guid userId)
    {
        if (userId == Guid.Empty)
        {
            _logger.LogWarning("Invalid userId provided for connection.");
            throw new HubException("Invalid userId.");
        }

        // Add the connection to the UserConnections dictionary
        if (!UserConnections.ContainsKey(userId))
        {
            UserConnections[userId] = new List<string>();
        }
        UserConnections[userId].Add(Context.ConnectionId);

        _logger.LogInformation($"User {userId} connected with ConnectionId {Context.ConnectionId}.");

        // Notify the user that they have successfully connected
        await Clients.Client(Context.ConnectionId).SendAsync("Connected", userId);
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (Guid.TryParse(userId, out var guidUserId))
        {
            _logger.LogInformation($"Processing connection for user {guidUserId} with ConnectionId {Context.ConnectionId}.");

            if (!UserConnections.ContainsKey(guidUserId))
            {
                UserConnections[guidUserId] = new List<string>();
                _logger.LogInformation($"New connection list created for user {guidUserId}.");
            }
            UserConnections[guidUserId].Add(Context.ConnectionId);
            _logger.LogInformation($"ConnectionId {Context.ConnectionId} added for user {guidUserId}. Total connections: {UserConnections[guidUserId].Count}.");

            // Thêm người dùng vào các group mà họ là thành viên
            var userGroups = await _context.GroupMembers
                .Where(gm => gm.UserId == guidUserId)
                .Select(gm => gm.GroupId)
                .ToListAsync();

            foreach (var groupId in userGroups)
            {
                try
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, groupId.ToString());
                    _logger.LogInformation($"User {guidUserId} added to group {groupId}.");
                }
                catch (Exception ex)
                {
                    _logger.LogError($"Failed to add user {guidUserId} to group {groupId}. Error: {ex.Message}");
                    // Optionally, you can take further actions here, like notifying the user or performing a retry.
                }
            }

        }
        else
        {
            _logger.LogWarning($"Failed to parse user ID for ConnectionId {Context.ConnectionId}.");
        }
        await UpdateConnectedUsersList();
        await base.OnConnectedAsync();
    }

    private async Task UpdateConnectedUsersList()
    {
        var connectedUsers = UserConnections.Keys.ToList();
        await Clients.All.SendAsync("UpdateConnectedUsers", connectedUsers);
    }
    public async Task<string> GetUserFullNameAsync(Guid userId)
    {
        var user = await _context.Users
            .Where(u => u.Id == userId)
            .Select(u => new { u.FirstName, u.LastName })
            .FirstOrDefaultAsync();

        if (user == null)
        {
            return "Unknown User";
        }

        return $"{user.FirstName} {user.LastName}";
    }

    public async Task NotifyNewMessage(Chat chat)
    {
        if (chat == null)
        {
            _logger.LogWarning("Invalid chat message.");
            throw new HubException("Invalid chat message.");
        }

        List<Guid> affectedUsers = new List<Guid>();

        // Lấy tên người gửi
        var senderFullName = await GetUserFullNameAsync(chat.UserId);

        if (chat.GroupId.HasValue)
        {
            // Lấy tất cả các thành viên trong nhóm
            var groupMembers = await _context.GroupMembers
                .Where(gm => gm.GroupId == chat.GroupId)
                .Select(gm => gm.UserId)
                .ToListAsync();

            affectedUsers.AddRange(groupMembers);

            foreach (var userId in groupMembers)
            {
                if (UserConnections.ContainsKey(userId))
                {
                    var connections = UserConnections[userId];
                    foreach (var connectionId in connections)
                    {
                        await Clients.Client(connectionId).SendAsync("ReceiveGroupMessage", new
                        {
                            chat.Id,
                            chat.UserId, // Đây là UserId của người gửi
                            SenderFullName = senderFullName, // Thêm tên đầy đủ người gửi
                            chat.GroupId,
                            chat.Message,
                            chat.AttachmentUrl,
                            chat.Date
                        });
                    }
                }
            }
        }
        else if (chat.ToUserId.HasValue)
        {
            // Thêm cả người nhận và người gửi vào danh sách bị ảnh hưởng
            affectedUsers.Add(chat.ToUserId.Value); // Người nhận
            affectedUsers.Add(chat.UserId); // Người gửi

            // Gửi tin nhắn đến người nhận
            if (UserConnections.ContainsKey(chat.ToUserId.Value))
            {
                var connections = UserConnections[chat.ToUserId.Value];
                foreach (var connectionId in connections)
                {
                    await Clients.Client(connectionId).SendAsync("ReceivePrivateMessage", new
                    {
                        chat.Id,
                        chat.UserId, // Đây là UserId của người gửi
                        SenderFullName = senderFullName, // Thêm tên đầy đủ người gửi
                        chat.ToUserId, // Đây là UserId của người nhận
                        chat.Message,
                        chat.AttachmentUrl,
                        chat.Date
                    });
                }
            }
        }
        else
        {
            _logger.LogWarning("Chat message must have either GroupId or ToUserId.");
            throw new HubException("Chat message must have either GroupId or ToUserId.");
        }

        // Phát sự kiện cập nhật danh sách mối quan hệ tới cả người gửi và người nhận
        foreach (var userId in affectedUsers.Distinct())
        {
            if (UserConnections.ContainsKey(userId))
            {
                var connections = UserConnections[userId];
                foreach (var connectionId in connections)
                {
                    await Clients.Client(connectionId).SendAsync("UpdateRelationships");
                }
            }
            else
            {
                _logger.LogWarning($"User {userId} not found in UserConnections.");
            }
        }
    }


    // Phương thức thông báo khi tin nhắn đã được đọc
    public async Task NotifyMessageRead(Guid chatId)
    {
        // Tìm tin nhắn dựa trên chatId
        var message = await _context.Chats.FindAsync(chatId);
        if (message == null)
        {
            _logger.LogWarning($"Message with ID {chatId} not found.");
            return;
        }

        // Đánh dấu tin nhắn là đã đọc
        message.IsRead = true;
        await _context.SaveChangesAsync();

        // Thông báo người gửi rằng tin nhắn đã được đọc
        if (UserConnections.ContainsKey(message.UserId))
        {
            var connections = UserConnections[message.UserId];
            foreach (var connectionId in connections)
            {
                await Clients.Client(connectionId).SendAsync("MessageRead", chatId);
            }
        }
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // Lấy UserId từ các claim của user hiện tại
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        // Kiểm tra nếu UserId hợp lệ
        if (Guid.TryParse(userId, out var guidUserId))
        {
            // Kiểm tra xem user có trong danh sách UserConnections không
            if (UserConnections.TryGetValue(guidUserId, out var connectionList))
            {
                // Xóa ConnectionId của người dùng khi ngắt kết nối
                connectionList.Remove(Context.ConnectionId);

                // Nếu người dùng không còn bất kỳ kết nối nào, xóa người dùng khỏi danh sách
                if (!connectionList.Any())
                {
                    UserConnections.TryRemove(guidUserId, out _);
                }
                _logger.LogInformation($"User {guidUserId} disconnected with ConnectionId {Context.ConnectionId}.");
            }
        }
        else
        {
            _logger.LogWarning($"Failed to parse user ID for ConnectionId {Context.ConnectionId}.");
        }

        // Cập nhật danh sách người dùng kết nối
        await UpdateConnectedUsersList();

        // Gọi phương thức cơ sở để xử lý mặc định của SignalR
        await base.OnDisconnectedAsync(exception);
    }


    public async Task NotifyGroupMembers(Guid groupId, string message)
    {
        // Create a scope to resolve the DbContext
        using (var scope = _serviceProvider.CreateScope())
        {
            var _context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            // Fetch group members
            var groupMembers = await _context.GroupMembers
                .Where(gm => gm.GroupId == groupId)
                .Select(gm => gm.UserId)
                .ToListAsync();

            // Notify each connected member
            foreach (var memberId in groupMembers)
            {
                if (UserConnections.ContainsKey(memberId))
                {
                    var connections = UserConnections[memberId];
                    foreach (var connectionId in connections)
                    {
                        await Clients.Client(connectionId).SendAsync("ReceiveGroupNotification", message);
                    }
                }
            }
        }

    }

}