namespace ChatAppServer.WebAPI.Models
{
    public class UserToken
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Token { get; set; }
        public DateTime Expiration { get; set; }
        public User User { get; set; }
    }

}
