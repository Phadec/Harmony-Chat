import React, { useEffect } from 'react';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
	withSpring
} from "react-native-reanimated";
import { Text, View, Pressable } from "react-native";
import { Button } from "@/components";

function DropUp({ isVisible, onClose }) {
	const opacity = useSharedValue(0);
	const translateY = useSharedValue(30);

	const animatedStyle = useAnimatedStyle(() => {
		return {
			opacity: opacity.value,
			transform: [{ translateY: translateY.value }]
		};
	});

	useEffect(() => {
		if (isVisible) {
			opacity.value = withTiming(1, { duration: 200 });
			translateY.value = withSpring(0, {
				damping: 15,
				stiffness: 90
			});
		} else {
			opacity.value = withTiming(0, { duration: 200 });
			translateY.value = withSpring(30);
		}
	}, [isVisible]);

	if (!isVisible) return null;

	return (
		<Animated.View
			className="absolute bottom-7 right-24 w-40"
			style={[animatedStyle, { zIndex: 50 }]}
		>
			<Pressable onPress={(e) => e.stopPropagation()}>
				<View className="bg-white rounded-3xl py-3 shadow-lg">
					<Button className="px-6 py-3">
						<Text className="font-rubik font-light text-sm text-black">
							Mark as read
						</Text>
					</Button>

					<Button className="px-6 py-3">
						<Text className="font-rubik font-light text-sm text-black">
							Mute
						</Text>
					</Button>

					<Button className="px-6 py-3">
						<Text className="font-rubik font-light text-sm text-black">
							Leave the group
						</Text>
					</Button>

					<Button className="px-6 py-3">
						<Text className="font-rubik font-light text-sm text-black">
							Delete
						</Text>
					</Button>
				</View>
			</Pressable>
		</Animated.View>
	);
}

export default DropUp;
