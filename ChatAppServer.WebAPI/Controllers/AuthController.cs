using ChatAppServer.WebAPI.Dtos;
using ChatAppServer.WebAPI.Models;
using ChatAppServer.WebAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory.Database;

namespace ChatAppServer.WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ILogger<AuthController> _logger;
        private readonly IHubContext<AuthHub> _hubContext;

        public AuthController(IAuthService authService, ILogger<AuthController> logger, IHubContext<AuthHub> hubContext)
        {
            _authService = authService;
            _logger = logger;
            _hubContext = hubContext;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromForm] LoginDto request, CancellationToken cancellationToken)
        {
            var result = await _authService.LoginAsync(request, cancellationToken);
            if (!result.Success)
            {
                return BadRequest(new { Message = result.Message });
            }

            return Ok(new
            {
                result.User.Id,
                result.User.Username,
                result.User.FirstName,
                result.User.LastName,
                result.User.Birthday,
                result.User.Email,
                result.User.Avatar,
                result.User.Status,
                result.User.TagName,
                result.User.Role,
                Token = result.Token
            });
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromForm] RegisterDto request, CancellationToken cancellationToken)
        {
            var result = await _authService.RegisterAsync(request, cancellationToken);
            if (!result.Success)
            {
                return BadRequest(new { Message = result.Message });
            }

            return Ok(new { Message = result.Message });
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout([FromForm] Guid userId, CancellationToken cancellationToken)
        {
            var result = await _authService.LogoutAsync(userId, User, cancellationToken);
            if (!result.Success)
            {
                return BadRequest(new { Message = result.Message });
            }

            return Ok(new { Message = result.Message });
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto request, CancellationToken cancellationToken)
        {
            var result = await _authService.ForgotPasswordAsync(request, cancellationToken);
            if (!result.Success)
            {
                return BadRequest(new { Message = result.Message });
            }

            return Ok(new { Message = result.Message });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromForm] ResetPasswordDto request, CancellationToken cancellationToken)
        {
            var result = await _authService.ResetPasswordAsync(request, cancellationToken);
            if (!result.Success)
            {
                return BadRequest(new { Message = result.Message });
            }

            return Ok(new { Message = result.Message });
        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto request, CancellationToken cancellationToken)
        {
            var result = await _authService.ChangePasswordAsync(request, User, cancellationToken);
            if (!result.Success)
            {
                return BadRequest(new { Message = result.Message });
            }

            return Ok(new { Message = result.Message });
        }

        [HttpGet("confirm-email")]
        public async Task<IActionResult> ConfirmEmail(Guid userId, string token, CancellationToken cancellationToken)
        {
            var result = await _authService.ConfirmEmailAsync(token, cancellationToken);
            if (!result.Success)
            {
                return BadRequest(new { Message = result.Message });
            }

            // Gửi thông báo cho tất cả client qua SignalR
            _logger.LogInformation($"Sending ReceiveEmailConfirmation event for user {userId.ToString()}");
            await _hubContext.Clients.All.SendAsync("ReceiveEmailConfirmation", userId.ToString());

            return Ok(new { Message = result.Message });
        }
    }
}
