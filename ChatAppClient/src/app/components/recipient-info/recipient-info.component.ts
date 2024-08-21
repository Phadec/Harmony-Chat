import { Component, Input, OnInit, OnChanges, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { FriendsService } from "../../services/friends.service";
import { ChatService } from "../../services/chat.service";
import { MatDialog } from "@angular/material/dialog";
import { ChangeNicknameDialogComponent } from "../change-nickname-dialog/change-nickname-dialog.component";
import { ConfirmDialogComponent } from "../confirm-dialog/confirm-dialog.component";
import { GroupService } from "../../services/group.service";
import { RenameGroupDialogComponent } from "../rename-group-dialog/rename-group-dialog.component";
import { AddMemberDialogComponent } from "../add-member-dialog/add-member-dialog.component";
import { AvatarUploadDialogComponent } from "../avatar-upload-dialog/avatar-upload-dialog.component";
import {ImagePreviewDialogComponent} from "../image-preview-dialog/image-preview-dialog.component";
import {SignalRService} from "../../services/signalr.service";
import {EventService} from "../../services/event.service";

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


@Component({
  selector: 'app-recipient-info',
  templateUrl: './recipient-info.component.html',
  styleUrls: ['./recipient-info.component.css']
})
export class RecipientInfoComponent implements OnInit, OnChanges {
  @Input() recipientId: string | null = null;
  @Output() updateSidebar = new EventEmitter<void>(); // EventEmitter để phát sự kiện
  @Output() resetRecipient = new EventEmitter<void>();
  recipientInfo: any;
  currentUser: any;

  constructor(
    private friendsService: FriendsService,
    private chatService: ChatService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private groupService: GroupService,
    private signalRService: SignalRService,
    private eventService: EventService
  ) {
    this.currentUser = { id: localStorage.getItem('userId') };
  }


  ngOnInit() {
    this.loadRecipientInfo();

    this.signalRService.groupNotificationReceived$.subscribe(notification => {
      if (notification && notification.groupId === this.recipientId) {
        this.loadRecipientInfo(); // Tải lại thông tin nhóm khi nhận thông báo mới
      }
    });
    this.signalRService.friendEventNotification$.subscribe((data) => {
      console.log('Friend event notification received in recipient info:', data);
      this.loadRecipientInfo(); // Reload recipient info when a friend event occurs
    });
    this.signalRService.friendEventNotification$.subscribe((data) => {
      if (data.EventType === 'FriendRemoved') {
        // Xử lý sự kiện "FriendRemoved", ví dụ cập nhật danh sách bạn bè
        console.log('Friend removed:', data.Data.FriendId);
      }
    });
    this.signalRService.friendEventNotification$.subscribe((data) => {
      console.log('Friend event notification received in recipient info:', data);

      // Xử lý sự kiện "FriendRemoved"
      if (data.EventType === 'FriendRemoved' && data.Data.FriendId === this.recipientId) {
        console.log('Friend removed, clearing recipientInfo:', data.Data.FriendId);
        this.recipientInfo = null; // Đặt recipientInfo về null
        this.cdr.detectChanges(); // Cập nhật giao diện
        this.resetRecipient.emit(); // Phát sự kiện để thông báo rằng recipient đã bị reset
      }
    });
  }


  ngOnChanges() {
    this.loadRecipientInfo();
  }


  resetRecipientData(): void {
    this.recipientId = null; // Reset recipientId về null
    this.recipientInfo = null; // Reset recipientInfo về null
    this.cdr.detectChanges(); // Đảm bảo giao diện được cập nhật
    this.resetRecipient.emit(); // Phát sự kiện để thông báo rằng recipient đã bị reset
    console.log("Recipient data has been reset");
  }

  loadRecipientInfo(): void {
    const userId = localStorage.getItem('userId');
    if (userId && this.recipientId) {
      this.friendsService.getFriendInfo(userId, this.recipientId).subscribe(
        (data) => {
          this.recipientInfo = data;
          this.cdr.detectChanges(); // Cập nhật giao diện sau khi tải xong thông tin
          console.log('Recipient info loaded:', data);
        },
        (error) => {
          console.error('Error fetching recipient information:', error);
          // Nếu xảy ra lỗi 404, đặt recipientInfo về null
          if (error.status === 404) {
            this.resetRecipientData(); // Reset giao diện
          }
        }
      );
    } else {
      console.log('No recipientId found, skipping loadRecipientInfo');
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
            this.recipientInfo.nickname = nickname;
            this.updateSidebar.emit();
            this.cdr.detectChanges();

            // Phát sự kiện nicknameChanged qua EventService
            this.eventService.emitNicknameChanged(nickname);
          },
          (error) => {
            console.error('Failed to change nickname', error);
          }
        );
      }
    });}

  onRemoveFriend(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '300px',
      data: {
        title: 'Unfriending',
        message: 'Are you sure you want to delete this friend?'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.friendsService.removeFriend(localStorage.getItem('userId')!, this.recipientInfo.id).subscribe(
          () => {
            console.log('Friend removed successfully');
            this.loadRecipientInfo()
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
        title: 'Block users',
        message: 'Are you sure you want to block this user?'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.friendsService.blockUser(localStorage.getItem('userId')!, this.recipientInfo.id).subscribe(
          () => {
            console.log('User blocked successfully');
            this.updateSidebar.emit(); // Cập nhật giao diện sidebar
            this.loadRecipientInfo(); // Tải lại thông tin người nhận sau khi chặn người dùng
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
        title: 'Delete a chat',
        message: 'Are you sure you want to delete this chat?'
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
            this.loadRecipientInfo(); // Tải lại thông tin người nhận sau khi xóa đoạn chat

            // Phát sự kiện xóa chat
            this.eventService.emitDeleteChat();
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
              this.loadRecipientInfo(); // Tải lại thông tin nhóm sau khi thêm thành viên
              alert('The member has been successfully added to the group.');
            },
            error => {
              console.error('Failed to add member:', error);
              alert('Members can not be added to the group. Please try again.');
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
          title: 'Confirmation of member deletion',
          message: 'Are you sure you want to remove this member from the group?'
        }
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.groupService.removeGroupMember({ GroupId: this.recipientInfo.id, UserId: memberId })
            .subscribe(response => {
              this.recipientInfo.members.$values = this.recipientInfo.members.$values.filter((m: GroupMember) => m.userId !== memberId);
              this.updateSidebar.emit(); // Cập nhật giao diện sau khi xóa thành viên
              this.loadRecipientInfo(); // Tải lại thông tin nhóm sau khi xóa thành viên
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
          title: 'Confirm promotion',
          message: 'Confirmation of promotion'
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
                this.loadRecipientInfo(); // Tải lại thông tin nhóm sau khi thăng cấp thành viên
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
          title: 'Downgrade confirmation',
          message: 'Are you sure you want to demote this member from the admin role?'
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
                this.loadRecipientInfo(); // Tải lại thông tin nhóm sau khi hạ cấp thành viên
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
            this.loadRecipientInfo(); // Tải lại thông tin nhóm sau khi đổi tên nhóm
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
        title: 'Leave a group',
        message: 'Are you sure you want to leave this group?'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.groupService.removeGroupMember({ GroupId: this.recipientInfo.id, UserId: this.currentUser.id}).subscribe(
          () => {
            console.log('Successfully left the group');
            // Phát sự kiện thành viên rời khỏi nhóm
            this.eventService.emitMemberRemoved(); // Không truyền tham số
          },
          error => {
            console.error('Failed to leave the group:', error);
          }
        );
      }
    });
  }



  onChangeGroupAvatar(): void {
    const currentAvatarUrl = this.getAvatarUrl(this.recipientInfo?.avatar) || ''; // Lấy URL của avatar hiện tại

    const dialogRef = this.dialog.open(AvatarUploadDialogComponent, {
      width: '400px',
      data: { currentAvatar: currentAvatarUrl } // Truyền avatar hiện tại vào hộp thoại
    });

    dialogRef.afterClosed().subscribe((file: File) => {
      if (file && this.recipientInfo && this.recipientInfo.isGroup) {
        this.uploadGroupAvatar(file);
      }
    });
  }


  uploadGroupAvatar(file: File): void {
    if (this.recipientInfo && this.recipientInfo.isGroup) {
      const request = {
        GroupId: this.recipientInfo.id,  // Make sure to use the correct property name
        AvatarFile: file
      };

      this.groupService.updateGroupAvatar(request).subscribe(
        response => {
          console.log('Avatar changed successfully');
          if (response.newAvatarUrl) {
            (this.recipientInfo as GroupInfo).avatar = response.newAvatarUrl;  // Update the avatar URL
            this.loadRecipientInfo(); // Tải lại thông tin nhóm sau khi đổi avatar
          }
        },
        error => {
          console.error('Failed to change avatar', error);
        }
      );
    }
  }
  openImagePreview(avatarUrl: string): void {
    this.dialog.open(ImagePreviewDialogComponent, {
      data: this.getAvatarUrl(avatarUrl),
      panelClass: 'custom-dialog-container'
    });
  }


  getAvatarUrl(avatar: string): string {
    return `https://192.168.1.102:7267/${avatar}`;
  }
}
