namespace ChatAppServer.WebAPI.Dtos
{
    public class RevokeGroupAdminDto
    {
        public Guid GroupId { get; set; }
        public Guid UserId { get; set; }
    }
}
