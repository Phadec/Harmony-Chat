namespace ChatAppServer.WebAPI.Dtos
{
    public class UserSearchResult
    {
        public Guid Id { get; set; }
        public string Username { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Email { get; set; }
        public string Avatar { get; set; }
        public string Status { get; set; }
        public string TagName { get; set; }
        public bool HasSentRequest { get; set; }
        public Guid? RequestId { get; set; }
        public bool HasReceivedRequest { get; set; }
        public Guid? ReceivedRequestId { get; set; }
    }
}
