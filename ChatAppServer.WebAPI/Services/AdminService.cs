using ChatAppServer.WebAPI.Dtos;
using ChatAppServer.WebAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace ChatAppServer.WebAPI.Services
{
    public class AdminService : IAdminService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AdminService> _logger;

        public AdminService(ApplicationDbContext context, ILogger<AdminService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<object> GetUsersAsync(CancellationToken cancellationToken)
        {
            return await _context.Users
                .OrderBy(p => p.Username)
                .Select(p => new
                {
                    p.Id,
                    p.Username,
                    p.FirstName,
                    p.LastName,
                    p.Birthday,
                    p.Email,
                    p.Avatar,
                    p.Status
                })
                .ToListAsync(cancellationToken);
        }

        public async Task UpdateUserRoleAsync(UpdateRoleDto request, CancellationToken cancellationToken)
        {
            var user = await _context.Users.FindAsync(request.UserId);
            if (user == null)
            {
                throw new KeyNotFoundException("User not found");
            }

            if (string.IsNullOrWhiteSpace(request.NewRole))
            {
                throw new ArgumentException("New role is required");
            }

            user.Role = request.NewRole;
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation($"User {user.Username} role updated to {request.NewRole}");
        }

        public async Task LockUserAsync(Guid userId, CancellationToken cancellationToken)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                throw new KeyNotFoundException("User not found");
            }

            user.IsLocked = true;
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation($"User {user.Username} has been locked.");
        }

        public async Task UnlockUserAsync(Guid userId, CancellationToken cancellationToken)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                throw new KeyNotFoundException("User not found");
            }

            user.IsLocked = false;
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation($"User {user.Username} has been unlocked.");
        }

        public async Task<object> GetFriendRequestsAsync(CancellationToken cancellationToken)
        {
            return await _context.FriendRequests
                .Include(fr => fr.Sender)
                .Include(fr => fr.Receiver)
                .Select(fr => new
                {
                    fr.Id,
                    Sender = fr.Sender.Username,
                    Receiver = fr.Receiver.Username,
                    fr.RequestDate,
                    fr.Status
                })
                .OrderBy(fr => fr.RequestDate)
                .ToListAsync(cancellationToken);
        }

        public async Task<object> GetAllChatsAsync(CancellationToken cancellationToken)
        {
            return await _context.Chats
                .Include(c => c.User)
                .Include(c => c.ToUser)
                .Include(c => c.Group)
                .OrderBy(c => c.Date)
                .Select(c => new
                {
                    c.Id,
                    UserId = c.User.Id,
                    Username = c.User.Username,
                    ToUserId = c.ToUserId,
                    ToUsername = c.ToUser != null ? c.ToUser.Username : null,
                    GroupId = c.GroupId,
                    GroupName = c.Group != null ? c.Group.Name : null,
                    Message = c.Message ?? string.Empty,
                    AttachmentUrl = c.AttachmentUrl ?? string.Empty,
                    Date = c.Date
                })
                .ToListAsync(cancellationToken);
        }

        public async Task<object> GetGroupsAsync(CancellationToken cancellationToken)
        {
            return await _context.Groups
                .Include(g => g.Members)
                .ThenInclude(m => m.User)
                .Include(g => g.Chats)
                .ThenInclude(c => c.User)
                .OrderBy(g => g.Name)
                .Select(g => new
                {
                    g.Id,
                    g.Name,
                    Members = g.Members.Select(m => new
                    {
                        m.User.Id,
                        m.User.Username
                    }),
                    Chats = g.Chats.Select(c => new
                    {
                        c.Id,
                        c.Message,
                        c.AttachmentUrl,
                        c.AttachmentOriginalName,
                        c.Date,
                        UserId = c.User.Id,
                        Username = c.User.Username
                    })
                })
                .ToListAsync(cancellationToken);
        }

        public async Task<object> GetUserBlocksAsync(CancellationToken cancellationToken)
        {
            return await _context.UserBlocks
                .Include(ub => ub.User)
                .Include(ub => ub.BlockedUser)
                .Select(ub => new
                {
                    UserId = ub.User.Id,
                    UserUsername = ub.User.Username,
                    BlockedUserId = ub.BlockedUser.Id,
                    BlockedUserUsername = ub.BlockedUser.Username,
                    ub.BlockedDate
                })
                .OrderBy(ub => ub.BlockedDate)
                .ToListAsync(cancellationToken);
        }

        public async Task<object> GetPendingUsersAsync(CancellationToken cancellationToken)
        {
            return await _context.PendingUsers
                .OrderBy(pu => pu.Email)
                .ToListAsync(cancellationToken);
        }
    }
}
