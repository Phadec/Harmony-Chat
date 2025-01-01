using ChatAppServer.WebAPI.Dtos;
using ChatAppServer.WebAPI.Models;

namespace ChatAppServer.WebAPI.Services
{
    public interface IGroupsService
    {
        Task<(bool Success, string Message, Group Group, List<object> Members)> CreateGroupAsync(CreateGroupDto request, string authenticatedUserId, CancellationToken cancellationToken);
        Task<(bool Success, string Message)> AddGroupMemberAsync(AddGroupMemberDto request, string authenticatedUserId, CancellationToken cancellationToken);
        Task<(bool Success, string Message)> DeleteGroupAsync(Guid groupId, string authenticatedUserId, CancellationToken cancellationToken);
        Task<(bool Success, string Message)> UpdateChatThemeAsync(Guid groupId, UpdateChatThemeDto request, string authenticatedUserId, CancellationToken cancellationToken);
        Task<List<UserDto>> GetGroupMembersAsync(Guid groupId, string authenticatedUserId, CancellationToken cancellationToken);
        Task<(bool Success, string Message)> RemoveGroupMemberAsync(RemoveGroupMemberDto request, string authenticatedUserId, CancellationToken cancellationToken);
        Task<List<object>> GetUserGroupsWithDetailsAsync(Guid userId, string authenticatedUserId, CancellationToken cancellationToken);
        Task<(bool Success, string Message)> RenameGroupAsync(RenameGroupDto request, string authenticatedUserId, CancellationToken cancellationToken);
        Task<(bool Success, string Message)> UpdateGroupAdminAsync(UpdateGroupAdminDto request, string authenticatedUserId, CancellationToken cancellationToken);
        Task<(bool Success, string Message)> RevokeGroupAdminAsync(RevokeGroupAdminDto request, string authenticatedUserId, CancellationToken cancellationToken);
        Task<(bool Success, string Message)> UpdateGroupAvatarAsync(UpdateAvatarGroupDto request, string authenticatedUserId, CancellationToken cancellationToken);
        Task<List<UserDto>> GetFriendsNotInGroupAsync(Guid groupId, string authenticatedUserId, CancellationToken cancellationToken);
        Task<(bool Success, string Message)> MuteGroupNotificationsAsync(Guid groupId, string authenticatedUserId, CancellationToken cancellationToken);
    }
}
