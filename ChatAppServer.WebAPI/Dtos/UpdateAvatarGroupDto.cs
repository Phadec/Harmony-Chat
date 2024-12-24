namespace ChatAppServer.WebAPI.Dtos
{
    public class UpdateAvatarGroupDto
    {
        public Guid GroupId { get; set; }
        public IFormFile AvatarFile { get; set; }
    }
}
