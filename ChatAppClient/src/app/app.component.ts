import { Component, OnInit } from '@angular/core';
import { SignalRService } from './services/signalr.service';
import {NavigationEnd, Router} from "@angular/router";
import {PeerService} from "./services/peer.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  constructor(private signalRService: SignalRService, private router: Router,private peerService: PeerService) { }

  ngOnInit(): void {
    // Bắt đầu kết nối SignalR
    this.signalRService.startConnection();

    // Đăng ký lắng nghe tin nhắn nhận được
    this.signalRService.registerServerEvents();
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        if (event.urlAfterRedirects === '/chats') {
          // Khi người dùng truy cập trang /chats, đăng ký peerId
          this.peerService.initializePeer();
        }
      }
    });
  }
}
