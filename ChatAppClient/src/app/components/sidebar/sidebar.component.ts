import { Component, OnInit, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ChatService } from '../../services/chat.service';
import { FriendsService } from '../../services/friends.service';
import { SignalRService } from '../../services/signalr.service';
import { FriendDto } from '../../models/friend.dto';
import { FriendRequestDto } from '../../models/friend-request.dto';
import { GroupDto } from "../../models/group.dto";
import { GroupService } from "../../services/group.service";
import { BlockedUsersModalComponent } from "../blocked-users-modal/blocked-users-modal.component";
import { AuthService } from "../../services/auth.service";
import { Router } from "@angular/router";
import { UserService } from "../../services/user.service";
import { UpdateUserDialogComponent } from "../update-user-dialog/update-user-dialog.component";
import { CreateGroupDialogComponent } from "../create-group-dialog/create-group-dialog.component";
import {ChangePasswordDialogComponent} from "../change-password-dialog/change-password-dialog.component";
import {ImagePreviewDialogComponent} from "../image-preview-dialog/image-preview-dialog.component";
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  relationships: any[] = [];
  friends: FriendDto[] = [];
  friendRequests: FriendRequestDto[] = [];
  groups: GroupDto[] = [];
  sentFriendRequests: any[] = [];
  blockedUsers: any[] = [];
  filteredRelationships: any[] = [];
  filteredUsers: any[] = []; // Danh sách người dùng sau khi lọc
  searchTerm: string = '';   // Chuỗi tìm kiếm
  selectedRecipientId: string | null = null;
  searchQuery: string = '';
  selectedTab: string = 'recent';
  userAvatar: string = '';
  @Output() selectRecipient = new EventEmitter<string>();

  constructor(
    private chatService: ChatService,
    private friendsService: FriendsService,
    private signalRService: SignalRService,
    private groupService: GroupService,
    private authService: AuthService,
    private userService: UserService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.selectedTab = 'recent';
    this.loadRelationships();
    this.loadFriends();
    this.loadFriendRequests();
    this.loadSentFriendRequests();
    this.loadBlockedUsers();
    this.loadGroups();
    this.subscribeToSignalREvents();
    this.loadCurrentUserAvatar();
    this.signalRService.messageSent.subscribe(() => {
      this.loadRelationships(); // Cập nhật danh sách quan hệ khi có tin nhắn mới
    });
  }
  subscribeToSignalREvents(): void {
// Lắng nghe sự kiện nhận tin nhắn riêng tư
    this.signalRService.messageReceived$.subscribe(() => {
      this.loadRelationships();

      // Kiểm tra nếu selectedRecipientId != null thì không hiện thông báo
      if (!this.selectedRecipientId) {
        this.snackBar.open('New private message received.', 'Close', {
          duration: 3000,
        });
      }
    });

// Lắng nghe sự kiện tin nhắn đã được đọc
    this.signalRService.messageRead$.subscribe((chatId) => {
      console.log(`Message ${chatId} has been read.`);
      this.loadRelationships();
    });


// Lắng nghe sự kiện cập nhật người dùng đang kết nối
    this.signalRService.connectedUsers$.subscribe((users) => {
      console.log('Connected users updated:', users);
      this.snackBar.open('Connected users updated.', 'Close', {
        duration: 3000,
      });
    });

// Lắng nghe sự kiện liên quan đến bạn bè
    this.signalRService.friendEventNotification$.subscribe((data) => {
      console.log('Friend event notification received in sidebar:', data);

      // Nếu sự kiện là FriendRequestReceived, hiển thị thông báo
      if (data.eventType === 'FriendRequestReceived') {
        this.snackBar.open('You have received a new friend request.', 'Close', {
          duration: 3000, // Thời gian hiển thị thông báo là 3 giây
        });
      }

      // Tải lại danh sách bạn bè và các dữ liệu liên quan cho tất cả các loại sự kiện
      this.loadFriends(); // Reload friends list
      this.loadRelationships(); // Reload relationships if needed
      this.loadFriendRequests(); // Reload friend requests
      this.loadSentFriendRequests(); // Reload sent friend requests
    });
// Lắng nghe sự kiện nhóm
    this.signalRService.groupNotificationReceived$.subscribe(notification => {
      if (notification) {
        // Giả sử message được lưu trong thuộc tính `message` của đối tượng `notification`
        const message = notification.message || 'Group notification received';  // Nếu không có thuộc tính message thì dùng mặc định

        console.log('Full group notification data:', notification); // In toàn bộ nội dung của notification

        // Tải lại danh sách nhóm và mối quan hệ
        this.loadGroups();
        this.loadRelationships();

        // Hiển thị message trong SnackBar
        this.snackBar.open(message, 'Close', {
          duration: 3000,
        });
      }
    });


// Lắng nghe sự kiện cập nhật mối quan hệ
    this.signalRService.hubConnection.on('UpdateRelationships', () => {
      console.log('UpdateRelationships event received');
      this.handleUpdateSidebar(); // Gọi phương thức để cập nhật lại sidebar
    });

// Lắng nghe sự kiện bạn bè bị xóa
    this.signalRService.hubConnection.on('FriendEventNotification', (data: { eventType: string, friendId: string }) => {
      if (data.eventType === 'FriendRemoved') {
        if (this.selectedRecipientId === data.friendId) {
          console.log(`Friend removed: ${data.friendId}`);
          this.selectedRecipientId = null; // Reset recipient info nếu người dùng hiện tại bị xóa
          this.cdr.detectChanges();
          this.snackBar.open('A friend has been removed.', 'Close', {
            duration: 3000,
          });
        }
      }
    });
  }
  onMessageSent(): void {
    // Khi có tin nhắn mới được gửi, tải lại danh sách mối quan hệ
    this.loadRelationships();
  }
  selectTab(tab: string): void {
    this.selectedTab = tab;
    localStorage.setItem('selectedTab', tab);

    // Reset search query and filtered users when switching tabs
    this.searchQuery = '';
    this.filteredUsers = [];
  }

  loadRelationships(): void {
    this.chatService.getRelationships().subscribe(
      (response) => {
        this.relationships = response.$values.map((rel: any) => ({
          id: rel.relationshipType === 'Private' ? rel.contactId : rel.groupId,
          fullName: rel.relationshipType === 'Private' && rel.contactNickname ? rel.contactNickname : (rel.relationshipType === 'Private' ? rel.contactFullName : rel.groupName),
          tagName: rel.relationshipType === 'Private' ? rel.contactTagName : '',
          lastMessage: rel.lastMessage,
          isGroup: rel.relationshipType === 'Group',
          isSentByUser: rel.isSentByUser,
          avatar: rel.avatar,
          senderFullName: rel.senderFullName || '',
          hasNewMessage: rel.hasNewMessage,
        }));
        this.filterRelationships(); // Áp dụng bộ lọc sau khi tải dữ liệu
      },
      (error) => {
        console.error('Error fetching relationships:', error);
      }
    );
  }

  loadFriends(): void {
    const userId = localStorage.getItem('userId');

    if (!userId) {
      console.error('User ID not found in localStorage.');
      return;
    }

    this.friendsService.getFriends(userId).subscribe(
      (response: any) => {
        if (Array.isArray(response.$values)) {
          this.friends = response.$values.map((rel: any): FriendDto => ({
            id: rel.id,
            tagname: rel.tagname,
            fullName: rel.nickname ? rel.nickname : rel.fullName,
            birthday: rel.birthday,
            email: rel.email,
            avatar: rel.avatar,
            status: rel.status,
            nickname: rel.nickname
          }));
        } else {
          console.error('Invalid response format');
        }
      },
      (error) => {
        console.error('Error fetching friends:', error);
      }
    );
  }

  loadFriendRequests(): void {
    const userId = localStorage.getItem('userId');

    if (!userId) {
      console.error('User ID not found in localStorage.');
      return;
    }

    this.friendsService.getFriendRequests(userId).subscribe(
      (response: any) => {
        if (Array.isArray(response.$values)) {
          this.friendRequests = response.$values.map((request: any): FriendRequestDto => ({
            id: request.id,
            senderId: request.senderId,
            senderName: request.senderName,
            tagName: request.tagName,
            status: request.status,
            avatar: request.avatar
          }));
        } else {
          console.error('Invalid response format');
        }
      },
      (error) => {
        console.error('Error fetching friend requests:', error);
      }
    );
  }

  loadGroups(): void {
    const userId = localStorage.getItem('userId');

    if (!userId) {
      console.error('User ID not found in localStorage.');
      return;
    }

    this.groupService.getUserGroupsWithDetails(userId).subscribe(
      (response: any) => {
        if (Array.isArray(response.$values)) {
          this.groups = response.$values.map((group: any): GroupDto => ({
            id: group.id,
            name: group.name,
            avatar: group.avatar
          }));
        } else {
          console.error('Invalid response format');
        }
      },
      (error: any) => {
        console.error('Error fetching groups:', error);
      }
    );
  }

  loadSentFriendRequests(): void {
    const userId = localStorage.getItem('userId')!;
    this.friendsService.getSentFriendRequests(userId).subscribe(
      (response) => {
        this.sentFriendRequests = response.$values; // Gán đúng $values cho mảng sentFriendRequests
      },
      (error) => {
        console.error('Error fetching sent friend requests:', error);
      }
    );
  }

  loadBlockedUsers(): void {
    const userId = localStorage.getItem('userId')!;
    this.friendsService.getBlockedUsers(userId).subscribe(
      (response) => {
        this.blockedUsers = response.$values; // Gán đúng $values cho mảng blockedUsers
      },
      (error) => {
        console.error('Error fetching blocked users:', error);
      }
    );
  }

  filterRelationships(): void {
    if (this.searchQuery.trim() !== '') {
      this.selectedTab = 'recent'; // Chuyển tab sang recent khi bắt đầu tìm kiếm
    }

    if (this.searchQuery.startsWith('@')) {
      this.searchTerm = this.searchQuery;  // Cập nhật searchTerm với giá trị searchQuery
      this.searchUsers();
    } else {
      this.filteredRelationships = this.relationships.filter((rel) =>
        rel.fullName.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
  }
  searchUsers(): void {
    if (this.searchTerm.trim() !== '') {
      this.userService.searchUserByTagName(this.searchTerm).subscribe(
        data => {
          // Data will now include `HasSentRequest` and `RequestId`
          this.filteredUsers = [{
            ...data,
            hasSentRequest: data.hasSentRequest,
            requestId: data.requestId
          }];
        },
        error => {
          console.error('Error searching users:', error);
          this.filteredUsers = [];
        }
      );
    } else {
      this.filteredUsers = [];
    }
  }

  isFriend(userId: string): boolean {
    return this.friends.some(friend => friend.id === userId);
  }

  onAddFriend(userId: string): void {
    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) {
      console.error('User ID not found in localStorage.');
      return;
    }

    this.friendsService.addFriend(currentUserId, userId).subscribe(
      (response) => {
        console.log('Friend request sent successfully', response);

        // Reload all necessary sections of the sidebar
        this.loadFriends();             // Load friends again after sending a friend request
        this.loadFriendRequests();      // Load friend requests after sending a friend request
        this.loadSentFriendRequests();  // Load sent friend requests after sending a friend request
        this.loadRelationships();       // Reload relationships

        // Optionally, if you're in the search context, you can reload the search results as well
        this.searchUsers();
      },
      error => {
        console.error('Error sending friend request:', error);
      }
    );
  }
  onCancelFriendRequest(requestId: string, context: 'search' | 'friendRequests'): void {
    if (requestId) {
      const currentUserId = localStorage.getItem('userId')!;
      this.friendsService.cancelFriendRequest(currentUserId, requestId).subscribe(
        () => {
          console.log('Friend request cancelled successfully');
          this.searchUsers();
          this.loadFriendRequests(); // Load lại danh sách lời mời nhận được
          this.loadSentFriendRequests(); // Load lại danh sách lời mời đã gửi


        }, error => {
          console.error('Error cancelling friend request:', error);
        }
      );
    } else {
      console.warn('Request ID is null or undefined');
    }
  }

  onSelectRecipient(recipientId: string): void {
    this.selectedRecipientId = recipientId;

    const selectedRelationship = this.relationships.find(rel => rel.id === recipientId);

    if (selectedRelationship && selectedRelationship.hasNewMessage) {
      selectedRelationship.hasNewMessage = false;

      this.chatService.markMessageAsRead(selectedRelationship.id).subscribe({
        next: () => {
          this.loadRelationships();
        },
        error: (err) => {
          console.error('Failed to mark message as read', err);
        }
      });
    }

    this.selectRecipient.emit(recipientId);
  }

  viewBlockedUsers(): void {
    const dialogRef = this.dialog.open(BlockedUsersModalComponent, {
      width: '400px',
      data: { blockedUsers: this.blockedUsers }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });
  }

  changeLanguage(): void {
    console.log('Change Language clicked');
    // Logic to change language
  }

  onAcceptRequest(requestId: string, context: 'search' | 'friendRequests'): void {
    const userId = localStorage.getItem('userId')!;
    this.friendsService.acceptFriendRequest(userId, requestId).subscribe(
      () => {
        console.log('Friend request accepted successfully');

        // Kiểm tra ngữ cảnh để gọi phương thức thích hợp
        if (context === 'search') {
          this.searchUsers();
        } else if (context === 'friendRequests') {
          this.loadFriendRequests(); // Load lại danh sách lời mời nhận được
          this.loadFriends(); // Load lại danh sách bạn bè sau khi chấp nhận lời mời kết bạn
          this.loadRelationships();  // Tải lại mối quan hệ sau khi có thay đổi
        }
      },
      error => {
        console.error('Error accepting friend request:', error);
      }
    );
  }

  onRejectRequest(requestId: string, context: 'search' | 'friendRequests'): void {
    const userId = localStorage.getItem('userId')!;
    this.friendsService.rejectFriendRequest(userId, requestId).subscribe(
      () => {
        console.log('Friend request rejected successfully');

        // Kiểm tra ngữ cảnh để gọi phương thức thích hợp
        if (context === 'search') {
          this.searchUsers();
        } else if (context === 'friendRequests') {
          this.loadFriendRequests(); // Load lại danh sách lời mời nhận được
          this.loadSentFriendRequests(); // Load lại danh sách lời mời đã gửi
          this.loadRelationships();  // Tải lại mối quan hệ sau khi có thay đổi
        }
      },
      error => {
        console.error('Error rejecting friend request:', error);
      }
    );
  }

  onRemoveFriend(friendId: string, context: 'search' | 'friendRequests'): void {
    const userId = localStorage.getItem('userId')!;
    this.friendsService.removeFriend(userId, friendId).subscribe({
      next: () => {
        this.loadFriends(); // Tải lại danh sách bạn bè sau khi xóa thành công
        this.loadRelationships();  // Tải lại mối quan hệ sau khi có thay đổi
      },
      error: (error) => {
        console.error('Error removing friend:', error);
      }
    });
  }

  signOut(): void {
    const userId = localStorage.getItem('userId')!;
    this.authService.logout(userId).subscribe({
      next: () => {
        localStorage.removeItem('userId');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Error during sign out:', err);
      }
    });
  }

  handleUpdateSidebar(): void {
    // Cập nhật lại dữ liệu mà bạn muốn trong SidebarComponent
    this.loadFriends();
    this.loadFriendRequests();
    this.loadSentFriendRequests();
    this.loadRelationships();
    this.loadBlockedUsers()

  }

  openUpdateUserDialog(): void {
    const dialogRef = this.dialog.open(UpdateUserDialogComponent, {
      width: '400px' // Adjust width as needed
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('User profile updated successfully.');
        // Handle any post-update actions if necessary
        this.loadCurrentUserAvatar();
        this.loadRelationships();  // Tải lại mối quan hệ sau khi có thay đổi
      }
    });
  }

  getAvatarUrl(avatar: string): string {
    return `https://192.168.1.102:7267/${avatar}`;
  }

  onCreateGroup(): void {
    const dialogRef = this.dialog.open(CreateGroupDialogComponent, {
      width: '1000px', height: '500px',
      data: {}
    });

    dialogRef.componentInstance.groupCreated.subscribe((result: any) => {
      if (result) {
        const formData = new FormData();
        const currentUserId = localStorage.getItem('userId');

        formData.append('name', result.name);

        if (currentUserId) {
          formData.append('MemberIds', currentUserId);
        }

        result.members.forEach((memberId: string) => {
          formData.append('MemberIds', memberId);
        });

        if (result.avatarFile) {
          formData.append('AvatarFile', result.avatarFile);
        }

        this.groupService.createGroupChat(formData).subscribe(
          () => {
            console.log('Group created successfully');
            this.loadGroups();  // Tải lại danh sách nhóm sau khi tạo nhóm mới
            this.loadRelationships();  // Tải lại mối quan hệ sau khi có thay đổi
          },
          error => {
            console.error('Failed to create group:', error);
          }
        );
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      this.loadGroups();  // Đảm bảo rằng danh sách nhóm được cập nhật khi dialog đóng lại
      this.loadRelationships();  // Tải lại mối quan hệ sau khi có thay đổi
    });
  }
  openChangePasswordDialog(): void {
    const dialogRef = this.dialog.open(ChangePasswordDialogComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Password changed successfully.');
      }
    });
  }
  // Lấy thông tin người dùng hiện tại và gán vào userAvatar
  loadCurrentUserAvatar(): void {
    const currentUserId = localStorage.getItem('userId');
    if (currentUserId) {
      this.userService.getUserInfo(currentUserId).subscribe(
        (userInfo) => {
          this.userAvatar = userInfo.avatar || ''; // Giả sử avatar nằm trong thuộc tính avatar
          localStorage.setItem('userAvatar', this.userAvatar);
        },
        (error) => {
          console.error('Failed to load user info', error);
        }
      );
    } else {
      console.error('No currentUserId found in localStorage');
    }
  }

  openImagePreview(avatarUrl: string): void {
    this.dialog.open(ImagePreviewDialogComponent, {
      data: this.getAvatarUrl(avatarUrl),
      panelClass: 'custom-dialog-container'
    });
  }
}
