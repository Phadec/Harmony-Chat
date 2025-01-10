import React, {useCallback, useMemo, useEffect} from "react";
import {Dimensions, Pressable, Text, View} from "react-native";
import Animated, {useSharedValue, useAnimatedStyle, withTiming} from "react-native-reanimated";
import ContextMenuActions from "../MessageContextMenu";
import Reactions from "../Reactions";

// Component Message Content
const MessageContent = React.memo(({message, me, formattedTime, width}) => (
	<View
		className={`flex-row items-center ${me ? 'justify-end' : 'justify-start'} py-1 `}>
		{me && (
			<Text className={`${me ? 'mr-3' : 'ml-3'} font-rubik text-2xs text-black/30`}>
				{formattedTime}
			</Text>
		)}
		<View style={{
			padding: 10, 
			borderRadius: 16, 
			backgroundColor: message === "Message has been deleted" ? '#e0e0e0' : (me ? '#9e5bd8' : '#f8f8f8'), 
			width: width
		}}>
			<Text style={{
				paddingStart: 5, 
				fontFamily: 'Rubik', 
				fontWeight: '300', 
				fontSize: 14, 
				color: message === "Message has been deleted" ? '#666' : (me ? 'white' : 'black'),
				fontStyle: message === "Message has been deleted" ? 'italic' : 'normal'
			}}>
				{message}
			</Text>
		</View>
	</View>
));

function MessageOverlay({message, position, onClose, messageId, onMessageDeleted, pinned, onPinToggle}) {
	if (!position || !message) {
		return null; // Không render nếu dữ liệu chưa đầy đủ
	}

	const {width} = Dimensions.get("window");
	const maxWidth = width * 0.6;

	const calculatedWidth = useMemo(() => {
		return Math.min(maxWidth, message.message.length * 8 + 30);
	}, [message.message.length, maxWidth]);

	// Shared values for animations
	const opacity = useSharedValue(0);
	const scale = useSharedValue(0.9);

	// Animated styles
	const overlayStyle = useAnimatedStyle(() => ({
		opacity: withTiming(opacity.value, {duration: 200}),
		transform: [{scale: withTiming(scale.value, {duration: 200})}],
	}));

	useEffect(() => {
		// Animate overlay when it mounts
		opacity.value = 1;
		scale.value = 1;

		return () => {
			// Reset animation values when unmounted
			opacity.value = 0;
			scale.value = 0.9;
		};
	}, [opacity, scale]);

	const handleClose = useCallback(() => {
		opacity.value = 0;
		scale.value = 0.9;
		onClose();
	}, [opacity, scale, onClose]);

	return (
		<Pressable
			style={{position: "absolute", width: "100%", height: "100%", justifyContent: "center",
				backgroundColor: "rgba(0,0,0,0.2)",}}
			onPress={handleClose}>
			<Animated.View style={[overlayStyle]}>
				<View className={`flex-col ${message.me ? "mr-3" : "ml-3"}`}>
					{/* Component Reaction */}
					<Reactions message={message}/>

					{/* Message Content */}
					<Animated.View className={`w-fit ${message.me ? "flex-row-reverse" : "flex-row"} items-center`}>
						<MessageContent
							message={message.message}
							me={message.me}
							formattedTime={message.formattedTime}
							width={calculatedWidth}
						/>
					</Animated.View>

					{/* Context Menu Action */}
					<Pressable onPress={(e) => e.stopPropagation()}>
						<ContextMenuActions
							me={message.me}
							onClose={handleClose}
							messageId={messageId}
							onMessageDeleted={onMessageDeleted}
							pinned={message.isPinned}
							onPinToggle={onPinToggle}
						/>
					</Pressable>
				</View>
			</Animated.View>
		</Pressable>
	);
}

export default MessageOverlay;
