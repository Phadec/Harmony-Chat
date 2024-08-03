using ChatAppServer.WebAPI.Models;
using Microsoft.AspNetCore.SignalR;
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

                await Clients.All.SendAsync("Users", user);
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

                    await Clients.All.SendAsync("Users", user);
                }
            }
            await base.OnDisconnectedAsync(exception);
        }
    }
}
