import React from 'react';
import {View, Image, Text} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Components
import {Button} from '@/components';

// Common
import {Constants, Colors} from '@/common';
import {baseURL} from "../../services/axiosInstance";
import {formatInTimeZone} from "date-fns-tz";

function formatChatDate(chatDate) {
	const timeZone = 'Asia/Ho_Chi_Minh';
	const date = new Date(chatDate);
	date.setHours(date.getHours() + 7); // Adjust the date by adding 7 hours

	// Kiểm tra nếu là hôm nay thi chỉ hiển thị giờ, ngược lại hiển thị ngày tháng va giờ
	const today = new Date();
	if (date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()) {
		return formatInTimeZone(date, timeZone, "HH:mm");
	}

	return formatInTimeZone(date, timeZone, "dd/MM HH:mm");
}

function GroupCard({item, navigation}) {
	const avatarUrl = `${baseURL}/${item.avatar}`;


	return (
		<Button className="flex-row items-center bg-light rounded-2xl py-4 px-14 mb-3"
				onPress={() => navigation.navigate('GroupChat')}>
			<View className="relative w-11 h-11 rounded-full">
				<Image source={{uri: avatarUrl}} className="rounded-full w-11 h-11"/>
			</View>

			<View className="ml-3 flex-1">
				<Text className="font-rubik font-medium text-sm text-black leading-5">{item.groupName}</Text>

				<View className="flex-row items-center mt-1">
					<Ionicons name="checkmark-done-outline" size={14} color={Constants.HexToRgba(Colors.black, 0.4)}/>
					<Text
						className={`font-rubik ${item.hasNewMessage ? 'font-bold' : 'font-medium'} text-xs text-black ml-1`}>
						{item.senderFullName}: {item.lastMessage}
					</Text>
				</View>
			</View>

			<View className="ml-2">
				<Text className={`font-rubik ${item.hasNewMessage ? 'font-bold' : 'font-medium text-black/40'}  text-xs text-black`}>
					{formatChatDate(item.chatDate)}
				</Text>
				<View className={`${item.hasNewMessage ? 'bg-red rounded-2xl items-center mt-2 w-3 ml-auto py-1.5' : '' }`}/>
			</View>
		</Button>
	);
}

export default GroupCard;
