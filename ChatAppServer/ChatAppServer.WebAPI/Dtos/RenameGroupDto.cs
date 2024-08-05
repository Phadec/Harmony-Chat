namespace ChatAppServer.WebAPI.Dtos
{
    public class RenameGroupDto
    {
        public Guid GroupId { get; set; }
        public string NewName { get; set; }
    }
}
