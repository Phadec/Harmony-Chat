export interface Message {
  id: string;
  message: string;
  userId: string;
  toUserId?: string;
  groupId?: string;
  date: string;
  isDeleted?: boolean; // Thêm thuộc tính này
  reactions?: any;
}
