namespace ChatAppServer.WebAPI.Models
{
    public class NewReactionStatus
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid ChatId { get; set; }
        public Guid UserId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Chat Chat { get; set; }
        public User User { get; set; }
    }

}
