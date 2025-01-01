using ChatAppServer.WebAPI.Dtos;
using ChatAppServer.WebAPI.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ChatAppServer.WebAPI.Services
{
    public class GroupsService : IGroupsService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<GroupsService> _logger;
        private readonly IHubContext<ChatHub> _hubContext;

        public GroupsService(ApplicationDbContext context, ILogger<GroupsService> logger, IHubContext<ChatHub> hubContext)
        {
            _context = context;
            _logger = logger;
            _hubContext = hubContext;
        }

        public async Task<(bool Success, string Message, Group Group, List<object> Members)> CreateGroupAsync(CreateGroupDto request, string authenticatedUserId, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return (false, "Group name is required", null, null);
            }

            request.MemberIds = request.MemberIds.Distinct().ToList();
            if (request.MemberIds == null || request.MemberIds.Count < 3)
            {
                return (false, "A group must have at least 3 members.", null, null);
            }

            if (!request.MemberIds.Contains(Guid.Parse(authenticatedUserId)))
            {
                return (false, "The group creator must be a member of the group.", null, null);
            }

            string avatarUrl = null;
            if (request.AvatarFile != null)
            {
                (string savedFileName, string originalFileName) = FileService.FileSaveToServer(request.AvatarFile, "wwwroot/avatars/");
                avatarUrl = Path.Combine("avatars", savedFileName).Replace("\\", "/");
            }else
            {
                avatarUrl = "avatars/default.jpg";
            }

            var group = new Group
            {
                Name = request.Name,
                Avatar = avatarUrl
            };

            await _context.Groups.AddAsync(group, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            var members = new List<object>();
            foreach (var userId in request.MemberIds)
            {
                var user = await _context.Users.FindAsync(new object[] { userId }, cancellationToken);
                if (user == null)
                {
                    return (false, $"User with Id {userId} not found", null, null);
                }

                var groupMember = new GroupMember
                {
                    GroupId = group.Id,
                    UserId = userId,
                    IsAdmin = userId == Guid.Parse(authenticatedUserId)
                };

                await _context.GroupMembers.AddAsync(groupMember, cancellationToken);
                members.Add(new
                {
                    user.Id,
                    user.Username,
                    user.FirstName,
                    user.LastName,
                    user.Birthday,
                    user.Email,
                    user.Avatar,
                    user.Status
                });
            }

            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation($"Group {group.Name} created with ID {group.Id}");

            var notificationMessage = $"Group {group.Name} has been created.";
            await _hubContext.Clients.All.SendAsync("NotifyGroupMembers", group.Id, notificationMessage);

            return (true, "Group created successfully", group, members);
        }

        public async Task<(bool Success, string Message)> AddGroupMemberAsync(AddGroupMemberDto request, string authenticatedUserId, CancellationToken cancellationToken)
        {
            var group = await _context.Groups.FindAsync(new object[] { request.GroupId }, cancellationToken);
            if (group == null)
            {
                return (false, "Group not found");
            }

            var isAdmin = await _context.GroupMembers
                .AnyAsync(gm => gm.GroupId == request.GroupId && gm.UserId == Guid.Parse(authenticatedUserId) && gm.IsAdmin, cancellationToken);
            if (!isAdmin)
            {
                return (false, "You are not authorized to add members to this group.");
            }

            var user = await _context.Users.FindAsync(new object[] { request.UserId }, cancellationToken);
            if (user == null)
            {
                return (false, "User not found");
            }

            var isMember = await _context.GroupMembers.AnyAsync(gm => gm.GroupId == request.GroupId && gm.UserId == request.UserId, cancellationToken);
            if (isMember)
            {
                return (false, "User is already a member of the group.");
            }

            var groupMember = new GroupMember
            {
                GroupId = request.GroupId,
                UserId = request.UserId
            };

            await _context.GroupMembers.AddAsync(groupMember, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation($"User {user.Username} added to group {group.Name}");
            var notificationMessage = $"User {user.Username} has been added to the group {group.Name}.";
            await _hubContext.Clients.All.SendAsync("NotifyGroupMembers", group.Id, notificationMessage);

            return (true, "User added to group successfully.");
        }

        public async Task<(bool Success, string Message)> DeleteGroupAsync(Guid groupId, string authenticatedUserId, CancellationToken cancellationToken)
        {
            var group = await _context.Groups.Include(g => g.Members)
                                             .Include(g => g.Chats)
                                             .FirstOrDefaultAsync(g => g.Id == groupId, cancellationToken);
            if (group == null)
            {
                return (false, "Group not found");
            }

            var isAdmin = await _context.GroupMembers.AnyAsync(gm => gm.GroupId == groupId && gm.UserId == Guid.Parse(authenticatedUserId) && gm.IsAdmin, cancellationToken);
            if (!isAdmin)
            {
                return (false, "You are not authorized to delete this group.");
            }

            _context.GroupMembers.RemoveRange(group.Members);
            _context.Chats.RemoveRange(group.Chats);
            _context.Groups.Remove(group);

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation($"Group {group.Name} deleted by user {authenticatedUserId}");

            var notificationMessage = $"Group {group.Name} has been deleted.";
            await _hubContext.Clients.All.SendAsync("NotifyGroupMembers", group.Id, notificationMessage);

            return (true, "Group deleted successfully.");
        }

        public async Task<(bool Success, string Message)> UpdateChatThemeAsync(Guid groupId, UpdateChatThemeDto request, string authenticatedUserId, CancellationToken cancellationToken)
        {
            var groupMember = await _context.GroupMembers
                .FirstOrDefaultAsync(gm => gm.GroupId == groupId && gm.UserId == Guid.Parse(authenticatedUserId), cancellationToken);

            if (groupMember == null)
            {
                return (false, "Group member not found.");
            }

            if (!groupMember.IsAdmin)
            {
                return (false, "You are not authorized to update the chat theme for this group.");
            }

            var group = await _context.Groups.FirstOrDefaultAsync(g => g.Id == groupId, cancellationToken);
            if (group == null)
            {
                return (false, "Group not found.");
            }

            group.ChatTheme = request.Theme;
            await _context.SaveChangesAsync(cancellationToken);

            var notificationMessage = $"Group chat theme has been updated to {request.Theme}.";
            await _hubContext.Clients.Group(groupId.ToString()).SendAsync("NotifyGroupMembers", groupId, notificationMessage);

            return (true, "Chat theme updated successfully.");
        }

        public async Task<List<UserDto>> GetGroupMembersAsync(Guid groupId, string authenticatedUserId, CancellationToken cancellationToken)
        {
            var groupMembers = await _context.GroupMembers
                .Where(gm => gm.GroupId == groupId)
                .Include(gm => gm.User)
                .ToListAsync(cancellationToken);

            if (!groupMembers.Any())
            {
                return null;
            }

            var isMember = groupMembers.Any(gm => gm.UserId == Guid.Parse(authenticatedUserId));
            if (!isMember)
            {
                return null;
            }

            return groupMembers.Select(gm => new UserDto
            {
                Id = gm.User.Id,
                Username = gm.User.Username,
                FirstName = gm.User.FirstName,
                LastName = gm.User.LastName,
                Birthday = gm.User.Birthday,
                Email = gm.User.Email,
                Avatar = gm.User.Avatar,
                Status = gm.User.Status
            }).ToList();
        }

        public async Task<(bool Success, string Message)> RemoveGroupMemberAsync(RemoveGroupMemberDto request, string authenticatedUserId, CancellationToken cancellationToken)
        {
            var authenticatedUserIdGuid = Guid.Parse(authenticatedUserId);

            var groupMember = await _context.GroupMembers
                .Include(gm => gm.User)
                .FirstOrDefaultAsync(gm => gm.GroupId == request.GroupId && gm.UserId == request.UserId, cancellationToken);

            if (groupMember == null)
            {
                return (false, "Group member not found.");
            }

            var isAdmin = await _context.GroupMembers.AnyAsync(gm => gm.GroupId == request.GroupId && gm.UserId == authenticatedUserIdGuid && gm.IsAdmin, cancellationToken);
            if (!isAdmin && request.UserId != authenticatedUserIdGuid)
            {
                return (false, "You are not authorized to remove members from this group.");
            }

            _context.GroupMembers.Remove(groupMember);
            await _context.SaveChangesAsync(cancellationToken);

            var group = await _context.Groups.FirstOrDefaultAsync(g => g.Id == request.GroupId, cancellationToken);
            if (group == null)
            {
                return (false, "Group not found.");
            }

            var anyMembersLeft = await _context.GroupMembers.AnyAsync(gm => gm.GroupId == request.GroupId, cancellationToken);
            if (!anyMembersLeft)
            {
                _context.Groups.Remove(group);
                await _context.SaveChangesAsync(cancellationToken);
                _logger.LogInformation($"Group {request.GroupId} deleted as no members were left.");

                var notificationMessage = $"User {groupMember.User.Username} has been removed from the group {group.Name}.";
                await _hubContext.Clients.All.SendAsync("NotifyGroupMembers", request.GroupId, notificationMessage);

                return (true, "Member removed and group deleted as no members were left.");
            }
            else
            {
                var anyAdminsLeft = await _context.GroupMembers.AnyAsync(gm => gm.GroupId == request.GroupId && gm.IsAdmin, cancellationToken);
                if (!anyAdminsLeft)
                {
                    var remainingMember = await _context.GroupMembers.FirstOrDefaultAsync(gm => gm.GroupId == request.GroupId, cancellationToken);
                    if (remainingMember != null)
                    {
                        remainingMember.IsAdmin = true;
                        await _context.SaveChangesAsync(cancellationToken);
                        _logger.LogInformation($"User {remainingMember.UserId} promoted to admin in group {request.GroupId} as no admins were left.");
                    }
                }

                var notificationMessage = $"User {groupMember.User.Username} has been removed from the group {group.Name}.";
                await _hubContext.Clients.All.SendAsync("NotifyGroupMembers", request.GroupId, notificationMessage);

                return (true, "Member removed from the group.");
            }
        }
        public async Task<List<object>> GetUserGroupsWithDetailsAsync(Guid userId, string authenticatedUserId, CancellationToken cancellationToken)
        {
            // Ensure the user can only request their own groups
            if (userId.ToString() != authenticatedUserId)
            {
                throw new UnauthorizedAccessException("You are not authorized to view this user's groups.");
            }

            // Fetch the groups the user belongs to
            var groups = await _context.Groups
                .Where(g => g.Members.Any(gm => gm.UserId == userId))
                .Select(g => new
                {
                    g.Id,
                    g.Name,
                    g.Avatar,
                    g.ChatTheme,
                    NotificationsMuted = g.Members
                        .Where(gm => gm.UserId == userId)
                        .Select(gm => gm.NotificationsMuted)
                        .FirstOrDefault() // Get the notifications muted status for the user
                })
                .ToListAsync(cancellationToken);

            // Cast anonymous type to object and return
            return groups.Select(g => (object)g).ToList();
        }


        public async Task<(bool Success, string Message)> RenameGroupAsync(RenameGroupDto request, string authenticatedUserId, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.NewName))
            {
                return (false, "New group name is required.");
            }

            var group = await _context.Groups.FindAsync(new object[] { request.GroupId }, cancellationToken);
            if (group == null)
            {
                return (false, "Group not found.");
            }

            var isAdmin = await _context.GroupMembers.AnyAsync(gm => gm.GroupId == request.GroupId && gm.UserId == Guid.Parse(authenticatedUserId) && gm.IsAdmin, cancellationToken);
            if (!isAdmin)
            {
                return (false, "You are not authorized to rename this group.");
            }

            group.Name = request.NewName;
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation($"Group {request.GroupId} renamed to {request.NewName}");
            var notificationMessage = $"Group has been renamed to {group.Name}.";
            await _hubContext.Clients.All.SendAsync("NotifyGroupMembers", request.GroupId, notificationMessage);

            return (true, "Group name updated successfully.");
        }

        public async Task<(bool Success, string Message)> UpdateGroupAdminAsync(UpdateGroupAdminDto request, string authenticatedUserId, CancellationToken cancellationToken)
        {
            var group = await _context.Groups.FindAsync(new object[] { request.GroupId }, cancellationToken);
            if (group == null)
            {
                return (false, "Group not found.");
            }

            var isAdmin = await _context.GroupMembers.AnyAsync(gm => gm.GroupId == request.GroupId && gm.UserId == Guid.Parse(authenticatedUserId) && gm.IsAdmin, cancellationToken);
            if (!isAdmin)
            {
                return (false, "You are not authorized to update group admin.");
            }

            var groupMember = await _context.GroupMembers.FirstOrDefaultAsync(gm => gm.GroupId == request.GroupId && gm.UserId == request.UserId, cancellationToken);
            if (groupMember == null)
            {
                return (false, "Group member not found.");
            }

            groupMember.IsAdmin = true;
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation($"Admin status updated to true in group {request.GroupId}");
            var notificationMessage = $"User {groupMember.User} has been promoted to admin in group {group.Name}.";
            await _hubContext.Clients.All.SendAsync("NotifyGroupMembers", request.GroupId, notificationMessage);

            return (true, "Admin status updated successfully.");
        }

        public async Task<(bool Success, string Message)> RevokeGroupAdminAsync(RevokeGroupAdminDto request, string authenticatedUserId, CancellationToken cancellationToken)
        {
            var group = await _context.Groups.FindAsync(new object[] { request.GroupId }, cancellationToken);
            if (group == null)
            {
                return (false, "Group not found.");
            }

            var isAdmin = await _context.GroupMembers
                .AnyAsync(gm => gm.GroupId == request.GroupId && gm.UserId == Guid.Parse(authenticatedUserId) && gm.IsAdmin, cancellationToken);
            if (!isAdmin)
            {
                return (false, "You are not authorized to revoke admin rights.");
            }

            var groupMember = await _context.GroupMembers
                .FirstOrDefaultAsync(gm => gm.GroupId == request.GroupId && gm.UserId == request.UserId, cancellationToken);
            if (groupMember == null)
            {
                return (false, "Group member not found.");
            }

            groupMember.IsAdmin = false;
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation($"Admin rights revoked in group {request.GroupId}");

            var anyAdminsLeft = await _context.GroupMembers
                .AnyAsync(gm => gm.GroupId == request.GroupId && gm.IsAdmin, cancellationToken);
            if (!anyAdminsLeft)
            {
                var remainingMember = await _context.GroupMembers.FirstOrDefaultAsync(gm => gm.GroupId == request.GroupId, cancellationToken);
                if (remainingMember != null)
                {
                    remainingMember.IsAdmin = true;
                    await _context.SaveChangesAsync(cancellationToken);

                    _logger.LogInformation($"User {remainingMember.UserId} promoted to admin in group {request.GroupId} as no admins were left.");
                }
            }

            var notificationMessage = $"User {groupMember.User.Username} has been demoted from admin in group {group.Name}.";
            await _hubContext.Clients.All.SendAsync("NotifyGroupMembers", request.GroupId, notificationMessage);

            return (true, "Admin rights revoked successfully.");
        }

        public async Task<(bool Success, string Message)> UpdateGroupAvatarAsync(UpdateAvatarGroupDto request, string authenticatedUserId, CancellationToken cancellationToken)
        {
            var group = await _context.Groups.FindAsync(new object[] { request.GroupId }, cancellationToken);
            if (group == null)
            {
                return (false, "Group not found.");
            }

            var isAdmin = await _context.GroupMembers.AnyAsync(gm => gm.GroupId == request.GroupId && gm.UserId == Guid.Parse(authenticatedUserId) && gm.IsAdmin, cancellationToken);
            if (!isAdmin)
            {
                return (false, "You are not authorized to update this group avatar.");
            }

            if (request.AvatarFile != null)
            {
                var oldAvatarPath = group.Avatar;
                var (savedFileName, originalFileName) = FileService.FileSaveToServer(request.AvatarFile, "wwwroot/avatars/");
                group.Avatar = Path.Combine("avatars", savedFileName).Replace("\\", "/");

                if (!string.IsNullOrEmpty(oldAvatarPath))
                {
                    var fullOldAvatarPath = Path.Combine("wwwroot", oldAvatarPath.Replace("/", "\\"));
                    if (System.IO.File.Exists(fullOldAvatarPath))
                    {
                        System.IO.File.Delete(fullOldAvatarPath);
                    }
                }
            }
            else
            {
                return (false, "No avatar file provided.");
            }

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation($"Group {request.GroupId} avatar updated");
            var notificationMessage = $"Group {group.Name} avatar has been updated.";
            await _hubContext.Clients.All.SendAsync("NotifyGroupMembers", request.GroupId, notificationMessage);

            return (true, "Group avatar updated successfully.");
        }

        public async Task<List<UserDto>> GetFriendsNotInGroupAsync(Guid groupId, string authenticatedUserId, CancellationToken cancellationToken)
        {
            var friends = await _context.Friendships
                .Where(f => f.UserId == Guid.Parse(authenticatedUserId))
                .Select(f => f.Friend)
                .ToListAsync(cancellationToken);

            if (!friends.Any())
            {
                return new List<UserDto>();
            }

            var groupMemberIds = await _context.GroupMembers
                .Where(gm => gm.GroupId == groupId)
                .Select(gm => gm.UserId)
                .ToListAsync(cancellationToken);

            return friends
                .Where(f => !groupMemberIds.Contains(f.Id))
                .Select(f => new UserDto
                {
                    Id = f.Id,
                    Username = f.Username,
                    FirstName = f.FirstName,
                    LastName = f.LastName,
                    Birthday = f.Birthday,
                    Email = f.Email,
                    Avatar = f.Avatar,
                    Status = f.Status,
                    TagName = f.TagName
                })
                .ToList();
        }

        public async Task<(bool Success, string Message)> MuteGroupNotificationsAsync(Guid groupId, string authenticatedUserId, CancellationToken cancellationToken)
        {
            var groupMember = await _context.GroupMembers
                .FirstOrDefaultAsync(gm => gm.GroupId == groupId && gm.UserId == Guid.Parse(authenticatedUserId), cancellationToken);

            if (groupMember == null)
            {
                return (false, "Group member not found.");
            }

            groupMember.NotificationsMuted = !groupMember.NotificationsMuted;
            await _context.SaveChangesAsync(cancellationToken);

            var notificationMessage = groupMember.NotificationsMuted
                ? "Group notifications muted successfully."
                : "Group notifications unmuted successfully.";

            await _hubContext.Clients.User(authenticatedUserId).SendAsync("NotifyUser", new
            {
                Message = notificationMessage,
                GroupId = groupId
            });

            return (true, notificationMessage);
        }

    }
}
