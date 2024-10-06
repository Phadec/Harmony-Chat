using ChatAppServer.WebAPI.Models;

public class ExpiredPendingUserCleanupService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ExpiredPendingUserCleanupService> _logger;
    private readonly TimeSpan _cleanupInterval = TimeSpan.FromHours(1);

    public ExpiredPendingUserCleanupService(IServiceProvider serviceProvider, ILogger<ExpiredPendingUserCleanupService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CleanupExpiredPendingUsersAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while cleaning up expired pending users.");
            }

            await Task.Delay(_cleanupInterval, stoppingToken);
        }
    }

    private async Task CleanupExpiredPendingUsersAsync()
    {
        using (var scope = _serviceProvider.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

            var expiredUsers = context.PendingUsers.Where(u => u.TokenExpiration < DateTime.UtcNow).ToList();
            if (expiredUsers.Any())
            {
                context.PendingUsers.RemoveRange(expiredUsers);
                await context.SaveChangesAsync();

                _logger.LogInformation("Removed {Count} expired pending users.", expiredUsers.Count);
            }
        }
    }
}
