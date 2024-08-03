namespace ChatAppServer.WebAPI.Models
{
    public class FriendRequest
    {
        public Guid Id { get; set; }
        public Guid SenderId { get; set; }
        public Guid ReceiverId { get; set; }
        public DateTime RequestDate { get; set; } = DateTime.UtcNow;
        public string Status { get; set; } = "Pending"; // Thêm trường Status

        public User Sender { get; set; }
        public User Receiver { get; set; }
    }
}
