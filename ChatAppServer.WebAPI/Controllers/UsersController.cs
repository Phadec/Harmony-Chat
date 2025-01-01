using ChatAppServer.WebAPI.Dtos;
using ChatAppServer.WebAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ChatAppServer.WebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly IUsersService _usersService;
        private readonly ILogger<UsersController> _logger;

        public UsersController(IUsersService usersService, ILogger<UsersController> logger)
        {
            _usersService = usersService;
            _logger = logger;
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchUserByTagName(string tagName, CancellationToken cancellationToken)
        {
            try
            {
                var authenticatedUserId = GetAuthenticatedUserId();
                if (authenticatedUserId == Guid.Empty)
                    return Forbid("You are not authorized to search users.");

                var result = await _usersService.SearchUserByTagNameAsync(tagName, authenticatedUserId, cancellationToken);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex.Message);
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex.Message);
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while searching for user with tagName {TagName}", tagName);
                return StatusCode(500, new { message = "An error occurred while processing your request." });
            }
        }


        [HttpPost("{userId}/update-status")]
        public async Task<IActionResult> UpdateStatus(Guid userId, [FromForm] string status, CancellationToken cancellationToken)
        {
            try
            {
                if (!IsUserAuthorized(userId))
                    return Forbid("You are not authorized to update this user's status.");

                await _usersService.UpdateStatusAsync(userId, status, cancellationToken);
                return Ok(new { Message = "Status updated successfully" });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex.Message);
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex.Message);
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"An error occurred while updating status for user {userId}");
                return StatusCode(500, new { message = "An error occurred while updating the status. Please try again later." });
            }
        }

        [HttpPost("{userId}/update-status-visibility")]
        public async Task<IActionResult> UpdateStatusVisibility(Guid userId, [FromForm] bool showOnlineStatus, CancellationToken cancellationToken)
        {
            try
            {
                if (!IsUserAuthorized(userId))
                    return Forbid("You are not authorized to update this user's status visibility.");

                await _usersService.UpdateStatusVisibilityAsync(userId, showOnlineStatus, cancellationToken);
                return Ok(new { Message = "Status visibility updated successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex.Message);
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"An error occurred while updating status visibility for user {userId}");
                return StatusCode(500, new { message = "An error occurred while updating the status visibility. Please try again later." });
            }
        }

        [HttpGet("{userId}/status")]
        public async Task<IActionResult> GetStatus(Guid userId, CancellationToken cancellationToken)
        {
            try
            {
                if (!IsUserAuthorized(userId))
                    return Forbid("You are not authorized to view this user's status.");

                var status = await _usersService.GetStatusAsync(userId, cancellationToken);
                return Ok(new { status });
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex.Message);
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"An error occurred while retrieving the status for user {userId}");
                return StatusCode(500, new { message = "An error occurred while retrieving the user status. Please try again later." });
            }
        }

        [HttpPut("{userId}/update-user")]
        public async Task<IActionResult> UpdateUser(Guid userId, [FromForm] UpdateUserDto request, CancellationToken cancellationToken)
        {
            try
            {
                if (!IsUserAuthorized(userId))
                    return Forbid("You are not authorized to update this user.");

                await _usersService.UpdateUserAsync(userId, request, cancellationToken);
                return Ok(new { Message = "User information updated successfully" });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex.Message);
                return BadRequest(new { message = ex.Message });
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex.Message);
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"An error occurred while updating user {userId}");
                return StatusCode(500, new { message = "An error occurred while updating the user. Please try again later." });
            }
        }

        [HttpGet("{userId}/get-user-info")]
        public async Task<IActionResult> GetUserInfo(Guid userId, CancellationToken cancellationToken)
        {
            try
            {
                if (!IsUserAuthorized(userId))
                    return Forbid("You are not authorized to view this user's info.");

                var userInfo = await _usersService.GetUserInfoAsync(userId, cancellationToken);
                return Ok(userInfo);
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex.Message);
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"An error occurred while retrieving the info for user {userId}");
                return StatusCode(500, new { message = "An error occurred while retrieving the user info. Please try again later." });
            }
        }

        private Guid GetAuthenticatedUserId()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return Guid.TryParse(userIdString, out var userId) ? userId : Guid.Empty;
        }

        private bool IsUserAuthorized(Guid userId)
        {
            return GetAuthenticatedUserId() == userId;
        }
    }
}
