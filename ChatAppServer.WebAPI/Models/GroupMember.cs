namespace ChatAppServer.WebAPI.Models
{
    public sealed class GroupMember
    {
        public GroupMember()
        {
            Id = Guid.NewGuid();
            IsAdmin = false; // Thiết lập mặc định IsAdmin là false
            NotificationsMuted = false; // Thiết lập mặc định là nhận thông báo
        }

        public Guid Id { get; set; }
        public Guid GroupId { get; set; }
        public Group Group { get; set; }
        public Guid UserId { get; set; }
        public User User { get; set; }
        public bool IsAdmin { get; set; } // Thêm thuộc tính IsAdmin
        public bool NotificationsMuted { get; set; } // Thêm thuộc tính NotificationsMuted để quản lý thông báo
    }
}
