import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FormGroup } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class GroupService {

  private apiUrl = 'https://localhost:7267/api/Groups';

  constructor(private http: HttpClient) {}

  createGroupChat(request: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/create-group-chat`, request);
  }

  addGroupChatMember(request: { GroupId: string, UserId: string }): Observable<any> {
    const formData = new FormData();
    formData.append('GroupId', request.GroupId);
    formData.append('UserId', request.UserId);
    return this.http.post(`${this.apiUrl}/add-group-chat-member`, formData);
  }

  deleteGroup(groupId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${groupId}/delete`);
  }

  getGroupMembers(groupId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${groupId}/members`);
  }

  removeGroupMember(request: { GroupId: string, UserId: string }): Observable<any> {
    const formData = new FormData();
    formData.append('GroupId', request.GroupId);
    formData.append('UserId', request.UserId);
    return this.http.delete(`${this.apiUrl}/remove-member`, { body: formData });
  }

  getUserGroupsWithDetails(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/user-groups-with-details/${userId}`);
  }

  renameGroup(request: { GroupId: string, NewName: string }): Observable<any> {
    const formData = new FormData();
    formData.append('GroupId', request.GroupId);
    formData.append('NewName', request.NewName);
    return this.http.put(`${this.apiUrl}/rename-group`, formData);
  }

  updateGroupAdmin(request: { GroupId: string, UserId: string }): Observable<any> {
    const formData = new FormData();
    formData.append('GroupId', request.GroupId);
    formData.append('UserId', request.UserId);
    return this.http.post(`${this.apiUrl}/update-admin`, formData);
  }

  revokeGroupAdmin(request: { GroupId: string, UserId: string }): Observable<any> {
    const formData = new FormData();
    formData.append('GroupId', request.GroupId);
    formData.append('UserId', request.UserId);
    return this.http.post(`${this.apiUrl}/revoke-admin`, formData);
  }

  updateGroupAvatar(request: { GroupId: string, AvatarFile: File }): Observable<any> {
    const formData = new FormData();
    formData.append('GroupId', request.GroupId);
    formData.append('AvatarFile', request.AvatarFile);
    return this.http.post(`${this.apiUrl}/update-avatar`, formData);
  }
}
