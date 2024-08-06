using ChatAppServer.WebAPI.Dtos;
using ChatAppServer.WebAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChatAppServer.WebAPI.Controllers
{
    [Route("api/[controller]/[action]")]
    [ApiController]
    [Authorize(Roles = "Admin")] // Chỉ cho phép admin truy cập các phương thức trong controller này
    public sealed class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AdminController> _logger;

        public AdminController(ApplicationDbContext context, ILogger<AdminController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpPost]
        public async Task<IActionResult> UpdateUserRole([FromForm] UpdateRoleDto request, CancellationToken cancellationToken)
        {
            var user = await _context.Users.FindAsync(request.UserId);
            if (user == null)
            {
                return NotFound(new { Message = "User not found" });
            }

            if (string.IsNullOrWhiteSpace(request.NewRole))
            {
                return BadRequest(new { Message = "New role is required" });
            }

            user.Role = request.NewRole;
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation($"User {user.Username} role updated to {request.NewRole}");

            return Ok(new { Message = "User role updated successfully" });
        }
    }
}
