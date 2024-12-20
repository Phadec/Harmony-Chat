import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import { baseURL } from '../axiosInstance';

export class SignalRService {
  private hubConnection: HubConnection;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  public messageReceived$: BehaviorSubject<any> = new BehaviorSubject(null);

  // Singleton: Đảm bảo chỉ có một instance duy nhất
  private static instance: SignalRService;

  private constructor() {
    this.hubConnection = this.createConnection();
    this.registerListeners();
  }

  // Singleton pattern: Chỉ trả về một instance duy nhất
  public static getInstance(): SignalRService {
    if (!SignalRService.instance) {
      SignalRService.instance = new SignalRService();
    }
    return SignalRService.instance;
  }

  private createConnection() {
    return new HubConnectionBuilder()
      .withUrl(`${baseURL}/chat-hub`, {
        accessTokenFactory: this.getAccessToken, // Lấy token khi cần
      })
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect([0, 2000, 10000, 30000]) // Auto reconnect với các khoảng thời gian khác nhau
      .build();
  }

  private getAccessToken = async () => {
    // Lấy token từ AsyncStorage
    const token = await AsyncStorage.getItem('token');
    return token || ''; // Nếu không có token thì trả về chuỗi rỗng
  };

  // Đăng ký các sự kiện của SignalR
  private registerListeners() {
    this.hubConnection.on('ReceivePrivateMessage', (message) => {
      console.log('Private message received:', message);
      this.messageReceived$.next(message);
    });

    this.hubConnection.on('ReceiveGroupMessage', (message) => {
      console.log('Group message received:', message);
      this.messageReceived$.next(message);
    });

    this.hubConnection.on('userstatuschanged', (status) => {
      // Xử lý khi trạng thái người dùng thay đổi
      console.log('User status changed:', status);
    });

    this.hubConnection.on('updateconnectedusers', (status) => {
      // Cập nhật danh sách người dùng kết nối
      console.log('Connected users updated:', status);
    });

    // Lắng nghe các lỗi xảy ra
    this.hubConnection.onclose((error) => {
      console.error('SignalR connection closed:', error);
      this.isConnected = false;
    });
  }

  private startConnection() {
    if (this.isConnected) return; // Nếu đã kết nối rồi thì không khởi tạo lại kết nối

    this.hubConnection
      .start()
      .then(() => {
        this.isConnected = true; // Đánh dấu kết nối thành công
        this.reconnectAttempts = 0; // Reset số lần thử kết nối lại
        console.log('SignalR connection established.');
      })
      .catch((err) => {
        console.error('Error while starting SignalR connection: ', err);
        this.isConnected = false; // Đánh dấu là không kết nối
        this.reconnectAttempts++;
        this.retryConnection(); // Cố gắng kết nối lại nếu có lỗi
      });
  }

  // Cố gắng kết nối lại nếu kết nối bị mất
  private retryConnection() {
    const maxRetries = 5; // Số lần thử tối đa
    if (this.reconnectAttempts < maxRetries) {
      const retryDelay = [1000, 3000, 5000, 10000, 20000][this.reconnectAttempts]; // Tăng dần thời gian retry
      setTimeout(() => {
        console.log(`Retrying SignalR connection (Attempt: ${this.reconnectAttempts + 1})`);
        this.startConnection();
      }, retryDelay);
    } else {
      console.error('Max retry attempts reached for SignalR connection.');
    }
  }

  public stopConnection() {
    if (!this.isConnected) return; // Nếu chưa kết nối thì không dừng kết nối

    this.hubConnection
      .stop()
      .then(() => {
        this.isConnected = false; // Đánh dấu là ngừng kết nối
        console.log('SignalR connection stopped.');
      })
      .catch((err) => {
        console.error('Error while stopping SignalR connection: ', err);
      });
  }

  public start() {
    // Kiểm tra kết nối trước khi bắt đầu
    if (!this.isConnected) {
      this.startConnection();
    }
  }

  public get connectionState() {
    return this.hubConnection.state;
  }

  // Cung cấp trạng thái kết nối (connected, disconnected...)
  public get connectionStatus() {
    return this.isConnected ? 'Connected' : 'Disconnected';
  }
}
