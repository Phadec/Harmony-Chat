import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { UserModel } from '../../models/user.model';
import { ChatModel } from '../../models/chat.model';
import { HttpClient } from '@angular/common/http';
import * as signalR from '@microsoft/signalr';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  users: UserModel[] = [];
  chats: ChatModel[] = [];
  selectedUserId: string = "";
  selectedUser: UserModel = new UserModel();
  user = new UserModel();
  hub: signalR.HubConnection | undefined;
  message: string = "";

  constructor(
    private http: HttpClient
  ){
    this.user = JSON.parse(localStorage.getItem("accessToken") ?? "");
    this.getFriends();

    this.hub = new signalR.HubConnectionBuilder().withUrl("https://localhost:7267/chat-hub").build();

    this.hub.start().then(()=> {
      console.log("Connection is started...");

      this.hub?.invoke("Connect", this.user.id);

      this.hub?.on("Users", (res:UserModel) => {
        console.log(res);
        this.users.find(p=> p.id == res.id)!.status = res.status;
      });

      this.hub?.on("Messages",(res:ChatModel)=> {
        console.log(res);

        if(this.selectedUserId == res.userId){
          this.chats.push(res);
        }
      })
    })
  }


  getFriends() {
    this.http.get<UserModel[]>(`https://localhost:7267/api/friends/${this.user.id}/friends`).subscribe(
      friends => {
        this.users = friends; // Update the user list
      console.log(this.users);
      },
      error => {
        console.error('Error fetching friends:', error);
        // Optionally, display an error message to the user
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

    this.http.get<ChatModel[]>(`https://localhost:7267/api/Chats/GetChats?userId=${this.user.id}&toUserId=${this.selectedUserId}`).subscribe(
      res => {
        this.chats = res;
      },
      error => {
        console.error('Error fetching chats:', error);
        // Optionally, display an error message to the user
      }
    );
  }

  sendMessage(){
    const data ={
      "userId": this.user.id,
      "toUserId": this.selectedUserId,
      "message": this.message
    }
    this.http.post<ChatModel>("https://localhost:7267/api/Chats/SendMessage",data).subscribe(
      (res)=> {
        this.chats.push(res);
        this.message = "";
      });
  }

}


