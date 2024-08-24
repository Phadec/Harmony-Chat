using ChatAppServer.WebAPI.Dtos;
using ChatAppServer.WebAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
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
        private readonly IHubContext<ChatHub> _hubContext;
        public FriendsController(ApplicationDbContext context, ILogger<FriendsController> logger, IHubContext<ChatHub> hubContext)
        {
            _context = context;
            _logger = logger;
            _hubContext = hubContext;
        }
        private async Task NotifyFriendEvent(Guid userId, string eventType, object eventData)
        {
            await _hubContext.Clients.User(userId.ToString()).SendAsync("FriendEventNotification", new
            {
                EventType = eventType,
                Data = eventData
            });
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

                // Gọi sự kiện NotifyNicknameChanged trong ChatHub để phát sự kiện tới cả hai người dùng
                await NotifyFriendEvent(userId, "NicknameChanged", new { FriendId = request.FriendId, Nickname = request.Nickname });
                await NotifyFriendEvent(request.FriendId, "NicknameChanged", new { FriendId = userId, Nickname = request.Nickname });

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

            // Check if user is trying to add themselves as a friend
            if (userId == friendId)
            {
                return BadRequest("You cannot add yourself as a friend.");
            }

            // Check if userId is blocked by friendId
            var isBlocked = await _context.UserBlocks
                .AnyAsync(ub => ub.UserId == friendId && ub.BlockedUserId == userId, cancellationToken);

            if (isBlocked)
            {
                return BadRequest("You cannot send a friend request to this user.");
            }

            // Check if friendId is blocked by userId
            var isBlockedReverse = await _context.UserBlocks
                .AnyAsync(ub => ub.UserId == userId && ub.BlockedUserId == friendId, cancellationToken);

            if (isBlockedReverse)
            {
                return BadRequest("You cannot send a friend request to this user.");
            }

            try
            {
                // Check if they are already friends
                bool isAlreadyFriend = await _context.Users
                    .AnyAsync(u => u.Id == userId && u.Friends.Any(f => f.FriendId == friendId), cancellationToken);

                if (isAlreadyFriend)
                {
                    return BadRequest("You are already friends with this user.");
                }

                // Check if a friend request has already been sent by the user
                bool requestAlreadyExists = await _context.FriendRequests
                    .AnyAsync(fr => fr.SenderId == userId && fr.ReceiverId == friendId && fr.Status == "Pending", cancellationToken);

                if (requestAlreadyExists)
                {
                    return BadRequest("Friend request already sent.");
                }

                // Check if a friend request from friendId to userId exists
                var reciprocalRequest = await _context.FriendRequests
                    .FirstOrDefaultAsync(fr => fr.SenderId == friendId && fr.ReceiverId == userId && fr.Status == "Pending", cancellationToken);

                if (reciprocalRequest != null)
                {
                    // Automatically accept the friend request since both users sent requests to each other
                    var user = await _context.Users.Include(u => u.Friends).FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
                    var sender = await _context.Users.Include(u => u.Friends).FirstOrDefaultAsync(u => u.Id == friendId, cancellationToken);

                    if (user == null || sender == null)
                    {
                        return NotFound("User or friend not found.");
                    }

                    user.AddFriend(friendId);
                    sender.AddFriend(userId);

                    _context.FriendRequests.Remove(reciprocalRequest);
                    _context.Users.Update(user);
                    _context.Users.Update(sender);

                    await _context.SaveChangesAsync(cancellationToken);
                    _logger.LogInformation($"Friend request between {userId} and {friendId} automatically accepted.");

                    return Ok(new { Message = "Friend request automatically accepted." });
                }

                // If no reciprocal request, create a new friend request
                var friendRequest = new FriendRequest
                {
                    SenderId = userId,
                    ReceiverId = friendId,
                    Status = "Pending"
                };

                await _context.FriendRequests.AddAsync(friendRequest, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);
                await NotifyFriendEvent(friendId, "FriendRequestReceived", new { FriendRequestId = friendRequest.Id });
                _logger.LogInformation($"Sending FriendRequestReceived to user {friendId}");

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

                await NotifyFriendEvent(userId, "FriendRemoved", new { FriendId = friendId });
                await NotifyFriendEvent(friendId, "FriendRemoved", new { FriendId = userId });
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
                    Nickname = f.Nickname,
                    NotificationsMuted = f.NotificationsMuted, // Thêm thông tin về trạng thái tắt thông báo
                    ChatTheme = f.ChatTheme,
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

                await NotifyFriendEvent(userId, "FriendRequestAccepted", new { FriendId = sender.Id });
                await NotifyFriendEvent(sender.Id, "FriendRequestAccepted", new { FriendId = userId });
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

                // Notify both the sender and receiver of the friend request rejection
                await NotifyFriendEvent(userId, "FriendRequestRejected", new { FriendRequestId = requestId });
                await NotifyFriendEvent(friendRequest.SenderId, "FriendRequestRejected", new { FriendRequestId = requestId });

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
            _logger.LogInformation($"CancelFriendRequest started for user {userId} and request {requestId}");

            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null || userId.ToString() != authenticatedUserId)
            {
                _logger.LogWarning("Unauthorized attempt to cancel friend request.");
                return Forbid("You are not authorized to cancel this friend request.");
            }

            if (userId == Guid.Empty || requestId == Guid.Empty)
            {
                _logger.LogWarning("Invalid userId or requestId.");
                return BadRequest("Invalid userId or requestId");
            }

            try
            {
                var friendRequest = await _context.FriendRequests
                                      .FirstOrDefaultAsync(fr => fr.Id == requestId && fr.SenderId == userId, cancellationToken);

                if (friendRequest == null)
                {
                    _logger.LogWarning($"Friend request {requestId} not found for user {userId}.");
                    return NotFound("Friend request not found or does not belong to the user.");
                }

                _logger.LogInformation($"Friend request {requestId} found for user {userId}, proceeding with cancellation.");

                _context.FriendRequests.Remove(friendRequest);
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation($"Friend request {requestId} successfully deleted for user {userId}.");

                _logger.LogInformation($"Notifying user {friendRequest.ReceiverId} of cancellation for friend request {requestId}");
                await NotifyFriendEvent(friendRequest.ReceiverId, "FriendRequestCanceled", new { FriendRequestId = requestId });

                return Ok(new { Message = "Friend request canceled successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in CancelFriendRequest: {ex.Message}");
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }


        [HttpGet("{userId}/relationship-info/{entityId}")]
        public async Task<IActionResult> GetRelationshipInfo(Guid userId, Guid entityId, CancellationToken cancellationToken)
        {
            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null || userId.ToString() != authenticatedUserId)
            {
                return Forbid("You are not authorized to view this information.");
            }

            if (userId == Guid.Empty || entityId == Guid.Empty)
            {
                return BadRequest("Invalid userId or entityId.");
            }

            try
            {
                // Check if the entity is a group
                var group = await _context.Groups
                    .Include(g => g.Members)
                        .ThenInclude(m => m.User) // Include User information for each member
                    .FirstOrDefaultAsync(g => g.Id == entityId, cancellationToken);

                if (group != null)
                {
                    // Check if the current user is an admin of the group
                    var isAdmin = group.Members.Any(m => m.UserId == userId && m.IsAdmin);

                    // Return group information
                    var groupInfo = new
                    {
                        IsGroup = true,
                        IsAdmin = isAdmin, // Indicate if the current user is an admin
                        Id = group.Id,
                        Name = group.Name,
                        Avatar = group.Avatar,
                        Members = group.Members.Select(m => new
                        {
                            m.UserId,
                            FullName = $"{m.User.FirstName} {m.User.LastName}",
                            m.User.Avatar,
                            m.User.TagName,
                            m.User.Status
                        }).ToList()
                    };

                    return Ok(groupInfo);
                }

                // Check if the entity is a friend relationship
                var friendship = await _context.Friendships
                    .Include(f => f.Friend)
                    .Include(f => f.User)
                    .FirstOrDefaultAsync(f => (f.UserId == userId && f.FriendId == entityId) ||
                                              (f.UserId == entityId && f.FriendId == userId), cancellationToken);

                if (friendship == null)
                {
                    return NotFound("Relationship not found.");
                }

                // Get friend information
                var friend = friendship.UserId == userId ? friendship.Friend : friendship.User;
                var friendInfo = new
                {
                    IsGroup = false,
                    Id = friend.Id,
                    Name = $"{friend.FirstName} {friend.LastName}",
                    Nickname = friendship.Nickname,
                    Avatar = friend.Avatar,
                    TagName = friend.TagName,
                    Status = friend.Status
                };

                return Ok(friendInfo);
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

                // Gửi thông báo đến người dùng đã chặn
                await NotifyFriendEvent(userId, "UserBlocked", new { BlockedUserId = blockedUserId });

                // Gửi thông báo đến người dùng bị chặn
                _logger.LogInformation($"Sending UserBlockedByOther notification to {blockedUserId} with friendId: {userId}");
                await NotifyFriendEvent(blockedUserId, "UserBlockedByOther", new { BlockedByUserId = userId });


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

                await NotifyFriendEvent(userId, "UserUnblocked", new { UnblockedUserId = blockedUserId });

                _logger.LogInformation($"User {userId} unblocked user {blockedUserId}");

                return Ok(new { Message = "User unblocked successfully" });
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
            var authenticatedUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (authenticatedUserId == null || userId.ToString() != authenticatedUserId)
            {
                return Forbid("You are not authorized to mute notifications for this friend.");
            }

            var friendship = await _context.Friendships
                .FirstOrDefaultAsync(f => f.UserId == userId && f.FriendId == friendId, cancellationToken);

            if (friendship == null)
            {
                return NotFound("Friendship not found.");
            }

            // Toggle the NotificationsMuted status
            friendship.NotificationsMuted = !friendship.NotificationsMuted;
            await _context.SaveChangesAsync(cancellationToken);

            // Prepare the message
            var notificationMessage = friendship.NotificationsMuted
                ? "Friend notifications muted successfully."
                : "Friend notifications unmuted successfully.";

            // Send the notification to the user via SignalR
            await _hubContext.Clients.User(userId.ToString()).SendAsync("NotifyUser", new
            {
                Message = notificationMessage,
                FriendId = friendId
            });

            // Return the response
            return Ok(new { Message = notificationMessage });
        }

        private async Task NotifyUser(string userId, string message, object data = null)
        {
            // Prepare the notification payload
            var notification = new
            {
                Message = message,
                Data = data
            };

            // Send the notification to the user via SignalR
            await _hubContext.Clients.User(userId).SendAsync("NotifyUser", notification);
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