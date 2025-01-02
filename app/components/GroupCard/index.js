import React from 'react';
import {View, Image, Text, TouchableOpacity} from 'react-native';

// Components
import {CustomContextMenu} from "@/components/";

import {ChatGroup} from "@/services/ChatGroup";


// Hooks
import {useContextMenu} from "@/hooks";

// Utils
import {baseURL} from "../../services/axiosInstance";

function GroupCard({item, navigation}) {
	const avatarUrl = `${baseURL}/${item.avatar}`;

	const {
		menuRef,
		isSelected,
		setIsSelected,
		handleSelect,
		handlePress,
		handleLongPress,
		getMenuPosition
	} = useContextMenu({
		item: item,
		navigationTarget: 'GroupChat',
		navigationParams: {
			recipientId: item.id,
			avatar: {uri: avatarUrl},
			nameGroup: item.name
		},
		onSelectCallbacks: {}
	});

	return (
		<CustomContextMenu
			menuRef={menuRef}
			isSelected={isSelected}
			onClose={() => setIsSelected(false)}
			onSelect={handleSelect}
			menuPosition={getMenuPosition()}>

			{/* Group item */}
			<TouchableOpacity
				onPress={handlePress}
				onLongPress={handleLongPress}>
				<View
					className={`flex-row items-center rounded-2xl py-2 px-14 mb-3 ${isSelected ? 'bg-gray-100' : 'bg-light'}`}
					// onPress={() => navigation.navigate('GroupChat')}
				>
					<View className="relative w-11 h-11 rounded-full">
						<Image source={{uri: avatarUrl}} className="rounded-full w-11 h-11"/>
					</View>

					<View className="ml-3 flex-1">
						<Text className="font-rubik font-medium text-sm text-black leading-5">{item.name}</Text>

						<View className="flex-row items-center mt-1">
							<Text
								className={`font-rubik ${item.hasNewMessage ? 'font-bold' : 'font-medium'} text-xs text-black ml-1`}>
								{item.senderFullName}: {item.lastMessage}
							</Text>
						</View>
					</View>

					<View className="ml-2">
						<Text
							className={`font-rubik ${item.hasNewMessage ? 'font-bold' : 'font-medium text-black/40'}  text-xs text-black`}>
							{/* {formatChatDate(item.chatDate)} */}
						</Text>
						<View
							className={`${item.hasNewMessage ? 'bg-red rounded-2xl items-center mt-2 w-3 ml-auto py-1.5' : ''}`}/>
					</View>
				</View>
			</TouchableOpacity>
		</CustomContextMenu>
	);
}

export default GroupCard;
