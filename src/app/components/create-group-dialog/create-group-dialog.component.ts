import { Component, Inject, OnInit, Output, EventEmitter } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FriendsService } from '../../services/friends.service';
import { GroupService } from '../../services/group.service';
import {AppConfigService} from "../../services/app-config.service";

@Component({
  selector: 'app-create-group-dialog',
  templateUrl: './create-group-dialog.component.html',
  styleUrls: ['./create-group-dialog.component.css']
})
export class CreateGroupDialogComponent implements OnInit {
  groupName: string = ''; // Tên của nhóm mới
  selectedMembers: any[] = []; // Danh sách các thành viên được chọn
  friends: any[] = []; // Danh sách bạn bè
  avatarFile: File | null = null; // Hình ảnh đại diện của nhóm
  searchQuery: string = ''; // Biến mới để lưu chuỗi tìm kiếm
  filteredFriends: any[] = []; // Biến mới để lưu danh sách bạn bè đã lọc
  @Output() groupCreated = new EventEmitter<any>(); // Sự kiện để thông báo rằng nhóm đã được tạo

  constructor(
    public dialogRef: MatDialogRef<CreateGroupDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private friendsService: FriendsService,
    private appConfig: AppConfigService,
  ) {}

  ngOnInit(): void {
    this.loadFriends();
  }

  loadFriends(): void {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.friendsService.getFriends(userId).subscribe(
        (response: any) => {
          if (response && response.$values) {
            this.friends = response.$values; // Lưu danh sách bạn bè
            this.filteredFriends = this.friends; // Hiển thị danh sách bạn bè ban đầu
          } else {
            console.error('Invalid response format:', response);
          }
        },
        error => {
          console.error('Failed to load friends:', error);
        }
      );
    } else {
      console.error('User ID not found in local storage.');
    }
  }
  avatarPreview: string | ArrayBuffer | null = null;
  // Xử lý sự kiện khi chọn avatar
  onAvatarSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.avatarFile = file;

      // Đọc file và hiển thị bản xem trước
      const reader = new FileReader();
      reader.onload = e => this.avatarPreview = reader.result as string;
      reader.readAsDataURL(file);
    }
  }
  // Lọc bạn bè theo chuỗi tìm kiếm
  filterFriends(): void {
    if (this.searchQuery.trim()) {
      this.filteredFriends = this.friends.filter(friend =>
        friend.fullName.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    } else {
      this.filteredFriends = this.friends; // Khôi phục danh sách bạn bè ban đầu nếu chuỗi tìm kiếm rỗng
    }
  }

  onConfirm(): void {
    const result = {
      name: this.groupName,
      members: this.selectedMembers,
      avatarFile: this.avatarFile
    };
    this.groupCreated.emit(result); // Phát sự kiện khi nhóm được tạo
    this.dialogRef.close(result);
  }


  onCancel(): void {
    this.dialogRef.close();
  }

  getAvatarUrl(avatar: string): string {
    const baseUrl = this.appConfig.getBaseUrl(); // Lấy baseUrl từ AppConfigService
    return `${baseUrl}/${avatar}`;
  }
}
