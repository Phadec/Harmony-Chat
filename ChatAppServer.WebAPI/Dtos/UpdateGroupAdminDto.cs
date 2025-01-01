namespace ChatAppServer.WebAPI.Dtos
{
    public class UpdateGroupAdminDto
    {
        public Guid GroupId { get; set; }
        public Guid UserId { get; set; }
    }

}
