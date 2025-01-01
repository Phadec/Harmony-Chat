using ChatAppServer.WebAPI.Dtos;
using ChatAppServer.WebAPI.Models;
using FuzzySharp;
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

        public async Task<IEnumerable<UserSearchResult>> SearchUserByTagNameAsync(string tagName, Guid authenticatedUserId, CancellationToken cancellationToken)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(tagName))
                {
                    throw new ArgumentException("TagName is required");
                }

                _logger.LogInformation($"Searching for users with tagName: {tagName}");

                // Remove @ handling since we're searching multiple fields
                var searchTerm = tagName.ToLower().Trim();

                // Lấy danh sách ID của bạn bè
                var friendIds = await _context.Friendships
                    .Where(f => f.UserId == authenticatedUserId || f.FriendId == authenticatedUserId)
                    .Select(f => f.UserId == authenticatedUserId ? f.FriendId : f.UserId)
                    .ToListAsync(cancellationToken);
                _logger.LogInformation($"Found {friendIds.ToArray().ToString} friends for user {authenticatedUserId}");

                // Lấy tất cả users tiềm năng (trừ bản thân và bạn bè)
                var potentialUsers = await _context.Users
                    .Where(u => u.Id != authenticatedUserId && !friendIds.Contains(u.Id))
                    .Select(u => new User
                    {
                        Id = u.Id,
                        Username = u.Username,
                        FirstName = u.FirstName,
                        LastName = u.LastName,
                        Email = u.Email,
                        Avatar = u.Avatar,
                        Status = u.Status,
                        TagName = u.TagName
                    })
                    .ToListAsync(cancellationToken);

                // Áp dụng Fuzzy Search với các trường cần tìm kiếm
                var fuzzyResults = potentialUsers
                    .Select(user => new 
                    {
                        User = user,
                        // Tính điểm cho từng trường
                        TagNameScore = Fuzz.PartialRatio(searchTerm, user.TagName?.ToLower() ?? string.Empty),
                        FirstNameScore = Fuzz.PartialRatio(searchTerm, user.FirstName?.ToLower() ?? string.Empty),
                        LastNameScore = Fuzz.PartialRatio(searchTerm, user.LastName?.ToLower() ?? string.Empty),
                        FullName1Score = Fuzz.PartialRatio(searchTerm, $"{user.FirstName} {user.LastName}".ToLower()),
                        FullName2Score = Fuzz.PartialRatio(searchTerm, $"{user.LastName} {user.FirstName}".ToLower())
                    })
                    .Select(result => new
                    {
                        result.User,
                        // Lấy điểm cao nhất từ các trường
                        MaxScore = Math.Max(
                            Math.Max(
                                Math.Max(result.TagNameScore, result.FirstNameScore),
                                Math.Max(result.LastNameScore, result.FullName1Score)
                            ),
                            result.FullName2Score
                        )
                    })
                    .Where(result => result.MaxScore >= 80) // Ngưỡng điểm tối thiểu
                    .OrderByDescending(result => result.MaxScore)
                    .Select(result => result.User)
                    .ToList();

                if (!fuzzyResults.Any())
                {
                    _logger.LogWarning($"No users found with search term: {searchTerm}");
                    return Enumerable.Empty<UserSearchResult>();
                }

                var userIds = fuzzyResults.Select(u => u.Id).ToList();

                // Get all blocks in one query
                var blocks = await _context.UserBlocks
                    .Where(ub =>
                        (ub.UserId == authenticatedUserId && userIds.Contains(ub.BlockedUserId)) ||
                        (ub.BlockedUserId == authenticatedUserId && userIds.Contains(ub.UserId)))
                    .ToListAsync(cancellationToken);

                // Get all friend requests in one query
                var friendRequests = await _context.FriendRequests
                    .Where(fr =>
                        ((fr.SenderId == authenticatedUserId && userIds.Contains(fr.ReceiverId)) ||
                         (fr.ReceiverId == authenticatedUserId && userIds.Contains(fr.SenderId))) &&
                        fr.Status == "Pending")
                    .ToListAsync(cancellationToken);

                var results = fuzzyResults
                    .Where(user => !blocks.Any(b =>
                        (b.UserId == authenticatedUserId && b.BlockedUserId == user.Id) ||
                        (b.UserId == user.Id && b.BlockedUserId == authenticatedUserId)))
                    .Select(user => new UserSearchResult
                    {
                        Id = user.Id,
                        Username = user.Username,
                        FirstName = user.FirstName,
                        LastName = user.LastName,
                        Email = user.Email,
                        Avatar = user.Avatar,
                        Status = user.Status,
                        TagName = user.TagName,
                        HasSentRequest = friendRequests.Any(fr =>
                            fr.SenderId == authenticatedUserId && fr.ReceiverId == user.Id),
                        RequestId = friendRequests
                            .FirstOrDefault(fr => fr.SenderId == authenticatedUserId && fr.ReceiverId == user.Id)?.Id,
                        HasReceivedRequest = friendRequests.Any(fr =>
                            fr.SenderId == user.Id && fr.ReceiverId == authenticatedUserId),
                        ReceivedRequestId = friendRequests
                            .FirstOrDefault(fr => fr.SenderId == user.Id && fr.ReceiverId == authenticatedUserId)?.Id
                    })
                    .OrderBy(u => u.LastName)
                    .ThenBy(u => u.FirstName)
                    .ToList();

                return results;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while searching users with tagName: {TagName}", tagName);
                throw;
            }
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
