namespace ChatAppServer.WebAPI.Dtos
{
    public class UnblockUserDto
    {
        public Guid UserId { get; set; }
        public Guid BlockedUserId { get; set; }
    }
}
