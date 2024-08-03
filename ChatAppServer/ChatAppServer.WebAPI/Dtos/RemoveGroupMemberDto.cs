namespace ChatAppServer.WebAPI.Dtos
{
    public sealed record RemoveGroupMemberDto(
        Guid GroupId,
        Guid UserId);
}
