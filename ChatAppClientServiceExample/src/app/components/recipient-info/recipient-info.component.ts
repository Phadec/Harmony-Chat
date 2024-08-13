import { Component, Input, OnInit, OnChanges, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import {FriendsService} from "../../services/friends.service";
import {ChatService} from "../../services/chat.service";
import {MatDialog} from "@angular/material/dialog";
import {ChangeNicknameDialogComponent} from "../change-nickname-dialog/change-nickname-dialog.component";
import {ConfirmDialogComponent} from "../confirm-dialog/confirm-dialog.component";
import {GroupService} from "../../services/group.service";
import {CreateGroupDialogComponent} from "../create-group-dialog/create-group-dialog.component";
import {RenameGroupDialogComponent} from "../rename-group-dialog/rename-group-dialog.component";
import {AddMemberDialogComponent} from "../add-member-dialog/add-member-dialog.component";

interface GroupMember {
  userId: string;
  fullName: string;
  avatar: string;
  tagName: string;
  status: string;
}

interface GroupInfo {
  $id: string;
  isGroup: true;
  isAdmin: boolean;
  id: string;
  name: string;
  avatar: string;
  members: { $id: string; $values: GroupMember[] };
}

interface IndividualInfo {
  $id: string;
  isGroup: false;
  id: string;
  name: string;
  nickname: string;
  avatar: string;
  tagName: string;
  status: string;
}

type RecipientInfo = GroupInfo | IndividualInfo;

@Component({
  selector: 'app-recipient-info',
  templateUrl: './recipient-info.component.html',
  styleUrls: ['./recipient-info.component.css']
})
export class RecipientInfoComponent implements OnInit, OnChanges {
  @Input() recipientId: string | null = null;
  @Output() updateSidebar = new EventEmitter<void>(); // EventEmitter để phát sự kiện

  recipientInfo: any;
  currentUser: any;

  constructor(
    private friendsService: FriendsService,
    private chatService: ChatService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private groupService: GroupService,
  ) {
    this.currentUser = { id: localStorage.getItem('userId') };
  }

  ngOnInit() {
    this.loadRecipientInfo();
  }

  ngOnChanges() {
    this.loadRecipientInfo();
  }

  loadRecipientInfo(): void {
    const userId = localStorage.getItem('userId');
    if (userId && this.recipientId) {
      this.friendsService.getFriendInfo(userId, this.recipientId).subscribe(
        (data) => {
          this.recipientInfo = data;
          this.cdr.detectChanges(); // Ensures the component updates
        },
        (error) => {
          console.error('Error fetching recipient information:', error);
        }
      );
    }
  }

  onChangeNickname(): void {
    const dialogRef = this.dialog.open(ChangeNicknameDialogComponent, {
      width: '300px',
      data: { currentNickname: this.recipientInfo.nickname }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined) {
        const userId = localStorage.getItem('userId')!;
        const friendId = this.recipientInfo.id;
        const nickname = result;

        this.friendsService.changeNickname(userId, friendId, nickname).subscribe(
          () => {
            console.log('Nickname changed successfully');
            this.updateSidebar.emit(); // Cập nhật giao diện sidebar
          },
          (error) => {
            console.error('Failed to change nickname', error);
          }
        );
      }
    });
  }

  onRemoveFriend(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '300px',
      data: {
        title: 'Xóa kết bạn',
        message: 'Bạn có chắc chắn muốn xóa bạn bè này không?'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.friendsService.removeFriend(localStorage.getItem('userId')!, this.recipientInfo.id).subscribe(
          () => {
            console.log('Friend removed successfully');
            this.updateSidebar.emit(); // Cập nhật giao diện sidebar
          },
          (error) => {
            console.error('Failed to remove friend', error);
          }
        );
      }
    });
  }

  onBlockUser(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '300px',
      data: {
        title: 'Chặn người dùng',
        message: 'Bạn có chắc chắn muốn chặn người dùng này không?'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.friendsService.blockUser(localStorage.getItem('userId')!, this.recipientInfo.id).subscribe(
          () => {
            console.log('User blocked successfully');
            this.updateSidebar.emit(); // Cập nhật giao diện sidebar
          },
          (error) => {
            console.error('Failed to block user', error);
          }
        );
      }
    });
  }

  onDeleteChat(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '300px',
      data: {
        title: 'Xóa đoạn chat',
        message: 'Bạn có chắc chắn muốn xóa đoạn chat này không?'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        const recipientId = this.recipientInfo?.id;
        const userId = localStorage.getItem('userId');

        if (!recipientId || !userId) {
          console.error('Recipient ID or User ID is missing.');
          return;
        }

        this.chatService.deleteChat(userId, recipientId).subscribe({
          next: () => {
            console.log('Chat deleted successfully');
            this.updateSidebar.emit(); // Cập nhật giao diện sidebar
          },
          error: (err) => {
            console.error('Failed to delete chat', err);
          }
        });
      }
    });
  }

  onAddMember(): void {
    const dialogRef = this.dialog.open(AddMemberDialogComponent, {
      width: '400px',
      data: { groupId: this.recipientId }
    });

    dialogRef.afterClosed().subscribe((selectedFriends: string[]) => {
      if (selectedFriends && selectedFriends.length > 0) {
        selectedFriends.forEach(friendId => {
          this.groupService.addGroupChatMember({ GroupId: this.recipientId!, UserId: friendId }).subscribe(
            () => {
              console.log('Member added successfully');
              this.updateSidebar.emit(); // Cập nhật giao diện sau khi thêm thành viên
              // Display success message
              alert('Thành viên đã được thêm vào nhóm thành công.');
            },
            error => {
              console.error('Failed to add member:', error);
              // Display error message
              alert('Không thể thêm thành viên vào nhóm. Vui lòng thử lại.');
            }
          );
        });
      }
    });
  }


  onRemoveGroupMember(memberId: string): void {
    if (this.recipientInfo && this.recipientInfo.isGroup) {  // Kiểm tra trực tiếp isGroup
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '300px',
        data: {
          title: 'Xác nhận xóa thành viên',
          message: 'Bạn có chắc chắn muốn xóa thành viên này khỏi nhóm không?'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.groupService.removeGroupMember({ GroupId: this.recipientInfo.id, UserId: memberId })
            .subscribe(response => {
              this.recipientInfo.members.$values = this.recipientInfo.members.$values.filter((m: GroupMember) => m.userId !== memberId);
              this.updateSidebar.emit(); // Cập nhật giao diện sau khi xóa thành viên
            }, error => {
              console.error('Failed to remove member:', error);
            });
        }
      });
    }
  }

  onPromoteToAdmin(memberId: string): void {
    if (this.recipientInfo && this.recipientInfo.isGroup) {  // Kiểm tra trực tiếp isGroup
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '300px',
        data: {
          title: 'Xác nhận thăng cấp',
          message: 'Bạn có chắc chắn muốn thăng cấp thành viên này lên admin không?'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.groupService.updateGroupAdmin({ GroupId: this.recipientInfo.id, UserId: memberId })
            .subscribe(response => {
              const member = this.recipientInfo.members.$values.find((m: GroupMember) => m.userId === memberId);
              if (member) {
                member.isAdmin = true; // Cập nhật trạng thái admin của thành viên
                this.updateSidebar.emit(); // Cập nhật giao diện sau khi thăng cấp
              }
            }, error => {
              console.error('Failed to promote member to admin:', error);
            });
        }
      });
    }
  }

  onDemoteFromAdmin(memberId: string): void {
    if (this.recipientInfo && this.recipientInfo.isGroup) {  // Kiểm tra trực tiếp isGroup
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '300px',
        data: {
          title: 'Xác nhận hạ cấp',
          message: 'Bạn có chắc chắn muốn hạ cấp thành viên này khỏi vai trò admin không?'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.groupService.revokeGroupAdmin({ GroupId: this.recipientInfo.id, UserId: memberId })
            .subscribe(response => {
              const member = this.recipientInfo.members.$values.find((m: GroupMember) => m.userId === memberId);
              if (member) {
                member.isAdmin = false; // Cập nhật trạng thái admin của thành viên
                this.updateSidebar.emit(); // Cập nhật giao diện sau khi hạ cấp
              }
            }, error => {
              console.error('Failed to demote member from admin:', error);
            });
        }
      });
    }
  }

  onRenameGroup(): void {
    const dialogRef = this.dialog.open(RenameGroupDialogComponent, {
      width: '300px',
      data: { currentRecipient: this.recipientId }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('Recipient ID:', this.recipientInfo.id);
      console.log('New Group Name:', result);
      if (result) {
        this.groupService.renameGroup(this.recipientInfo.id, result).subscribe(
          () => {
            console.log('Group name changed successfully');
            this.updateSidebar.emit(); // Update sidebar or UI
          },
          error => {
            console.error('Failed to change group name', error);
          }
        );
      }
    });
  }
  onLeaveGroup(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '300px',
      data: {
        title: 'Rời khỏi nhóm',
        message: 'Bạn có chắc chắn muốn rời khỏi nhóm này không?'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.groupService.removeGroupMember({ GroupId: this.recipientInfo.id, UserId: this.currentUser.id }).subscribe(
          () => {
            console.log('Successfully left the group');
            this.updateSidebar.emit(); // Cập nhật giao diện sau khi rời khỏi nhóm
            // Bạn có thể thêm logic điều hướng người dùng đến một trang khác nếu cần
          },
          error => {
            console.error('Failed to leave the group:', error);
          }
        );
      }
    });
  }


  getAvatarUrl(avatar: string): string {
    return `https://localhost:7267/${avatar}`;
  }
}
