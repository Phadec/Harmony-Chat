using ChatAppServer.WebAPI.Dtos;
using ChatAppServer.WebAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChatAppServer.WebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Ensure all endpoints require authorization
    public class FriendsController : ControllerBase
    {
        private readonly IFriendsService _friendsService;
        private readonly ILogger<FriendsController> _logger;

        public FriendsController(IFriendsService friendsService, ILogger<FriendsController> logger)
        {
            _friendsService = friendsService;
            _logger = logger;
        }

        [HttpGet("{userId}/get-sent-friend-requests")]
        public async Task<IActionResult> GetSentFriendRequests(Guid userId, CancellationToken cancellationToken)
        {
            if (!IsUserAuthorized(userId))
                return Forbid("You are not authorized to view this user's sent friend requests.");

            try
            {
                var sentRequests = await _friendsService.GetSentFriendRequests(userId, cancellationToken);
                return Ok(sentRequests);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while retrieving sent friend requests for user {UserId}.", userId);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpPost("{userId}/change-nickname")]
        public async Task<IActionResult> ChangeNickname(Guid userId, [FromBody] ChangeNicknameDto request, CancellationToken cancellationToken)
        {
            if (!IsUserAuthorized(userId))
                return Forbid("You are not authorized to change this nickname.");

            try
            {
                await _friendsService.ChangeNickname(userId, request, cancellationToken);
                return Ok(new { Message = string.IsNullOrEmpty(request.Nickname) ? "Nickname removed successfully." : "Nickname changed successfully." });
            }
            catch (KeyNotFoundException)
            {
                return NotFound("Friendship not found.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while changing/removing nickname for user {UserId} and friend {FriendId}.", userId, request.FriendId);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpPost("{userId}/add/{friendId}")]
        public async Task<IActionResult> AddFriend(Guid userId, Guid friendId, CancellationToken cancellationToken)
        {
            if (!IsUserAuthorized(userId))
                return Forbid();

            try
            {
                await _friendsService.AddFriend(userId, friendId, cancellationToken);
                return Ok(new { Message = "Friend request sent successfully." });
            }
            catch (KeyNotFoundException)
            {
                return NotFound("User or friend not found.");
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in AddFriend for user {UserId} and friend {FriendId}.", userId, friendId);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpDelete("{userId}/remove/{friendId}")]
        public async Task<IActionResult> RemoveFriend(Guid userId, Guid friendId, CancellationToken cancellationToken)
        {
            if (!IsUserAuthorized(userId))
                return Forbid("You are not authorized to remove this friend.");

            try
            {
                await _friendsService.RemoveFriend(userId, friendId, cancellationToken);
                return Ok(new { Message = "Friend removed successfully." });
            }
            catch (KeyNotFoundException)
            {
                return NotFound("User or friend not found.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in RemoveFriend for user {UserId} and friend {FriendId}.", userId, friendId);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpPost("{userId}/update-chat-theme/{friendId}")]
        public async Task<IActionResult> UpdateChatThemeWithFriend(Guid userId, Guid friendId, [FromBody] UpdateChatThemeDto request, CancellationToken cancellationToken)
        {
            if (!IsUserAuthorized(userId))
                return Forbid("You are not authorized to update the chat theme for this friend.");

            try
            {
                await _friendsService.UpdateChatThemeWithFriend(userId, friendId, request, cancellationToken);
                return Ok(new { Message = "Chat theme updated successfully for both directions." });
            }
            catch (KeyNotFoundException)
            {
                return NotFound("Friendship not found.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while updating the chat theme for user {UserId} and friend {FriendId}.", userId, friendId);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpGet("{userId}/friends")]
        public async Task<IActionResult> GetFriends(Guid userId, CancellationToken cancellationToken)
        {
            if (!IsUserAuthorized(userId))
                return Forbid("You are not authorized to view this user's friends.");

            try
            {
                var friends = await _friendsService.GetFriends(userId, cancellationToken);
                return Ok(friends);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching friends for user {UserId}", userId);
                return StatusCode(500, "An error occurred while fetching friends.");
            }
        }

        [HttpGet("{userId}/friend-requests")]
        public async Task<IActionResult> GetFriendRequests(Guid userId, CancellationToken cancellationToken)
        {
            if (!IsUserAuthorized(userId))
                return Forbid("You are not authorized to view this user's friend requests.");

            try
            {
                var friendRequests = await _friendsService.GetFriendRequests(userId, cancellationToken);
                return Ok(friendRequests);
            }
            catch (KeyNotFoundException)
            {
                return NotFound("User not found.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching friend requests for user {UserId}", userId);
                return StatusCode(500, "An error occurred while fetching friend requests.");
            }
        }

        [HttpPost("{userId}/accept-friend-request/{requestId}")]
        public async Task<IActionResult> AcceptFriendRequest(Guid userId, Guid requestId, CancellationToken cancellationToken)
        {
            if (!IsUserAuthorized(userId))
                return Forbid("You are not authorized to accept this friend request.");

            try
            {
                await _friendsService.AcceptFriendRequest(userId, requestId, cancellationToken);
                return Ok(new { Message = "Friend request accepted successfully." });
            }
            catch (KeyNotFoundException)
            {
                return NotFound("Friend request not found.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in AcceptFriendRequest for user {UserId} and request {RequestId}.", userId, requestId);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpPost("{userId}/reject-friend-request/{requestId}")]
        public async Task<IActionResult> RejectFriendRequest(Guid userId, Guid requestId, CancellationToken cancellationToken)
        {
            if (!IsUserAuthorized(userId))
                return Forbid("You are not authorized to reject this friend request.");

            try
            {
                await _friendsService.RejectFriendRequest(userId, requestId, cancellationToken);
                return Ok(new { Message = "Friend request rejected successfully." });
            }
            catch (KeyNotFoundException)
            {
                return NotFound("Friend request not found.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in RejectFriendRequest for user {UserId} and request {RequestId}.", userId, requestId);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpDelete("{userId}/cancel-friend-request/{requestId}")]
        public async Task<IActionResult> CancelFriendRequest(Guid userId, Guid requestId, CancellationToken cancellationToken)
        {
            if (!IsUserAuthorized(userId))
                return Forbid("You are not authorized to cancel this friend request.");

            try
            {
                await _friendsService.CancelFriendRequest(userId, requestId, cancellationToken);
                return Ok(new { Message = "Friend request canceled successfully." });
            }
            catch (KeyNotFoundException)
            {
                return NotFound("Friend request not found.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in CancelFriendRequest for user {UserId} and request {RequestId}.", userId, requestId);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpGet("{userId}/relationship-info/{entityId}")]
        public async Task<IActionResult> GetRelationshipInfo(Guid userId, Guid entityId, CancellationToken cancellationToken)
        {
            if (!IsUserAuthorized(userId))
                return Forbid("You are not authorized to view this information.");

            try
            {
                var relationshipInfo = await _friendsService.GetRelationshipInfo(userId, entityId, cancellationToken);
                return Ok(relationshipInfo);
            }
            catch (KeyNotFoundException)
            {
                return NotFound("Relationship not found.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while fetching relationship info for user {UserId} and entity {EntityId}.", userId, entityId);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpPost("{userId}/block/{blockedUserId}")]
        public async Task<IActionResult> BlockUser(Guid userId, Guid blockedUserId, CancellationToken cancellationToken)
        {
            if (!IsUserAuthorized(userId))
                return Forbid("You are not authorized to block this user.");

            try
            {
                await _friendsService.BlockUser(userId, blockedUserId, cancellationToken);
                return Ok(new { Message = "User blocked successfully." });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (KeyNotFoundException)
            {
                return NotFound("User or block entry not found.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while blocking user {BlockedUserId} for user {UserId}.", blockedUserId, userId);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpPost("{userId}/unblock/{blockedUserId}")]
        public async Task<IActionResult> UnblockUser(Guid userId, Guid blockedUserId, CancellationToken cancellationToken)
        {
            if (!IsUserAuthorized(userId))
                return Forbid("You are not authorized to unblock this user.");

            try
            {
                await _friendsService.UnblockUser(userId, blockedUserId, cancellationToken);
                return Ok(new { Message = "User unblocked successfully." });
            }
            catch (KeyNotFoundException)
            {
                return NotFound("User block not found.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while unblocking user {BlockedUserId} for user {UserId}.", blockedUserId, userId);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpPost("{userId}/mute-friend-notifications/{friendId}")]
        public async Task<IActionResult> MuteFriendNotifications(Guid userId, Guid friendId, CancellationToken cancellationToken)
        {
            if (!IsUserAuthorized(userId))
                return Forbid("You are not authorized to mute notifications for this friend.");

            try
            {
                await _friendsService.MuteFriendNotifications(userId, friendId, cancellationToken);
                return Ok(new { Message = "Friend notifications toggled successfully." });
            }
            catch (KeyNotFoundException)
            {
                return NotFound("Friendship not found.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while muting/unmuting notifications for user {UserId} and friend {FriendId}.", userId, friendId);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpGet("{userId}/blocked-users")]
        public async Task<IActionResult> GetBlockedUsers(Guid userId, CancellationToken cancellationToken)
        {
            if (!IsUserAuthorized(userId))
                return Forbid("You are not authorized to view blocked users.");

            try
            {
                var blockedUsers = await _friendsService.GetBlockedUsers(userId, cancellationToken);
                return Ok(blockedUsers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while fetching blocked users for user {UserId}", userId);
                return StatusCode(500, "An error occurred while fetching blocked users.");
            }
        }

        private bool IsUserAuthorized(Guid userId)
        {
            var authenticatedUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            return authenticatedUserId != null && userId.ToString() == authenticatedUserId;
        }
    }
}
