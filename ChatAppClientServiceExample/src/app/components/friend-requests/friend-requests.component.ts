import { Component, OnInit } from '@angular/core';
import { FriendsService } from '../../services/friends.service';

@Component({
  selector: 'app-friend-requests',
  templateUrl: './friend-requests.component.html',
  styleUrls: ['./friend-requests.component.css']
})
export class FriendRequestsComponent implements OnInit {
  friendRequests: any[] = [];
  userId: string | null = null;

  constructor(private friendsService: FriendsService) {}

  ngOnInit(): void {
    this.userId = localStorage.getItem('userId'); // Lấy userId từ localStorage
    if (this.userId) {
      this.loadFriendRequests();
    } else {
      console.error('User ID is not available.');
    }
  }

  loadFriendRequests(): void {
    if (this.userId) {
      this.friendsService.getFriendRequests(this.userId).subscribe({
        next: (response) => {
          this.friendRequests = response.$values;
        },
        error: (error) => {
          console.error('Failed to load friend requests:', error);
        }
      });
    }
  }

  acceptRequest(requestId: string): void {
    if (this.userId) {
      this.friendsService.acceptFriendRequest(this.userId, requestId).subscribe({
        next: () => {
          this.friendRequests = this.friendRequests.filter(request => request.id !== requestId);
        },
        error: (error) => {
          console.error('Failed to accept friend request:', error);
        }
      });
    }
  }

  rejectRequest(requestId: string): void {
    if (this.userId) {
      this.friendsService.rejectFriendRequest(this.userId, requestId).subscribe({
        next: () => {
          this.friendRequests = this.friendRequests.filter(request => request.id !== requestId);
        },
        error: (error) => {
          console.error('Failed to reject friend request:', error);
        }
      });
    }
  }
}
