import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GroupService } from '../../services/group.service';
import { MatListOption } from '@angular/material/list'; // Import MatListOption


@Component({
  selector: 'app-add-member-dialog',
  templateUrl: './add-member-dialog.component.html',
  styleUrls: ['./add-member-dialog.component.css']
})
export class AddMemberDialogComponent implements OnInit {
  friendsNotInGroup: any[] = [];
  selectedFriends: any[] = []; // Lưu trữ các mục được chọn

  constructor(
    private dialogRef: MatDialogRef<AddMemberDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { groupId: string },
    private groupService: GroupService
  ) {}

  ngOnInit(): void {
    this.loadFriendsNotInGroup();
  }

  loadFriendsNotInGroup(): void {
    this.groupService.getFriendsNotInGroup(this.data.groupId).subscribe(
      (response: any) => {
        const friends = response.$values;
        if (Array.isArray(friends)) {
          this.friendsNotInGroup = friends.map(friend => ({
            ...friend,
            selected: false // Đảm bảo rằng tất cả các mục đều không được chọn mặc định
          }));
        } else {
          console.error('Expected an array, but got', friends);
          this.friendsNotInGroup = [];
        }
      },
      (error) => {
        console.error('Error fetching friends not in group:', error);
      }
    );
  }

  onSelectionChange(event: any): void {
    this.selectedFriends = event.source.selectedOptions.selected.map((option: MatListOption) => option.value);
  }

  get hasSelectedFriends(): boolean {
    return this.selectedFriends.length > 0;
  }

  onConfirm(): void {
    const selectedFriendIds = this.selectedFriends.map(friend => friend.id);
    this.dialogRef.close(selectedFriendIds);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
  getAvatarUrl(avatar: string): string {
    return `https://192.168.1.102:7267/${avatar}`;
  }
}
