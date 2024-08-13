import { Component, Input, OnInit, OnChanges, ChangeDetectorRef } from '@angular/core';
import { FriendsService } from "../../services/friends.service";

@Component({
  selector: 'app-recipient-info',
  templateUrl: './recipient-info.component.html',
  styleUrls: ['./recipient-info.component.css']
})
export class RecipientInfoComponent implements OnInit, OnChanges {
  @Input() recipientId: string | null = null;

  recipientInfo: any;

  constructor(
    private friendsService: FriendsService,
    private cdr: ChangeDetectorRef
  ) {}

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

  onChangeNickname() {
    // Logic to change the recipient's nickname
  }

  onRemoveFriend() {
    // Logic to remove the recipient from the friends list
  }

  onBlockUser() {
    // Logic to block the recipient
  }
  getAvatarUrl(avatar: string): string {
    return `https://localhost:7267/${avatar}`;
  }
}
