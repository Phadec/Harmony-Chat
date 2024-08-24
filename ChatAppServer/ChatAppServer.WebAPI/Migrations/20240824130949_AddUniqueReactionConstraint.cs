using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChatAppServer.WebAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueReactionConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Reactions_ChatId",
                table: "Reactions");

            migrationBuilder.CreateIndex(
                name: "IX_Reactions_ChatId_UserId",
                table: "Reactions",
                columns: new[] { "ChatId", "UserId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Reactions_ChatId_UserId",
                table: "Reactions");

            migrationBuilder.CreateIndex(
                name: "IX_Reactions_ChatId",
                table: "Reactions",
                column: "ChatId");
        }
    }
}
