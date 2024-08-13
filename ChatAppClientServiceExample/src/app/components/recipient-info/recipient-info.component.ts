import { Component, Input, OnInit, OnChanges, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import {FriendsService} from "../../services/friends.service";
import {ChatService} from "../../services/chat.service";
import {MatDialog} from "@angular/material/dialog";
import {ChangeNicknameDialogComponent} from "../change-nickname-dialog/change-nickname-dialog.component";
import {ConfirmDialogComponent} from "../confirm-dialog/confirm-dialog.component";
import {GroupService} from "../../services/group.service";
import {CreateGroupDialogComponent} from "../create-group-dialog/create-group-dialog.component";

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

  onCreateGroup(): void {
    const dialogRef = this.dialog.open(CreateGroupDialogComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.groupService.createGroupChat(result).subscribe(
          () => {
            console.log('Group created successfully');
            this.updateSidebar.emit(); // Cập nhật giao diện sidebar
          },
          (error) => {
            console.error('Failed to create group', error);
          }
        );
      }
    });
  }
  onAddMember() {
    // Logic to open a dialog to add a member
  }

  onRemoveGroupMember(memberId: string) {
    // Logic to remove a member from the group
  }

  onPromoteToAdmin(memberId: string) {
    // Logic to promote a member to admin
  }

  onDemoteFromAdmin(memberId: string) {
    // Logic to demote an admin to member
  }


  getAvatarUrl(avatar: string): string {
    return `https://localhost:7267/${avatar}`;
  }
}
