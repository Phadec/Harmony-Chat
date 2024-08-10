using ChatAppServer.WebAPI.Dtos;
using ChatAppServer.WebAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ChatAppServer.WebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Ensure all endpoints require authorization
    public class FriendsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<FriendsController> _logger;

        public FriendsController(ApplicationDbContext context, ILogger<FriendsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        private bool IsAuthenticatedUser(Guid userId)
        {
            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return authenticatedUserId != null && userId.ToString() == authenticatedUserId;
        }

        [HttpGet("{userId}/get-sent-friend-requests")]
        public async Task<IActionResult> GetSentFriendRequests(Guid userId, CancellationToken cancellationToken)
        {
            if (!IsAuthenticatedUser(userId))
            {
                return Forbid("You are not authorized to view this user's sent friend requests.");
            }

            if (userId == Guid.Empty)
            {
                return BadRequest("Invalid userId");
            }

            var sentRequests = await _context.FriendRequests
                .AsNoTracking()
                .Where(fr => fr.SenderId == userId)
                .Include(fr => fr.Receiver)
                .ToListAsync(cancellationToken);

            if (!sentRequests.Any())
            {
                return NotFound("No sent friend requests found.");
            }

            var sentRequestsDto = sentRequests.Select(fr => new SentFriendRequestDto
            {
                Id = fr.Id,
                ReceiverId = fr.ReceiverId,
                TagName = fr.Receiver.TagName,
                RequestDate = fr.RequestDate,
                Status = fr.Status
            }).ToList();

            return Ok(sentRequestsDto);
        }

        [HttpPost("{userId}/change-nickname")]
        public async Task<IActionResult> ChangeNickname(Guid userId, [FromForm] ChangeNicknameDto request, CancellationToken cancellationToken)
        {
            if (!IsAuthenticatedUser(userId))
            {
                return Forbid("You are not authorized to change this nickname.");
            }

            var friendship = await _context.Friendships
                .FirstOrDefaultAsync(f => f.UserId == userId && f.FriendId == request.FriendId, cancellationToken);

            if (friendship == null)
            {
                return NotFound("Friendship not found.");
            }

            friendship.Nickname = request.Nickname;
            _context.Friendships.Update(friendship);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation($"Nickname for friend {request.FriendId} changed to {request.Nickname} by user {userId}");

            return Ok(new { Message = "Nickname changed successfully." });
        }

        [HttpPost("{userId}/add/{friendId}")]
        public async Task<IActionResult> AddFriend(Guid userId, Guid friendId, CancellationToken cancellationToken)
        {
            if (!IsAuthenticatedUser(userId))
            {
                return Forbid();
            }

            if (userId == Guid.Empty || friendId == Guid.Empty)
            {
                return BadRequest("Invalid userId or friendId");
            }

            if (userId == friendId)
            {
                return BadRequest("You cannot add yourself as a friend.");
            }

            var isBlocked = await _context.UserBlocks
                .AsNoTracking()
                .AnyAsync(ub => ub.UserId == friendId && ub.BlockedUserId == userId, cancellationToken);

            if (isBlocked)
            {
                return BadRequest("You cannot send a friend request to this user.");
            }

            var isBlockedReverse = await _context.UserBlocks
                .AsNoTracking()
                .AnyAsync(ub => ub.UserId == userId && ub.BlockedUserId == friendId, cancellationToken);

            if (isBlockedReverse)
            {
                return BadRequest("You cannot send a friend request to this user.");
            }

            try
            {
                bool isAlreadyFriend = await _context.Users
                    .AsNoTracking()
                    .AnyAsync(u => u.Id == userId && u.Friends.Any(f => f.FriendId == friendId), cancellationToken);

                if (isAlreadyFriend)
                {
                    return BadRequest("You are already friends with this user.");
                }

                bool requestAlreadyExists = await _context.FriendRequests
                    .AsNoTracking()
                    .AnyAsync(fr => fr.SenderId == userId && fr.ReceiverId == friendId && fr.Status == "Pending", cancellationToken);

                if (requestAlreadyExists)
                {
                    return BadRequest("Friend request already sent.");
                }

                var friendRequest = new FriendRequest
                {
                    SenderId = userId,
                    ReceiverId = friendId,
                    Status = "Pending"
                };

                await _context.FriendRequests.AddAsync(friendRequest, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);

                var result = new
                {
                    friendRequest.Id,
                    friendRequest.SenderId,
                    friendRequest.ReceiverId,
                    friendRequest.RequestDate,
                    friendRequest.Status
                };

                _logger.LogInformation($"Friend request from {userId} to {friendId} created.");

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in AddFriend for user {UserId} and friend {FriendId}", userId, friendId);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpDelete("{userId}/remove/{friendId}")]
        public async Task<IActionResult> RemoveFriend(Guid userId, Guid friendId, CancellationToken cancellationToken)
        {
            if (!IsAuthenticatedUser(userId))
            {
                return Forbid("You are not authorized to remove this friend.");
            }

            if (userId == Guid.Empty || friendId == Guid.Empty)
            {
                return BadRequest("Invalid userId or friendId");
            }

            try
            {
                var user = await _context.Users.Include(u => u.Friends).FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
                var friend = await _context.Users.Include(u => u.Friends).FirstOrDefaultAsync(u => u.Id == friendId, cancellationToken);

                if (user == null || friend == null)
                {
                    return NotFound("User or friend not found.");
                }

                var userFriendship = user.Friends.FirstOrDefault(f => f.FriendId == friendId);
                var friendFriendship = friend.Friends.FirstOrDefault(f => f.FriendId == userId);

                if (userFriendship != null)
                {
                    user.Friends.Remove(userFriendship);
                }

                if (friendFriendship != null)
                {
                    friend.Friends.Remove(friendFriendship);
                }

                _context.Users.Update(user);
                _context.Users.Update(friend);
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation($"Friendship between {userId} and {friendId} removed.");

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in RemoveFriend for user {UserId} and friend {FriendId}", userId, friendId);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpGet("{userId}/friends")]
        public async Task<IActionResult> GetFriends(Guid userId, CancellationToken cancellationToken)
        {
            if (!IsAuthenticatedUser(userId))
            {
                return Forbid("You are not authorized to view this user's friends.");
            }

            if (userId == Guid.Empty)
            {
                return BadRequest("Invalid userId");
            }

            var friendships = await _context.Friendships
                .AsNoTracking()
                .Where(f => f.UserId == userId)
                .Include(f => f.Friend)
                .ToListAsync(cancellationToken);

            var reverseFriendships = await _context.Friendships
                .AsNoTracking()
                .Where(f => f.FriendId == userId)
                .Include(f => f.User)
                .ToListAsync(cancellationToken);

            var allFriends = friendships
                .Select(f => new { User = f.Friend, f.Nickname })
                .Concat(reverseFriendships.Select(f => new { User = f.User, f.Nickname }))
                .Distinct()
                .ToList();

            if (!allFriends.Any())
            {
                return NotFound("No friends found.");
            }

            var friendsDto = allFriends.Select(f => new FriendDto
            {
                Id = f.User.Id,
                Username = f.User.Username,
                FirstName = f.User.FirstName,
                LastName = f.User.LastName,
                Birthday = f.User.Birthday,
                Email = f.User.Email,
                Avatar = f.User.Avatar,
                Status = f.User.Status,
                Nickname = f.Nickname
            }).ToList();

            return Ok(friendsDto);
        }

        [HttpGet("{userId}/friend-requests")]
        public async Task<IActionResult> GetFriendRequests(Guid userId, CancellationToken cancellationToken)
        {
            if (!IsAuthenticatedUser(userId))
            {
                return Forbid("You are not authorized to view this user's friend requests.");
            }

            if (userId == Guid.Empty)
            {
                return BadRequest("Invalid userId");
            }

            var user = await _context.Users
                .AsNoTracking()
                .Include(u => u.ReceivedFriendRequests)
                .ThenInclude(fr => fr.Sender)
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

            if (user == null)
            {
                return NotFound();
            }

            var friendRequests = user.ReceivedFriendRequests.Select(fr => new
            {
                fr.Id,
                SenderId = fr.SenderId,
                SenderName = $"{fr.Sender.FirstName} {fr.Sender.LastName}",
                TagName = fr.Sender.TagName,
                fr.Status
            }).ToList();

            return Ok(friendRequests);
        }

        [HttpPost("{userId}/accept-friend-request/{requestId}")]
        public async Task<IActionResult> AcceptFriendRequest(Guid userId, Guid requestId, CancellationToken cancellationToken)
        {
            if (!IsAuthenticatedUser(userId))
            {
                return Forbid("You are not authorized to accept this friend request.");
            }

            if (userId == Guid.Empty || requestId == Guid.Empty)
            {
                return BadRequest("Invalid userId or requestId");
            }

            try
            {
                var friendRequest = await _context.FriendRequests
                    .Include(fr => fr.Sender)
                    .FirstOrDefaultAsync(fr => fr.Id == requestId && fr.ReceiverId == userId, cancellationToken);

                if (friendRequest == null)
                {
                    return NotFound("Friend request not found or does not belong to the user.");
                }

                var user = await _context.Users
                    .Include(u => u.Friends)
                    .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

                if (user == null)
                {
                    return NotFound("User not found.");
                }

                user.AddFriend(friendRequest.SenderId);

                var sender = await _context.Users
                    .Include(u => u.Friends)
                    .FirstOrDefaultAsync(u => u.Id == friendRequest.SenderId, cancellationToken);

                if (sender == null)
                {
                    return NotFound("Sender not found.");
                }

                sender.AddFriend(userId);

                _context.FriendRequests.Remove(friendRequest);
                _context.Users.Update(user);
                _context.Users.Update(sender);

                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation($"Friend request {requestId} accepted by {userId}.");

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in AcceptFriendRequest for user {UserId} and request {RequestId}", userId, requestId);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpPost("{userId}/reject-friend-request/{requestId}")]
        public async Task<IActionResult> RejectFriendRequest(Guid userId, Guid requestId, CancellationToken cancellationToken)
        {
            if (!IsAuthenticatedUser(userId))
            {
                return Forbid("You are not authorized to reject this friend request.");
            }

            if (userId == Guid.Empty || requestId == Guid.Empty)
            {
                return BadRequest("Invalid userId or requestId");
            }

            try
            {
                var friendRequest = await _context.FriendRequests
                    .FirstOrDefaultAsync(fr => fr.Id == requestId && fr.ReceiverId == userId, cancellationToken);

                if (friendRequest == null)
                {
                    return NotFound("Friend request not found.");
                }

                _context.FriendRequests.Remove(friendRequest);
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation($"Friend request {requestId} rejected by {userId}.");

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in RejectFriendRequest for user {UserId} and request {RequestId}", userId, requestId);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpDelete("{userId}/cancel-friend-request/{requestId}")]
        public async Task<IActionResult> CancelFriendRequest(Guid userId, Guid requestId, CancellationToken cancellationToken)
        {
            if (!IsAuthenticatedUser(userId))
            {
                return Forbid("You are not authorized to cancel this friend request.");
            }

            if (userId == Guid.Empty || requestId == Guid.Empty)
            {
                return BadRequest("Invalid userId or requestId");
            }

            try
            {
                var friendRequest = await _context.FriendRequests
                    .FirstOrDefaultAsync(fr => fr.Id == requestId && fr.SenderId == userId, cancellationToken);

                if (friendRequest == null)
                {
                    return NotFound("Friend request not found or does not belong to the user.");
                }

                _context.FriendRequests.Remove(friendRequest);
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation($"Friend request {requestId} canceled by {userId}.");

                return Ok(new { Message = "Friend request canceled successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in CancelFriendRequest for user {UserId} and request {RequestId}", userId, requestId);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpPost("{userId}/block/{blockedUserId}")]
        public async Task<IActionResult> BlockUser(Guid userId, Guid blockedUserId, CancellationToken cancellationToken)
        {
            if (!IsAuthenticatedUser(userId))
            {
                return Forbid("You are not authorized to block this user.");
            }

            if (userId == blockedUserId)
            {
                return BadRequest("You cannot block yourself.");
            }

            var friendships = await _context.Friendships
                .Where(f => (f.UserId == userId && f.FriendId == blockedUserId) || (f.UserId == blockedUserId && f.FriendId == userId))
                .ToListAsync(cancellationToken);

            if (friendships.Any())
            {
                _context.Friendships.RemoveRange(friendships);
            }

            var friendRequests = await _context.FriendRequests
                .Where(fr => (fr.SenderId == userId && fr.ReceiverId == blockedUserId) || (fr.SenderId == blockedUserId && fr.ReceiverId == userId))
                .ToListAsync(cancellationToken);

            if (friendRequests.Any())
            {
                _context.FriendRequests.RemoveRange(friendRequests);
            }

            var userBlock = new UserBlock
            {
                UserId = userId,
                BlockedUserId = blockedUserId,
                BlockedDate = DateTime.UtcNow
            };

            _context.UserBlocks.Add(userBlock);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation($"User {userId} blocked user {blockedUserId}");

            return Ok(new { Message = "User blocked successfully" });
        }

        [HttpPost("{userId}/unblock/{blockedUserId}")]
        public async Task<IActionResult> UnblockUser(Guid userId, Guid blockedUserId, CancellationToken cancellationToken)
        {
            if (!IsAuthenticatedUser(userId))
            {
                return Forbid("You are not authorized to unblock this user.");
            }

            var userBlock = await _context.UserBlocks
                .FirstOrDefaultAsync(ub => ub.UserId == userId && ub.BlockedUserId == blockedUserId, cancellationToken);

            if (userBlock == null)
            {
                return NotFound(new { Message = "User block not found" });
            }

            _context.UserBlocks.Remove(userBlock);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation($"User {userId} unblocked user {blockedUserId}");

            return Ok(new { Message = "User unblocked successfully" });
        }

        [HttpGet("{userId}/blocked-users")]
        public async Task<IActionResult> GetBlockedUsers(Guid userId, CancellationToken cancellationToken)
        {
            if (!IsAuthenticatedUser(userId))
            {
                return Forbid("You are not authorized to view blocked users.");
            }

            var blockedUsers = await _context.UserBlocks
                .AsNoTracking()
                .Where(ub => ub.UserId == userId)
                .Select(ub => new
                {
                    ub.BlockedUserId,
                    BlockedDate = ub.BlockedDate.ToString("yyyy-MM-ddTHH:mm:ssZ")
                })
                .ToListAsync(cancellationToken);

            return Ok(blockedUsers);
        }
    }
}
