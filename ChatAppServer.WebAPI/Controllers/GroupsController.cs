using ChatAppServer.WebAPI.Dtos;
using ChatAppServer.WebAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChatAppServer.WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public sealed class GroupsController : ControllerBase
    {
        private readonly IGroupsService _groupsService;

        public GroupsController(IGroupsService groupsService)
        {
            _groupsService = groupsService;
        }

        // 1. Create a new group chat
        [HttpPost("create-group-chat")]
        public async Task<IActionResult> CreateGroup([FromForm] CreateGroupDto request, CancellationToken cancellationToken)
        {
            var authenticatedUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null)
            {
                return Forbid("You are not authorized to create this group.");
            }

            var (success, message, group, members) = await _groupsService.CreateGroupAsync(request, authenticatedUserId, cancellationToken);
            if (!success)
            {
                return BadRequest(new { Message = message });
            }

            return CreatedAtAction(nameof(GetGroupMembers), new { groupId = group.Id }, new
            {
                id = group.Id,
                name = group.Name,
                avatar = group.Avatar,
                members
            });
        }

        // 2. Add a member to the group chat
        [HttpPost("add-group-chat-member")]
        public async Task<IActionResult> AddMember([FromForm] AddGroupMemberDto request, CancellationToken cancellationToken)
        {
            var authenticatedUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null)
            {
                return Forbid("You are not authorized to add members to this group.");
            }

            var (success, message) = await _groupsService.AddGroupMemberAsync(request, authenticatedUserId, cancellationToken);
            if (!success)
            {
                return BadRequest(new { Message = message });
            }

            return Ok(new { Message = "Member added successfully." });
        }

        // 3. Delete a group chat
        [HttpDelete("{groupId}/delete")]
        public async Task<IActionResult> DeleteGroup(Guid groupId, CancellationToken cancellationToken)
        {
            var authenticatedUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null)
            {
                return Forbid("You are not authorized to delete this group.");
            }

            var (success, message) = await _groupsService.DeleteGroupAsync(groupId, authenticatedUserId, cancellationToken);
            if (!success)
            {
                return BadRequest(new { Message = message });
            }

            return NoContent();
        }

        // 4. Update the chat theme for a group chat
        [HttpPost("{groupId}/update-chat-theme")]
        public async Task<IActionResult> UpdateChatThemeForGroup(Guid groupId, [FromBody] UpdateChatThemeDto request, CancellationToken cancellationToken)
        {
            var authenticatedUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null)
            {
                return Forbid("You are not authorized to update the chat theme for this group.");
            }

            var (success, message) = await _groupsService.UpdateChatThemeAsync(groupId, request, authenticatedUserId, cancellationToken);
            if (!success)
            {
                return BadRequest(new { Message = message });
            }

            return Ok(new { Message = message });
        }

        // 5. Get the members of a group chat
        [HttpGet("{groupId}/members")]
        public async Task<IActionResult> GetGroupMembers(Guid groupId, CancellationToken cancellationToken)
        {
            var authenticatedUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null)
            {
                return Forbid("You are not authorized to view the members of this group.");
            }

            var members = await _groupsService.GetGroupMembersAsync(groupId, authenticatedUserId, cancellationToken);
            if (members == null)
            {
                return NotFound(new { Message = "No members found in this group or you are not authorized." });
            }

            return Ok(members);
        }

        // 6. Remove a member from the group chat
        [HttpDelete("remove-member")]
        public async Task<IActionResult> RemoveMember([FromForm] RemoveGroupMemberDto request, CancellationToken cancellationToken)
        {
            var authenticatedUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null)
            {
                return Forbid("You are not authorized to remove members from this group.");
            }

            var (success, message) = await _groupsService.RemoveGroupMemberAsync(request, authenticatedUserId, cancellationToken);
            if (!success)
            {
                return BadRequest(new { Message = message });
            }

            return Ok(new { Message = message });
        }

        // 7. Get all groups a user belongs to, with details
        [HttpGet("user-groups-with-details/{userId}")]
        public async Task<IActionResult> GetUserGroupsWithDetails(Guid userId, CancellationToken cancellationToken)
        {
            var authenticatedUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null)
            {
                return Forbid("You are not authorized to view this user's groups.");
            }

            try
            {
                var groups = await _groupsService.GetUserGroupsWithDetailsAsync(userId, authenticatedUserId, cancellationToken);
                if (groups == null || !groups.Any())
                {
                    return NotFound(new { Message = "No groups found for this user." });
                }

                return Ok(groups);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid("You are not authorized to view these groups.");
            }
        }

        // 8. Rename a group chat
        [HttpPut("rename-group")]
        public async Task<IActionResult> RenameGroup([FromBody] RenameGroupDto request, CancellationToken cancellationToken)
        {
            var authenticatedUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null)
            {
                return Forbid("You are not authorized to rename this group.");
            }

            var (success, message) = await _groupsService.RenameGroupAsync(request, authenticatedUserId, cancellationToken);
            if (!success)
            {
                return BadRequest(new { Message = message });
            }

            return Ok(new { Message = message });
        }

        // 9. Update group admin
        [HttpPost("update-admin")]
        public async Task<IActionResult> UpdateGroupAdmin([FromForm] UpdateGroupAdminDto request, CancellationToken cancellationToken)
        {
            var authenticatedUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null)
            {
                return Forbid("You are not authorized to update group admin.");
            }

            var (success, message) = await _groupsService.UpdateGroupAdminAsync(request, authenticatedUserId, cancellationToken);
            if (!success)
            {
                return BadRequest(new { Message = message });
            }

            return Ok(new { Message = message });
        }

        // 10. Revoke group admin
        [HttpPost("revoke-admin")]
        public async Task<IActionResult> RevokeGroupAdmin([FromForm] RevokeGroupAdminDto request, CancellationToken cancellationToken)
        {
            var authenticatedUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null)
            {
                return Forbid("You are not authorized to revoke admin rights.");
            }

            var (success, message) = await _groupsService.RevokeGroupAdminAsync(request, authenticatedUserId, cancellationToken);
            if (!success)
            {
                return BadRequest(new { Message = message });
            }

            return Ok(new { Message = message });
        }

        // 11. Update the group avatar
        [HttpPost("update-avatar")]
        public async Task<IActionResult> UpdateGroupAvatar([FromForm] UpdateAvatarGroupDto request, CancellationToken cancellationToken)
        {
            var authenticatedUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null)
            {
                return Forbid("You are not authorized to update this group avatar.");
            }

            var (success, message) = await _groupsService.UpdateGroupAvatarAsync(request, authenticatedUserId, cancellationToken);
            if (!success)
            {
                return BadRequest(new { Message = message });
            }

            return Ok(new { Message = message });
        }

        // 12. Get friends not in the group
        [HttpGet("{groupId}/non-members")]
        public async Task<IActionResult> GetFriendsNotInGroup(Guid groupId, CancellationToken cancellationToken)
        {
            var authenticatedUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null)
            {
                return Forbid("You are not authorized to view this group's non-members.");
            }

            var nonMembers = await _groupsService.GetFriendsNotInGroupAsync(groupId, authenticatedUserId, cancellationToken);
            return Ok(nonMembers);
        }

        // 13. Mute or unmute group notifications
        [HttpPost("{groupId}/mute-group-notifications")]
        public async Task<IActionResult> MuteGroupNotifications(Guid groupId, CancellationToken cancellationToken)
        {
            var authenticatedUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null)
            {
                return Forbid("You are not authorized to mute notifications for this group.");
            }

            var (success, message) = await _groupsService.MuteGroupNotificationsAsync(groupId, authenticatedUserId, cancellationToken);
            if (!success)
            {
                return BadRequest(new { Message = message });
            }

            return Ok(new { Message = message });
        }
    }
}
