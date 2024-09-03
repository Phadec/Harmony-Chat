namespace ChatAppServer.WebAPI.Dtos
{
    public sealed record SendMessageDto(
        Guid UserId,
        Guid RecipientId,  // RecipientId có thể là GroupId hoặc ToUserId
        string? Message,
        IFormFile? Attachment,
        Guid? RepliedToMessageId);  // Thêm thuộc tính này để lưu ID của tin nhắn được reply
}
