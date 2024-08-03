namespace ChatAppServer.WebAPI.Dtos
{
    public class UserDto
    {
        public Guid Id { get; set; }
        public string Username { get; set; }
        public string FullName { get; set; } // Thêm trường FullName
        public DateTime Birthday { get; set; } // Thêm trường Birthday
        public string Email { get; set; } // Thêm trường Email
        public string Avatar { get; set; }
        public string Status { get; set; }
    }
}
