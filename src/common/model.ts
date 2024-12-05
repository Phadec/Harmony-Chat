export interface Special {
  id: number;
  name: string;
  message: string;
  time: string;
  icon: string;
  avatar: string;
  iconColor: string;
}
export interface Message {
  chatId: string;                // ID của cuộc trò chuyện
  contactFullName: string;       // Tên người liên lạc
  contactTagName: string;        // Tên người dùng có thể được dùng để hiển thị với ký tự @
  status: string;                // Trạng thái của người liên lạc (online/offline)
  avatar: string;                // Đường dẫn đến avatar của người liên lạc
  lastMessage: string;           // Tin nhắn cuối cùng
  lastAttachmentUrl: string;     // URL đính kèm của tin nhắn cuối cùng
  isDeleted: boolean;            // Kiểm tra xem tin nhắn có bị xóa không
  isSentByUser: boolean;         // Kiểm tra xem tin nhắn có phải do người dùng gửi không
  hasNewMessage: boolean;        // Kiểm tra xem có tin nhắn mới hay không
  unreadCount: number;           // Số lượng tin nhắn chưa đọc
  notificationsEnabled: boolean; // Tình trạng thông báo bật hay tắt
  chatDate: string;              // Ngày giờ của cuộc trò chuyện (ví dụ: ISO string format)
}
interface Reaction {
  $id: string;
  $values: any[];  // Nếu có thêm các phần tử trong $values, hãy điều chỉnh kiểu này
}
export interface Relationship {
  $id: string;
  relationshipType: string;
  chatId: string;
  chatDate: string;
  contactId: string;
  contactFullName: string;
  contactTagName: string;
  contactNickname: string;
  status: string;
  avatar: string;
  lastMessage: string;
  lastAttachmentUrl: string;
  reaction: Reaction;
  isDeleted: boolean;
  isSentByUser: boolean;
  hasNewMessage: boolean;
  hasNewReactions: boolean;
}
export interface RelationshipsResponse {
  $id: string;
  $values: Relationship[];
}


export interface CallItem {
  id: string;
  name: string;
  avatar: string;
  time: string;
  callType: "incoming" | "outgoing" | "missed";
  videoCall: boolean;
}
