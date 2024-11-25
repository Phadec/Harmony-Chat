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
  id: number;
  sender: string;
  content: string;
  time: string;
  avatarUri: string;
  isOnline: boolean;
  unreadCount: number;
  notificationsEnabled: boolean;
}

export interface CallItem {
  id: string;
  name: string;
  avatar: string;
  time: string;
  callType: "incoming" | "outgoing" | "missed";
  videoCall: boolean;
}
