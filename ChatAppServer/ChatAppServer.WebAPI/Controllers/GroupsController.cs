using ChatAppServer.WebAPI.Dtos;
using ChatAppServer.WebAPI.Models;
using ChatAppServer.WebAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ChatAppServer.WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public sealed class GroupsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<GroupsController> _logger;

        public GroupsController(ApplicationDbContext context, ILogger<GroupsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpPost("create-group-chat")]
        public async Task<IActionResult> CreateGroup([FromForm] CreateGroupDto request, CancellationToken cancellationToken)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Name))
                {
                    return BadRequest(new { Message = "Group name is required" });
                }

                request.MemberIds = request.MemberIds.Distinct().ToList();
                if (request.MemberIds == null || request.MemberIds.Count < 3)
                {
                    return BadRequest(new { Message = "A group must have at least 3 members." });
                }

                var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (authenticatedUserId == null)
                {
                    return Forbid("You are not authorized to create this group.");
                }

                if (!request.MemberIds.Contains(Guid.Parse(authenticatedUserId)))
                {
                    return BadRequest(new { Message = "The group creator must be a member of the group." });
                }

                string avatarUrl = null;
                if (request.AvatarFile != null)
                {
                    (string savedFileName, string originalFileName) = FileService.FileSaveToServer(request.AvatarFile, "wwwroot/avatar/");
                    avatarUrl = Path.Combine("avatars", savedFileName).Replace("\\", "/");
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
                        return NotFound(new { Message = $"User with Id {userId} not found" });
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

                return CreatedAtAction(nameof(GetGroupMembers), new { groupId = group.Id }, new
                {
                    id = group.Id,
                    name = group.Name,
                    avatar = group.Avatar,
                    members
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while creating group {GroupName} for user {UserId}", request.Name, User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }
        }


        [HttpPost("add-group-chat-member")]
        public async Task<IActionResult> AddMember([FromForm] AddGroupMemberDto request, CancellationToken cancellationToken)
        {
            try
            {
                var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (authenticatedUserId == null)
                {
                    return Forbid("You are not authorized to add members to this group.");
                }

                var group = await _context.Groups.FindAsync(new object[] { request.GroupId }, cancellationToken);
                if (group == null)
                {
                    return NotFound(new { Message = "Group not found" });
                }

                var isAdmin = await _context.GroupMembers.AnyAsync(gm => gm.GroupId == request.GroupId && gm.UserId == Guid.Parse(authenticatedUserId) && gm.IsAdmin, cancellationToken);
                if (!isAdmin)
                {
                    return Forbid("You are not authorized to add members to this group.");
                }

                var user = await _context.Users.FindAsync(new object[] { request.UserId }, cancellationToken);
                if (user == null)
                {
                    return NotFound(new { Message = "User not found" });
                }

                var isMember = await _context.GroupMembers.AnyAsync(gm => gm.GroupId == request.GroupId && gm.UserId == request.UserId, cancellationToken);
                if (isMember)
                {
                    return Conflict(new { Message = "User is already a member of the group" });
                }

                var groupMember = new GroupMember
                {
                    GroupId = request.GroupId,
                    UserId = request.UserId
                };

                await _context.GroupMembers.AddAsync(groupMember, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation($"User {user.Username} added to group {group.Name}");

                return Ok(new
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
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while adding user {UserId} to group {GroupId}", request.UserId, request.GroupId);
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }
        }


        [HttpDelete("{groupId}/delete")]
        public async Task<IActionResult> DeleteGroup(Guid groupId, CancellationToken cancellationToken)
        {
            try
            {
                var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (authenticatedUserId == null)
                {
                    return Forbid("You are not authorized to delete this group.");
                }

                var group = await _context.Groups.Include(g => g.Members)
                                                 .Include(g => g.Chats)
                                                 .FirstOrDefaultAsync(g => g.Id == groupId, cancellationToken);
                if (group == null)
                {
                    return NotFound(new { Message = "Group not found" });
                }

                var isAdmin = await _context.GroupMembers.AnyAsync(gm => gm.GroupId == groupId && gm.UserId == Guid.Parse(authenticatedUserId) && gm.IsAdmin, cancellationToken);
                if (!isAdmin)
                {
                    return Forbid("You are not authorized to delete this group.");
                }

                _context.GroupMembers.RemoveRange(group.Members);
                _context.Chats.RemoveRange(group.Chats);
                _context.Groups.Remove(group);

                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation($"Group {group.Name} deleted by user {authenticatedUserId}");

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while deleting the group with ID {GroupId}", groupId);
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }
        }

        [HttpGet("{groupId}/members")]
        public async Task<IActionResult> GetGroupMembers(Guid groupId, CancellationToken cancellationToken)
        {
            try
            {
                var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (authenticatedUserId == null)
                {
                    return Forbid("You are not authorized to view the members of this group.");
                }

                var groupMembers = await _context.GroupMembers
                    .Where(gm => gm.GroupId == groupId)
                    .Include(gm => gm.User)
                    .ToListAsync(cancellationToken);

                if (!groupMembers.Any())
                {
                    return NotFound(new { Message = "No members found in this group" });
                }

                var isMember = groupMembers.Any(gm => gm.UserId == Guid.Parse(authenticatedUserId));
                if (!isMember)
                {
                    return Forbid("You are not authorized to view the members of this group.");
                }

                var membersDto = groupMembers.Select(gm => new UserDto
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

                return Ok(membersDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while fetching the members of group {GroupId}", groupId);
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }
        }

        [HttpDelete("remove-member")]
        public async Task<IActionResult> RemoveMember([FromForm] RemoveGroupMemberDto request, CancellationToken cancellationToken)
        {
            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null)
            {
                return Forbid("You are not authorized to remove members from this group.");
            }

            var authenticatedUserIdGuid = Guid.Parse(authenticatedUserId);

            var groupMember = await _context.GroupMembers
                .FirstOrDefaultAsync(gm => gm.GroupId == request.GroupId && gm.UserId == request.UserId, cancellationToken);

            if (groupMember == null)
            {
                return NotFound(new { Message = "Group member not found" });
            }

            var isAdmin = await _context.GroupMembers.AnyAsync(gm => gm.GroupId == request.GroupId && gm.UserId == authenticatedUserIdGuid && gm.IsAdmin, cancellationToken);
            if (!isAdmin && request.UserId != authenticatedUserIdGuid)
            {
                return Forbid("You are not authorized to remove members from this group.");
            }

            try
            {
                var wasAdmin = groupMember.IsAdmin;
                _context.GroupMembers.Remove(groupMember);
                await _context.SaveChangesAsync(cancellationToken);

                var anyMembersLeft = await _context.GroupMembers.AnyAsync(gm => gm.GroupId == request.GroupId, cancellationToken);
                if (!anyMembersLeft)
                {
                    var group = await _context.Groups.FirstOrDefaultAsync(g => g.Id == request.GroupId, cancellationToken);
                    if (group != null)
                    {
                        _context.Groups.Remove(group);
                        await _context.SaveChangesAsync(cancellationToken);
                        _logger.LogInformation($"Group {request.GroupId} deleted as no members were left.");
                        return Ok(new { Message = "Member removed and group deleted as no members were left." });
                    }
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

                    _logger.LogInformation($"User {request.UserId} removed from group {request.GroupId}");
                    return Ok(new { Message = "Member removed from the group" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in RemoveMember: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }

            return Ok(new { Message = "Member removed from the group" });
        }

        [HttpGet("user-groups-with-details/{userId}")]
        public async Task<IActionResult> GetUserGroupsWithDetails(Guid userId, CancellationToken cancellationToken)
        {
            try
            {
                var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (authenticatedUserId == null || userId.ToString() != authenticatedUserId)
                {
                    return Forbid("You are not authorized to view this user's groups.");
                }

                if (userId == Guid.Empty)
                {
                    return BadRequest(new { Message = "Invalid userId" });
                }

                // Truy vấn để lấy các nhóm mà người dùng tham gia và chỉ trả về id, name, avatar
                var userGroups = await _context.Groups
                    .Where(g => g.Members.Any(gm => gm.UserId == userId))
                    .Select(g => new
                    {
                        g.Id,
                        g.Name,
                        g.Avatar
                    })
                    .ToListAsync(cancellationToken);

                if (!userGroups.Any())
                {
                    return NotFound(new { Message = "No groups found for this user." });
                }

                return Ok(userGroups);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while fetching groups for user {UserId}", userId);
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }
        }


        [HttpPut("rename-group")]
        public async Task<IActionResult> RenameGroup([FromBody] RenameGroupDto request, CancellationToken cancellationToken)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.NewName))
                {
                    return BadRequest(new { Message = "New group name is required" });
                }

                var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (authenticatedUserId == null)
                {
                    return Forbid("You are not authorized to rename this group.");
                }

                var group = await _context.Groups.FindAsync(new object[] { request.GroupId }, cancellationToken);
                if (group == null)
                {
                    return NotFound(new { Message = "Group not found" });
                }

                var isAdmin = await _context.GroupMembers.AnyAsync(gm => gm.GroupId == request.GroupId && gm.UserId == Guid.Parse(authenticatedUserId) && gm.IsAdmin, cancellationToken);
                if (!isAdmin)
                {
                    return Forbid("You are not authorized to rename this group.");
                }

                group.Name = request.NewName;
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation($"Group {request.GroupId} renamed to {request.NewName}");

                return Ok(new { Message = "Group name updated successfully", group.Id, group.Name });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while renaming group {GroupId}", request.GroupId);
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }
        }


        [HttpPost("update-admin")]
        public async Task<IActionResult> UpdateGroupAdmin([FromForm] UpdateGroupAdminDto request, CancellationToken cancellationToken)
        {
            try
            {
                var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (authenticatedUserId == null)
                {
                    return Forbid("You are not authorized to update group admin.");
                }

                var group = await _context.Groups.FindAsync(new object[] { request.GroupId }, cancellationToken);
                if (group == null)
                {
                    return NotFound(new { Message = "Group not found" });
                }

                var isAdmin = await _context.GroupMembers
                    .AnyAsync(gm => gm.GroupId == request.GroupId && gm.UserId == Guid.Parse(authenticatedUserId) && gm.IsAdmin, cancellationToken);
                if (!isAdmin)
                {
                    return Forbid("You are not authorized to update group admin.");
                }

                var groupMember = await _context.GroupMembers
                    .FirstOrDefaultAsync(gm => gm.GroupId == request.GroupId && gm.UserId == request.UserId, cancellationToken);
                if (groupMember == null)
                {
                    return NotFound(new { Message = "Group member not found" });
                }

                groupMember.IsAdmin = true;
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation($"User {request.UserId} admin status updated to true in group {request.GroupId}");

                return Ok(new { Message = "Admin status updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while updating admin status for user {UserId} in group {GroupId}", request.UserId, request.GroupId);
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }
        }


        [HttpPost("revoke-admin")]
        public async Task<IActionResult> RevokeGroupAdmin([FromForm] RevokeGroupAdminDto request, CancellationToken cancellationToken)
        {
            try
            {
                var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (authenticatedUserId == null)
                {
                    return Forbid("You are not authorized to revoke admin rights.");
                }

                var group = await _context.Groups.FindAsync(new object[] { request.GroupId }, cancellationToken);
                if (group == null)
                {
                    return NotFound(new { Message = "Group not found" });
                }

                var isAdmin = await _context.GroupMembers
                    .AnyAsync(gm => gm.GroupId == request.GroupId && gm.UserId == Guid.Parse(authenticatedUserId) && gm.IsAdmin, cancellationToken);
                if (!isAdmin)
                {
                    return Forbid("You are not authorized to revoke admin rights.");
                }

                var groupMember = await _context.GroupMembers
                    .FirstOrDefaultAsync(gm => gm.GroupId == request.GroupId && gm.UserId == request.UserId, cancellationToken);
                if (groupMember == null)
                {
                    return NotFound(new { Message = "Group member not found" });
                }

                groupMember.IsAdmin = false;
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation($"Admin rights revoked for user {request.UserId} in group {request.GroupId}");

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
                else
                {
                    var adminCount = await _context.GroupMembers.CountAsync(gm => gm.GroupId == request.GroupId && gm.IsAdmin, cancellationToken);
                    if (adminCount == 1 && groupMember.UserId == Guid.Parse(authenticatedUserId))
                    {
                        var randomMember = await _context.GroupMembers.FirstOrDefaultAsync(gm => gm.GroupId == request.GroupId && !gm.IsAdmin, cancellationToken);
                        if (randomMember != null)
                        {
                            randomMember.IsAdmin = true;
                            await _context.SaveChangesAsync(cancellationToken);

                            _logger.LogInformation($"User {randomMember.UserId} promoted to admin in group {request.GroupId} as the last admin revoked their own admin rights.");
                        }
                        else
                        {
                            return BadRequest(new { Message = "Cannot revoke admin rights because there are no other members to promote to admin." });
                        }
                    }
                }

                return Ok(new { Message = "Admin rights revoked successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while revoking admin rights for user {UserId} in group {GroupId}", request.UserId, request.GroupId);
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }
        }


        [HttpPost("update-avatar")]
        public async Task<IActionResult> UpdateGroupAvatar([FromForm] UpdateAvatarGroupDto request, CancellationToken cancellationToken)
        {
            try
            {
                var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (authenticatedUserId == null)
                {
                    return Forbid("You are not authorized to update this group avatar.");
                }

                var group = await _context.Groups.FindAsync(new object[] { request.GroupId }, cancellationToken);
                if (group == null)
                {
                    return NotFound(new { Message = "Group not found" });
                }

                var isAdmin = await _context.GroupMembers.AnyAsync(gm => gm.GroupId == request.GroupId && gm.UserId == Guid.Parse(authenticatedUserId) && gm.IsAdmin, cancellationToken);
                if (!isAdmin)
                {
                    return Forbid("You are not authorized to update this group avatar.");
                }

                if (request.AvatarFile != null)
                {
                    // Save the current avatar path before updating
                    var oldAvatarPath = group.Avatar;

                    // Validate the file type and size if necessary
                    var (savedFileName, originalFileName) = FileService.FileSaveToServer(request.AvatarFile, "wwwroot/avatar/");
                    group.Avatar = Path.Combine("avatars", savedFileName).Replace("\\", "/");

                    // Delete the old avatar file if it exists
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
                    return BadRequest(new { Message = "No avatar file provided" });
                }

                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation($"Group {request.GroupId} avatar updated");

                return Ok(new
                {
                    Message = "Group avatar updated successfully",
                    group.Id,
                    group.Name,
                    group.Avatar
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating avatar for group {GroupId}", request.GroupId);
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }
        }

        [HttpGet("{groupId}/non-members")]
        public async Task<IActionResult> GetFriendsNotInGroup(Guid groupId, CancellationToken cancellationToken)
        {
            try
            {
                var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (authenticatedUserId == null)
                {
                    return Forbid("You are not authorized to view this group's non-members.");
                }

                var authenticatedUserIdGuid = Guid.Parse(authenticatedUserId);

                // Lấy danh sách bạn bè của người dùng hiện tại
                var friends = await _context.Friendships
                    .Where(f => f.UserId == authenticatedUserIdGuid)
                    .Select(f => f.Friend)
                    .ToListAsync(cancellationToken);

                if (!friends.Any())
                {
                    return Ok(new List<UserDto>()); // Trả về danh sách rỗng nếu không có bạn bè nào
                }

                // Lấy danh sách UserIds của những thành viên đã có trong nhóm
                var groupMemberIds = await _context.GroupMembers
                    .Where(gm => gm.GroupId == groupId)
                    .Select(gm => gm.UserId)
                    .ToListAsync(cancellationToken);

                // Lọc ra những bạn bè không nằm trong nhóm
                var nonMembers = friends
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
                        Status = f.Status
                    })
                    .ToList();

                return Ok(nonMembers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while fetching non-members for group {GroupId}", groupId);
                return StatusCode(500, new { Message = "An error occurred while processing your request." });
            }
        }



    }
}