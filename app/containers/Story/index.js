import React, {useRef, useMemo, useCallback, useState} from 'react';
import {ImageBackground, View, Image, Text} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Svg, {Circle} from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import {BlurView} from '@react-native-community/blur';
import ConfettiCannon from 'react-native-confetti-cannon';
import BottomSheet from '@gorhom/bottom-sheet';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Octicons from 'react-native-vector-icons/Octicons';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Components
import {Button, Input, CustomBackdrop} from '@/components';

// Commons
import {Colors, Constants} from '@/common';

function StoryShape({size, count}) {
	const numberOfDots = (2 * 3.14 * 26) / count;

	return (
		<Svg width={size} height={size}>
			<Circle cx={size / 2} cy={size / 2} r={size / 2 - 2} fill="none" stroke={Colors.orange} strokeDasharray={`${numberOfDots} 4`} strokeDashoffsett={numberOfDots} strokeWidth={4} />
		</Svg>
	);
}

function Comment() {
	return (
		<View className="px-6 py-10">
			<View className="flex-row items-center">
				<Octicons name="comment-discussion" size={24} color={Colors.main} />
				<Text className="font-rubik font-medium text-sm text-main ml-2">Comment</Text>
			</View>

			<View className="bg-light rounded-3xl p-4 flex-row items-center mt-5">
				<Input placeholder="Write a comment..." placeholderTextColor={Constants.HexToRgba(Colors.black, 0.4)} className="font-rubik text-xs text-black mr-auto flex-1" />
				<Ionicons name="send" size={20} color={Colors.main} />
			</View>
		</View>
	);
}

function Emoji() {
	function Icon({icon}) {
		return (
			<Button>
				<Text className="text-4xl">{icon}</Text>
			</Button>
		);
	}

	const favorites = ['🧐', '🤓', '😎', '🥸', '🤩', '😏'];
	const emojis = ['😀', '😃', '😄', '😁', '😆', '🥹', '😀', '😃', '😄', '😁', '😆', '🥹', '😀', '😃', '😄', '😁', '😆', '🥹', '😀', '😃', '😄', '😁', '😆', '🥹'];

	return (
		<View className="px-6 py-10">
			<View className="flex-row items-center">
				<MaterialIcons name="emoji-emotions" size={20} color={Colors.main} />
				<Text className="font-rubik font-medium text-sm text-main ml-2">Emoji</Text>
			</View>

			<View className="mt-5">
				<View className="border-b border-main/10 pb-4 mb-4">
					<Text className="font-rubik text-xs text-black/40">Favorites</Text>

					<View className="flex-row items-center justify-between mt-3">
						{favorites.map((item, i) => (
							<Icon key={i} icon={item} />
						))}
					</View>
				</View>

				<View className="flex-row items-center justify-between flex-wrap">
					{emojis.map((item, i) => (
						<Icon key={i} icon={item} />
					))}
				</View>
			</View>
		</View>
	);
}

function StoryContainer({navigation}) {
	const [openBottom, setOpenBottom] = useState('');
	const [isLiked, setLike] = useState(false);

	const insets = useSafeAreaInsets();

	const likedRef = useRef(null);

	// Bottom Sheet
	const bottomSheetRef = useRef(null);
	const snapPoints = useMemo(() => ['1%', openBottom === 'emoji' ? '44%' : '26%'], [openBottom]);
	const handleSheetChanges = useCallback(index => {
		if (index === 0) {
			bottomSheetRef.current?.close();
			setOpenBottom('');
		}
	}, []);

	const renderBackdrop = useCallback(
		props => (
			<CustomBackdrop
				{...props}
				disappearsOnIndex={0}
				appearsOnIndex={1}
				onPress={() => {
					bottomSheetRef.current?.close();
					setOpenBottom('');
				}}
			/>
		),
		[],
	);

	return (
		<ImageBackground source={require('@/assets/images/image-2.webp')} resizeMode="cover" className="flex-1">
			<LinearGradient colors={[Constants.HexToRgba(Colors.black, 1), Constants.HexToRgba(Colors.black, 0)]} className="h-48 px-6 z-50" style={{paddingTop: insets.top + 16}}>
				<View className="flex-row items-center">
					<Button className="mr-2 -ml-2 p-2" onPress={() => navigation.goBack()}>
						<MaterialIcons name="arrow-back-ios" size={16} color={Colors.white} />
					</Button>

					<View className="relative items-center justify-center">
						<StoryShape size={64} count={16} />
						<Image source={require('@/assets/images/story-1.png')} className="w-12 h-12 rounded-full absolute" />
					</View>

					<View className="ml-4">
						<Text className="font-rubik font-medium text-sm text-white">Mayke Schuurs</Text>
						<Text className="font-rubik text-xs text-white/70 mt-1">16:30</Text>
					</View>

					<Text className="text-base ml-auto">🏕️</Text>
				</View>
			</LinearGradient>

			<View className="mt-auto mb-10 px-6 flex-row items-end">
				<View className="rounded-xl py-2 px-14 relative overflow-hidden flex-1">
					<BlurView style={{position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, flex: 1, zIndex: 10}} blurType="dark" blurAmount={10} reducedTransparencyFallbackColor="black" />

					<View className="flex-row items-center relative z-10">
						<Octicons name="link" size={16} color={Colors.white} />
						<Text className="font-rubik font-light text-sm text-white ml-2">https://teammade.it</Text>
					</View>
				</View>

				<View className="ml-6">
					<Button
						onPress={() => {
							setLike(true);

							if (!isLiked) likedRef.current.start();
						}}
						className="p-1">
						<MaterialIcons name={isLiked ? 'favorite' : 'favorite-outline'} size={24} color={isLiked ? Colors.red : Colors.white} />
					</Button>

					<Button className="mt-8 p-1">
						<MaterialIcons name="emoji-emotions" size={24} color={Colors.white} onPress={() => setOpenBottom('emoji')} />
					</Button>

					<Button className="mt-8 p-1">
						<Octicons name="comment-discussion" size={24} color={Colors.white} onPress={() => setOpenBottom('comment')} />
					</Button>

					<Button className="mt-8 mb-2 p-1">
						<Feather name="send" size={24} color={Colors.white} />
					</Button>
				</View>
			</View>

			{openBottom !== '' && (
				<BottomSheet
					ref={bottomSheetRef}
					index={1}
					snapPoints={snapPoints}
					backgroundStyle={{
						backgroundColor: Colors.white,
					}}
					backdropComponent={renderBackdrop}
					onChange={handleSheetChanges}>
					{openBottom === 'comment' && <Comment />}
					{openBottom === 'emoji' && <Emoji />}
				</BottomSheet>
			)}

			<View className="-mr-3 -scale-x-100">
				<ConfettiCannon count={20} origin={{x: -10, y: 0}} autoStart={false} ref={likedRef} />
			</View>
		</ImageBackground>
	);
}

export default StoryContainer;
