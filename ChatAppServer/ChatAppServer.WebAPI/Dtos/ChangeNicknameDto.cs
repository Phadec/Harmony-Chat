namespace ChatAppServer.WebAPI.Dtos
{
    public class ChangeNicknameDto
    {
        public Guid FriendId { get; set; }
        public string Nickname { get; set; }
    }
}
