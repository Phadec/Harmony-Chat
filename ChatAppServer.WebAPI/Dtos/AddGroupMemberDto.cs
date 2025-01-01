namespace ChatAppServer.WebAPI.Dtos
{
    public sealed record AddGroupMemberDto(
        Guid GroupId,
        Guid UserId);
}
