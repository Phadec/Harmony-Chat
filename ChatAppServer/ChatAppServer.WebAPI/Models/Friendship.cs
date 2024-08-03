using Microsoft.EntityFrameworkCore;

namespace ChatAppServer.WebAPI.Models
{
    public class Friendship
    {
        public Guid UserId { get; set; }
        public User User { get; set; }
        public Guid FriendId { get; set; }
        public static void Configure(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Friendship>()
                .HasKey(f => new { f.UserId, f.FriendId });
        }
    }

}