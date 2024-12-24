namespace ChatAppServer.WebAPI.Dtos
{
    public class UpdateUserDto
    {
        public string? FirstName { get; set; }  // Remove default initialization
        public string? LastName { get; set; }   // Remove default initialization
        public DateTime? Birthday { get; set; } // Make Birthday nullable
        public string? Email { get; set; }      // Remove default initialization
        public string? TagName { get; set; }    // Remove default initialization
        public IFormFile? AvatarFile { get; set; }
    }
}
