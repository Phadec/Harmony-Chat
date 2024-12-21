import {Dimensions, Text, View} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import moment from "moment-timezone";
import React from "react";

function ChatRow({me, message, date}) {
	// Lấy chiều rộng màn hình
	const {width} = Dimensions.get('window');
	const maxWidth = width * 0.6; // 60% chiều rộng màn hình

	// Tính độ rộng động của View dựa trên độ dài tin nhắn
	const calculatedWidth = Math.min(maxWidth, message.length * 8 + 40);

	return (
		<View className={`${me ? 'flex-row-reverse' : 'flex-row'} items-center mb-6`}>
			{/* Hiển thị icon cho tin nhắn của me */}
			{me && (
				<View className="w-8 items-center">
					<Ionicons name="checkmark-done" size={16} color="rgba(0, 0, 0, 0.5)"/>
				</View>
			)}

			{/* View tin nhắn có chiều rộng động */}
			<View
				style={{
					padding: 10,
					borderRadius: 14,
					backgroundColor: me ? '#9e5bd8' : '#E0E0E0',
					width: calculatedWidth, // Áp dụng chiều rộng động
				}}>
				<Text
					style={{
						paddingStart: 5,
						fontFamily: 'Rubik',
						fontWeight: '300',
						fontSize: 14,
						color: me ? 'white' : 'black',
					}}>
					{message}
				</Text>
			</View>

			{/* Hiển thị thời gian */}
			<Text className={`${me ? 'mr-3' : 'ml-3'} font-rubik text-2xs text-black/30`}>
				{moment(message.date).format('HH:mm')}
			</Text>
		</View>
	);
}

export default ChatRow;
