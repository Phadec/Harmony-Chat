import {Component, OnInit, Output, EventEmitter, ChangeDetectorRef} from '@angular/core';
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
import {UpdateUserDialogComponent} from "../update-user-dialog/update-user-dialog.component";

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
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.selectedTab = 'recent';

    this.loadRelationships();
    this.loadFriends();
    this.loadFriendRequests();
    this.loadSentFriendRequests();
    this.loadBlockedUsers();
    this.loadGroups();
    this.loadSentFriendRequests();
    this.subscribeToSignalREvents();
  }
  subscribeToSignalREvents(): void {
    this.signalRService.messageReceived$.subscribe(() => {
      this.loadRelationships();
    });

    this.signalRService.messageRead$.subscribe((chatId) => {
      console.log(`Message ${chatId} has been read.`);
      this.loadRelationships();
    });
    this.signalRService.friendRequestSent$.subscribe((friendRequest) => {
      console.log('Friend request sent:', friendRequest);
      this.loadSentFriendRequests(); // Tải lại danh sách yêu cầu kết bạn đã gửi
    });

    this.signalRService.connectedUsers$.subscribe((users) => {
      console.log('Connected users updated:', users);
      // Cập nhật giao diện người dùng khi danh sách kết nối thay đổi
    });

    // Lắng nghe các sự kiện liên quan đến bạn bè và người dùng
    this.signalRService.hubConnection.on('NicknameChanged', (userId, nickname) => {
      console.log(`Nickname changed for user ${userId}. New nickname: ${nickname}`);
      this.loadFriends(); // Tải lại danh sách bạn bè để cập nhật biệt danh
    });

    this.signalRService.hubConnection.on('FriendRequestReceived', (userId, requestId) => {
      console.log(`New friend request received from ${userId}. Request ID: ${requestId}`);
      this.loadFriendRequests(); // Tải lại danh sách yêu cầu kết bạn
    });

    this.signalRService.hubConnection.on('FriendRemoved', (userId) => {
      console.log(`Friend removed: ${userId}`);
      this.loadFriends(); // Tải lại danh sách bạn bè khi bạn bè bị xóa
    });

    this.signalRService.hubConnection.on('UserBlocked', (userId) => {
      console.log(`User blocked: ${userId}`);
      this.loadBlockedUsers(); // Tải lại danh sách người dùng bị chặn
    });

    this.signalRService.hubConnection.on('UserUnblocked', (userId) => {
      console.log(`User unblocked: ${userId}`);
      this.loadBlockedUsers(); // Tải lại danh sách người dùng bị bỏ chặn
    });

    this.signalRService.hubConnection.on('FriendRequestAccepted', (userId) => {
      console.log(`Friend request accepted by ${userId}`);
      this.loadFriendRequests(); // Tải lại danh sách yêu cầu kết bạn khi một yêu cầu được chấp nhận
      this.loadFriends(); // Tải lại danh sách bạn bè sau khi yêu cầu kết bạn được chấp nhận
    });

    this.signalRService.hubConnection.on('FriendRequestRejected', (userId) => {
      console.log(`Friend request rejected by ${userId}`);
      this.loadFriendRequests(); // Tải lại danh sách yêu cầu kết bạn khi một yêu cầu bị từ chối
    });

    this.signalRService.hubConnection.on('UpdateRelationships', () => {
      this.loadRelationships();
    });

    this.signalRService.messageReceived$.subscribe(() => {
      this.loadRelationships();
    });
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
        this.searchUsers();

        // Ép buộc Angular phát hiện và cập nhật giao diện
        this.cdr.detectChanges();
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

          // Kiểm tra ngữ cảnh để gọi phương thức thích hợp
          if (context === 'search') {
            this.searchUsers();
          } else if (context === 'friendRequests') {
            this.loadFriendRequests(); // Load lại danh sách lời mời nhận được
            this.loadSentFriendRequests(); // Load lại danh sách lời mời đã gửi
          }
        },
        error => {
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
        }
      },
      error => {
        console.error('Error rejecting friend request:', error);
      }
    );
  }


  onRemoveFriend(friendId: string,context: 'search' | 'friendRequests'): void {
    const userId = localStorage.getItem('userId')!;
    this.friendsService.removeFriend(userId, friendId).subscribe({
      next: () => {
        this.loadFriends(); // Tải lại danh sách bạn bè sau khi xóa thành công
      },
      error: (error) => {
        console.error('Error removing friend:', error);
      }
    });
  }

  onBlockUser(blockedUserId: string): void {
    const userId = localStorage.getItem('userId')!;

    this.friendsService.blockUser(userId, blockedUserId).subscribe(
      () => {
        this.loadFriends(); // Cập nhật danh sách bạn bè sau khi chặn
        this.loadBlockedUsers(); // Cập nhật danh sách người bị chặn
      },
      (error) => {
        console.error('Error blocking user:', error);
      }
    );
  }

  onUnblockUser(blockedUserId: string): void {
    const userId = localStorage.getItem('userId')!;
    this.friendsService.unblockUser(userId, blockedUserId).subscribe(() => {
      this.loadBlockedUsers();
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
    // hoặc bất kỳ hành động nào khác bạn muốn thực hiện khi nhận được sự kiện
  }
  openUpdateUserDialog(): void {
    const dialogRef = this.dialog.open(UpdateUserDialogComponent, {
      width: '400px' // Adjust width as needed
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('User profile updated successfully.');
        // Handle any post-update actions if necessary
      }
    });
  }
  getAvatarUrl(avatar: string): string {
    return `https://localhost:7267/${avatar}`;
  }
}
