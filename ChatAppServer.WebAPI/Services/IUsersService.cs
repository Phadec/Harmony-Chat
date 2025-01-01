using ChatAppServer.WebAPI.Dtos;

namespace ChatAppServer.WebAPI.Services
{
    public interface IUsersService
    {
        Task<IEnumerable<UserSearchResult>> SearchUserByTagNameAsync(string tagName, Guid authenticatedUserId, CancellationToken cancellationToken);
        Task UpdateStatusAsync(Guid userId, string status, CancellationToken cancellationToken);
        Task UpdateStatusVisibilityAsync(Guid userId, bool showOnlineStatus, CancellationToken cancellationToken);
        Task<string> GetStatusAsync(Guid userId, CancellationToken cancellationToken);
        Task<object> GetUserInfoAsync(Guid userId, CancellationToken cancellationToken);
        Task UpdateUserAsync(Guid userId, UpdateUserDto request, CancellationToken cancellationToken);
    }
}
