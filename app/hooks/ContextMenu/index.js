import {useRef, useState} from "react";
import {useNavigation} from "@react-navigation/native";

// Services
import {ChatService} from "../../services/Chat";
import {FriendService} from "@/services";

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

	// hàm markAsRead
	const handleMarkAsRead = async () => {
		try {
			if (!item) {
				console.warn('No chat found to mark as read.');
				return;
			}
			const response = await chatService.markMessageAsRead(item.chatId);
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
			const response = await friendService.muteFriendNotification(item.id);

			if (response) {
				console.log('Muted success for friend:', item.fullName);
			}
		} catch (error) {
			console.error('Error muting chat:', error);
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
				case 'mute':
					handleMuteFriendNotification();
					break;
				case 'hide':
					console.log('Hidden');
					break;
				case 'delete':
					console.log('Deleted');
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
		const {isBottomThird = true, topMargin = 70, bottomMargin = 5} = options.menuPosition || {};
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
