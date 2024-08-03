namespace ChatAppServer.WebAPI.Dtos
{
    public class RegisterDto
    {
        public string Username { get; set; }
        public string Password { get; set; }
        public string FullName { get; set; }
        public DateTime Birthday { get; set; }
        public string Email { get; set; }
        public IFormFile File { get; set; }
    }
}
