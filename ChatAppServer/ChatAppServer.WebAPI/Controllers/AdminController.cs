using ChatAppServer.WebAPI.Dtos;
using ChatAppServer.WebAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChatAppServer.WebAPI.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    [Authorize(Roles = "Admin")] // Chỉ cho phép admin truy cập các phương thức trong controller này
    public sealed class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AdminController> _logger;

        public AdminController(ApplicationDbContext context, ILogger<AdminController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet("get-users")]
        public async Task<IActionResult> GetUsers(CancellationToken cancellationToken)
        {
            var users = await _context.Users
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

            return Ok(users);
        }

        [HttpPost("update-user-role")]
        public async Task<IActionResult> UpdateUserRole([FromForm] UpdateRoleDto request, CancellationToken cancellationToken)
        {
            var user = await _context.Users.FindAsync(request.UserId);
            if (user == null)
            {
                return NotFound(new { Message = "User not found" });
            }

            if (string.IsNullOrWhiteSpace(request.NewRole))
            {
                return BadRequest(new { Message = "New role is required" });
            }

            user.Role = request.NewRole;
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation($"User {user.Username} role updated to {request.NewRole}");

            return Ok(new { Message = "User role updated successfully" });
        }

        [HttpPost("lock-user")]
        public async Task<IActionResult> LockUser([FromForm] Guid userId, CancellationToken cancellationToken)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { Message = "User not found" });
            }

            user.IsLocked = true;
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation($"User {user.Username} has been locked.");

            return Ok(new { Message = "User has been locked successfully." });
        }

        [HttpPost("unlock-user")]
        public async Task<IActionResult> UnlockUser([FromForm] Guid userId, CancellationToken cancellationToken)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { Message = "User not found" });
            }

            user.IsLocked = false;
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation($"User {user.Username} has been unlocked.");

            return Ok(new { Message = "User has been unlocked successfully." });
        }

        [HttpGet("get-friend-requests")]
        public async Task<IActionResult> GetFriendRequests(CancellationToken cancellationToken)
        {
            var friendRequests = await _context.FriendRequests
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

            return Ok(friendRequests);
        }

        [HttpGet("get-all-chats")]
        public async Task<IActionResult> GetAllChats(CancellationToken cancellationToken)
        {
            var chats = await _context.Chats
                .Include(c => c.User)
                .Include(c => c.ToUser)
                .Include(c => c.Group)
                .OrderBy(c => c.Date) // Sắp xếp theo thời gian gửi tin nhắn
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

            return Ok(chats);
        }



        [HttpGet("get-groups")]
        public async Task<IActionResult> GetGroups(CancellationToken cancellationToken)
        {
            var groups = await _context.Groups
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

            return Ok(groups);
        }


        [HttpGet("get-user-blocks")]
        public async Task<IActionResult> GetUserBlocks(CancellationToken cancellationToken)
        {
            var userBlocks = await _context.UserBlocks
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

            return Ok(userBlocks);
        }

        [HttpGet("get-pending-users")]
        public async Task<IActionResult> GetPendingUsers(CancellationToken cancellationToken)
        {
            var pendingUsers = await _context.PendingUsers
                .OrderBy(pu => pu.Email)
                .ToListAsync(cancellationToken);

            return Ok(pendingUsers);
        }
    }
}