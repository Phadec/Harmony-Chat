import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog'; // Đảm bảo đã nhập MatDialog
import { ChatService } from '../../services/chat.service';
import { FriendsService } from '../../services/friends.service';
import { SignalRService } from '../../services/signalr.service';
import { FriendDto } from '../../models/friend.dto';
import { FriendRequestDto } from '../../models/friend-request.dto';
import {GroupDto} from "../../models/group.dto";
import {GroupService} from "../../services/group.service";
import {BlockedUsersModalComponent} from "../blocked-users-modal/blocked-users-modal.component";
import {AuthService} from "../../services/auth.service";
import {Router} from "@angular/router";
import {UserService} from "../../services/user.service";

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
    private router: Router,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    const savedTab = localStorage.getItem('selectedTab') || 'recent';
    this.selectedTab = savedTab;

    this.loadRelationships();
    this.loadFriends();
    this.loadFriendRequests();
    this.loadSentFriendRequests();
    this.loadBlockedUsers();
    this.loadGroups();

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
            fullName: rel.fullName,
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
          console.log(this.groups); // Log để kiểm tra dữ liệu
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
        this.sentFriendRequests = response;
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
        this.blockedUsers = response;
      },
      (error) => {
        console.error('Error fetching blocked users:', error);
      }
    );
  }
  searchUsers(): void {
    if (this.searchTerm.trim() !== '') {
      this.userService.searchUserByTagName(this.searchTerm).subscribe(
        data => {
          this.filteredUsers = [data]; // Đặt kết quả tìm kiếm vào filteredUsers
        },
        error => {
          console.error('Error searching users:', error);
          this.filteredUsers = []; // Xoá danh sách người dùng nếu tìm kiếm không thành công
        }
      );
    } else {
      this.filteredUsers = []; // Xoá danh sách người dùng nếu từ khoá tìm kiếm trống
    }
  }

  filterRelationships(): void {
    if (this.searchQuery.startsWith('@')) {
      // Nếu tìm kiếm bắt đầu bằng '@', gọi API để tìm người dùng theo TagName
      this.searchUsers();
    } else {
      // Nếu không, lọc danh sách mối quan hệ hiện có
      this.filteredRelationships = this.relationships.filter((rel) =>
        rel.fullName.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
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
    // Logic to change language
    // You can redirect to a language settings page or show a language selection modal
    console.log('Change Language clicked');
  }

  onAcceptRequest(requestId: string): void {
    const userId = localStorage.getItem('userId')!;
    this.friendsService.acceptFriendRequest(userId, requestId).subscribe(() => {
      this.loadFriendRequests();
      this.loadFriends();
    });
  }

  onRejectRequest(requestId: string): void {
    const userId = localStorage.getItem('userId')!;
    this.friendsService.rejectFriendRequest(userId, requestId).subscribe(() => {
      this.loadFriendRequests();
    });
  }

  onCancelSentRequest(requestId: string): void {
    const userId = localStorage.getItem('userId')!;
    this.friendsService.cancelFriendRequest(userId, requestId).subscribe(() => {
      this.loadSentFriendRequests();
    });
  }

  onRemoveFriend(friendId: string): void {
    const userId = localStorage.getItem('userId')!;
    this.friendsService.removeFriend(userId, friendId).subscribe({
      next: () => {
        // Tải lại danh sách bạn bè sau khi xóa thành công
        this.loadFriends();
      },
      error: (error) => {
        console.error('Error removing friend:', error);
        // Xử lý lỗi nếu cần
      }
    });
  }


  onBlockUser(blockedUserId: string): void {
    const userId = localStorage.getItem('userId')!;

    // Chặn người dùng
    this.friendsService.blockUser(userId, blockedUserId).subscribe(
      () => {
        // Sau khi chặn thành công, cập nhật danh sách bạn bè và người bị chặn
        this.loadFriends(); // Cập nhật danh sách bạn bè
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
        localStorage.removeItem('userId'); // Xóa thông tin người dùng khỏi localStorage
        this.router.navigate(['/login']); // Điều hướng đến trang đăng nhập
      },
      error: (err) => {
        console.error('Error during sign out:', err);
      }
    });
  }

  getAvatarUrl(avatar: string): string {
    return `https://localhost:7267/${avatar}`;
  }
}
