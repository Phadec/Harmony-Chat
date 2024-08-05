using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChatAppServer.WebAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddNicknameToFriendship : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Nickname",
                table: "Friendships",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Nickname",
                table: "Friendships");
        }
    }
}
