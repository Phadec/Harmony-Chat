import {useRef, useState} from "react";
import {useNavigation} from "@react-navigation/native";

function useContextMenu(
	options = {
		navigationTarget: 'Chat',
		navigationParams: {},
		onSelectCallbacks: {},
		menuPosition: {
			isBottomThird: true,
			topMargin: 70,
			bottomMargin: 5
		}
	})
{
	const menuRef = useRef(null);
	const [isSelected, setIsSelected] = useState(false);
	const navigation = useNavigation();

	const handleSelect = (value) => {
		// Gọi callback tương ứng nếu được cung cấp
		if (options.onSelectCallbacks && options.onSelectCallbacks[value]) {
			options.onSelectCallbacks[value]();
		} else {
			// Xử lý mặc định
			switch (value) {
				case 'mark_unread':
					console.log('Marked as unread');
					break;
				case 'mute':
					console.log('Muted');
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
		getMenuPosition
	};
};

export default useContextMenu;
