using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChatAppServer.WebAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueTagName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add the TagName column if it does not exist
            migrationBuilder.AddColumn<string>(
                name: "TagName",
                table: "Users",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "");

            // Create a unique index on the TagName column
            migrationBuilder.CreateIndex(
                name: "IX_Users_TagName",
                table: "Users",
                column: "TagName",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop the unique index on the TagName column
            migrationBuilder.DropIndex(
                name: "IX_Users_TagName",
                table: "Users");

            // Remove the TagName column
            migrationBuilder.DropColumn(
                name: "TagName",
                table: "Users");
        }
    }
}
