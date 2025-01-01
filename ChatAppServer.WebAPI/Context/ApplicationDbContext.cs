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
        public DbSet<MessageReadStatus> MessageReadStatuses { get; set; }
        public DbSet<UserDeletedMessage> UserDeletedMessages { get; set; }
        public DbSet<Reaction> Reactions { get; set; }
        public DbSet<NewReactionStatus> NewReactionStatuses { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);


            // Configure User entity
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Id)
               .HasColumnType("char(36)"); // Sử dụng char(36) cho GUID

                entity.Property(e => e.FirstName).IsRequired().HasMaxLength(50);
                entity.Property(e => e.LastName).IsRequired().HasMaxLength(50);
                entity.Property(e => e.IsEmailConfirmed).HasDefaultValue(false);  // Set default value
                entity.Property(e => e.IsLocked).HasDefaultValue(false); // Set default value for IsLocked

                entity.HasIndex(e => e.TagName).IsUnique();

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
                entity.Property(e => e.Id)
                 .HasColumnType("char(36)"); // Sử dụng char(36) cho GUID
                entity.Property(e => e.Name)
                                .IsRequired()
                                .HasColumnType("varchar(255)"); // Thay nvarchar(max) bằng varchar(255)

                // Set default value for ChatTheme to "default"
                entity.Property(e => e.ChatTheme)
                    .IsRequired()
                    .HasDefaultValue("default");

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

                entity.Property(e => e.Id)
                      .HasColumnType("char(36)"); // Sử dụng char(36) cho GUID

                entity.HasKey(e => e.Id);
                entity.Property(e => e.IsAdmin).HasDefaultValue(false);
            });

            modelBuilder.Entity<Chat>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Message)
                    .IsRequired(false);  // Cho phép null nếu tin nhắn chỉ có đính kèm

                entity.Property(e => e.IsDeleted)
                    .HasDefaultValue(false);

                entity.Property(e => e.IsPinned)
                    .HasDefaultValue(false); // Đặt giá trị mặc định là chưa ghim

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

                entity.HasOne(e => e.RepliedToMessage)
                    .WithMany()
                    .HasForeignKey(e => e.RepliedToMessageId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.ToUserId)
                    .HasFilter(null)
                    .HasDatabaseName("IX_Chat_ToUserId");

                entity.HasIndex(e => e.GroupId)
                    .HasFilter(null)
                    .HasDatabaseName("IX_Chat_GroupId");

                entity.HasIndex(e => e.RepliedToMessageId)
                    .HasFilter(null)
                    .HasDatabaseName("IX_Chat_RepliedToMessageId");
            });
            modelBuilder.Entity<MessageReadStatus>(entity =>
                {
                    entity.HasKey(e => e.Id);

                    entity.HasOne(e => e.Chat)
                        .WithMany()
                        .HasForeignKey(e => e.MessageId)
                        .OnDelete(DeleteBehavior.Cascade);

                    entity.HasOne(e => e.User)
                        .WithMany()
                        .HasForeignKey(e => e.UserId)
                        .OnDelete(DeleteBehavior.Cascade);

                    entity.Property(e => e.IsRead)
                        .IsRequired()
                        .HasDefaultValue(false);

                    entity.Property(e => e.ReadAt)
                        .IsRequired(false);
                });

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
                    .HasDefaultValue(string.Empty);

                // Configure default value for ChatTheme
                entity.Property(e => e.ChatTheme)
                    .IsRequired()
                    .HasDefaultValue("default");
            });

            modelBuilder.Entity<Reaction>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.Property(e => e.Id)
                   .HasColumnType("char(36)"); // Sử dụng char(36) cho GUID

                entity.HasOne(r => r.Chat)
                    .WithMany(c => c.Reactions)
                    .HasForeignKey(r => r.ChatId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(r => r.User)
                    .WithMany(u => u.Reactions)
                    .HasForeignKey(r => r.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.Property(r => r.ReactionType).IsRequired();

                // Thêm ràng buộc duy nhất cho ChatId và UserId
                entity.HasIndex(r => new { r.ChatId, r.UserId })
                    .IsUnique(); // Đảm bảo mỗi người chỉ có 1 reaction cho mỗi tin nhắn
            });

            // Configure PendingUser entity
            modelBuilder.Entity<PendingUser>(entity =>
                {
                    entity.HasKey(e => e.Id);
                    entity.Property(e => e.TokenExpiration).IsRequired();
                });
            modelBuilder.Entity<UserDeletedMessage>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new
                {
                    e.UserId,
                    e.MessageId
                }).IsUnique();
                entity.Property(e => e.DeletedAt).IsRequired();
            });
            modelBuilder.Entity<NewReactionStatus>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasOne(e => e.Chat)
                    .WithMany()
                    .HasForeignKey(e => e.ChatId)
                    .OnDelete(DeleteBehavior.Cascade); // Đảm bảo phản ứng được xóa khi Chat bị xóa

                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade); // Đảm bảo phản ứng được xóa khi User bị xóa

                entity.Property(e => e.CreatedAt)
                    .IsRequired(); // Đảm bảo thời gian tạo phản ứng mới luôn có giá trị
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
    }
}