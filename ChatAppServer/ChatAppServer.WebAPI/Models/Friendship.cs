using Microsoft.EntityFrameworkCore;

namespace ChatAppServer.WebAPI.Models
{
    public class Friendship
    {
        public Guid UserId { get; set; }
        public User User { get; set; }
        public Guid FriendId { get; set; }
        public User Friend { get; set; }
        public string Nickname { get; set; }

        public static void Configure(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Friendship>(entity =>
            {
                entity.HasKey(e => new { e.UserId, e.FriendId });

                entity.HasOne(e => e.User)
                    .WithMany(u => u.Friends)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Friend)
                    .WithMany()
                    .HasForeignKey(e => e.FriendId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(e => e.Nickname)
                    .HasMaxLength(100)
                    .HasDefaultValue(""); // Set default value to empty string
            });
        }
    }
}
