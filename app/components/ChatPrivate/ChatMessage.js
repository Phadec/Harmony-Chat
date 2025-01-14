// Tách MessageContent thành component riêng
import React, {useState} from 'react';
import useChatMessage from "../../hooks/ChatPrivate/ChatMessage";
import {GestureDetector} from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import {Text, View} from "react-native";
import BubbleReactions from "./BubbleReactions";

const MessageContent = React.memo(
	({
		 message, me, formattedTime, reactions, width,
		 composedGesture,    heartStyle,
		 opacity
	 }) => {
		return (
			<GestureDetector gesture={composedGesture}>
				<View className={`flex-row items-center ${me ? 'justify-end' : 'justify-start'} py-1`}>
					{me && (
						<Text className={`${me ? 'mr-3' : 'ml-3'} font-rubik text-2xs text-black/30`}>
							{formattedTime}
						</Text>
					)}
					<View className="relative">
						<View style={{
							padding: 10,
							borderRadius: 8,
							backgroundColor: me ? '#9e5bd8' : '#f8f8f8',
							width: width,
						}}>
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

						{/* Heart Animation */}
						<Animated.View style={heartStyle}>
							<Text style={{fontSize: 24}}>❤️</Text>
						</Animated.View>

						{/* Bubble reactions */}
						{reactions.length > 0 && <BubbleReactions me={me} reactions={reactions}/>}
					</View>
					{!me && (
						<Text className={`${me ? 'mr-3' : 'ml-3'} font-rubik text-2xs text-black/30`}>
							{formattedTime}
						</Text>
					)}
				</View>
			</GestureDetector>
		)
	});

// Component chính
function ChatMessage({avatar, message, onSwipe, onLongPress, onCloseActions}) {
	const {
		reactions,
		calculatedWidth,
		composedGesture,
		panStyle,
		heartStyle,
		opacity,
	} = useChatMessage(
		avatar,
		message,
		onSwipe,
		onLongPress,
	);
	return (
		<View className={`flex-col ${message.me ? 'mr-3' : ''}`}>
			<Animated.View
				style={[panStyle]}
				className={`w-fit ${message.me ? 'flex-row-reverse' : 'flex-row'} items-center
				${reactions.length > 0 ? 'pb-5' : ''}`}>
				<MessageContent
					message={message.message}
					me={message.me}
					formattedTime={message.formattedTime}
					reactions={reactions}
					width={calculatedWidth}
					composedGesture={composedGesture}
					heartStyle={heartStyle}
					opacity={opacity}
				/>
			</Animated.View>
		</View>
	);
}

export default React.memo(ChatMessage);
