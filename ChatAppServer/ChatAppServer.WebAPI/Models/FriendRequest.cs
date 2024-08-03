namespace ChatAppServer.WebAPI.Models
{
    public class FriendRequest
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid SenderId { get; set; }
        public Guid ReceiverId { get; set; }
        public DateTime RequestDate { get; set; } = DateTime.UtcNow;
        public string Status { get; set; } = "Pending";

        public User Sender { get; set; }
        public User Receiver { get; set; }
    }
}
