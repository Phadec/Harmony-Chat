import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  // Quản lý sự kiện nickname thay đổi
  private nicknameChangedSource = new BehaviorSubject<string | null>(null);
  public nicknameChanged$ = this.nicknameChangedSource.asObservable();

  // Quản lý sự kiện tin nhắn mới
  private newMessageSource = new BehaviorSubject<any>(null);
  public newMessage$ = this.newMessageSource.asObservable();

  // Quản lý sự kiện người dùng được thêm vào nhóm
  private memberAddedSource = new BehaviorSubject<any>(null);
  public memberAdded$ = this.memberAddedSource.asObservable();

  // Quản lý sự kiện người dùng rời khỏi nhóm
  private memberRemovedSource = new BehaviorSubject<void>(undefined); // Khởi tạo với undefined
  public memberRemoved$ = this.memberRemovedSource.asObservable();

  // Quản lý sự kiện xóa chat (Subject)
  private chatDeletedSource = new Subject<void>();
  public chatDeleted$ = this.chatDeletedSource.asObservable();

  // Hàm phát sự kiện nickname thay đổi
  emitNicknameChanged(newNickname: string): void {
    this.nicknameChangedSource.next(newNickname);
  }

  // Hàm phát sự kiện tin nhắn mới
  emitNewMessage(message: any): void {
    this.newMessageSource.next(message);
  }

  // Hàm phát sự kiện thêm thành viên vào nhóm
  emitMemberAdded(memberInfo: any): void {
    this.memberAddedSource.next(memberInfo);
  }

  // Hàm phát sự kiện thành viên rời khỏi nhóm (không có tham số)
  emitMemberRemoved(): void {
    this.memberRemovedSource.next();
  }

  // Hàm phát sự kiện xóa chat (không có tham số)
  emitDeleteChat(): void {
    this.chatDeletedSource.next();
  }
}
