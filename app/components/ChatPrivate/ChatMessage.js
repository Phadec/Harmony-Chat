// ChatMessage.js
import React from 'react';
import {View, Text, Dimensions} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {Constants, Colors} from '@/common';

function ChatMessage ({me, message}) {
	// Lấy chiều rộng màn hình
	const {width} = Dimensions.get('window');
	const maxWidth = width * 0.6; // 60% chiều rộng màn hình

	// Tính độ rộng động của View dựa trên độ dài tin nhắn
	const calculatedWidth = Math.min(maxWidth, message.length * 8 + 40);

	return (
		<View className={`${me ? 'flex-row-reverse ' : 'flex-row'} items-center mb-6`}>
			{me && (
				<View className="w-8 items-center">
					<Ionicons name="checkmark-done" size={16}
							  color={Constants.HexToRgba(Colors.black, 0.5)} />
				</View>
			)}
			{/* View tin nhắn có chiều rộng động */}
			<View
				style={{
					padding: 10,
					borderRadius: 10,
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

			<Text className={`${me ? 'mr-3' : 'ml-3'} font-rubik text-2xs text-black/30`}>
				21:22
			</Text>
		</View>
	);
};

export default ChatMessage;
