import React, {useMemo} from 'react';
import Animated, {Extrapolate, interpolate, useAnimatedStyle} from 'react-native-reanimated';
import {Colors, Constants} from '@/common';

const CustomBackdrop = ({animatedIndex, style}) => {
	// animated variables
	const containerAnimatedStyle = useAnimatedStyle(() => ({
		opacity: interpolate(animatedIndex.value, [0, 1], [0, 1], Extrapolate.CLAMP),
	}));

	// styles
	const containerStyle = useMemo(
		() => [
			style,
			{
				backgroundColor: Constants.HexToRgba(Colors.black, 0.8),
			},
			containerAnimatedStyle,
		],
		[style, containerAnimatedStyle],
	);

	return <Animated.View style={containerStyle} />;
};

export default CustomBackdrop;
