using ChatAppServer.WebAPI.Dtos;
using ChatAppServer.WebAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChatAppServer.WebAPI.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public sealed class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;
        private readonly ILogger<AdminController> _logger;

        public AdminController(IAdminService adminService, ILogger<AdminController> logger)
        {
            _adminService = adminService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetUsers(CancellationToken cancellationToken)
        {
            try
            {
                var users = await _adminService.GetUsersAsync(cancellationToken);
                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while fetching users.");
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpPost]
        public async Task<IActionResult> UpdateUserRole([FromForm] UpdateRoleDto request, CancellationToken cancellationToken)
        {
            try
            {
                await _adminService.UpdateUserRoleAsync(request, cancellationToken);
                return Ok(new { Message = "User role updated successfully" });
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex.Message);
                return NotFound(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex.Message);
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while updating user role.");
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpPost]
        public async Task<IActionResult> LockUser([FromForm] Guid userId, CancellationToken cancellationToken)
        {
            try
            {
                await _adminService.LockUserAsync(userId, cancellationToken);
                return Ok(new { Message = "User has been locked successfully." });
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex.Message);
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while locking user.");
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpPost]
        public async Task<IActionResult> UnlockUser([FromForm] Guid userId, CancellationToken cancellationToken)
        {
            try
            {
                await _adminService.UnlockUserAsync(userId, cancellationToken);
                return Ok(new { Message = "User has been unlocked successfully." });
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogWarning(ex.Message);
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while unlocking user.");
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetFriendRequests(CancellationToken cancellationToken)
        {
            try
            {
                var friendRequests = await _adminService.GetFriendRequestsAsync(cancellationToken);
                return Ok(friendRequests);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while fetching friend requests.");
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetAllChats(CancellationToken cancellationToken)
        {
            try
            {
                var chats = await _adminService.GetAllChatsAsync(cancellationToken);
                return Ok(chats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while fetching chats.");
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetGroups(CancellationToken cancellationToken)
        {
            try
            {
                var groups = await _adminService.GetGroupsAsync(cancellationToken);
                return Ok(groups);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while fetching groups.");
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetUserBlocks(CancellationToken cancellationToken)
        {
            try
            {
                var userBlocks = await _adminService.GetUserBlocksAsync(cancellationToken);
                return Ok(userBlocks);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while fetching user blocks.");
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetPendingUsers(CancellationToken cancellationToken)
        {
            try
            {
                var pendingUsers = await _adminService.GetPendingUsersAsync(cancellationToken);
                return Ok(pendingUsers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while fetching pending users.");
                return StatusCode(500, "An error occurred while processing your request.");
            }
        }
    }
}
