import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-chat-header',
  templateUrl: './chat-header.component.html',
  styleUrls: ['./chat-header.component.css']
})
export class ChatHeaderComponent implements OnInit {
  @Input() recipientInfo: any; // Nhận thông tin recipient từ component cha

  constructor() {}

  ngOnInit(): void {}
}
