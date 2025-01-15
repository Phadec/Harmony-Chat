import React, {useRef, useState} from 'react';
import {View, Image, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {baseURL} from '../../services/axiosInstance'; // Import baseURL

// Common
import {Constants, Colors} from '@/common';

// Components
import {CustomContextMenu} from '@/components';

// Hooks
import {useContextMenu} from "@/hooks";

// Utils
import {formatChatDate} from "../../utils/date";

function Status({color}) {
	return <View className="w-3 h-3 rounded-full border-2 border-white absolute -left-[1px] -top-[1px] "
		style={{backgroundColor: Colors[color]}}/>;
}

function MessageCard({item, navigation}) {
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
		navigationTarget: 'ChatPrivate',
		navigationParams: {
			recipientId: item.contactId,
			contactFullName: item.contactFullName,
			contactNickname: item.contactNickname,
			status: item.status,
			avatar: {uri: avatarUrl},
			online: item.online,
		},
	});
	
	const menuOptions = [
		{value: 'mute', icon: '🔕', text: 'Mute/Unmute'},
		{value: item.hasNewMessage ? 'mark_read' : 'mark_unread', icon: '🔄', text: item.hasNewMessage ? 'Mark as Read' : 'Mark as unread'},
		{value: 'block', icon: '🚫', text: 'Block'},
		{value: 'delete', icon: '🗑️', text: 'Delete', color: 'red'},
	];

	return (
		<CustomContextMenu
			menuRef={menuRef}
			isSelected={isSelected}
			onClose={() => setIsSelected(false)}
			onSelect={handleSelect}
			menuPosition={getMenuPosition()}
			options={menuOptions}
		>

			{/* Message item */}
			<TouchableOpacity
				onPress={handlePress}
				onLongPress={handleLongPress}
			>
				<View className={`flex-row items-center rounded-2xl py-2 px-14 mb-3 ${
					isSelected ? 'bg-gray-100' : 'bg-light'
				}`}>
					<View className="relative w-11 h-11 rounded-full">
						<Image source={{uri: avatarUrl}}
							   className="rounded-full w-11 h-11"/>

						{/*Kiểm tra trạng thái nếu online thì hiện ko thì tắt*/}
						{item.status === 'online' ? <Status color={"green"}/> : ''}

						{/*Kiểm tra xem người dùng đọc chưa, nếu chưa thì in đậm*/}
						{/*<View className="absolute -bottom-[2px] -right-[2px]">*/}
						{/*	<Text>👽</Text>*/}
						{/*</View>*/}
					</View>

					<View className="ml-3 flex-1">
						{/*Kiểm tra xem người dùng đọc chưa, nếu chưa thì in đậm*/}
						<Text
							className={`font-rubik ${item.hasNewMessage ? 'font-bold' : 'font-medium'} text-sm text-black leading-5`}>
							{item.contactNickname ? item.contactNickname : item.contactFullName}
						</Text>

						<View className="flex-row items-center mt-1">
							<Ionicons name="checkmark-done-outline" size={14}
									  color={Constants.HexToRgba(Colors.black, 0.4)}/>
							<Text
								className={`font-rubik ${item.hasNewMessage ? 'font-bold' : 'font-medium'} text-xs text-black ml-1`}>
								{
									item.lastMessage.length > 30 ? `${item.lastMessage.slice(0, 30)}...` : item.lastMessage
								}
							</Text>
						</View>
					</View>

					<View className="ml-2">
						<Text
							className={`font-rubik ${item.hasNewMessage ? 'font-bold' : 'font-medium text-black/40'}  text-xs text-black`}>
							{formatChatDate(item.chatDate)}
						</Text>

						{/*thay đổi ở đây một chấm đỏ ở đây để thông báo khi hasNewMessage === true*/}
						<View
							className={`${item.hasNewMessage ? 'bg-red rounded-2xl items-center mt-2 w-3 ml-auto py-1.5' : ''}`}/>
					</View>
				</View>
			</TouchableOpacity>
		</CustomContextMenu>
	);
}
export default MessageCard;

