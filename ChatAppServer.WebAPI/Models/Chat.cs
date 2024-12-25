namespace ChatAppServer.WebAPI.Models
{
    public sealed class Chat
    {
        public Chat()
        {
            Id = Guid.NewGuid();
            Date = DateTime.UtcNow;
        }

        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public User User { get; set; }
        public Guid? ToUserId { get; set; }
        public User? ToUser { get; set; }
        public Guid? GroupId { get; set; }
        public Group? Group { get; set; }
        public string? Message { get; set; }
        public string? AttachmentUrl { get; set; }
        public string? AttachmentOriginalName { get; set; }
        public DateTime Date { get; set; }

        public bool IsRead { get; set; } = false;
        public DateTime? ReadAt { get; set; }

        public bool IsDeleted { get; set; } = false;

        public Guid? RepliedToMessageId { get; set; }
        public Chat? RepliedToMessage { get; set; }

        public ICollection<Reaction> Reactions { get; set; } = new List<Reaction>();

        // Thuộc tính mới để lưu trạng thái ghim tin nhắn
        public bool IsPinned { get; set; } = false; // Mặc định là chưa ghim
    }
}
