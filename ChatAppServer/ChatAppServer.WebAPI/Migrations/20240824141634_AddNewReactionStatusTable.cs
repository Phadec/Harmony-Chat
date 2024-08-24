using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChatAppServer.WebAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddNewReactionStatusTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "NewReactionStatuses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ChatId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NewReactionStatuses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_NewReactionStatuses_Chats_ChatId",
                        column: x => x.ChatId,
                        principalTable: "Chats",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_NewReactionStatuses_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_NewReactionStatuses_ChatId",
                table: "NewReactionStatuses",
                column: "ChatId");

            migrationBuilder.CreateIndex(
                name: "IX_NewReactionStatuses_UserId",
                table: "NewReactionStatuses",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NewReactionStatuses");
        }
    }
}
