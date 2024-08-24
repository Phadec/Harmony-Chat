# ProjectDotNet

**ProjectDotNet - Ứng Dụng Chat Thời Gian Thực**

## Mô Tả Dự Án

**ProjectDotNet - ChatRealtime** là một ứng dụng chat thời gian thực được xây dựng trên nền tảng ASP.NET Core. Ứng dụng cho phép người dùng gửi và nhận tin nhắn trong thời gian thực, tạo ra trải nghiệm chat trực quan và mượt mà. Ứng dụng này cũng tích hợp các hàng đợi nền (background queue) để xử lý các tác vụ quan trọng, nhằm cải thiện hiệu suất và khả năng mở rộng.

## Công Nghệ Sử Dụng

- **ASP.NET Core**: 
   - ASP.NET Core là một framework phát triển web mã nguồn mở và đa nền tảng của Microsoft, được sử dụng để xây dựng và chạy các ứng dụng web hiện đại với khả năng mở rộng cao.

- **Entity Framework Core**:
   - Entity Framework Core (EF Core) là một Object-Relational Mapper (ORM) cho .NET, cho phép các nhà phát triển làm việc với cơ sở dữ liệu bằng cách sử dụng các đối tượng .NET. Nó hỗ trợ truy vấn LINQ, theo dõi thay đổi, cập nhật, và di chuyển dữ liệu.

- **SignalR**:
   - SignalR là một thư viện dành cho ASP.NET giúp việc thêm chức năng thời gian thực vào các ứng dụng dễ dàng hơn. SignalR hỗ trợ các chức năng như cập nhật nội dung thời gian thực, thông báo, và các tính năng chat.

- **SQL Server**:
   - SQL Server là hệ quản trị cơ sở dữ liệu quan hệ của Microsoft, được sử dụng để lưu trữ và quản lý dữ liệu của ứng dụng.

- **JWT (JSON Web Tokens)**:
   - JWT là một tiêu chuẩn mở (RFC 7519) định dạng token JSON sử dụng để truyền thông tin giữa các bên một cách an toàn dưới dạng đối tượng JSON. Trong ứng dụng này, JWT được sử dụng để quản lý xác thực và phân quyền người dùng.

- **Bootstrap**:
   - Bootstrap là một framework front-end mã nguồn mở để phát triển giao diện web nhanh chóng và hiệu quả. Nó cung cấp các mẫu thiết kế sẵn, các thành phần giao diện, và các plugin JavaScript.

- **Swagger UI**:
   - Swagger UI là một công cụ mã nguồn mở để xây dựng tài liệu API và UI tương tác. Nó cho phép các nhà phát triển và người dùng thử nghiệm các API một cách dễ dàng.

- **Angular**:
   - Angular là một framework phát triển ứng dụng web front-end mạnh mẽ, được sử dụng để xây dựng giao diện người dùng (UI) hiện đại và phản ứng nhanh. Trong dự án này, Angular được sử dụng để xây dựng các thành phần giao diện người dùng động, cải thiện trải nghiệm người dùng.

- **Background Queue**:
   - Background Queue là một mô hình xử lý tác vụ không đồng bộ, giúp giảm tải cho máy chủ bằng cách xử lý các tác vụ phức tạp hoặc không yêu cầu phản hồi ngay lập tức ở nền. Điều này giúp cải thiện hiệu suất và khả năng mở rộng của ứng dụng.
