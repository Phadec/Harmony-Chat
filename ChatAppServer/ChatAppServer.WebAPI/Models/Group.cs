namespace ChatAppServer.WebAPI.Models
{
    public sealed class Group
    {
        public Group()
        {
            Id = Guid.NewGuid();
            Members = new List<GroupMember>();
            Chats = new List<Chat>();
        }

        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Avatar { get; set; } = string.Empty; // Thêm thuộc tính này

        public List<GroupMember> Members { get; set; }
        public List<Chat> Chats { get; set; }
    }
}
