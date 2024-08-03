using ChatAppServer.WebAPI.Models;
using Microsoft.EntityFrameworkCore;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Chat> Chats { get; set; }
    public DbSet<Friendship> Friendships { get; set; }
    public DbSet<FriendRequest> FriendRequests { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.LogTo(Console.WriteLine, new[] { DbLoggerCategory.Database.Command.Name }, Microsoft.Extensions.Logging.LogLevel.Information);
        base.OnConfiguring(optionsBuilder);
    }

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
        });

        // Configure FriendRequest entity
        modelBuilder.Entity<FriendRequest>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Status)
                .IsRequired()
                .HasMaxLength(20);
        });

        // Configure Friendship entity
        Friendship.Configure(modelBuilder);
    }
}
