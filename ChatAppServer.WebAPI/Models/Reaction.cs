namespace ChatAppServer.WebAPI.Models
{
    public class Reaction
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid ChatId { get; set; }
        public Chat Chat { get; set; }
        public Guid UserId { get; set; }
        public User User { get; set; }
        public string ReactionType { get; set; } = string.Empty; // Ví dụ: "like", "love", "haha", etc.
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
