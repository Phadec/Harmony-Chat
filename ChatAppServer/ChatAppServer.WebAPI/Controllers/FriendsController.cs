using ChatAppServer.WebAPI.Dtos;
using ChatAppServer.WebAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChatAppServer.WebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FriendsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<FriendsController> _logger;

        public FriendsController(ApplicationDbContext context, ILogger<FriendsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpPost("{userId}/change-nickname")]
        public async Task<IActionResult> ChangeNickname(Guid userId, [FromForm] ChangeNicknameDto request, CancellationToken cancellationToken)
        {
            var friendship = await _context.Friendships
                .FirstOrDefaultAsync(f => f.UserId == userId && f.FriendId == request.FriendId, cancellationToken);

            if (friendship == null)
            {
                return NotFound("Friendship not found.");
            }

            friendship.Nickname = request.Nickname;
            _context.Friendships.Update(friendship);
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation($"Nickname for friend {request.FriendId} changed to {request.Nickname}");

            return Ok(new { Message = "Nickname changed successfully." });
        }

        [HttpPost("{userId}/add/{friendId}")]
        public async Task<IActionResult> AddFriend(Guid userId, Guid friendId, CancellationToken cancellationToken)
        {
            if (userId == Guid.Empty || friendId == Guid.Empty)
            {
                return BadRequest("Invalid userId or friendId");
            }

            try
            {
                // Kiểm tra xem người dùng có phải là bạn bè chưa
                bool isAlreadyFriend = await _context.Users
                    .AnyAsync(u => u.Id == userId && u.Friends.Any(f => f.FriendId == friendId), cancellationToken);

                if (isAlreadyFriend)
                {
                    return BadRequest("You are already friends with this user.");
                }

                // Kiểm tra xem đã có yêu cầu kết bạn chưa
                bool requestAlreadyExists = await _context.FriendRequests
                    .AnyAsync(fr => fr.SenderId == userId && fr.ReceiverId == friendId && fr.Status == "Pending", cancellationToken);

                if (requestAlreadyExists)
                {
                    return BadRequest("Friend request already sent.");
                }

                // Tạo và lưu lời mời kết bạn cho người nhận
                var friendRequest = new FriendRequest
                {
                    SenderId = userId,
                    ReceiverId = friendId,
                    Status = "Pending"
                };

                await _context.FriendRequests.AddAsync(friendRequest, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);

                // Trả về đối tượng ẩn danh chứa các trường cần thiết
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
            if (userId == Guid.Empty)
            {
                return BadRequest("Invalid userId");
            }

            var friendships = await _context.Friendships
                .Include(f => f.Friend)
                .Where(f => f.UserId == userId || f.FriendId == userId)
                .ToListAsync(cancellationToken);

            if (friendships == null || !friendships.Any())
            {
                return NotFound("No friends found.");
            }

            var friendsDto = friendships.Select(f =>
            {
                var friend = f.UserId == userId ? f.Friend : f.User;
                return new FriendDto
                {
                    Id = friend.Id,
                    Username = friend.Username,
                    FullName = friend.FullName,
                    Birthday = friend.Birthday,
                    Email = friend.Email,
                    Avatar = friend.Avatar,
                    Status = friend.Status,
                    Nickname = f.Nickname
                };
            }).ToList();

            return Ok(friendsDto);
        }


        [HttpGet("{userId}/friend-requests")]
        public async Task<IActionResult> GetFriendRequests(Guid userId, CancellationToken cancellationToken)
        {
            if (userId == Guid.Empty)
            {
                return BadRequest("Invalid userId");
            }

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
                SenderUsername = fr.Sender.Username,
                fr.Status
            }).ToList();

            return Ok(friendRequests);
        }

        [HttpPost("{userId}/accept-friend-request/{requestId}")]
        public async Task<IActionResult> AcceptFriendRequest(Guid userId, Guid requestId, CancellationToken cancellationToken)
        {
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

                _context.FriendRequests.Remove(friendRequest); // Xóa yêu cầu kết bạn
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

                _context.FriendRequests.Remove(friendRequest); // Xóa yêu cầu kết bạn
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
    }
}
