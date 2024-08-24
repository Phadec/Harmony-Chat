namespace ChatAppServer.WebAPI.Models
{
    public class Friendship
    {
        public Guid UserId { get; set; }
        public User User { get; set; }
        public Guid FriendId { get; set; }
        public User Friend { get; set; }
        public string Nickname { get; set; }

        // Thêm thuộc tính tắt thông báo
        public bool NotificationsMuted { get; set; } = false;
        public string ChatTheme { get; set; } = "default";
    }

}
