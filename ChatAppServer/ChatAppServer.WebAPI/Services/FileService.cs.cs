namespace ChatAppServer.WebAPI.Services
{
    public static class FileService
    {
        public static string FileSaveToServer(IFormFile file, string directoryPath)
        {
            if (file == null || file.Length == 0)
            {
                return null;
            }

            string filePath = Path.Combine(directoryPath, Guid.NewGuid() + Path.GetExtension(file.FileName));

            if (!Directory.Exists(directoryPath))
            {
                Directory.CreateDirectory(directoryPath);
            }

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                file.CopyTo(stream);
            }

            return filePath;
        }
    }
}
