import { Component, OnInit, OnDestroy } from '@angular/core';
import { SignalRService } from '../../services/signalr.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, OnDestroy {
  private messageSubscription: Subscription = new Subscription();

  constructor(private signalRService: SignalRService) {}

  ngOnInit(): void {
    // Start the SignalR connection
    this.signalRService.startConnection();

    // Add the listener for receiving messages
    this.signalRService.addReceiveMessageListener();

    // Subscribe to the messageReceived$ observable
    this.messageSubscription = this.signalRService.messageReceived$.subscribe(message => {
      console.log('New message received:', message);
      // Handle incoming messages here (e.g., update the chat UI)
    });
  }

  ngOnDestroy(): void {
    // Unsubscribe to avoid memory leaks
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }

    // Stop the SignalR connection when the component is destroyed
    this.signalRService.stopConnection();
  }
}
