import { Component, OnInit } from '@angular/core';
import { FriendsService } from '../../services/friends.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-friend-list',
  templateUrl: './friend-list.component.html',
  styleUrls: ['./friend-list.component.css']
})
export class FriendListComponent implements OnInit {
  friends: any[] = [];
  userId: string | null = null;

  constructor(private friendsService: FriendsService, private router: Router) { }

  ngOnInit(): void {
    this.userId = localStorage.getItem('userId'); // Lấy userId từ localStorage
    const token = localStorage.getItem('token'); // Lấy token từ localStorage

    // In ra console để kiểm tra
    console.log('User ID:', this.userId);
    console.log('Token:', token);

    if (this.userId) {
      this.loadFriends();
    } else {
      console.error('User is not logged in');
      this.router.navigate(['/login']); // Chuyển hướng đến trang đăng nhập nếu không có userId
    }
  }

  loadFriends(): void {
    if (this.userId) {
      this.friendsService.getFriends(this.userId).subscribe({
        next: (response) => {
          // Assuming the response has a $values property containing the array of friends
          this.friends = response.$values || []; // Fallback to an empty array if $values is not present
        },
        error: (error) => {
          console.error('Failed to load friends:', error);
        }
      });
    }
  }


  removeFriend(friendId: string): void {
    if (this.userId) {
      this.friendsService.removeFriend(this.userId, friendId).subscribe({
        next: () => {
          this.friends = this.friends.filter(friend => friend.id !== friendId);
        },
        error: (error) => {
          console.error('Failed to remove friend:', error);
        }
      });
    } else {
      console.error('User ID is not available for removing friend');
    }
  }
}
