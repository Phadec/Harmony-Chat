using ChatAppServer.WebAPI.Dtos;

namespace ChatAppServer.WebAPI.Services
{
    public interface IFriendsService
    {
        Task<List<SentFriendRequestDto>> GetSentFriendRequests(Guid userId, CancellationToken cancellationToken);
        Task ChangeNickname(Guid userId, ChangeNicknameDto request, CancellationToken cancellationToken);
        Task AddFriend(Guid userId, Guid friendId, CancellationToken cancellationToken);
        Task RemoveFriend(Guid userId, Guid friendId, CancellationToken cancellationToken);
        Task UpdateChatThemeWithFriend(Guid userId, Guid friendId, UpdateChatThemeDto request, CancellationToken cancellationToken);
        Task<List<FriendDto>> GetFriends(Guid userId, CancellationToken cancellationToken);
        Task<List<object>> GetFriendRequests(Guid userId, CancellationToken cancellationToken);
        Task AcceptFriendRequest(Guid userId, Guid requestId, CancellationToken cancellationToken);
        Task RejectFriendRequest(Guid userId, Guid requestId, CancellationToken cancellationToken);
        Task CancelFriendRequest(Guid userId, Guid requestId, CancellationToken cancellationToken);
        Task<object> GetRelationshipInfo(Guid userId, Guid entityId, CancellationToken cancellationToken);
        Task BlockUser(Guid userId, Guid blockedUserId, CancellationToken cancellationToken);
        Task UnblockUser(Guid userId, Guid blockedUserId, CancellationToken cancellationToken);
        Task MuteFriendNotifications(Guid userId, Guid friendId, CancellationToken cancellationToken);
        Task<List<object>> GetBlockedUsers(Guid userId, CancellationToken cancellationToken);
    }
}
