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

        [HttpGet("{userId}/get-sent-friend-requests")]
        public async Task<IActionResult> GetSentFriendRequests(Guid userId, CancellationToken cancellationToken)
        {
            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null || userId.ToString() != authenticatedUserId)
            {
                return Forbid("You are not authorized to view this user's sent friend requests.");
            }

            if (userId == Guid.Empty)
            {
                return BadRequest("Invalid userId");
            }

            try
            {
                var sentRequests = await _context.FriendRequests
                    .Where(fr => fr.SenderId == userId)
                    .Include(fr => fr.Receiver)
                    .ToListAsync(cancellationToken);

                // Không cần kiểm tra `sentRequests.Any()`
                var sentRequestsDto = sentRequests.Select(fr => new SentFriendRequestDto
                {
                    Id = fr.Id,
                    ReceiverId = fr.ReceiverId,
                    TagName = fr.Receiver.TagName, // Đúng là Receiver thay vì Sender
                    RequestDate = fr.RequestDate,
                    Status = fr.Status
                }).ToList();

                // Trả về mảng rỗng nếu không tìm thấy yêu cầu nào
                return Ok(sentRequestsDto);
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
            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null || userId.ToString() != authenticatedUserId)
            {
                return Forbid("You are not authorized to change this nickname.");
            }

            if (userId == Guid.Empty || request.FriendId == Guid.Empty)
            {
                return BadRequest("Invalid userId or friendId.");
            }

            try
            {
                var friendship = await _context.Friendships
                    .FirstOrDefaultAsync(f => f.UserId == userId && f.FriendId == request.FriendId, cancellationToken);

                if (friendship == null)
                {
                    return NotFound("Friendship not found.");
                }

                // Kiểm tra nếu biệt danh là chuỗi rỗng hoặc null, nghĩa là xóa biệt danh
                if (string.IsNullOrEmpty(request.Nickname))
                {
                    friendship.Nickname = string.Empty; // Hoặc null, tùy theo cách bạn quản lý dữ liệu
                    _logger.LogInformation($"Nickname for friend {request.FriendId} removed by user {userId}");
                }
                else
                {
                    friendship.Nickname = request.Nickname;
                    _logger.LogInformation($"Nickname for friend {request.FriendId} changed to {request.Nickname} by user {userId}");
                }

                _context.Friendships.Update(friendship);
                await _context.SaveChangesAsync(cancellationToken);

                return Ok(new { Message = string.IsNullOrEmpty(request.Nickname) ? "Nickname removed successfully." : "Nickname changed successfully." });
            }
            catch (DbUpdateException dbEx)
            {
                _logger.LogError(dbEx, "Database error occurred while changing/removing nickname for user {UserId} and friend {FriendId}.", userId, request.FriendId);
                return StatusCode(500, "An error occurred while updating the nickname in the database.");
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
            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null || userId.ToString() != authenticatedUserId)
            {
                return Forbid();
            }

            if (userId == Guid.Empty || friendId == Guid.Empty)
            {
                return BadRequest("Invalid userId or friendId");
            }

            // Kiểm tra xem userId có đang cố gắng tự thêm mình làm bạn bè không
            if (userId == friendId)
            {
                return BadRequest("You cannot add yourself as a friend.");
            }

            // Kiểm tra nếu userId bị chặn bởi friendId
            var isBlocked = await _context.UserBlocks
                .AnyAsync(ub => ub.UserId == friendId && ub.BlockedUserId == userId, cancellationToken);

            if (isBlocked)
            {
                return BadRequest("You cannot send a friend request to this user.");
            }

            // Kiểm tra nếu friendId bị chặn bởi userId
            var isBlockedReverse = await _context.UserBlocks
                .AnyAsync(ub => ub.UserId == userId && ub.BlockedUserId == friendId, cancellationToken);

            if (isBlockedReverse)
            {
                return BadRequest("You cannot send a friend request to this user.");
            }

            try
            {
                bool isAlreadyFriend = await _context.Users
                    .AnyAsync(u => u.Id == userId && u.Friends.Any(f => f.FriendId == friendId), cancellationToken);

                if (isAlreadyFriend)
                {
                    return BadRequest("You are already friends with this user.");
                }

                bool requestAlreadyExists = await _context.FriendRequests
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
                _logger.LogError($"Error in AddFriend: {ex.Message}");
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }



        [HttpDelete("{userId}/remove/{friendId}")]
        public async Task<IActionResult> RemoveFriend(Guid userId, Guid friendId, CancellationToken cancellationToken)
        {
            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null || userId.ToString() != authenticatedUserId)
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
                _logger.LogError($"Error in RemoveFriend: {ex.Message}");
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpGet("{userId}/friends")]
        public async Task<IActionResult> GetFriends(Guid userId, CancellationToken cancellationToken)
        {
            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null || userId.ToString() != authenticatedUserId)
            {
                return Forbid("You are not authorized to view this user's friends.");
            }

            if (userId == Guid.Empty)
            {
                return BadRequest("Invalid userId");
            }

            try
            {
                // Truy vấn một phía từ UserId hoặc FriendId
                var friendships = await _context.Friendships
                    .Where(f => f.UserId == userId)
                    .Include(f => f.User)
                    .Include(f => f.Friend)
                    .ToListAsync(cancellationToken);

                // Không trả về lỗi 404 nếu không có bạn bè, mà trả về một danh sách rỗng
                var friendsDto = friendships.Select(f => new FriendDto
                {
                    Id = f.UserId == userId ? f.Friend.Id : f.User.Id, // Lấy Id của bạn bè
                    Tagname = f.UserId == userId ? f.Friend.TagName : f.User.TagName,
                    FullName = (f.UserId == userId ? f.Friend.FirstName : f.User.FirstName) + " " + (f.UserId == userId ? f.Friend.LastName : f.User.LastName),
                    Birthday = f.UserId == userId ? f.Friend.Birthday : f.User.Birthday,
                    Email = f.UserId == userId ? f.Friend.Email : f.User.Email,
                    Avatar = f.UserId == userId ? f.Friend.Avatar : f.User.Avatar,
                    Status = f.UserId == userId ? f.Friend.Status : f.User.Status,
                    Nickname = f.Nickname
                }).ToList();

                // Trả về danh sách bạn bè (có thể là danh sách rỗng)
                return Ok(friendsDto);
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
            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null || userId.ToString() != authenticatedUserId)
            {
                return Forbid("You are not authorized to view this user's friend requests.");
            }

            if (userId == Guid.Empty)
            {
                return BadRequest("Invalid userId");
            }

            try
            {
                var user = await _context.Users.Include(u => u.ReceivedFriendRequests)
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
                    fr.Sender.Avatar,
                    fr.Status
                }).ToList();

                return Ok(friendRequests);
            }
            catch (Exception ex)
            {
                // Ghi lại lỗi
                _logger.LogError(ex, "Error occurred while fetching friend requests for user {UserId}", userId);

                // Trả về lỗi Internal Server Error với thông báo lỗi
                return StatusCode(500, "An error occurred while fetching friend requests.");
            }
        }


        [HttpPost("{userId}/accept-friend-request/{requestId}")]
        public async Task<IActionResult> AcceptFriendRequest(Guid userId, Guid requestId, CancellationToken cancellationToken)
        {
            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null || userId.ToString() != authenticatedUserId)
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

                var user = await _context.Users.Include(u => u.Friends).FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
                if (user == null)
                {
                    return NotFound("User not found.");
                }

                user.AddFriend(friendRequest.SenderId);

                var sender = await _context.Users.Include(u => u.Friends).FirstOrDefaultAsync(u => u.Id == friendRequest.SenderId, cancellationToken);
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
                _logger.LogError($"Error in AcceptFriendRequest: {ex.Message}");
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpPost("{userId}/reject-friend-request/{requestId}")]
        public async Task<IActionResult> RejectFriendRequest(Guid userId, Guid requestId, CancellationToken cancellationToken)
        {
            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null || userId.ToString() != authenticatedUserId)
            {
                return Forbid("You are not authorized to reject this friend request.");
            }

            if (userId == Guid.Empty || requestId == Guid.Empty)
            {
                return BadRequest("Invalid userId or requestId");
            }

            try
            {
                var friendRequest = await _context.FriendRequests.FirstOrDefaultAsync(fr => fr.Id == requestId && fr.ReceiverId == userId, cancellationToken);
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
                _logger.LogError($"Error in RejectFriendRequest: {ex.Message}");
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpDelete("{userId}/cancel-friend-request/{requestId}")]
        public async Task<IActionResult> CancelFriendRequest(Guid userId, Guid requestId, CancellationToken cancellationToken)
        {
            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null || userId.ToString() != authenticatedUserId)
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
                _logger.LogError($"Error in CancelFriendRequest: {ex.Message}");
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }
        [HttpGet("{userId}/friend-info/{friendId}")]
        public async Task<IActionResult> GetFriendInfo(Guid userId, Guid friendId, CancellationToken cancellationToken)
        {
            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null || userId.ToString() != authenticatedUserId)
            {
                return Forbid("You are not authorized to view this friend's information.");
            }

            if (userId == Guid.Empty || friendId == Guid.Empty)
            {
                return BadRequest("Invalid userId or friendId.");
            }

            try
            {
                // Tìm thông tin về mối quan hệ bạn bè
                var friendship = await _context.Friendships
                    .Include(f => f.Friend)
                    .Include(f => f.User)
                    .FirstOrDefaultAsync(f => (f.UserId == userId && f.FriendId == friendId) ||
                                              (f.UserId == friendId && f.FriendId == userId), cancellationToken);

                if (friendship == null)
                {
                    return NotFound("Friendship not found.");
                }

                // Lấy thông tin chi tiết về bạn bè
                var friend = friendship.UserId == userId ? friendship.Friend : friendship.User;

                var friendInfo = new
                {
                    Id = friend.Id,
                    FullName = $"{friend.FirstName} {friend.LastName}",
                    Nickname = friendship.Nickname,
                    Avatar = friend.Avatar,
                    TagName = friend.TagName,
                    Status = friend.Status
                };

                return Ok(friendInfo);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while fetching friend info for user {UserId} and friend {FriendId}.", userId, friendId);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }


        [HttpPost("{userId}/block/{blockedUserId}")]
        public async Task<IActionResult> BlockUser(Guid userId, Guid blockedUserId, CancellationToken cancellationToken)
        {
            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null || userId.ToString() != authenticatedUserId)
            {
                return Forbid("You are not authorized to block this user.");
            }

            if (userId == blockedUserId)
            {
                return BadRequest("You cannot block yourself.");
            }

            try
            {
                // Xóa kết bạn nếu họ là bạn bè
                var friendships = await _context.Friendships
                    .Where(f => (f.UserId == userId && f.FriendId == blockedUserId) || (f.UserId == blockedUserId && f.FriendId == userId))
                    .ToListAsync(cancellationToken);

                if (friendships.Any())
                {
                    _context.Friendships.RemoveRange(friendships);
                }

                // Xóa tất cả yêu cầu kết bạn liên quan đến người dùng bị chặn
                var friendRequests = await _context.FriendRequests
                    .Where(fr => (fr.SenderId == userId && fr.ReceiverId == blockedUserId) || (fr.SenderId == blockedUserId && fr.ReceiverId == userId))
                    .ToListAsync(cancellationToken);

                if (friendRequests.Any())
                {
                    _context.FriendRequests.RemoveRange(friendRequests);
                }

                // Kiểm tra xem người dùng đã bị chặn trước đó hay chưa
                var existingBlock = await _context.UserBlocks
                    .FirstOrDefaultAsync(ub => ub.UserId == userId && ub.BlockedUserId == blockedUserId, cancellationToken);

                if (existingBlock != null)
                {
                    return BadRequest("This user is already blocked.");
                }

                // Thêm người dùng bị chặn vào bảng chặn
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
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while blocking user {BlockedUserId} for user {UserId}.", blockedUserId, userId);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }


        [HttpPost("{userId}/unblock/{blockedUserId}")]
        public async Task<IActionResult> UnblockUser(Guid userId, Guid blockedUserId, CancellationToken cancellationToken)
        {
            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null || userId.ToString() != authenticatedUserId)
            {
                return Forbid("You are not authorized to unblock this user.");
            }

            if (userId == blockedUserId)
            {
                return BadRequest("You cannot unblock yourself.");
            }

            try
            {
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
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while unblocking user {BlockedUserId} for user {UserId}.", blockedUserId, userId);
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }


        [HttpGet("{userId}/blocked-users")]
        public async Task<IActionResult> GetBlockedUsers(Guid userId, CancellationToken cancellationToken)
        {
            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null || userId.ToString() != authenticatedUserId)
            {
                return Forbid("You are not authorized to view blocked users.");
            }

            try
            {
                var blockedUsers = await _context.UserBlocks
               .Where(ub => ub.UserId == userId)
               .Include(ub => ub.BlockedUser) // Bao gồm thông tin người dùng bị chặn
               .Include(ub => ub.User) // Bao gồm thông tin người dùng thực hiện hành động chặn
               .Select(ub => new
               {
                   BlockedUserId = ub.BlockedUserId,
                   BlockedFullName = $"{ub.BlockedUser.FirstName} {ub.BlockedUser.LastName}", // Nối FirstName và LastName
                   BlockedTagName = ub.BlockedUser.TagName,
                   BlockedAvatar = ub.BlockedUser.Avatar,
               })
               .ToListAsync();



                return Ok(blockedUsers);
            }
            catch (Exception ex)
            {
                // Ghi lại lỗi
                _logger.LogError(ex, "Error occurred while fetching blocked users for user {UserId}", userId);

                // Trả về lỗi Internal Server Error với thông báo lỗi
                return StatusCode(500, "An error occurred while fetching blocked users.");
            }
        }

    }
}