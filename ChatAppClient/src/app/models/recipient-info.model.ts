export interface RecipientInfo {
  id: string;
  fullName: string;
  nickname?: string;
  avatar: string;
  tagName?: string;
  status: string;
  type: 'Private' | 'Group';  // Xác định loại recipient
}
