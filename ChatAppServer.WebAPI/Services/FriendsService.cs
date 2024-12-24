using ChatAppServer.WebAPI.Dtos;
using ChatAppServer.WebAPI.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace ChatAppServer.WebAPI.Services
{
    public class FriendsService : IFriendsService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<FriendsService> _logger;
        private readonly IHubContext<ChatHub> _hubContext;

        public FriendsService(ApplicationDbContext context, ILogger<FriendsService> logger, IHubContext<ChatHub> hubContext)
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

        public async Task<List<SentFriendRequestDto>> GetSentFriendRequests(Guid userId, CancellationToken cancellationToken)
        {
            var sentRequests = await _context.FriendRequests
                .Where(fr => fr.SenderId == userId)
                .Include(fr => fr.Receiver)
                .ToListAsync(cancellationToken);

            return sentRequests.Select(fr => new SentFriendRequestDto
            {
                Id = fr.Id,
                ReceiverId = fr.ReceiverId,
                TagName = fr.Receiver.TagName,
                RequestDate = fr.RequestDate,
                Status = fr.Status
            }).ToList();
        }

        public async Task ChangeNickname(Guid userId, ChangeNicknameDto request, CancellationToken cancellationToken)
        {
            var friendship = await _context.Friendships
                .FirstOrDefaultAsync(f => f.UserId == userId && f.FriendId == request.FriendId, cancellationToken);

            if (friendship == null)
            {
                throw new KeyNotFoundException("Friendship not found.");
            }

            friendship.Nickname = string.IsNullOrEmpty(request.Nickname) ? string.Empty : request.Nickname;
            _context.Friendships.Update(friendship);
            await _context.SaveChangesAsync(cancellationToken);

            await NotifyFriendEvent(userId, "NicknameChanged", new { FriendId = request.FriendId, Nickname = request.Nickname });
            await NotifyFriendEvent(request.FriendId, "NicknameChanged", new { FriendId = userId, Nickname = request.Nickname });
        }

        public async Task AddFriend(Guid userId, Guid friendId, CancellationToken cancellationToken)
        {
            if (userId == friendId)
            {
                throw new InvalidOperationException("You cannot add yourself as a friend.");
            }

            var isBlocked = await _context.UserBlocks.AnyAsync(ub => ub.UserId == friendId && ub.BlockedUserId == userId, cancellationToken);
            if (isBlocked)
            {
                throw new InvalidOperationException("You cannot send a friend request to this user.");
            }

            var isBlockedReverse = await _context.UserBlocks.AnyAsync(ub => ub.UserId == userId && ub.BlockedUserId == friendId, cancellationToken);
            if (isBlockedReverse)
            {
                throw new InvalidOperationException("You cannot send a friend request to this user.");
            }

            bool isAlreadyFriend = await _context.Users.AnyAsync(u => u.Id == userId && u.Friends.Any(f => f.FriendId == friendId), cancellationToken);
            if (isAlreadyFriend)
            {
                throw new InvalidOperationException("You are already friends with this user.");
            }

            bool requestAlreadyExists = await _context.FriendRequests
                .AnyAsync(fr => fr.SenderId == userId && fr.ReceiverId == friendId && fr.Status == "Pending", cancellationToken);

            if (requestAlreadyExists)
            {
                throw new InvalidOperationException("Friend request already sent.");
            }

            var reciprocalRequest = await _context.FriendRequests
                .FirstOrDefaultAsync(fr => fr.SenderId == friendId && fr.ReceiverId == userId && fr.Status == "Pending", cancellationToken);

            if (reciprocalRequest != null)
            {
                var user = await _context.Users.Include(u => u.Friends).FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
                var sender = await _context.Users.Include(u => u.Friends).FirstOrDefaultAsync(u => u.Id == friendId, cancellationToken);

                if (user == null || sender == null)
                {
                    throw new KeyNotFoundException("User or friend not found.");
                }

                user.AddFriend(friendId);
                sender.AddFriend(userId);

                _context.FriendRequests.Remove(reciprocalRequest);
                _context.Users.Update(user);
                _context.Users.Update(sender);

                await _context.SaveChangesAsync(cancellationToken);
                _logger.LogInformation($"Friend request between {userId} and {friendId} automatically accepted.");
                return;
            }

            var friendRequest = new FriendRequest
            {
                SenderId = userId,
                ReceiverId = friendId,
                Status = "Pending"
            };

            await _context.FriendRequests.AddAsync(friendRequest, cancellationToken);
            await _context.SaveChangesAsync(cancellationToken);

            await NotifyFriendEvent(friendId, "FriendRequestReceived", new { FriendRequestId = friendRequest.Id });
            _logger.LogInformation($"Friend request from {userId} to {friendId} created.");
        }

        public async Task RemoveFriend(Guid userId, Guid friendId, CancellationToken cancellationToken)
        {
            var user = await _context.Users.Include(u => u.Friends).FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
            var friend = await _context.Users.Include(u => u.Friends).FirstOrDefaultAsync(u => u.Id == friendId, cancellationToken);

            if (user == null || friend == null)
            {
                throw new KeyNotFoundException("User or friend not found.");
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
        }

        public async Task UpdateChatThemeWithFriend(Guid userId, Guid friendId, UpdateChatThemeDto request, CancellationToken cancellationToken)
        {
            var friendship1 = await _context.Friendships
                .FirstOrDefaultAsync(f => f.UserId == userId && f.FriendId == friendId, cancellationToken);

            var friendship2 = await _context.Friendships
                .FirstOrDefaultAsync(f => f.UserId == friendId && f.FriendId == userId, cancellationToken);

            if (friendship1 == null && friendship2 == null)
            {
                throw new KeyNotFoundException("Friendship not found.");
            }

            if (friendship1 != null)
            {
                friendship1.ChatTheme = request.Theme;
            }

            if (friendship2 != null)
            {
                friendship2.ChatTheme = request.Theme;
            }

            await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task<List<FriendDto>> GetFriends(Guid userId, CancellationToken cancellationToken)
        {
            var friendships = await _context.Friendships
                .Where(f => f.UserId == userId)
                .Include(f => f.User)
                .Include(f => f.Friend)
                .ToListAsync(cancellationToken);

            return friendships.Select(f => new FriendDto
            {
                Id = f.Friend.Id,
                Tagname = f.Friend.TagName,
                FullName = $"{f.Friend.FirstName} {f.Friend.LastName}",
                Birthday = f.Friend.Birthday,
                Email = f.Friend.Email,
                Avatar = f.Friend.Avatar,
                Status = f.Friend.Status,
                Nickname = f.Nickname,
                NotificationsMuted = f.NotificationsMuted,
                ChatTheme = f.ChatTheme,
            }).ToList();
        }

        public async Task<List<object>> GetFriendRequests(Guid userId, CancellationToken cancellationToken)
        {
            var user = await _context.Users.Include(u => u.ReceivedFriendRequests)
                                           .ThenInclude(fr => fr.Sender)
                                           .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

            if (user == null)
            {
                throw new KeyNotFoundException("User not found.");
            }

            return user.ReceivedFriendRequests.Select(fr => new
            {
                fr.Id,
                SenderId = fr.SenderId,
                SenderName = $"{fr.Sender.FirstName} {fr.Sender.LastName}",
                TagName = fr.Sender.TagName,
                fr.Sender.Avatar,
                fr.Status
            }).Cast<object>().ToList();
        }

        public async Task AcceptFriendRequest(Guid userId, Guid requestId, CancellationToken cancellationToken)
        {
            var friendRequest = await _context.FriendRequests
                                  .Include(fr => fr.Sender)
                                  .FirstOrDefaultAsync(fr => fr.Id == requestId && fr.ReceiverId == userId, cancellationToken);

            if (friendRequest == null)
            {
                throw new KeyNotFoundException("Friend request not found or does not belong to the user.");
            }

            var user = await _context.Users.Include(u => u.Friends).FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);
            var sender = await _context.Users.Include(u => u.Friends).FirstOrDefaultAsync(u => u.Id == friendRequest.SenderId, cancellationToken);

            if (user == null || sender == null)
            {
                throw new KeyNotFoundException("User or sender not found.");
            }

            user.AddFriend(friendRequest.SenderId);
            sender.AddFriend(userId);

            _context.FriendRequests.Remove(friendRequest);
            _context.Users.Update(user);
            _context.Users.Update(sender);
            await _context.SaveChangesAsync(cancellationToken);

            await NotifyFriendEvent(userId, "FriendRequestAccepted", new { FriendId = sender.Id });
            await NotifyFriendEvent(sender.Id, "FriendRequestAccepted", new { FriendId = userId });
        }

        public async Task RejectFriendRequest(Guid userId, Guid requestId, CancellationToken cancellationToken)
        {
            var friendRequest = await _context.FriendRequests
                .FirstOrDefaultAsync(fr => fr.Id == requestId && fr.ReceiverId == userId, cancellationToken);

            if (friendRequest == null)
            {
                throw new KeyNotFoundException("Friend request not found.");
            }

            _context.FriendRequests.Remove(friendRequest);
            await _context.SaveChangesAsync(cancellationToken);

            await NotifyFriendEvent(userId, "FriendRequestRejected", new { FriendRequestId = requestId });
            await NotifyFriendEvent(friendRequest.SenderId, "FriendRequestRejected", new { FriendRequestId = requestId });
        }

        public async Task CancelFriendRequest(Guid userId, Guid requestId, CancellationToken cancellationToken)
        {
            var friendRequest = await _context.FriendRequests
                .FirstOrDefaultAsync(fr => fr.Id == requestId && fr.SenderId == userId, cancellationToken);

            if (friendRequest == null)
            {
                throw new KeyNotFoundException("Friend request not found or does not belong to the user.");
            }

            _context.FriendRequests.Remove(friendRequest);
            await _context.SaveChangesAsync(cancellationToken);

            await NotifyFriendEvent(friendRequest.ReceiverId, "FriendRequestCanceled", new { FriendRequestId = requestId });
        }

        public async Task<object> GetRelationshipInfo(Guid userId, Guid entityId, CancellationToken cancellationToken)
        {
            var group = await _context.Groups
                .Include(g => g.Members)
                .ThenInclude(m => m.User)
                .FirstOrDefaultAsync(g => g.Id == entityId, cancellationToken);

            if (group != null)
            {
                var isAdmin = group.Members.Any(m => m.UserId == userId && m.IsAdmin);
                return new
                {
                    IsGroup = true,
                    IsAdmin = isAdmin,
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
            }

            var friendship = await _context.Friendships
                .Include(f => f.Friend)
                .Include(f => f.User)
                .FirstOrDefaultAsync(f => (f.UserId == userId && f.FriendId == entityId) || (f.UserId == entityId && f.FriendId == userId), cancellationToken);

            if (friendship == null)
            {
                throw new KeyNotFoundException("Relationship not found.");
            }

            var friend = friendship.UserId == userId ? friendship.Friend : friendship.User;
            return new
            {
                IsGroup = false,
                Id = friend.Id,
                Name = $"{friend.FirstName} {friend.LastName}",
                Nickname = friendship.Nickname,
                Avatar = friend.Avatar,
                TagName = friend.TagName,
                Status = friend.Status
            };
        }

        public async Task BlockUser(Guid userId, Guid blockedUserId, CancellationToken cancellationToken)
        {
            if (userId == blockedUserId)
            {
                throw new InvalidOperationException("You cannot block yourself.");
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

            var existingBlock = await _context.UserBlocks
                .FirstOrDefaultAsync(ub => ub.UserId == userId && ub.BlockedUserId == blockedUserId, cancellationToken);

            if (existingBlock != null)
            {
                throw new InvalidOperationException("This user is already blocked.");
            }

            var userBlock = new UserBlock
            {
                UserId = userId,
                BlockedUserId = blockedUserId,
                BlockedDate = DateTime.UtcNow
            };

            _context.UserBlocks.Add(userBlock);
            await _context.SaveChangesAsync(cancellationToken);

            await NotifyFriendEvent(userId, "UserBlocked", new { BlockedUserId = blockedUserId });
            await NotifyFriendEvent(blockedUserId, "UserBlockedByOther", new { BlockedByUserId = userId });
        }

        public async Task UnblockUser(Guid userId, Guid blockedUserId, CancellationToken cancellationToken)
        {
            if (userId == blockedUserId)
            {
                throw new InvalidOperationException("You cannot unblock yourself.");
            }

            var userBlock = await _context.UserBlocks
                .FirstOrDefaultAsync(ub => ub.UserId == userId && ub.BlockedUserId == blockedUserId, cancellationToken);

            if (userBlock == null)
            {
                throw new KeyNotFoundException("User block not found.");
            }

            _context.UserBlocks.Remove(userBlock);
            await _context.SaveChangesAsync(cancellationToken);

            await NotifyFriendEvent(userId, "UserUnblocked", new { UnblockedUserId = blockedUserId });
        }

        public async Task MuteFriendNotifications(Guid userId, Guid friendId, CancellationToken cancellationToken)
        {
            var friendship = await _context.Friendships
                .FirstOrDefaultAsync(f => f.UserId == userId && f.FriendId == friendId, cancellationToken);

            if (friendship == null)
            {
                throw new KeyNotFoundException("Friendship not found.");
            }

            friendship.NotificationsMuted = !friendship.NotificationsMuted;
            await _context.SaveChangesAsync(cancellationToken);

            var notificationMessage = friendship.NotificationsMuted
                ? "Friend notifications muted successfully."
                : "Friend notifications unmuted successfully.";

            await NotifyFriendEvent(userId, "NotificationStatusChanged", new { FriendId = friendId, Muted = friendship.NotificationsMuted });
        }

        public async Task<List<object>> GetBlockedUsers(Guid userId, CancellationToken cancellationToken)
        {
            var blockedUsers = await _context.UserBlocks
                .Where(ub => ub.UserId == userId)
                .Include(ub => ub.BlockedUser)
                .Select(ub => new
                {
                    BlockedUserId = ub.BlockedUserId,
                    BlockedFullName = $"{ub.BlockedUser.FirstName} {ub.BlockedUser.LastName}",
                    BlockedTagName = ub.BlockedUser.TagName,
                    BlockedAvatar = ub.BlockedUser.Avatar,
                })
                .ToListAsync(cancellationToken);

            return blockedUsers.Cast<object>().ToList();
        }
    }
}
