using Microsoft.EntityFrameworkCore;

namespace ChatAppServer.WebAPI.Models
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Chat> Chats { get; set; }
        public DbSet<Group> Groups { get; set; }
        public DbSet<GroupMember> GroupMembers { get; set; }
        public DbSet<Friendship> Friendships { get; set; }
        public DbSet<FriendRequest> FriendRequests { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure User entity
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasMany(e => e.SentFriendRequests)
                    .WithOne(fr => fr.Sender)
                    .HasForeignKey(fr => fr.SenderId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(e => e.ReceivedFriendRequests)
                    .WithOne(fr => fr.Receiver)
                    .HasForeignKey(fr => fr.ReceiverId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(e => e.SentChats)
                    .WithOne(c => c.User)
                    .HasForeignKey(c => c.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(e => e.ReceivedChats)
                    .WithOne(c => c.ToUser)
                    .HasForeignKey(c => c.ToUserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(e => e.Groups)
                    .WithOne(gm => gm.User)
                    .HasForeignKey(gm => gm.UserId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure Group entity
            modelBuilder.Entity<Group>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired();

                entity.HasMany(e => e.Members)
                    .WithOne(gm => gm.Group)
                    .HasForeignKey(gm => gm.GroupId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(e => e.Chats)
                    .WithOne(c => c.Group)
                    .HasForeignKey(c => c.GroupId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure GroupMember entity
            modelBuilder.Entity<GroupMember>(entity =>
            {
                entity.HasKey(e => e.Id);
            });

            // Configure Chat entity
            modelBuilder.Entity<Chat>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Message)
                    .IsRequired();

                entity.HasOne(e => e.User)
                    .WithMany(u => u.SentChats)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.ToUser)
                    .WithMany(u => u.ReceivedChats)
                    .HasForeignKey(e => e.ToUserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Group)
                    .WithMany(g => g.Chats)
                    .HasForeignKey(e => e.GroupId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure Friendship entity
            Friendship.Configure(modelBuilder);
        }
    }
}
