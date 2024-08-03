import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import * as signalR from '@microsoft/signalr';
import { FormsModule } from '@angular/forms';
import { UserModel } from '../../models/user.model';
import { ChatModel } from '../../models/chat.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  users: UserModel[] = [];
  chats: ChatModel[] = [];
  selectedUserId: string = "";
  selectedUser: UserModel = new UserModel();
  user: UserModel = new UserModel();
  hub: signalR.HubConnection | undefined;
  message: string = "";
  attachment: File | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem("accessToken") ?? "{}");
    this.getFriends();

    this.hub = new signalR.HubConnectionBuilder().withUrl("https://localhost:7267/chat-hub").build();

    this.hub.start().then(() => {
      console.log("Connection is started...");

      this.hub?.invoke("Connect", this.user.id);

      this.hub?.on("Users", (res: UserModel) => {
        const user = this.users.find(p => p.id === res.id);
        if (user) {
          user.status = res.status;
        }
      });

      this.hub?.on("Messages", (res: ChatModel) => {
        if (this.selectedUserId === res.userId) {
          this.chats.push(res);
        }
      });
    }).catch(err => {
      console.error('Error starting SignalR connection:', err);
    });
  }

  getFriends() {
    this.http.get<any>(`https://localhost:7267/api/friends/${this.user.id}/friends`).subscribe(
      response => {
        this.users = response.$values || response;
      },
      error => {
        console.error('Error fetching friends:', error);
      }
    );
  }

  logout() {
    localStorage.clear();
    document.location.reload();
  }

  changeUser(user: UserModel) {
    this.selectedUserId = user.id;
    this.selectedUser = user;

    this.http.get<any>(`https://localhost:7267/api/Chats/GetChats?userId=${this.user.id}&toUserId=${this.selectedUserId}`).subscribe(
      response => {
        this.chats = response.$values || response;
      },
      error => {
        console.error('Error fetching chats:', error);
      }
    );
  }

  onFileSelected(event: any) {
    this.attachment = event.target.files[0];
  }

  sendMessage() {
    const formData = new FormData();
    formData.append('userId', this.user.id);
    formData.append('toUserId', this.selectedUserId);
    formData.append('message', this.message);
    if (this.attachment) {
      formData.append('attachment', this.attachment);
    }

    this.http.post<ChatModel>("https://localhost:7267/api/Chats/SendPrivateMessage", formData).subscribe(
      res => {
        this.chats.push(res);
        this.message = "";
        this.attachment = null;
      },
      (error: HttpErrorResponse) => {
        console.error('Error sending message:', error);
        console.error('Error details:', error.error); // Log chi tiết lỗi

        if (error.error && error.error.errors) {
          for (let key in error.error.errors) {
            console.error(`Validation error in ${key}: ${error.error.errors[key]}`);
          }
        }
      }
    );
  }
}
