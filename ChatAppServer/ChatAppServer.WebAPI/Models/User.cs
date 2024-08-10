namespace ChatAppServer.WebAPI.Models
{
    public sealed class User
    {
        public User()
        {
            Id = Guid.NewGuid();
            Friends = new List<Friendship>();
            SentFriendRequests = new List<FriendRequest>();
            ReceivedFriendRequests = new List<FriendRequest>();
            SentChats = new List<Chat>();
            ReceivedChats = new List<Chat>();
            Groups = new List<GroupMember>();
        }

        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public DateTime Birthday { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Avatar { get; set; } = string.Empty;
        public string OriginalAvatarFileName { get; set; } = string.Empty;
        public string Status { get; set; } = "offline";
        public string PasswordHash { get; set; } = string.Empty;
        public bool ShowOnlineStatus { get; set; } = true;
        public string Role { get; set; } = "User";
        public bool IsEmailConfirmed { get; set; } = false;
        public bool IsLocked { get; set; } = false;
        public string TagName { get; set; } = string.Empty;

        // New field to store the last time a password reset email was sent
        public DateTime? LastPasswordResetEmailSentTime { get; set; }

        public List<Friendship> Friends { get; set; }
        public List<FriendRequest> SentFriendRequests { get; set; }
        public List<FriendRequest> ReceivedFriendRequests { get; set; }
        public List<Chat> SentChats { get; set; }
        public List<Chat> ReceivedChats { get; set; }
        public List<GroupMember> Groups { get; set; }

        public void AddFriend(Guid friendId)
        {
            if (!Friends.Any(f => f.FriendId == friendId))
            {
                Friends.Add(new Friendship { UserId = this.Id, FriendId = friendId });
            }
        }

        public void RemoveFriend(Guid friendId)
        {
            var friendship = Friends.FirstOrDefault(f => f.FriendId == friendId);
            if (friendship != null)
            {
                Friends.Remove(friendship);
            }
        }

        public bool IsFriend(Guid friendId)
        {
            return Friends.Any(f => f.FriendId == friendId);
        }
    }
}
