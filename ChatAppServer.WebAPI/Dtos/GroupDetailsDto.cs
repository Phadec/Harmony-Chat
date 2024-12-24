namespace ChatAppServer.WebAPI.Dtos
{
    public class GroupDetailsDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Avatar { get; set; }
        public string ChatTheme { get; set; }
        public bool NotificationsMuted { get; set; }
    }

}
