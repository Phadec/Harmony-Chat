import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FriendsService } from '../../services/friends.service';
import { Observable } from 'rxjs';
import {BlockedUserDto} from "../../models/blocked-user.dto";
import {AppConfigService} from "../../services/app-config.service";

@Component({
  selector: 'app-blocked-users-modal',
  templateUrl: './blocked-users-modal.component.html',
  styleUrls: ['./blocked-users-modal.component.css']
})
export class BlockedUsersModalComponent implements OnInit {
  blockedUsers: BlockedUserDto[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private friendsService: FriendsService,
    private appConfig: AppConfigService,
    public dialogRef: MatDialogRef<BlockedUsersModalComponent>
  ) {}

  ngOnInit(): void {
    this.loadBlockedUsers();
  }

  loadBlockedUsers(): void {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.friendsService.getBlockedUsers(userId).subscribe(
        (response: { $values: BlockedUserDto[] }) => {
          this.blockedUsers = response.$values || [];
        },
        (error) => {
          console.error('Error fetching blocked users:', error);
        }
      );
    }
}

  unblockUser(blockedUserId: string): void {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.friendsService.unblockUser(userId, blockedUserId).subscribe(
        () => {
          this.loadBlockedUsers(); // Reload blocked users after unblocking
        },
        (error) => {
          console.error('Error unblocking user:', error);
        }
      );
    }
  }

  getAvatarUrl(avatar: string): string {
    const baseUrl = this.appConfig.getBaseUrl(); // Lấy baseUrl từ AppConfigService
    return `${baseUrl}/${avatar}`;
  }
  onClose(): void {
    this.dialogRef.close();
  }
}
