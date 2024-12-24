namespace ChatAppServer.WebAPI.Dtos
{
    public class ChatDto
    {
        public Guid ChatId { get; set; }
        public DateTime ChatDate { get; set; }
        public bool IsGroup { get; set; }
        public Guid? ContactId { get; set; }
        public string? ContactName { get; set; }
        public string LastMessage { get; set; }
        public string LastAttachmentUrl { get; set; }
        public bool IsSentByUser { get; set; } // Thêm thuộc tính này
    }

}
