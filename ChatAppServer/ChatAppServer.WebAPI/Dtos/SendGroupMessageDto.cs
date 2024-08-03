namespace ChatAppServer.WebAPI.Dtos
{
    public sealed record SendGroupMessageDto(
          Guid UserId,
          Guid GroupId,
          string? Message,
          IFormFile? Attachment);
}
