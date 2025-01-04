import React, {useRef, useEffect} from 'react';
import {Animated, Text, View} from 'react-native';

function TypingIndicator() {
	const dot1 = useRef(new Animated.Value(0)).current;
	const dot2 = useRef(new Animated.Value(0)).current;
	const dot3 = useRef(new Animated.Value(0)).current;

	// Animation
	useEffect(() => {
		const animateDot = (dot, delay) => {
			Animated.loop(
				Animated.sequence([
					Animated.timing(dot, {
						toValue: 1,
						duration: 300,
						delay,
						useNativeDriver: true,
					}),
					Animated.timing(dot, {
						toValue: 0,
						duration: 300,
						useNativeDriver: true,
					}),
				])
			).start();
		};

		animateDot(dot1, 0); // Không delay
		animateDot(dot2, 300); // Delay 300ms
		animateDot(dot3, 600); // Delay 600ms
	}, [dot1, dot2, dot3]);

	return (
		<View className="p-2.5 bg-gray-100 rounded-3xl self-start my-2.5 flex-row items-center">
			<View className="flex-row">
				<Animated.View
					style={[
						{
							width: 6,
							height: 6,
							borderRadius: 3,
							backgroundColor: '#555',
							marginHorizontal: 2,
							opacity: dot1,
							transform: [{ scale: dot1 }],
						},
					]}
				/>
				<Animated.View
					style={[
						{
							width: 6,
							height: 6,
							borderRadius: 3,
							backgroundColor: '#555',
							marginHorizontal: 2,
							opacity: dot2,
							transform: [{ scale: dot2 }],
						},
					]}
				/>
				<Animated.View
					style={[
						{
							width: 6,
							height: 6,
							borderRadius: 3,
							backgroundColor: '#555',
							marginHorizontal: 2,
							opacity: dot3,
							transform: [{ scale: dot3 }],
						},
					]}
				/>
			</View>
		</View>
	)
}

export default TypingIndicator;
