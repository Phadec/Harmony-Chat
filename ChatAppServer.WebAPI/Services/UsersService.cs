using ChatAppServer.WebAPI.Dtos;
using ChatAppServer.WebAPI.Models;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Net.Mail;
using System.Text;
using System.Text.RegularExpressions;

namespace ChatAppServer.WebAPI.Services
{
    public class UsersService : IUsersService
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<UsersService> _logger;
        private readonly IEmailService _emailService;

        public UsersService(ApplicationDbContext context, ILogger<UsersService> logger, IEmailService emailService)
        {
            _context = context;
            _logger = logger;
            _emailService = emailService;
        }

        public async Task<object> SearchUserByTagNameAsync(string tagName, Guid authenticatedUserId, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(tagName))
            {
                throw new ArgumentException("TagName is required");
            }

            _logger.LogInformation($"Searching for user with tagName: {tagName}");

            if (!tagName.StartsWith("@"))
            {
                tagName = "@" + tagName;
            }

            var authenticatedUser = await _context.Users
                .Where(u => u.Id == authenticatedUserId)
                .Select(u => u.TagName)
                .FirstOrDefaultAsync(cancellationToken);

            if (authenticatedUser != null && tagName.ToLower() == authenticatedUser.ToLower())
            {
                _logger.LogWarning($"User tried to search for themselves with tagName {tagName}");
                throw new KeyNotFoundException("User not found");
            }

            var user = await _context.Users
                .Where(u => u.TagName.ToLower() == tagName.ToLower())
                .Select(u => new
                {
                    u.Id,
                    u.Username,
                    u.FirstName,
                    u.LastName,
                    u.Email,
                    u.Avatar,
                    u.Status,
                    u.TagName
                })
                .FirstOrDefaultAsync(cancellationToken);

            if (user == null)
            {
                _logger.LogWarning($"User with tagName {tagName} not found");
                throw new KeyNotFoundException("User not found");
            }

            var isBlockedByUser = await _context.UserBlocks
                .AnyAsync(ub => ub.UserId == authenticatedUserId && ub.BlockedUserId == user.Id, cancellationToken);

            var isBlockedByTarget = await _context.UserBlocks
                .AnyAsync(ub => ub.UserId == user.Id && ub.BlockedUserId == authenticatedUserId, cancellationToken);

            if (isBlockedByUser || isBlockedByTarget)
            {
                _logger.LogWarning($"User with tagName {tagName} has blocked the authenticated user or vice versa");
                throw new KeyNotFoundException("User not found");
            }

            var friendRequestSent = await _context.FriendRequests
                .FirstOrDefaultAsync(fr => fr.SenderId == authenticatedUserId && fr.ReceiverId == user.Id && fr.Status == "Pending", cancellationToken);

            var friendRequestReceived = await _context.FriendRequests
                .FirstOrDefaultAsync(fr => fr.SenderId == user.Id && fr.ReceiverId == authenticatedUserId && fr.Status == "Pending", cancellationToken);

            return new
            {
                user.Id,
                user.Username,
                user.FirstName,
                user.LastName,
                user.Email,
                user.Avatar,
                user.Status,
                user.TagName,
                HasSentRequest = friendRequestSent != null,
                RequestId = friendRequestSent?.Id,
                HasReceivedRequest = friendRequestReceived != null,
                ReceivedRequestId = friendRequestReceived?.Id
            };
        }

        public async Task UpdateStatusAsync(Guid userId, string status, CancellationToken cancellationToken)
        {
            var validStatuses = new List<string> { "online", "offline" };
            if (string.IsNullOrWhiteSpace(status) || !validStatuses.Contains(status.ToLower()))
            {
                throw new ArgumentException("Invalid status. Status must be 'online' or 'offline'.");
            }

            var user = await _context.Users.FindAsync(new object[] { userId }, cancellationToken);
            if (user == null)
            {
                throw new KeyNotFoundException("User not found");
            }

            user.Status = status.ToLower();
            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation($"User {userId} status updated to {status}");
        }

        public async Task UpdateStatusVisibilityAsync(Guid userId, bool showOnlineStatus, CancellationToken cancellationToken)
        {
            var user = await _context.Users.FindAsync(new object[] { userId }, cancellationToken);
            if (user == null)
            {
                throw new KeyNotFoundException("User not found");
            }

            user.ShowOnlineStatus = showOnlineStatus;
            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation($"User {userId} show online status updated to {showOnlineStatus}");
        }

        public async Task<string> GetStatusAsync(Guid userId, CancellationToken cancellationToken)
        {
            var user = await _context.Users.FindAsync(new object[] { userId }, cancellationToken);
            if (user == null)
            {
                throw new KeyNotFoundException("User not found");
            }

            return user.Status;
        }

        public async Task<object> GetUserInfoAsync(Guid userId, CancellationToken cancellationToken)
        {
            var user = await _context.Users.FindAsync(new object[] { userId }, cancellationToken);
            if (user == null)
            {
                throw new KeyNotFoundException("User not found");
            }

            return new
            {
                user.Id,
                user.Username,
                user.FirstName,
                user.LastName,
                user.Birthday,
                user.Email,
                user.Avatar,
                user.Status,
                user.ShowOnlineStatus,
                user.TagName
            };
        }

        public async Task UpdateUserAsync(Guid userId, UpdateUserDto request, CancellationToken cancellationToken)
        {
            var user = await _context.Users.FindAsync(new object[] { userId }, cancellationToken);
            if (user == null)
            {
                throw new KeyNotFoundException("User not found");
            }

            bool emailChanged = false;

            if (!string.IsNullOrEmpty(request.FirstName))
            {
                var normalizedFirstName = NormalizeName(request.FirstName);
                if (!IsValidName(normalizedFirstName))
                {
                    throw new ArgumentException("Invalid FirstName format. Only letters and spaces are allowed.");
                }
                user.FirstName = normalizedFirstName;
            }

            if (!string.IsNullOrEmpty(request.LastName))
            {
                var normalizedLastName = NormalizeName(request.LastName);
                if (!IsValidName(normalizedLastName))
                {
                    throw new ArgumentException("Invalid LastName format. Only letters and spaces are allowed.");
                }
                user.LastName = normalizedLastName;
            }

            if (request.Birthday != null)
            {
                user.Birthday = request.Birthday.Value;
            }

            if (!string.IsNullOrEmpty(request.Email) && !request.Email.Equals(user.Email, StringComparison.OrdinalIgnoreCase))
            {
                if (!IsValidEmail(request.Email))
                {
                    throw new ArgumentException("Invalid email format.");
                }
                emailChanged = true;
                user.Email = request.Email;
            }

            if (request.AvatarFile != null)
            {
                if (request.AvatarFile.Length > 5 * 1024 * 1024)
                {
                    throw new ArgumentException("Avatar file size exceeds the limit of 5MB.");
                }

                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
                var fileExtension = Path.GetExtension(request.AvatarFile.FileName).ToLower();

                if (!allowedExtensions.Contains(fileExtension))
                {
                    throw new ArgumentException("Invalid file format. Only JPG and PNG are allowed.");
                }

                if (!string.IsNullOrEmpty(user.Avatar))
                {
                    var oldAvatarPath = Path.Combine("wwwroot", user.Avatar);
                    if (System.IO.File.Exists(oldAvatarPath))
                    {
                        System.IO.File.Delete(oldAvatarPath);
                    }
                }

                var (savedFileName, originalFileName) = FileService.FileSaveToServer(request.AvatarFile, "wwwroot/avatars/");
                user.Avatar = Path.Combine("avatars", savedFileName).Replace("\\", "/");
                user.OriginalAvatarFileName = originalFileName;
            }

            if (!string.IsNullOrEmpty(request.TagName) && !request.TagName.Equals(user.TagName, StringComparison.OrdinalIgnoreCase))
            {
                var normalizedTagName = NormalizeTagName(request.TagName);
                if (!IsValidTagName(normalizedTagName))
                {
                    throw new ArgumentException("Invalid TagName format. Only letters, numbers, and one '@' at the beginning are allowed.");
                }

                if (await _context.Users.AnyAsync(u => u.TagName == normalizedTagName, cancellationToken))
                {
                    throw new ArgumentException("TagName already exists. Please choose a different TagName.");
                }
                user.TagName = normalizedTagName;
            }

            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation($"User {userId} information updated");

            if (emailChanged)
            {
                await _emailService.SendEmailConfirmationAsync(user.Email, user.FirstName, user.LastName);
            }
        }

        private string NormalizeName(string name)
        {
            return Regex.Replace(name, @"\s+", " ").Trim();
        }

        private string NormalizeTagName(string tagName)
        {
            tagName = Regex.Replace(RemoveDiacritics(tagName), @"\s+", "").ToLower();

            if (!tagName.StartsWith("@"))
            {
                tagName = "@" + tagName;
            }

            return tagName;
        }

        private bool IsValidName(string name)
        {
            var regex = new Regex(@"^[\p{L}\s]+$", RegexOptions.Compiled);
            return regex.IsMatch(name);
        }

        private bool IsValidTagName(string tagName)
        {
            var regex = new Regex(@"^@[a-zA-Z0-9]+$", RegexOptions.Compiled);
            return regex.IsMatch(tagName);
        }

        private string RemoveDiacritics(string text)
        {
            string normalizedString = text.Normalize(NormalizationForm.FormD);
            StringBuilder stringBuilder = new StringBuilder();

            foreach (char c in normalizedString)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                {
                    stringBuilder.Append(c);
                }
            }

            return stringBuilder.ToString().Normalize(NormalizationForm.FormC);
        }

        private bool IsValidEmail(string email)
        {
            try
            {
                var addr = new MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }
    }
}
