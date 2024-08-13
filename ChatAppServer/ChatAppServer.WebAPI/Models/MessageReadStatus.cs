namespace ChatAppServer.WebAPI.Models
{
    public class MessageReadStatus
    {
        public Guid Id { get; set; } // Primary Key
        public Guid MessageId { get; set; } // Foreign Key to Chat
        public Guid UserId { get; set; } // Foreign Key to User
        public bool IsRead { get; set; } // Indicates whether the message has been read
        public DateTime? ReadAt { get; set; } // Date and time when the message was read

        // Navigation Properties
        public Chat Chat { get; set; }
        public User User { get; set; }
    }
}
