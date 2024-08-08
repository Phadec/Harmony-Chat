namespace ChatAppServer.WebAPI.Dtos
{
    public sealed record SendMessageDto(
    Guid UserId,
    Guid RecipientId,  // RecipientId có thể là GroupId hoặc ToUserId
    string? Message,
    IFormFile? Attachment);

}