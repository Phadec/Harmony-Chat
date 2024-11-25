import { CallItem, Message, Special } from "@/common/model";

export const callsData: CallItem[] = [
  {
    id: "1",
    name: "Jhon Abraham",
    avatar:
      "https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg?size=626&ext=jpg",
    time: "Today, 07:30 AM",
    callType: "incoming",
    videoCall: true,
  },
  {
    id: "2",
    name: "Sabila Sayma",
    avatar:
      "https://img.freepik.com/free-psd/3d-illustration-business-man-with-glasses_23-2149436194.jpg?size=626&ext=jpg",
    time: "Yesterday, 07:35 PM",
    callType: "missed",
    videoCall: false,
  },
  {
    id: "3",
    name: "Alex Linderson",
    avatar:
      "https://img.freepik.com/free-psd/3d-rendering-avatar_23-2150833554.jpg?size=626&ext=jpg",
    time: "Monday, 09:30 AM",
    callType: "outgoing",
    videoCall: true,
  },
  {
    id: "4",
    name: "Jhon Abraham",
    avatar:
      "https://img.freepik.com/premium-vector/flat-vector-illustration-animator_1033579-62857.jpg?size=626&ext=jpg",
    time: "03/07/22, 07:30 AM",
    callType: "outgoing",
    videoCall: false,
  },
  {
    id: "5",
    name: "John Borino",
    avatar:
      "https://img.freepik.com/free-psd/3d-illustration-person-with-glasses_23-2149436191.jpg?size=626&ext=jpg",
    time: "Monday, 09:30 AM",
    callType: "incoming",
    videoCall: true,
  },
  {
    id: "6",
    name: "John Borino",
    avatar:
      "https://img.freepik.com/free-psd/3d-illustration-person-with-glasses_23-2149436191.jpg?size=626&ext=jpg",
    time: "Monday, 09:30 AM",
    callType: "incoming",
    videoCall: true,
  },
  {
    id: "7",
    name: "John Borino",
    avatar:
      "https://img.freepik.com/free-psd/3d-illustration-person-with-glasses_23-2149436191.jpg?size=626&ext=jpg",
    time: "Monday, 09:30 AM",
    callType: "incoming",
    videoCall: true,
  },
  {
    id: "8",
    name: "John Borino",
    avatar:
      "https://img.freepik.com/free-psd/3d-illustration-person-with-glasses_23-2149436191.jpg?size=626&ext=jpg",
    time: "Monday, 09:30 AM",
    callType: "incoming",
    videoCall: true,
  },
  {
    id: "9",
    name: "John Borino",
    avatar:
      "https://img.freepik.com/free-psd/3d-illustration-person-with-glasses_23-2149436191.jpg?size=626&ext=jpg",
    time: "Monday, 09:30 AM",
    callType: "incoming",
    videoCall: true,
  },
];

export const specials: Special[] = [
  {
    id: 1,
    name: "Jhon Abraham",
    message: "Today, I don’t know anything",
    time: "Today",
    icon: "map-pin",
    avatar: "https://img.freepik.com/free-psd/3d-illustration-person-with-sunglasses_23-2149436188.jpg?size=626&ext=jpg",
    iconColor: "red",
  },
  {
    id: 2,
    name: "Sabila Sayma",
    message: "Why am I so tired today 😅",
    time: "Today",
    icon: "heart",
    avatar: "https://img.freepik.com/free-psd/3d-illustration-business-man-with-glasses_23-2149436194.jpg?size=626&ext=jpg",
    iconColor: "pink",
  },
  {
    id: 3,
    name: "Alex Linderson",
    message: "Today is Monday",
    time: "Today",
    icon: "star",
    avatar: "https://img.freepik.com/free-psd/3d-rendering-avatar_23-2150833554.jpg?size=626&ext=jpg",
    iconColor: "blue",
  },
  {
    id: 4,
    name: "Jhon Abraham",
    message: "Hmm...",
    time: "Yesterday",
    icon: "shield",
    avatar: "https://img.freepik.com/premium-vector/flat-vector-illustration-animator_1033579-62857.jpg?size=626&ext=jpg",
    iconColor: "black",
  }
  ,
  {
    id: 5,
    name: "Jhon Abraham",
    message: "Hmm...",
    time: "Yesterday",
    icon: "shield",
    avatar: "https://img.freepik.com/premium-vector/flat-vector-illustration-animator_1033579-62857.jpg?size=626&ext=jpg",
    iconColor: "black",
  }
  ,
  {
    id: 6,
    name: "Jhon Abraham",
    message: "Hmm...",
    time: "Yesterday",
    icon: "shield",
    avatar: "https://img.freepik.com/premium-vector/flat-vector-illustration-animator_1033579-62857.jpg?size=626&ext=jpg",
    iconColor: "black",
  }
  ,
  {
    id: 7,
    name: "Jhon Abraham",
    message: "Hmm...",
    time: "Yesterday",
    icon: "shield",
    avatar: "https://img.freepik.com/premium-vector/flat-vector-illustration-animator_1033579-62857.jpg?size=626&ext=jpg",
    iconColor: "black",
  }
];

export const messages: Message[] = [
  {
    id: 1,
    sender: "Alice",
    content:
      "Hey! How are you?oapisejfhkjlsdfhbksjdfhkasldjfslkdjfhlsdkajhfaljskdfh",
    time: "10:30 AM",
    avatarUri: "https://randomuser.me/api/portraits/women/1.jpg",
    isOnline: true,
    unreadCount: 1,
    notificationsEnabled: true,
  },
  {
    id: 2,
    sender: "Bob",
    content: "Are we still on for lunch?",
    time: "09:45 AM",
    avatarUri: "https://randomuser.me/api/portraits/men/2.jpg",
    isOnline: false,
    unreadCount: 0,
    notificationsEnabled: false,
  },
  {
    id: 3,
    sender: "Charlie",
    content: "Check out this picture!",
    time: "Yesterday",
    avatarUri: "https://randomuser.me/api/portraits/men/3.jpg",
    isOnline: false,
    unreadCount: 3,
    notificationsEnabled: true,
  },
  {
    id: 4,
    sender: "Charlie",
    content: "Check out this picture!",
    time: "Yesterday",
    avatarUri: "https://randomuser.me/api/portraits/men/3.jpg",
    isOnline: false,
    unreadCount: 3,
    notificationsEnabled: true,
  },
  {
    id: 5,
    sender: "Charlie",
    content: "Check out this picture!",
    time: "Yesterday",
    avatarUri: "https://randomuser.me/api/portraits/men/3.jpg",
    isOnline: false,
    unreadCount: 3,
    notificationsEnabled: true,
  },
  {
    id: 6,
    sender: "Charlie",
    content: "Check out this picture!",
    time: "Yesterday",
    avatarUri: "https://randomuser.me/api/portraits/men/3.jpg",
    isOnline: false,
    unreadCount: 3,
    notificationsEnabled: true,
  },
];