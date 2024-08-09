namespace ChatAppServer.WebAPI.Dtos
{
    public class SentFriendRequestDto
    {
        public Guid Id { get; set; }
        public Guid ReceiverId { get; set; }
        public String TagName { get; set; }
        public DateTime RequestDate { get; set; }
        public string Status { get; set; }
    }

}
