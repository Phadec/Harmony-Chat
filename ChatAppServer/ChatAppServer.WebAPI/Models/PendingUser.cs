namespace ChatAppServer.WebAPI.Models
{
    public class PendingUser
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public DateTime Birthday { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Avatar { get; set; } = string.Empty;
        public string OriginalAvatarFileName { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty; // Token xác nhận
        public DateTime TokenExpiration { get; set; } // Thời gian hết hạn của token
    }
}
