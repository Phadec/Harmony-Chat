namespace ChatAppServer.WebAPI.Dtos
{
    public class UpdateUserDto
    {
        public string FullName { get; set; }
        public DateTime Birthday { get; set; }
        public string Email { get; set; }
        public string Avatar { get; set; }
    }
}
