import React from "react";
import {Image, Text, TouchableOpacity, View} from "react-native";

// Constants
import {baseURL} from "../../services/axiosInstance";

// Components
import {CustomContextMenu} from "@/components";

// Hooks
import {useContextMenu} from "@/hooks";

// Services
import {GroupService} from "@/services";

// Redux
import {useDispatch} from "react-redux";
import {actions as GroupRedux} from "@/redux/reducer/GroupRedux";


const GroupCard = ({group, navigation, index, totalItems}) => {
	const avatarUrl = `${baseURL}/${group.avatar}`;
	const dispatch = useDispatch();

	// Mute notification for group
	const muteNotification = async () => {
		await GroupRedux.muteGroup(dispatch, new GroupService(), group.id);
	}

	// Delete group
	const deleteGroup = async () => {
		// Call API to delete group
		await GroupRedux.deleteGroup(dispatch, new GroupService(), group.id);
	}

	const {
		menuRef,
		isSelected,
		setIsSelected,
		handleSelect,
		handlePress,
		handleLongPress,
		getMenuPosition
	} = useContextMenu({
		navigationTarget: 'GroupChat',
		navigationParams: {},
		onSelectCallbacks: {
			// Tùy chỉnh các callback cho message
			mute: () => muteNotification(),
			delete: () => deleteGroup(),
		}
	});

	return (
		<CustomContextMenu
			menuRef={menuRef}
			isSelected={isSelected}
			onClose={() => setIsSelected(false)}
			onSelect={handleSelect}
			menuPosition={getMenuPosition()}>

			{/* Group item (children)*/}
			<TouchableOpacity
				onPress={handlePress}
				onLongPress={handleLongPress}
			>
				<View className={`flex-row items-center rounded-2xl py-2 px-14 mb-3 ${
					isSelected ? 'bg-gray-100' : 'bg-light'
				}`}>
					<View className="relative w-11 h-11 rounded-full">
						<Image
							source={{uri: avatarUrl}}
							className="rounded-full w-10 h-10"
						/>
					</View>
					<View className="ml-3 flex-1">
						<Text className="font-rubik font-medium text-sm text-black leading-5">
							{group.name}
						</Text>
						{
							group.notificationsMuted && (
								<Text className="font-rubik font-normal text-xs text-gray-500">
									Notifications muted
								</Text>
							)
						}
					</View>
				</View>
			</TouchableOpacity>
		</CustomContextMenu>
	);
};

export default GroupCard;
