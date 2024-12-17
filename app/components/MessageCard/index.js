import React from 'react';
import {View, Image, Text} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {formatInTimeZone} from "date-fns-tz"; // Import date-fns-tz for timezone formatting

// Components
import {Button} from '@/components';

// Common
import {Constants, Colors} from '@/common';
import {ChatService} from "../../services/Chat";

function Status({color}) {
	return <View className="w-3 h-3 rounded-full border-2 border-white absolute -left-[1px] -top-[1px] "
				 style={{backgroundColor: Colors[color]}}/>;
}

function formatChatDate(chatDate) {
	const timeZone = 'Asia/Ho_Chi_Minh';
	return formatInTimeZone(new Date(chatDate), timeZone, "dd/MM HH:mm");
}

function MessageCard({item, navigation}) {
	// Check if the user has read the message
	const [hasRead, setHasRead] = React.useState(false);
	const chatService = new ChatService();

	const markAsRead = async () => {
		// Call the API to mark the message as read

	}

	return (
		<Button className="flex-row items-center bg-light rounded-2xl py-4 px-14 mb-3"
				onPress={() => navigation.navigate('Chat', {
					recipientId: item.contactId,
					contactFullName: item.contactFullName,
					contactNickname: item.contactNickname,
					status: item.status,
					avatar: item.avatar,
				})}>
			<View className="relative w-11 h-11 rounded-full">
				<Image source={require('@/assets/images/story-1.png')}
					   className="rounded-full w-11 h-11"/>

				{/*Kiểm tra trạng thái nếu online thì hiện ko thì tắt*/}
				{item.status && <Status color={"green"}/>}

				<View className="absolute -bottom-[2px] -right-[2px]">
					<Text>👽</Text>
				</View>
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
						{item.lastMessage}
					</Text>
				</View>
			</View>

			<View className="ml-2">
				<Text
					className={`font-rubik ${item.hasNewMessage ? 'font-bold' : 'font-medium text-black/40'}  text-xs text-black`}>
					{formatChatDate(item.chatDate)}
				</Text>

				{/*thay đổi ở đây một chấm đỏ ở đây để thông báo khi hasNewMessage === true*/}
				<View className={`${item.hasNewMessage ? 'bg-red rounded-2xl items-center mt-2 w-3 ml-auto py-1.5' : '' }`}/>
			</View>
		</Button>);
}

export default MessageCard;
