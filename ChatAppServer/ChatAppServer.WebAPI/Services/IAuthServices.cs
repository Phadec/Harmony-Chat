using ChatAppServer.WebAPI.Dtos;
using ChatAppServer.WebAPI.Models;
using System.Security.Claims;

namespace ChatAppServer.WebAPI.Services
{
    public interface IAuthService
    {
        Task<(bool Success, string Message, string? Token, User? User)> LoginAsync(LoginDto request, CancellationToken cancellationToken);
        Task<(bool Success, string Message)> RegisterAsync(RegisterDto request, CancellationToken cancellationToken);
        Task<(bool Success, string Message)> ConfirmEmailAsync(string token, CancellationToken cancellationToken);
        Task<(bool Success, string Message)> LogoutAsync(Guid userId, ClaimsPrincipal currentUser, CancellationToken cancellationToken);
        Task<(bool Success, string Message)> ForgotPasswordAsync(ForgotPasswordDto request, CancellationToken cancellationToken);
        Task<(bool Success, string Message)> ResetPasswordAsync(ResetPasswordDto request, CancellationToken cancellationToken);
        Task<(bool Success, string Message)> ChangePasswordAsync(ChangePasswordDto request, ClaimsPrincipal currentUser, CancellationToken cancellationToken);
    }
}
