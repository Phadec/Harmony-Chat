using ChatAppServer.WebAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChatAppServer.WebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UsersController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchUserByUsername(string username, CancellationToken cancellationToken)
        {
            var user = await _context.Users
                .Where(u => u.Username.ToLower() == username.ToLower())
                .Select(u => new
                {
                    u.Id,
                    u.Username,
                    u.FullName,
                    u.Email,
                    u.Avatar,
                    u.Status
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            return Ok(user);
        }
    }
}
