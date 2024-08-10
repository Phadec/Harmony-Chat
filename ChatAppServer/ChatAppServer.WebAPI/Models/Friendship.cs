namespace ChatAppServer.WebAPI.Models
{
    public class Friendship
    {
        public Guid UserId { get; set; }
        public User User { get; set; }
        public Guid FriendId { get; set; }
        public User Friend { get; set; }
        public string Nickname { get; set; }
    }
}
