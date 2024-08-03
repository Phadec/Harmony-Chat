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

        public FriendsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpPost("{userId}/add/{friendId}")]
        public async Task<IActionResult> AddFriend(Guid userId, Guid friendId, CancellationToken cancellationToken)
        {
            try
            {
                // Kiểm tra xem người dùng có phải là bạn bè chưa
                bool isAlreadyFriend = await _context.Users
                    .AnyAsync(u => u.Id == userId && u.Friends.Any(f => f.FriendId == friendId), cancellationToken);

                if (isAlreadyFriend)
                {
                    return BadRequest("You are already friends with this user.");
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

                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in AddFriend: {ex.Message}");
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }


        [HttpDelete("{userId}/remove/{friendId}")]
        public async Task<IActionResult> RemoveFriend(Guid userId, Guid friendId, CancellationToken cancellationToken)
        {
            var user = await _context.Users.Include(u => u.Friends).FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
            var friend = await _context.Users.Include(u => u.Friends).FirstOrDefaultAsync(u => u.Id == friendId, cancellationToken);

            if (user == null || friend == null)
            {
                return NotFound();
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

            return Ok();
        }

        [HttpGet("{userId}/friends")]
        public async Task<IActionResult> GetFriends(Guid userId, CancellationToken cancellationToken)
        {
            // Lấy tất cả các mối quan hệ bạn bè của người dùng
            var friendships = await _context.Friendships
                .Where(f => f.UserId == userId || f.FriendId == userId)
                .ToListAsync(cancellationToken);

            if (friendships == null || !friendships.Any())
            {
                return NotFound("No friends found.");
            }

            // Lấy tất cả các UserId của bạn bè
            var friendIds = friendships
                .Select(f => f.UserId == userId ? f.FriendId : f.UserId)
                .Distinct()
                .ToList();

            // Lấy thông tin chi tiết của tất cả bạn bè
            var friends = await _context.Users
                .Where(u => friendIds.Contains(u.Id))
                .ToListAsync(cancellationToken);

            // Chuyển đổi danh sách User thành danh sách UserDto
            var friendsDto = friends.Select(u => new UserDto
            {
                Id = u.Id,
                Username = u.Username,
                FullName = u.FullName,
                Birthday = u.Birthday,
                Email = u.Email,
                Avatar = u.Avatar,
                Status = u.Status
            }).ToList();

            return Ok(friendsDto);
        }

        [HttpGet("{userId}/friend-requests")]
        public async Task<IActionResult> GetFriendRequests(Guid userId, CancellationToken cancellationToken)
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
                SenderUsername = fr.Sender.Username,
                fr.Status
            }).ToList();

            return Ok(friendRequests);
        }

        [HttpPost("{userId}/accept-friend-request/{requestId}")]
        public async Task<IActionResult> AcceptFriendRequest(Guid userId, Guid requestId, CancellationToken cancellationToken)
        {
            try
            {
                Console.WriteLine($"Accepting friend request: UserId={userId}, RequestId={requestId}");

                var friendRequest = await _context.FriendRequests
                                      .Include(fr => fr.Sender)
                                      .FirstOrDefaultAsync(fr => fr.Id == requestId && fr.ReceiverId == userId, cancellationToken);

                if (friendRequest == null)
                {
                    Console.WriteLine($"FriendRequest with Id {requestId} and ReceiverId {userId} not found.");
                    return NotFound($"Friend request with ID {requestId} not found or does not belong to user {userId}.");
                }

                var user = await _context.Users.Include(u => u.Friends).FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
                if (user == null)
                {
                    Console.WriteLine($"User with Id {userId} not found.");
                    return NotFound($"User with ID {userId} not found.");
                }

                user.AddFriend(friendRequest.SenderId);

                var sender = await _context.Users.Include(u => u.Friends).FirstOrDefaultAsync(u => u.Id == friendRequest.SenderId, cancellationToken);
                if (sender == null)
                {
                    Console.WriteLine($"Sender with Id {friendRequest.SenderId} not found.");
                    return NotFound($"Sender with ID {friendRequest.SenderId} not found.");
                }

                sender.AddFriend(userId);
                friendRequest.Status = "Accepted";

                _context.FriendRequests.Update(friendRequest);
                _context.Users.Update(user);
                _context.Users.Update(sender);

                var affectedRows = await _context.SaveChangesAsync(cancellationToken);
                Console.WriteLine($"Number of rows affected: {affectedRows}");

                return Ok();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in AcceptFriendRequest: {ex.Message}");
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpPost("{userId}/reject-friend-request/{requestId}")]
        public async Task<IActionResult> RejectFriendRequest(Guid userId, Guid requestId, CancellationToken cancellationToken)
        {
            var friendRequest = await _context.FriendRequests.FirstOrDefaultAsync(fr => fr.Id == requestId && fr.ReceiverId == userId, cancellationToken);
            if (friendRequest == null)
            {
                return NotFound();
            }

            friendRequest.Status = "Rejected";
            _context.FriendRequests.Update(friendRequest);
            await _context.SaveChangesAsync(cancellationToken);

            return Ok();
        }
    }
}
