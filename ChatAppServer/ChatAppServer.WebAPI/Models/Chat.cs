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
        public User ToUser { get; set; }
        public Guid? GroupId { get; set; }
        public Group Group { get; set; }
        public string Message { get; set; } = string.Empty;
        public DateTime Date { get; set; }
    }
}
