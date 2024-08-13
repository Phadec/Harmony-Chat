import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FriendsService } from '../../services/friends.service';

@Component({
  selector: 'app-create-group-dialog',
  templateUrl: './create-group-dialog.component.html',
  styleUrls: ['./create-group-dialog.component.css']
})
export class CreateGroupDialogComponent implements OnInit {
  groupName: string = ''; // Tên của nhóm mới
  selectedMembers: any[] = []; // Danh sách các thành viên được chọn
  friends: any[] = []; // Danh sách bạn bè

  constructor(
    public dialogRef: MatDialogRef<CreateGroupDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private friendsService: FriendsService
  ) {}

  ngOnInit(): void {
    this.loadFriends();
  }

  loadFriends(): void {
    const userId = localStorage.getItem('userId'); // Lấy userId từ localStorage
    if (userId) {
      this.friendsService.getFriends(userId).subscribe(
        (friends: any[]) => {
          this.friends = friends; // Gán danh sách bạn bè vào biến friends
        },
        error => {
          console.error('Failed to load friends:', error);
        }
      );
    } else {
      console.error('User ID not found in local storage.');
    }
  }

  onConfirm(): void {
    this.dialogRef.close({ name: this.groupName, members: this.selectedMembers });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
