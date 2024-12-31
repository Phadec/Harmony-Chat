import React, {useEffect} from 'react';
import {Image, View, useWindowDimensions, TouchableOpacity} from 'react-native';
import {getFocusedRouteNameFromRoute} from '@react-navigation/native';
import Animated, {useSharedValue, useAnimatedStyle, withTiming} from 'react-native-reanimated';

function Tabbar({state, descriptors, navigation}) {
	const {width} = useWindowDimensions();
	const tabWidth = width / state.routes.length;
	const tabWidthShared = useSharedValue(0);
	const margin = useSharedValue(0);

	const AnimatedButton = Animated.createAnimatedComponent(TouchableOpacity);

	const shapeAnimation = useAnimatedStyle(() => {
		return {
			transform: [{translateX: tabWidthShared.value}],
		};
	});

	const marginAnimation = useAnimatedStyle(() => {
		return {
			marginBottom: margin.value,
		};
	});

	useEffect(() => {
		const multiplier = state.index;

		tabWidthShared.value = withTiming(tabWidth * multiplier, {duration: 200});
		margin.value = 0;

		setTimeout(() => (margin.value = withTiming(40)), 100);
	}, [state.index]);

	let route = state.routes[state.index];
	let routeName = route?.name || 'Home';

	const stackName = getFocusedRouteNameFromRoute(route);

	if ((routeName === 'Root:Messages' && stackName === 'Chat')
		|| (routeName === 'Root:Messages' && stackName === 'GroupChat')
		|| (routeName === 'Root:Groups' && stackName === 'GroupChat')
		|| (routeName === 'Root:Stories' && stackName === 'Chat')
		|| (routeName === 'Root:Stories' && stackName === 'AddFriend')
		|| (routeName === 'Root:Calls' && stackName === 'Calling')
	) return null;

	return (
		<View className="flex-row items-center justify-evenly bg-main h-20 relative">
			{state.routes.map((route, index) => {
				const {options} = descriptors[route.key];
				const Icon = options.tabBarIcon;
				const isFocused = state.index === index;

				const onPress = () => {
					const event = navigation.emit({
						type: 'tabPress',
						target: route.key,
					});

					if (!isFocused && !event.defaultPrevented) {
						navigation.navigate(route.name);
					}
				};

				const onLongPress = () => {
					navigation.emit({
						type: 'tabLongPress',
						target: route.key,
					});
				};

				return (
					<View key={index} className="relative items-center justify-center z-10" style={{width: tabWidth}}>
						<AnimatedButton
							className={`relative z-10 items-center justify-center rounded-full bg-main
							${isFocused ? 'w-12 h-12' : 'w-full h-20'}`}
							style={[state.index === index && marginAnimation]}
							accessibilityRole="button"
							accessibilityStates={isFocused ? ['selected'] : []}
							accessibilityLabel={options.tabBarAccessibilityLabel}
							testID={options.tabBarTestID}
							onPress={onPress}
							onLongPress={onLongPress}
							activeOpacity={0.8}
							bordered={isFocused}>
							<Icon focused={isFocused} />
						</AnimatedButton>
					</View>
				);
			})}

			<Animated.View className="h-20 absolute left-0 bottom-0 items-center justify-center" style={[{width: tabWidth}, shapeAnimation]}>
				<Image source={require('@/assets/images/button.png')} className="w-32 h-16 absolute bottom-8" style={{left: -(130 - tabWidth) / 2}} resizeMode="contain" />
			</Animated.View>
		</View>
	);
}

export default Tabbar;
