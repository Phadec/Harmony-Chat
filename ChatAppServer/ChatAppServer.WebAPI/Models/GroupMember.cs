namespace ChatAppServer.WebAPI.Models
{
    public sealed class GroupMember
    {
        public GroupMember()
        {
            Id = Guid.NewGuid();
        }

        public Guid Id { get; set; }
        public Guid GroupId { get; set; }
        public Group Group { get; set; }
        public Guid UserId { get; set; }
        public User User { get; set; }
    }
}
