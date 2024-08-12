import { Component, OnInit } from '@angular/core';
import { SignalRService } from './services/signalr.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  constructor(private signalRService: SignalRService) { }

  ngOnInit(): void {
    // Bắt đầu kết nối SignalR
    this.signalRService.startConnection();

    // Đăng ký lắng nghe tin nhắn nhận được
    this.signalRService.registerServerEvents();
  }
}
