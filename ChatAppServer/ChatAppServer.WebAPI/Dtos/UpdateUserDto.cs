namespace ChatAppServer.WebAPI.Dtos
{
    public class UpdateUserDto
    {
        public string FullName { get; set; }
        public DateTime Birthday { get; set; }
        public string Email { get; set; }
        public IFormFile AvatarFile { get; set; } // Đảm bảo bạn sử dụng IFormFile để nhận tệp tải lên
    }

}
