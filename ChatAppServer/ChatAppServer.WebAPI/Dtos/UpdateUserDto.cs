namespace ChatAppServer.WebAPI.Dtos
{
    public class UpdateUserDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public DateTime Birthday { get; set; }
        public string Email { get; set; } = string.Empty;
        public string TagName { get; set; } = string.Empty; // Add this property
        public IFormFile? AvatarFile { get; set; }

    }

}
