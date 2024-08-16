export interface RecipientInfo {
  id: string;
  fullName: string;
  nickname?: string;
  avatar: string;
  tagName?: string;
  status: string;
  type: 'Private' | 'Group';  // Xác định loại recipient (cá nhân hoặc nhóm)
  isGroup: boolean;           // Xác định xem đây có phải là nhóm hay không
}
