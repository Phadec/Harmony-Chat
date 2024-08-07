namespace ChatAppServer.WebAPI.Dtos
{
    public class BlockUserDto
    {
        public Guid UserId { get; set; }
        public Guid BlockedUserId { get; set; }
    }
}
