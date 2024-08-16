import { Component, Input, OnInit, OnChanges, ChangeDetectorRef, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FriendsService } from "../../services/friends.service";
import { ChatService } from "../../services/chat.service";
import { MatDialog } from "@angular/material/dialog";
import { ChangeNicknameDialogComponent } from "../change-nickname-dialog/change-nickname-dialog.component";
import { ConfirmDialogComponent } from "../confirm-dialog/confirm-dialog.component";
import { GroupService } from "../../services/group.service";
import { RenameGroupDialogComponent } from "../rename-group-dialog/rename-group-dialog.component";
import { AddMemberDialogComponent } from "../add-member-dialog/add-member-dialog.component";
import { AvatarUploadDialogComponent } from "../avatar-upload-dialog/avatar-upload-dialog.component";
import { ImagePreviewDialogComponent } from "../image-preview-dialog/image-preview-dialog.component";
import { SignalRService } from "../../services/signalr.service";
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-recipient-info',
  templateUrl: './recipient-info.component.html',
  styleUrls: ['./recipient-info.component.css']
})
export class RecipientInfoComponent implements OnInit, OnChanges, OnDestroy {
  @Input() recipientId: string | null = null;
  @Output() updateSidebar = new EventEmitter<void>();
  @Output() resetRecipient = new EventEmitter<void>();

  recipientInfo: any;
  currentUser: any;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private friendsService: FriendsService,
    private chatService: ChatService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private groupService: GroupService,
    private signalRService: SignalRService
  ) {
    this.currentUser = { id: localStorage.getItem('userId') };
  }

  ngOnInit(): void {
    this.loadRecipientInfo();
    this.registerSignalRListeners();
  }

  ngOnChanges(): void {
    this.loadRecipientInfo();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe(); // Hủy tất cả các subscriptions khi component bị hủy
  }

  registerSignalRListeners(): void {
    this.subscriptions.add(
      this.signalRService.groupNotificationReceived$.subscribe(notification => {
        if (notification && notification.groupId === this.recipientId) {
          this.loadRecipientInfo();
        }
      })
    );

    this.subscriptions.add(
      this.signalRService.friendEventNotification$.subscribe(data => {
        console.log('Friend event notification received in recipient info:', data);
        this.loadRecipientInfo();
      })
    );
  }

  resetRecipientData(): void {
    this.recipientId = null;
    this.recipientInfo = null;
    this.cdr.detectChanges();
    this.resetRecipient.emit();
    console.log("Recipient data has been reset");
  }

  loadRecipientInfo(): void {
    const userId = this.currentUser.id;
    if (userId && this.recipientId) {
      this.friendsService.getFriendInfo(userId, this.recipientId).subscribe(
        data => {
          this.recipientInfo = data;
          this.cdr.detectChanges();
          console.log('Recipient info loaded:', data);
        },
        error => this.handleError(error)
      );
    } else {
      console.log('No recipientId found, skipping loadRecipientInfo');
    }
  }

  handleError(error: any): void {
    console.error('An error occurred:', error);
    if (error.status === 404) {
      this.resetRecipientData();
    }
  }

  onChangeNickname(): void {
    const dialogRef = this.dialog.open(ChangeNicknameDialogComponent, {
      width: '300px',
      data: { currentNickname: this.recipientInfo.nickname }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined) {
        this.friendsService.changeNickname(this.currentUser.id, this.recipientInfo.id, result).subscribe(
          () => {
            console.log('Nickname changed successfully');
            this.updateSidebar.emit();
            this.loadRecipientInfo();
          },
          error => this.handleError(error)
        );
      }
    });
  }

  onRemoveFriend(): void {
    this.confirmDialog('Unfriending', 'Are you sure you want to delete this friend?').subscribe(result => {
      if (result) {
        this.friendsService.removeFriend(this.currentUser.id, this.recipientInfo.id).subscribe(
          () => {
            console.log('Friend removed successfully');
        window.location.reload();
          },
          error => this.handleError(error)
        );
      }
    });
  }

  onBlockUser(): void {
    this.confirmDialog('Block users', 'Are you sure you want to block this user?').subscribe(result => {
      if (result) {
        this.friendsService.blockUser(this.currentUser.id, this.recipientInfo.id).subscribe(
          () => {
            console.log('User blocked successfully');
            window.location.reload();
          },
          error => this.handleError(error)
        );
      }
    });
  }

  onDeleteChat(): void {
    this.confirmDialog('Delete a chat', 'Are you sure you want to delete this chat?').subscribe(result => {
      if (result) {
        this.chatService.deleteChat(this.currentUser.id, this.recipientInfo.id).subscribe(
          () => {
            console.log('Chat deleted successfully');
            this.resetRecipientData();
            this.updateSidebar.emit();
          },
          error => this.handleError(error)
        );
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
              this.updateSidebar.emit();
              this.loadRecipientInfo();
            },
            error => this.handleError(error)
          );
        });
      }
    });
  }

  onRemoveGroupMember(memberId: string): void {
    this.confirmDialog('Confirmation of member deletion', 'Are you sure you want to remove this member from the group?').subscribe(result => {
      if (result) {
        this.groupService.removeGroupMember({ GroupId: this.recipientInfo.id, UserId: memberId }).subscribe(
          () => {
            this.recipientInfo.members.$values = this.recipientInfo.members.$values.filter((m: any) => m.userId !== memberId);
            this.updateSidebar.emit();
            this.loadRecipientInfo();
          },
          error => this.handleError(error)
        );
      }
    });
  }

  onPromoteToAdmin(memberId: string): void {
    this.confirmDialog('Confirm promotion', 'Are you sure you want to promote this member to admin?').subscribe(result => {
      if (result) {
        this.groupService.updateGroupAdmin({ GroupId: this.recipientInfo.id, UserId: memberId }).subscribe(
          () => {
            const member = this.recipientInfo.members.$values.find((m: any) => m.userId === memberId);
            if (member) member.isAdmin = true;
            this.updateSidebar.emit();
            this.loadRecipientInfo();
          },
          error => this.handleError(error)
        );
      }
    });
  }

  onDemoteFromAdmin(memberId: string): void {
    this.confirmDialog('Downgrade confirmation', 'Are you sure you want to demote this member from the admin role?').subscribe(result => {
      if (result) {
        this.groupService.revokeGroupAdmin({ GroupId: this.recipientInfo.id, UserId: memberId }).subscribe(
          () => {
            const member = this.recipientInfo.members.$values.find((m: any) => m.userId === memberId);
            if (member) member.isAdmin = false;
            this.updateSidebar.emit();
            this.loadRecipientInfo();
          },
          error => this.handleError(error)
        );
      }
    });
  }

  onRenameGroup(): void {
    const dialogRef = this.dialog.open(RenameGroupDialogComponent, {
      width: '300px',
      data: { currentRecipient: this.recipientId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.groupService.renameGroup(this.recipientInfo.id, result).subscribe(
          () => {
            console.log('Group name changed successfully');
            this.updateSidebar.emit();
            this.loadRecipientInfo();
          },
          error => this.handleError(error)
        );
      }
    });
  }

  onLeaveGroup(): void {
    this.confirmDialog('Leave a group', 'Are you sure you want to leave this group?').subscribe(result => {
      if (result) {
        this.groupService.removeGroupMember({ GroupId: this.recipientInfo.id, UserId: this.currentUser.id }).subscribe(
          () => {
            console.log('Successfully left the group');
           window.location.reload();
          },
          error => this.handleError(error)
        );
      }
    });
  }

  onChangeGroupAvatar(): void {
    const currentAvatarUrl = this.getAvatarUrl(this.recipientInfo?.avatar) || '';

    const dialogRef = this.dialog.open(AvatarUploadDialogComponent, {
      width: '400px',
      data: { currentAvatar: currentAvatarUrl }
    });

    dialogRef.afterClosed().subscribe((file: File) => {
      if (file && this.recipientInfo?.isGroup) {
        this.uploadGroupAvatar(file);
      }
    });
  }

  uploadGroupAvatar(file: File): void {
    const request = { GroupId: this.recipientInfo.id, AvatarFile: file };
    this.groupService.updateGroupAvatar(request).subscribe(
      response => {
        console.log('Avatar changed successfully');
        if (response.newAvatarUrl) {
          this.recipientInfo.avatar = response.newAvatarUrl;
          this.loadRecipientInfo();
        }
      },
      error => this.handleError(error)
    );
  }

  openImagePreview(avatarUrl: string): void {
    this.dialog.open(ImagePreviewDialogComponent, {
      data: this.getAvatarUrl(avatarUrl),
      panelClass: 'custom-dialog-container'
    });
  }

  getAvatarUrl(avatar: string): string {
    return `https://localhost:7267/${avatar}`;
  }

  confirmDialog(title: string, message: string) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '300px',
      data: { title, message }
    });
    return dialogRef.afterClosed();
  }
}
