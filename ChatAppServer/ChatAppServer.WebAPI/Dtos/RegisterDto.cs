namespace ChatAppServer.WebAPI.Dtos
{
    public class RegisterDto
    {
        public string Username { get; set; }
        public string Password { get; set; }
        public string FullName { get; set; } // Thêm trường FullName
        public DateTime Birthday { get; set; } // Thêm trường Birthday
        public string Email { get; set; } // Thêm trường Email
        public IFormFile File { get; set; } // File cho avatar hoặc các mục khác
    }
}
