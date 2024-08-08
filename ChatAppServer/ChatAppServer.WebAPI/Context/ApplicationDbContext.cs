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
        public DbSet<PendingUser> PendingUsers { get; set; }
        public DbSet<Chat> Chats { get; set; }
        public DbSet<Group> Groups { get; set; }
        public DbSet<GroupMember> GroupMembers { get; set; }
        public DbSet<Friendship> Friendships { get; set; }
        public DbSet<FriendRequest> FriendRequests { get; set; }
        public DbSet<UserToken> Tokens { get; set; }
        public DbSet<UserBlock> UserBlocks { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure User entity
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.FirstName).IsRequired().HasMaxLength(50);
                entity.Property(e => e.LastName).IsRequired().HasMaxLength(50);
                entity.Property(e => e.IsEmailConfirmed).HasDefaultValue(false);  // Set default value
                entity.Property(e => e.IsLocked).HasDefaultValue(false); // Set default value for IsLocked

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
            // Configure UserBlock entity
            modelBuilder.Entity<UserBlock>(entity =>
            {
                entity.HasKey(e => new { e.UserId, e.BlockedUserId });

                entity.HasOne(ub => ub.User)
                    .WithMany()
                    .HasForeignKey(ub => ub.UserId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(ub => ub.BlockedUser)
                    .WithMany()
                    .HasForeignKey(ub => ub.BlockedUserId)
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
                entity.Property(e => e.IsAdmin).HasDefaultValue(false);
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

            // Configure PendingUser entity
            modelBuilder.Entity<PendingUser>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.TokenExpiration).IsRequired();
            });

            // Configure Token entity
            modelBuilder.Entity<UserToken>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Token).IsRequired();
                entity.Property(e => e.Expiration).IsRequired();

                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }

        public static void SeedData(IServiceProvider serviceProvider)
        {
            using (var context = new ApplicationDbContext(serviceProvider.GetRequiredService<DbContextOptions<ApplicationDbContext>>()))
            {
                if (!context.Users.Any(u => u.Role == "Admin"))
                {
                    var adminUser = new User
                    {
                        Username = "admin",
                        FirstName = "Admin",
                        LastName = "User",
                        Email = "admin@example.com",
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                        Role = "Admin",
                        IsEmailConfirmed = true,
                        Status = "offline"
                    };

                    context.Users.Add(adminUser);
                }

                // Thêm ba người dùng để test
                var user1 = new User
                {
                    Username = "user1",
                    FirstName = "User",
                    LastName = "One",
                    Email = "user1@example.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password1"),
                    Role = "User",
                    IsEmailConfirmed = true,
                    Status = "offline"
                };

                var user2 = new User
                {
                    Username = "user2",
                    FirstName = "User",
                    LastName = "Two",
                    Email = "user2@example.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password2"),
                    Role = "User",
                    IsEmailConfirmed = true,
                    Status = "offline"
                };

                var user3 = new User
                {
                    Username = "user3",
                    FirstName = "User",
                    LastName = "Three",
                    Email = "user3@example.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password3"),
                    Role = "User",
                    IsEmailConfirmed = true,
                    Status = "offline"
                };

                if (!context.Users.Any(u => u.Username == user1.Username))
                    context.Users.Add(user1);

                if (!context.Users.Any(u => u.Username == user2.Username))
                    context.Users.Add(user2);

                if (!context.Users.Any(u => u.Username == user3.Username))
                    context.Users.Add(user3);

                context.SaveChanges();

                // Tạo nhóm và thêm thành viên
                var group = new Group
                {
                    Name = "Test Group",
                    Avatar = "default.png"
                };

                context.Groups.Add(group);
                context.SaveChanges();

                var groupMember1 = new GroupMember
                {
                    GroupId = group.Id,
                    UserId = user1.Id,
                    IsAdmin = true
                };

                var groupMember2 = new GroupMember
                {
                    GroupId = group.Id,
                    UserId = user2.Id,
                    IsAdmin = false
                };

                context.GroupMembers.Add(groupMember1);
                context.GroupMembers.Add(groupMember2);

                // Tạo mối quan hệ bạn bè
                var friendship = new Friendship
                {
                    UserId = user1.Id,
                    FriendId = user2.Id
                };

                if (!context.Friendships.Any(f => f.UserId == user1.Id && f.FriendId == user2.Id))
                    context.Friendships.Add(friendship);

                context.SaveChanges();
            }
        }
    }
}
