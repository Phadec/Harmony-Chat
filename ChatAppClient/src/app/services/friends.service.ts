import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FriendsService {

  private apiUrl = 'https://192.168.1.102:7267/api/Friends';

  constructor(private http: HttpClient) { }

  getSentFriendRequests(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${userId}/get-sent-friend-requests`);
  }

  changeNickname(userId: string, friendId: string, nickname: string): Observable<any> {
    const payload = { FriendId: friendId, Nickname: nickname };
    return this.http.post(`${this.apiUrl}/${userId}/change-nickname`, payload);
  }


  addFriend(userId: string, friendId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${userId}/add/${friendId}`, {});
  }

  removeFriend(userId: string, friendId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${userId}/remove/${friendId}`);
  }

  getFriends(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${userId}/friends`);
  }

  getFriendRequests(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${userId}/friend-requests`);
  }

  acceptFriendRequest(userId: string, requestId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${userId}/accept-friend-request/${requestId}`, {});
  }

  rejectFriendRequest(userId: string, requestId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${userId}/reject-friend-request/${requestId}`, {});
  }

  cancelFriendRequest(userId: string, requestId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${userId}/cancel-friend-request/${requestId}`);
  }

  blockUser(userId: string, blockedUserId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${userId}/block/${blockedUserId}`, {});
  }

  unblockUser(userId: string, blockedUserId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${userId}/unblock/${blockedUserId}`, {});
  }

  getBlockedUsers(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${userId}/blocked-users`);
  }
  getFriendInfo(userId: string, entityId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${userId}/relationship-info/${entityId}`);
  }
}
