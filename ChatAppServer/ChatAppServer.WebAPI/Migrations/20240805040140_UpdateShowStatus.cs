using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChatAppServer.WebAPI.Migrations
{
    /// <inheritdoc />
    public partial class UpdateShowStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "ShowOnlineStatus",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ShowOnlineStatus",
                table: "Users");
        }
    }
}
