// Tách MessageContent thành component riêng
import React, {} from 'react';
import useChatMessage from "../../hooks/ChatPrivate/ChatMessage";
import {GestureDetector} from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import {Text, View} from "react-native";

export const MessageContent = React.memo(
	({message, me, formattedTime, width, composedGesture}) => (

	<GestureDetector
		gesture={composedGesture}>
		<View
			className={`flex-row items-center ${me ? 'justify-end' : 'justify-start'} py-1 `}>
			{me && (
				<Text className={`${me ? 'mr-3' : 'ml-3'} font-rubik text-2xs text-black/30`}>
					{formattedTime}
				</Text>
			)}
			<View style={{padding: 10, borderRadius: 16, backgroundColor: me ? '#9e5bd8' : '#f8f8f8', width: width,}}>
				<Text style={{
					paddingStart: 5,
					fontFamily: 'Rubik',
					fontWeight: '300',
					fontSize: 14,
					color: me ? 'white' : 'black',
				}}>
					{message}
				</Text>
			</View>
			{!me && (
				<Text className={`${me ? 'mr-3' : 'ml-3'} font-rubik text-2xs text-black/30`}>
					{formattedTime}
				</Text>
			)}
		</View>
	</GestureDetector>
));

// Component chính
function ChatMessage({message, onSwipe, onLongPress, onCloseActions}) {
	const {
		calculatedWidth,
		composedGesture,
		panStyle,
	} = useChatMessage(
		message,
		onSwipe,
		onLongPress,
		onCloseActions
	);

	return (
		<View className={`flex-col ${message.me ? 'mr-3' : ''}`}>
			<Animated.View
				style={[panStyle]}
				className={`w-fit ${message.me ? 'flex-row-reverse' : 'flex-row'} items-center`}>
				<MessageContent
					message={message.message}
					me={message.me}
					formattedTime={message.formattedTime}
					width={calculatedWidth}
					composedGesture={composedGesture}
				/>
			</Animated.View>
		</View>
	);
}

export default React.memo(ChatMessage);
