import React, { useCallback, useMemo } from 'react';
import {Dimensions, TouchableOpacity} from 'react-native';

// Animated, Gesture Handler
import {useAnimatedGestureHandler, useAnimatedStyle, useSharedValue, withSpring} from "react-native-reanimated";

export const useChatMessage = (id, message, me) => {
	// Calculate dynamic width
	const { width } = Dimensions.get('window');
	const maxWidth = width * 0.6;

	const calculatedWidth = useMemo(() => {
		return Math.min(maxWidth, message.length * 8 + 30);
	}, [message.length, maxWidth]);

	// Animation cho reply
	const startPosition = 0;
	const x = useSharedValue(startPosition);
	const eventHandler = useAnimatedGestureHandler({
		onStart: (event, ctx) => {},
		onActive: (event, ctx) => {
			x.value = me ? -60 : 60;
		},
		onEnd: (event, ctx) => {
			x.value = withSpring(startPosition);
		},
	})

	const uas = useAnimatedStyle(() => {
		return {
			transform: [{translateX: x.value}]
		}
	})

	return {
		calculatedWidth,
		eventHandler,
		uas,
	};
};

export default useChatMessage;
