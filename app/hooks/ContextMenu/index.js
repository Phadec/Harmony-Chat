import { useRef, useState } from "react";
import { useNavigation } from "@react-navigation/native";

// Services
import { FriendService, ChatService } from "@/services";
import { removeFriend, updateFriend } from "../../redux/reducer/FriendRedux";
import { useDispatch } from "react-redux";
import { Alert } from "react-native";

function useContextMenu(
	options = {
		item: null,
		navigationTarget: 'Chat',
		navigationParams: {},
		onSelectCallbacks: {},
		menuPosition: {
			isBottomThird: true,
			topMargin: 70,
			bottomMargin: 5
		}
	}) {
	const item = options.item ? options.item : null;
	const menuRef = useRef(null);
	const [isSelected, setIsSelected] = useState(false);
	const navigation = useNavigation();
	const chatService = new ChatService();
	const dispatch = useDispatch();

	// hàm markAsRead
	const handleMarkAsRead = async () => {
		try {
			if (!item) return;

			const response = await chatService.markMessageAsRead(item.chatId);
			if (response) {
				console.log(`Marked message from ${item.contactFullName} as read successfully!`);
				// dispatch(updateMessage({ ...item, hasNewMessage: false }));
			}
		} catch (error) {
			console.error('Error marking as read:', error);
		}
	};

	// Hàm Mute
	const handleMuteFriendNotification = async () => {
		try {
			if (!item) {
				console.warn('No item found to mute.');
				return;
			}
			const friendService = new FriendService();
			const response = await friendService.muteFriendNotification(item.contactId);

			if (response) {
				console.log('Muted success for friend:', item.fullName);
				dispatch(updateFriend({ ...item, notificationsMuted: !item.notificationsMuted }));
			}
		} catch (error) {
			console.error('Error muting chat:', error);
		}
	};

	// unFriend
	const unFriend = async () => {
		try {
			const friendService = new FriendService();
			const response = await friendService.unFriend(item.contactId);
			if (response) {
				Alert.alert(`Unfriend with ${item.fullName} successfully!`);
				dispatch(removeFriend(item.id));
			}
		} catch (error) {
			console.log('Error unfriend:', error);
		}
	};

	//delete chat
	const deleteChat = async () => {
		try {
			if (!item) return;
			const response = await chatService.deleteChat(item.c);
			if (response) {
				console.log(`Deleted chat with ${item.contactFullName} successfully!`);
				Alert.alert(`Chat with ${item.contactFullName} has been deleted.`);
				// dispatch(updateMessage({ ...item, hasNewMessage: false }));
			}
		} catch (error) {
			console.error('Error deleting chat:', error);
		}
	};

	//Block
	const handleBlockUser = async () => {
		try {
			Alert.alert(
				"",
				`Are you sure you want to block ${item.fullName}? You won't be able to:
				• See their posts
				• Receive messages from them
				• They won't be able to find you`,
				[
					{
						text: "Cancel",
						style: "cancel"
					},
					{
						text: "Block",
						style: 'destructive',
						onPress: async () => {
							const friendService = new FriendService();
							const response = await friendService.blockUser(item.contactId);
							if (response) {
								dispatch(removeFriend(item.id));
							}
						}
					}
				]
			);
		} catch (error) {
			console.error('Error blocking user:', error);
		}
	};

	const handleSelect = (value) => {
		if (options.onSelectCallbacks && options.onSelectCallbacks[value]) {
			options.onSelectCallbacks[value]();
		} else {
			switch (value) {
				case 'mark_read':
					handleMarkAsRead();
					break;
				case 'mark_unread':
					console.log('unRead');
					break;
				case 'mute':
					handleMuteFriendNotification();
					break;
				case 'block':
					handleBlockUser();
					break;
				case 'hide':
					console.log('Hidden');
					break;
				case 'delete':
					deleteChat();
					break;
				case 'block':
					handleBlockUser();
					break;
				default:
					throw new Error('Unknown option');
			}
		}
		setIsSelected(false);
	};

	const handlePress = () => {
		navigation.navigate(options.navigationTarget, options.navigationParams);
	};

	const handleLongPress = () => {
		setIsSelected(true);
		menuRef.current.open();
	};

	const getMenuPosition = () => {
		const { isBottomThird = true, topMargin = 70, bottomMargin = 5 } = options.menuPosition || {};
		return {
			marginTop: isBottomThird ? topMargin : 0,
			marginBottom: isBottomThird ? bottomMargin : 0,
		};
	};

	return {
		menuRef,
		isSelected,
		setIsSelected,
		handleSelect,
		handlePress,
		handleLongPress,
		getMenuPosition,
	};
};

export default useContextMenu;
