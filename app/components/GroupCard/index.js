import React from "react";
import {Image, Text, TouchableOpacity, View} from "react-native";

// Constants
import {baseURL} from "../../services/axiosInstance";

// Components
import {CustomContextMenu} from "@/components";

// Hooks
import {useContextMenu} from "@/hooks";


const GroupCard = ({group, navigation, index, totalItems}) => {
	const avatarUrl = `${baseURL}/${group.avatar}`;
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
			mark_read: () => console.log('Custom mark read for message'),
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
					</View>
				</View>
			</TouchableOpacity>
		</CustomContextMenu>
	);
};

export default GroupCard;
