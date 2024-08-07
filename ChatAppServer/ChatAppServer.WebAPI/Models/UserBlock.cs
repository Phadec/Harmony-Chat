namespace ChatAppServer.WebAPI.Models
{
    public class UserBlock
    {
        public Guid UserId { get; set; }
        public User User { get; set; }
        public Guid BlockedUserId { get; set; }
        public User BlockedUser { get; set; }
        public DateTime BlockedDate { get; set; }

    }
}
