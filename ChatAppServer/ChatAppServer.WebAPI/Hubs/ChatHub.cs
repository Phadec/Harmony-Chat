using ChatAppServer.WebAPI.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Concurrent;

namespace ChatAppServer.WebAPI.Hubs
{
    public sealed class ChatHub : Hub
    {
        private readonly ApplicationDbContext _context;
        public static ConcurrentDictionary<string, Guid> Users = new();

        public ChatHub(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task Connect(Guid userId)
        {
            Users.TryAdd(Context.ConnectionId, userId);
            User? user = await _context.Users.FindAsync(userId);
            if (user is not null)
            {
                user.Status = "online";
                await _context.SaveChangesAsync();

                await Clients.All.SendAsync("Users", new
                {
                    user.Id,
                    user.Username,
                    user.FullName,
                    user.Birthday,
                    user.Email,
                    user.Avatar,
                    user.Status
                });
            }
        }

        public async Task Disconnect(Guid userId)
        {
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
                    await _context.SaveChangesAsync();

                    await Clients.All.SendAsync("Users", new
                    {
                        user.Id,
                        user.Username,
                        user.FullName,
                        user.Birthday,
                        user.Email,
                        user.Avatar,
                        user.Status
                    });
                }
            }
            await base.OnDisconnectedAsync(exception);
        }

        // Method to notify new message
        public async Task NotifyNewMessage(Chat chat)
        {
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
            else
            {
                var connection = Users.FirstOrDefault(p => p.Value == chat.ToUserId);
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
        }
    }
}
