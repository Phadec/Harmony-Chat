namespace ChatAppServer.WebAPI.Dtos
{
    public class ChatMessageDto
    {
        public Guid ChatId { get; set; }
        public DateTime ChatDate { get; set; }
        public string Message { get; set; }
        public string AttachmentUrl { get; set; }
        public bool IsSentByUser { get; set; }
        public Guid SenderId { get; set; }
        public string SenderFullName { get; set; }
        public string SenderName { get; set; }
        public Guid? GroupId { get; set; }
        public string GroupName { get; set; }
    }

}
