﻿namespace ChatAppServer.WebAPI.Models
{
    public sealed class User
    {
        public User()
        {
            Id = Guid.NewGuid();
            Friends = new List<Friendship>();
            SentFriendRequests = new List<FriendRequest>();
            ReceivedFriendRequests = new List<FriendRequest>();
        }

        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public DateTime Birthday { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Avatar { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public List<Friendship> Friends { get; set; }
        public List<FriendRequest> SentFriendRequests { get; set; }
        public List<FriendRequest> ReceivedFriendRequests { get; set; }

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