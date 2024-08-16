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
import { ChangePasswordDialogComponent } from "../change-password-dialog/change-password-dialog.component";
import { ImagePreviewDialogComponent } from "../image-preview-dialog/image-preview-dialog.component";

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
  filteredUsers: any[] = [];
  searchTerm: string = '';
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
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.selectedTab = 'recent';
    this.loadInitialData();
    this.subscribeToSignalREvents();
    this.loadCurrentUserAvatar();
  }

  // Thêm phương thức selectTab để chuyển đổi giữa các tab
  selectTab(tab: string): void {
    this.selectedTab = tab;
    localStorage.setItem('selectedTab', tab);
    this.filterRelationships();
  }

  // Thêm phương thức kiểm tra bạn bè
  isFriend(userId: string): boolean {
    return this.friends.some(friend => friend.id === userId);
  }

  // Thêm phương thức mở modal người dùng bị chặn
  viewBlockedUsers(): void {
    const dialogRef = this.dialog.open(BlockedUsersModalComponent, {
      width: '400px',
      data: { blockedUsers: this.blockedUsers }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });
  }

  // Thêm phương thức thay đổi ngôn ngữ
  changeLanguage(): void {
    console.log('Change Language clicked');
    // Logic thay đổi ngôn ngữ
  }

  // Phương thức này tải toàn bộ dữ liệu ban đầu
  loadInitialData(): void {
    this.loadRelationships();
    this.loadFriends();
    this.loadFriendRequests();
    this.loadSentFriendRequests();
    this.loadBlockedUsers();
    this.loadGroups();
  }

  subscribeToSignalREvents(): void {
    this.signalRService.friendRequestReceived$.subscribe(() => this.loadFriendRequests());
    this.signalRService.messageReceived$.subscribe(() => this.loadRelationships());
    this.signalRService.messageRead$.subscribe(() => this.loadRelationships());
    this.signalRService.friendRequestSent$.subscribe(() => this.loadSentFriendRequests());
    this.signalRService.friendEventNotification$.subscribe(() => {
      this.loadFriends();
      this.loadRelationships();
      this.loadFriendRequests();
      this.loadSentFriendRequests();
    });
    this.signalRService.groupNotificationReceived$.subscribe(() => {
      this.loadGroups();
      this.loadRelationships();
    });

    this.signalRService.hubConnection.on('FriendEventNotification', (data: { eventType: string, friendId: string }) => {
      if (data.eventType === 'FriendRemoved' && this.selectedRecipientId === data.friendId) {
        this.selectedRecipientId = null;
        this.cdr.detectChanges();
      }
    });
  }

  loadRelationships(): void {
    this.chatService.getRelationships().subscribe(
      response => {
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
        this.filterRelationships();
      },
      error => console.error('Error fetching relationships:', error)
    );
  }

  loadFriends(): void {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.friendsService.getFriends(userId).subscribe(
        response => this.friends = response.$values || [],
        error => console.error('Error fetching friends:', error)
      );
    }
  }

  loadFriendRequests(): void {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.friendsService.getFriendRequests(userId).subscribe(
        response => this.friendRequests = response.$values || [],
        error => console.error('Error fetching friend requests:', error)
      );
    }
  }

  loadSentFriendRequests(): void {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.friendsService.getSentFriendRequests(userId).subscribe(
        response => this.sentFriendRequests = response.$values || [],
        error => console.error('Error fetching sent friend requests:', error)
      );
    }
  }

  loadBlockedUsers(): void {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.friendsService.getBlockedUsers(userId).subscribe(
        response => this.blockedUsers = response.$values || [],
        error => console.error('Error fetching blocked users:', error)
      );
    }
  }

  loadGroups(): void {
    const userId = localStorage.getItem('userId');
    if (userId) {
      this.groupService.getUserGroupsWithDetails(userId).subscribe(
        response => this.groups = response.$values || [],
        error => console.error('Error fetching groups:', error)
      );
    }
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

  onAddFriend(userId: string): void {
    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) return;

    this.friendsService.addFriend(currentUserId, userId).subscribe(
      () => {
        this.loadFriends();
        this.loadFriendRequests();
        this.loadSentFriendRequests();
        this.loadRelationships();
        this.searchUsers();
      },
      error => console.error('Error sending friend request:', error)
    );
  }

  onCancelFriendRequest(requestId: string, context: 'search' | 'friendRequests'): void {
    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) return;

    this.friendsService.cancelFriendRequest(currentUserId, requestId).subscribe(
      () => {
        if (context === 'search') {
          this.searchUsers();
        } else if (context === 'friendRequests') {
          this.loadFriendRequests();
          this.loadSentFriendRequests();
        }
      },
      error => console.error('Error cancelling friend request:', error)
    );
  }

  onAcceptRequest(requestId: string, context: 'search' | 'friendRequests'): void {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    this.friendsService.acceptFriendRequest(userId, requestId).subscribe(
      () => {
        if (context === 'search') {
          this.searchUsers();
        } else if (context === 'friendRequests') {
          this.loadFriendRequests();
          this.loadFriends();
          this.loadRelationships();
        }
      },
      error => console.error('Error accepting friend request:', error)
    );
  }

  onRejectRequest(requestId: string, context: 'search' | 'friendRequests'): void {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    this.friendsService.rejectFriendRequest(userId, requestId).subscribe(
      () => {
        if (context === 'search') {
          this.searchUsers();
        } else if (context === 'friendRequests') {
          this.loadFriendRequests();
          this.loadSentFriendRequests();
          this.loadRelationships();
        }
      },
      error => console.error('Error rejecting friend request:', error)
    );
  }

  onRemoveFriend(friendId: string): void {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    this.friendsService.removeFriend(userId, friendId).subscribe(
      () => {
        this.loadFriends();
        this.loadRelationships();
      },
      error => console.error('Error removing friend:', error)
    );
  }

  onSelectRecipient(recipientId: string): void {
    this.selectedRecipientId = recipientId;

    const selectedRelationship = this.relationships.find(rel => rel.id === recipientId);

    if (selectedRelationship && selectedRelationship.hasNewMessage) {
      selectedRelationship.hasNewMessage = false;

      this.chatService.markMessageAsRead(selectedRelationship.id).subscribe({
        next: () => this.loadRelationships(),
        error: (err) => console.error('Failed to mark message as read', err)
      });
    }

    this.selectRecipient.emit(recipientId);
  }

  openUpdateUserDialog(): void {
    const dialogRef = this.dialog.open(UpdateUserDialogComponent, {
      width: '400px' // Adjust width as needed
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadRelationships();
      }
    });
  }

  openChangePasswordDialog(): void {
    this.dialog.open(ChangePasswordDialogComponent, {
      width: '400px'
    });
  }

  signOut(): void {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    this.authService.logout(userId).subscribe({
      next: () => {
        localStorage.removeItem('userId');
        this.router.navigate(['/login']);
      },
      error: (err) => console.error('Error during sign out:', err)
    });
  }

  // Lấy thông tin người dùng hiện tại và gán vào userAvatar
  loadCurrentUserAvatar(): void {
    const currentUserId = localStorage.getItem('userId');
    if (currentUserId) {
      this.userService.getUserInfo(currentUserId).subscribe(
        userInfo => {
          this.userAvatar = userInfo.avatar || '';
          localStorage.setItem('userAvatar', this.userAvatar);
        },
        error => console.error('Failed to load user info', error)
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
  onCreateGroup(): void {
    const dialogRef = this.dialog.open(CreateGroupDialogComponent, {
      width: '1000px',
      height: '500px',
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

  getAvatarUrl(avatar: string): string {
    return `https://localhost:7267/${avatar}`;
  }
}
