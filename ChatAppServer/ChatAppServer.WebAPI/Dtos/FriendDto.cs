namespace ChatAppServer.WebAPI.Dtos
{
    public class FriendDto
    {
        public Guid Id { get; set; }
        public string Username { get; set; }
        public string FullName { get; set; }
        public DateTime Birthday { get; set; }
        public string Email { get; set; }
        public string Avatar { get; set; }
        public string Status { get; set; }
        public string Nickname { get; set; }
    }
}
