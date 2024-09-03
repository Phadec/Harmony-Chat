using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChatAppServer.WebAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddReplyMessage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameIndex(
                name: "IX_Chats_ToUserId",
                table: "Chats",
                newName: "IX_Chat_ToUserId");

            migrationBuilder.RenameIndex(
                name: "IX_Chats_GroupId",
                table: "Chats",
                newName: "IX_Chat_GroupId");

            migrationBuilder.AlterColumn<string>(
                name: "Message",
                table: "Chats",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<Guid>(
                name: "RepliedToMessageId",
                table: "Chats",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Chat_RepliedToMessageId",
                table: "Chats",
                column: "RepliedToMessageId");

            migrationBuilder.AddForeignKey(
                name: "FK_Chats_Chats_RepliedToMessageId",
                table: "Chats",
                column: "RepliedToMessageId",
                principalTable: "Chats",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Chats_Chats_RepliedToMessageId",
                table: "Chats");

            migrationBuilder.DropIndex(
                name: "IX_Chat_RepliedToMessageId",
                table: "Chats");

            migrationBuilder.DropColumn(
                name: "RepliedToMessageId",
                table: "Chats");

            migrationBuilder.RenameIndex(
                name: "IX_Chat_ToUserId",
                table: "Chats",
                newName: "IX_Chats_ToUserId");

            migrationBuilder.RenameIndex(
                name: "IX_Chat_GroupId",
                table: "Chats",
                newName: "IX_Chats_GroupId");

            migrationBuilder.AlterColumn<string>(
                name: "Message",
                table: "Chats",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);
        }
    }
}
