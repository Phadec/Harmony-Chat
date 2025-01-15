import React, {useRef} from 'react';
import {View, Image, Text, useWindowDimensions, Pressable, StatusBar} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Animated, {Extrapolate, interpolate, useAnimatedRef, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withSpring, withTiming} from 'react-native-reanimated';

// Components
import {Button} from '@/components';

// Common
import {Colors} from '@/common';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedAntDesign = Animated.createAnimatedComponent(AntDesign);

const onboarding = [
	{id: 1, image: require('@/assets/images/onboarding-1.png'), title: 'Messaging with your friends is fun with Harmony'},
	{id: 2, image: require('@/assets/images/onboarding-2.png'), title: 'Use Harmony to communicate with your loved ones'},
	{id: 3, image: require('@/assets/images/onboarding-3.png'), title: 'You can create a community and reach more people'},
];

function Onboard({index, item, x}) {
	const {width: SCREEN_WIDTH} = useWindowDimensions();

	const imageAnimatedStyle = useAnimatedStyle(() => {
		const opacityAnimation = interpolate(x.value, [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH], [0, 1, 0], Extrapolate.CLAMP);

		const translateYAnimation = interpolate(x.value, [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH], [100, 0, 100], Extrapolate.CLAMP);

		return {
			width: SCREEN_WIDTH * 0.8,
			height: SCREEN_WIDTH * 0.8,
			opacity: opacityAnimation,
			transform: [{translateY: translateYAnimation}],
		};
	});

	const textAnimatedStyle = useAnimatedStyle(() => {
		const opacityAnimation = interpolate(x.value, [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH], [0, 1, 0], Extrapolate.CLAMP);

		const translateYAnimation = interpolate(x.value, [(index - 1) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 1) * SCREEN_WIDTH], [10, 0, 10], Extrapolate.CLAMP);

		return {
			opacity: opacityAnimation,
			transform: [{translateY: translateYAnimation}],
		};
	});

	return (
		<View className="flex-1 items-center justify-center" style={{width: SCREEN_WIDTH}}>
			<Animated.Image source={item.image} className="w-56 h-56" style={imageAnimatedStyle} resizeMode="contain" />

			<Animated.View className="mt-16 w-[90%]" style={textAnimatedStyle}>
				<Text className="font-rubik font-semibold text-2xl text-white leading-9 text-center">{item.title}</Text>
			</Animated.View>
		</View>
	);
}

function NextButton({dataLength, flatListIndex, flatListRef, navigation}) {
	const buttonAnimationStyle = useAnimatedStyle(() => {
		const isLastScreen = flatListIndex.value === dataLength - 1;
		return {
			width: isLastScreen ? withSpring(140) : withSpring(50),
			height: 50,
		};
	});

	const arrowAnimationStyle = useAnimatedStyle(() => {
		const isLastScreen = flatListIndex.value === dataLength - 1;
		return {
			opacity: isLastScreen ? withTiming(0) : withTiming(1),
			transform: [{translateX: isLastScreen ? withTiming(100) : withTiming(0)}],
		};
	});

	const textAnimationStyle = useAnimatedStyle(() => {
		const isLastScreen = flatListIndex.value === dataLength - 1;
		return {
			opacity: isLastScreen ? withTiming(1) : withTiming(0),
			transform: [{translateX: isLastScreen ? withTiming(0) : withTiming(-100)}],
		};
	});

	const handleNextScreen = () => {
		const isLastScreen = flatListIndex.value === dataLength - 1;
		if (!isLastScreen) {
			flatListRef.current?.scrollToIndex({index: flatListIndex.value + 1});
		} else {
			navigation.navigate('Auth');
		}
	};

	return (
		<AnimatedPressable 
			onPress={handleNextScreen} 
			className="rounded-full items-center justify-center overflow-hidden bg-white mx-auto mb-4" 
			style={[buttonAnimationStyle]}>
			<Animated.Text 
				className="font-rubik font-medium text-sm text-black" 
				style={[textAnimationStyle]}>
				Start Chat
			</Animated.Text>

			<AnimatedAntDesign 
				name="arrowright" 
				size={16} 
				color={Colors.main} 
				style={[{position: 'absolute'}, arrowAnimationStyle]} />
		</AnimatedPressable>
	);
}

function PaginationItem({index, x, screenWidth}) {
	const animatedDotStyle = useAnimatedStyle(() => {
		const widthAnimation = interpolate(x.value, [(index - 1) * screenWidth, index * screenWidth, (index + 1) * screenWidth], [10, 20, 10], Extrapolate.CLAMP);

		const opacityAnimation = interpolate(x.value, [(index - 1) * screenWidth, index * screenWidth, (index + 1) * screenWidth], [0.5, 1, 0.5], Extrapolate.CLAMP);

		return {
			width: widthAnimation,
			opacity: opacityAnimation,
		};
	});

	return <Animated.View className="w-2 h-2 rounded-lg bg-white mx-1" style={[animatedDotStyle]} />;
}

function Pagination({data, screenWidth, x}) {
	return (
		<View className="h-10 flex-row items-center justify-center mb-10">
			{data.map((item, index) => (
				<PaginationItem key={item.id} index={index} x={x} screenWidth={screenWidth} />
			))}
		</View>
	);
}

function OnboardingContainer({navigation}) {
	const {width: SCREEN_WIDTH} = useWindowDimensions();
	const insets = useSafeAreaInsets();
	const flatListRef = useAnimatedRef();

	const flatListIndex = useSharedValue(0);
	const x = useSharedValue(0);

	const onViewableItemsChanged = useRef(({viewableItems}) => {
		flatListIndex.value = viewableItems[0].index ?? 0;
	}).current;

	const onScroll = useAnimatedScrollHandler({
		onScroll: event => {
			x.value = event.contentOffset.x;
		},
	});

	return (
		<View className="flex-1 bg-main pb-10 px-8" style={{paddingTop: insets.top + 16}}>
			<View className="flex-row items-center justify-between">
				<Image source={require('@/assets/images/logo-thin.png')} className="w-7 h-5" resizeMode="contain" />

				<Button onPress={() => navigation.navigate('Auth')}>
					<Text className="font-rubik text-sm text-white/50">Skip</Text>
				</Button>
			</View>

			<View className="flex-1 -mx-8">
				<Animated.FlatList
					ref={flatListRef}
					data={onboarding}
					keyExtractor={item => item.id}
					renderItem={({item, index}) => <Onboard index={index} item={item} x={x} />}
					onScroll={onScroll}
					scrollEventThrottle={16}
					bounces={false}
					horizontal
					showsHorizontalScrollIndicator={false}
					pagingEnabled
					onViewableItemsChanged={onViewableItemsChanged}
				/>

				<Pagination data={onboarding} screenWidth={SCREEN_WIDTH} x={x} />
			</View>

			<NextButton 
				flatListRef={flatListRef}
				flatListIndex={flatListIndex} 
				dataLength={onboarding.length} 
				navigation={navigation} />
		</View>
	);
}

export default OnboardingContainer;
