using ChatAppServer.WebAPI.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Concurrent;

namespace ChatAppServer.WebAPI.Hubs
{
    public sealed class ChatHub : Hub
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ChatHub> _logger;
        public static ConcurrentDictionary<string, Guid> Users = new();

        public ChatHub(ApplicationDbContext context, ILogger<ChatHub> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task Connect(Guid userId)
        {
            if (userId == Guid.Empty)
            {
                _logger.LogWarning("Invalid userId provided for connection.");
                throw new HubException("Invalid userId.");
            }

            Users.TryAdd(Context.ConnectionId, userId);
            User? user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
            if (user is not null)
            {
                user.Status = "online";
                _context.Users.Update(user);
                await _context.SaveChangesAsync();

                await Clients.All.SendAsync("Users", new
                {
                    user.Id,
                    user.Username,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    user.Birthday,
                    user.Email,
                    user.Avatar,
                    user.Status
                });

                _logger.LogInformation($"User {user.Username} connected with ConnectionId {Context.ConnectionId}.");
            }
            else
            {
                _logger.LogWarning($"User with Id {userId} not found.");
            }
        }

        public async Task Disconnect(Guid userId)
        {
            if (userId == Guid.Empty)
            {
                _logger.LogWarning("Invalid userId provided for disconnection.");
                throw new HubException("Invalid userId.");
            }

            await OnDisconnectedAsync(null);
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (Users.TryRemove(Context.ConnectionId, out Guid userId))
            {
                User? user = await _context.Users.FindAsync(userId);
                if (user is not null)
                {
                    user.Status = "offline";
                    _context.Users.Update(user);
                    await _context.SaveChangesAsync();

                    await Clients.All.SendAsync("Users", new
                    {
                        user.Id,
                        user.Username,
                        FirstName = user.FirstName,
                        LastName = user.LastName,
                        user.Birthday,
                        user.Email,
                        user.Avatar,
                        user.Status
                    });

                    _logger.LogInformation($"User {user.Username} disconnected.");
                }
                else
                {
                    _logger.LogWarning($"User with Id {userId} not found.");
                }
            }
            await base.OnDisconnectedAsync(exception);
        }

        public async Task NotifyNewMessage(Chat chat)
        {
            if (chat == null)
            {
                _logger.LogWarning("Invalid chat message.");
                throw new HubException("Invalid chat message.");
            }

            if (chat.GroupId.HasValue)
            {
                var groupMembers = await _context.GroupMembers
                    .Where(gm => gm.GroupId == chat.GroupId)
                    .Select(gm => gm.UserId)
                    .ToListAsync();

                foreach (var userId in groupMembers)
                {
                    var connection = Users.FirstOrDefault(p => p.Value == userId);
                    if (connection.Key != null)
                    {
                        await Clients.Client(connection.Key).SendAsync("ReceiveGroupMessage", new
                        {
                            chat.Id,
                            chat.UserId,
                            chat.GroupId,
                            chat.Message,
                            chat.AttachmentUrl,
                            chat.Date
                        });
                    }
                }
            }
            else if (chat.ToUserId.HasValue)
            {
                var connection = Users.FirstOrDefault(p => p.Value == chat.ToUserId.Value);
                if (connection.Key != null)
                {
                    await Clients.Client(connection.Key).SendAsync("ReceivePrivateMessage", new
                    {
                        chat.Id,
                        chat.UserId,
                        chat.ToUserId,
                        chat.Message,
                        chat.AttachmentUrl,
                        chat.Date
                    });
                }
            }
            else
            {
                _logger.LogWarning("Chat message must have either GroupId or ToUserId.");
                throw new HubException("Chat message must have either GroupId or ToUserId.");
            }

            // Phát sự kiện cập nhật danh sách mối quan hệ
            await Clients.All.SendAsync("UpdateRelationships");
        }
    }
}
