import React from 'react';
import {View, Text} from 'react-native';

// icon
import Ionicons from 'react-native-vector-icons/Ionicons';
// commons
import {Constants, Colors} from '@/common';

// Custom hook
import useChatMessage from "../../hooks/ChatPrivate/ChatMessage";

// Animated, Gesture Handler
import Animated from "react-native-reanimated";
import {Directions, FlingGestureHandler, State} from "react-native-gesture-handler";


function ChatMessage({id, me, message, formattedTime, onSwipe}) {
	const {
		calculatedWidth,
		eventHandler,
		uas,
	} = useChatMessage(id, message, me);

	return (
		<FlingGestureHandler
			direction={me ? Directions.LEFT : Directions.RIGHT}
			onGestureEvent={eventHandler}
			onHandlerStateChange={({nativeEvent}) => {
				if (nativeEvent.state === State.ACTIVE) {
					onSwipe(message, me, id);
				}
			}}
		>
			<Animated.View
				style={[uas]}
				className={`${me ? 'flex-row-reverse ' : 'flex-row'} items-center mb-6`}>
				{me && (
					<View className="w-8 items-center">
						<Ionicons name="checkmark-done" size={16}
								  color={Constants.HexToRgba(Colors.black, 0.5)}/>
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

				{/* Thời gian gửi tin nhắn */}
				<Text className={`${me ? 'mr-3' : 'ml-3'} font-rubik text-2xs text-black/30`}>
					{formattedTime}
				</Text>
			</Animated.View>
		</FlingGestureHandler>
	);
};

export default React.memo(ChatMessage);
