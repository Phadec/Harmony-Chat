using ChatAppServer.WebAPI.Models;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

public sealed class AuthHub : Hub
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ChatHub> _logger;
    private readonly IServiceProvider _serviceProvider; // Inject IServiceProvider
    // Dictionary để quản lý các authentication token của user
    public static ConcurrentDictionary<Guid, List<string>> connections = new();

    public AuthHub(ApplicationDbContext context, ILogger<ChatHub> logger, IServiceProvider serviceProvider)
    {
        _context = context;
        _logger = logger;
        _serviceProvider = serviceProvider;
    }



    // Khi người dùng kết nối
    public async Task Connect(Guid connectionID)
    {
        if (connectionID == Guid.Empty)
        {
            _logger.LogWarning("Invalid userId provided for connection.");
            throw new HubException("Invalid userId.");
        }

        // Add the connection to the UserConnections dictionary
        if (!connections.ContainsKey(connectionID))
        {
            connections[connectionID] = new List<string>();
        }
        connections[connectionID].Add(Context.ConnectionId);

        _logger.LogInformation($"Authentication {connectionID} connected with ConnectionId {Context.ConnectionId}.");

        // Notify the user that they have successfully connected
        await Clients.Client(Context.ConnectionId).SendAsync("AuthenticateConnected", new { Message = "You are connected." });
    }

    // Khi người dùng ngắt kết nối
    public async Task Disconnect(Exception exception)
    {
        foreach (var authenticationID in connections.Keys)
        {
            if (connections[authenticationID].Contains(Context.ConnectionId))
            {
                connections[authenticationID].Remove(Context.ConnectionId);
                _logger.LogInformation($"Connection {Context.ConnectionId} removed from Authentication {authenticationID}.");

                // Nếu user không còn kết nối nào, xóa khỏi dictionary
                if (connections[authenticationID].Count == 0)
                {
                    connections.TryRemove(authenticationID, out _);
                }
                break;
            }
        }

        await base.OnDisconnectedAsync(exception);
    }

    // Khi confirm email thành công
    public async Task ConfirmEmail(Guid authenticationID)
    {
        if (authenticationID == Guid.Empty)
        {
            _logger.LogWarning("Invalid userId provided for confirm email.");
            throw new HubException("Invalid userId.");
        }

        // Check if authenticationID exists in the dictionary
        if (!AuthHub.connections.ContainsKey(authenticationID))
        {
            _logger.LogWarning($"Authentication {authenticationID} does not exist.");
            throw new HubException("Authentication ID does not exist.");
        }

        // Lấy danh sách connectionId của user
        var connections = AuthHub.connections[authenticationID];
        if (connections == null || connections.Count == 0)
        {
            _logger.LogWarning($"No active connections for Authentication {authenticationID}.");
            return; // Không có kết nối nào đang hoạt động
        }

        // Notify only the connections for this authenticationID
        foreach (var connectionId in connections)
        {
            await Clients.Client(connectionId).SendAsync("AuthenticateConfirmEmail", new { Message = "Your email has been confirmed!" });
        }
    }
}