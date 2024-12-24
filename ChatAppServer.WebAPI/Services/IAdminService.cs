using ChatAppServer.WebAPI.Dtos;

namespace ChatAppServer.WebAPI.Services
{
    public interface IAdminService
    {
        Task<object> GetUsersAsync(CancellationToken cancellationToken);
        Task UpdateUserRoleAsync(UpdateRoleDto request, CancellationToken cancellationToken);
        Task LockUserAsync(Guid userId, CancellationToken cancellationToken);
        Task UnlockUserAsync(Guid userId, CancellationToken cancellationToken);
        Task<object> GetFriendRequestsAsync(CancellationToken cancellationToken);
        Task<object> GetAllChatsAsync(CancellationToken cancellationToken);
        Task<object> GetGroupsAsync(CancellationToken cancellationToken);
        Task<object> GetUserBlocksAsync(CancellationToken cancellationToken);
        Task<object> GetPendingUsersAsync(CancellationToken cancellationToken);
    }
}
