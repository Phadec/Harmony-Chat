using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChatAppServer.WebAPI.Migrations
{
    public partial class AddRoleIntoUser : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Thêm cột Role vào bảng Users
            migrationBuilder.AddColumn<string>(
                name: "Role",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Xóa cột Role khỏi bảng Users nếu rollback migration
            migrationBuilder.DropColumn(
                name: "Role",
                table: "Users");
        }
    }
}
