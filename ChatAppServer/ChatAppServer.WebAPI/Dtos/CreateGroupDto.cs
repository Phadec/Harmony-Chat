namespace ChatAppServer.WebAPI.Dtos
{
    public class CreateGroupDto
    {
        public string Name { get; set; }
        public List<Guid> MemberIds { get; set; }
        public IFormFile AvatarFile { get; set; } // Thêm thuộc tính này
    }
}
