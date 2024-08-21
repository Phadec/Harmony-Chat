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

    // Dictionary để lưu trữ PeerId theo UserId
    public static ConcurrentDictionary<Guid, string> UserPeerIds = new();

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
        try
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
                _logger.LogWarning($"Failed to parse user ID for ConnectionId {Context.ConnectionId}. Claims: {Context.User?.Claims}");
            }
            await UpdateConnectedUsersList();
        }
        catch (Exception ex)
        {
            _logger.LogError($"An error occurred during connection setup. ConnectionId: {Context.ConnectionId}. Error: {ex.Message}");
        }

        await base.OnConnectedAsync();
    }


    private async Task UpdateConnectedUsersList()
    {
        try
        {
            var connectedUsers = UserConnections.Keys.ToList();
            await Clients.All.SendAsync("UpdateConnectedUsers", connectedUsers);
        }
        catch (Exception ex)
        {
            _logger.LogError($"Failed to update connected users list. Error: {ex.Message}");
        }
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
        try
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (Guid.TryParse(userId, out var guidUserId))
            {
                if (UserConnections.TryGetValue(guidUserId, out var connectionList))
                {
                    connectionList.Remove(Context.ConnectionId);

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

            await UpdateConnectedUsersList();
        }
        catch (Exception ex)
        {
            _logger.LogError($"An error occurred during disconnection. ConnectionId: {Context.ConnectionId}. Error: {ex.Message}");
        }

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
    // Phương thức đăng ký PeerId cho người dùng
    public async Task RegisterPeerId(Guid userId, string peerId)
    {
        if (userId == Guid.Empty || string.IsNullOrEmpty(peerId))
        {
            _logger.LogWarning("Invalid userId or peerId.");
            throw new HubException("Invalid userId or peerId.");
        }

        // Lưu PeerId của người dùng
        UserPeerIds[userId] = peerId;
        _logger.LogInformation($"User {userId} registered peerId {peerId}.");

        // Optionally, notify other clients that this peerId has been updated
        await Clients.All.SendAsync("PeerIdUpdated", userId, peerId);
    }

    // Phương thức để lấy PeerId của người dùng
    public string GetPeerId(Guid userId)
    {
        if (UserPeerIds.TryGetValue(userId, out var peerId))
        {
            return peerId;
        }

        _logger.LogWarning($"No peerId found for user {userId}.");
        throw new HubException("User not found.");
    }

    // Phương thức để lấy userId từ peerId
    public Guid GetUserIdByPeerId(string peerId)
    {
        foreach (var entry in UserPeerIds)
        {
            if (entry.Value == peerId)
            {
                return entry.Key;
            }
        }
        throw new HubException("User not found for this peerId.");
    }

    // Phương thức để lấy fullName của người dùng
    public async Task<string> GetFullNameByUserId(Guid userId)
    {
        var user = await _context.Users
            .Where(u => u.Id == userId)
            .Select(u => $"{u.FirstName} {u.LastName}")
            .FirstOrDefaultAsync();

        return user ?? "Unknown User";
    }

    // Phương thức để xử lý khi người dùng nhận cuộc gọi
    public async Task HandleIncomingCall(string peerId, bool isVideoCall)
    {
        try
        {
            // Lấy userId từ peerId
            var userId = GetUserIdByPeerId(peerId);

            // Lấy fullName từ userId
            var fullName = await GetFullNameByUserId(userId);

            // Gửi tên người gọi, peerId và isVideoCall đến client
            await Clients.Client(Context.ConnectionId).SendAsync("ReceiveCall", new { callerName = fullName, peerId, isVideoCall });
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error handling incoming call. PeerId: {peerId}, Error: {ex.Message}");
        }
    }

    // Phương thức để xử lý khi người dùng kết thúc cuộc gọi
    public async Task HandleEndingCall(string peerId, bool isVideoCall)
    {
        try
        {
            // Lấy userId từ peerId
            var userId = GetUserIdByPeerId(peerId);

            // Gửi thông báo kết thúc cuộc gọi đến tất cả các connectionId của userId
            if (UserConnections.TryGetValue(userId, out var connectionIds))
            {
                foreach (var connectionId in connectionIds)
                {
                    await Clients.Client(connectionId).SendAsync("CallEnded", new { peerId, isVideoCall });
                }
            }
            else
            {
                _logger.LogWarning($"No connections found for user {userId} when trying to handle ending call.");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error handling ending call. PeerId: {peerId}, Error: {ex.Message}");
        }
    }




}