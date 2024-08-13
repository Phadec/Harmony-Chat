namespace ChatAppServer.WebAPI.Models
{
    public class UserDeletedMessage
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; } // The user who deleted the message
        public Guid MessageId { get; set; } // The message that was deleted
        public DateTime DeletedAt { get; set; } // When the message was deleted
    }

}
