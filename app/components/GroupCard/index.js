import React from 'react';
import {View, Image, Text, TouchableOpacity} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Components
import {CustomContextMenu} from "@/components/";


// Hooks
import {useContextMenu} from "@/hooks";

// Common
import {Constants, Colors} from '@/common';

// Utils
import {baseURL} from "../../services/axiosInstance";
import { count } from 'rxjs';

function GroupCard({item, navigation}) {
	const avatarUrl = `${baseURL}/${item.avatar}`;
	console.log('GroupCard', item);
	// Mask as read

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
			nameGroup: item.name,
			countMembers: 10
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
