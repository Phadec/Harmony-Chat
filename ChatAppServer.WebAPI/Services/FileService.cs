namespace ChatAppServer.WebAPI.Services
{
    public static class FileService
    {
        public static (string SavedFileName, string OriginalFileName) FileSaveToServer(IFormFile file, string directoryPath)
        {
            if (file == null || file.Length == 0)
            {
                return (null, null);
            }

            string savedFileName = Guid.NewGuid() + Path.GetExtension(file.FileName);
            string filePath = Path.Combine(directoryPath, savedFileName);

            if (!Directory.Exists(directoryPath))
            {
                Directory.CreateDirectory(directoryPath);
            }

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                file.CopyTo(stream);
            }

            return (savedFileName, file.FileName);
        }
    }
}
