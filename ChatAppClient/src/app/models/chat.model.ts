export class ChatModel {
  userId: string;
  toUserId: string;
  date: Date;
  message: string;

  constructor(userId: string = "", toUserId: string = "", date: Date = new Date(), message: string = "") {
    this.userId = userId;
    this.toUserId = toUserId;
    this.date = date;
    this.message = message;
  }
}
