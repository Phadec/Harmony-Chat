namespace ChatAppServer.WebAPI.Dtos
{
    public class UpdateRoleDto
    {
        public Guid UserId { get; set; }
        public string NewRole { get; set; }
    }
}
