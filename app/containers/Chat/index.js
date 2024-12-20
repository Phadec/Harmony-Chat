import React, {useEffect, useState} from 'react';
import {SectionList, Image, Text, View} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import Animated, {useSharedValue, useAnimatedStyle, withTiming} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Octicons from 'react-native-vector-icons/Octicons';
import Feather from 'react-native-vector-icons/Feather';
import Fontisto from 'react-native-vector-icons/Fontisto';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';

// Components
import {Button, Input} from '@/components';

// Commons
import {Colors, Constants} from '@/common';

const messages = [
	{
		title: 'Today',
		data: [
			{id: 1, message: 'Lorem ipsum dolor sit amet, conse.', me: true},
			{id: 2, message: 'Lorem ipsum dolor sit amet, conse adipiscing elit, sed do eiusmod tempor incididunt ut labore. sed do eiusmod', me: true},
			{id: 3, message: 'Lorem ipsum dolor sit amet, conse.'},
			{id: 4, message: 'Lorem ipsum dolor sit amet, conse adipiscing elit, sed do eiusmod tempor incididunt ut labore. sed do eiusmod', me: true},
			{id: 5, message: 'Lorem ipsum dolor sit amet, conse.'},
			{id: 6, message: 'Lorem ipsum dolor sit amet, conse adipiscing elit, sed do eiusmod tempor incididunt ut labore. sed do eiusmod'},
			{id: 7, message: 'Lorem ipsum dolor sit amet, conse.', me: true},
			{id: 8, message: 'Lorem ipsum dolor sit amet, conse adipiscing elit, sed do eiusmod tempor incididunt ut labore. sed do eiusmod', me: true},
			{id: 9, message: 'Lorem ipsum dolor sit amet, conse.'},
			{id: 10, message: 'Lorem ipsum dolor sit amet, conse adipiscing elit, sed do eiusmod tempor incididunt ut labore. sed do eiusmod', me: true},
			{id: 11, message: 'Lorem ipsum dolor sit amet, conse.'},
			{id: 12, message: 'Lorem ipsum dolor sit amet, conse adipiscing elit, sed do eiusmod tempor incididunt ut labore. sed do eiusmod'},
		],
	},
	{
		title: 'Yesterday',
		data: [
			{id: 1, message: 'Lorem ipsum dolor sit amet, conse.', me: true},
			{id: 2, message: 'Lorem ipsum dolor sit amet, conse adipiscing elit, sed do eiusmod tempor incididunt ut labore. sed do eiusmod', me: true},
			{id: 3, message: 'Lorem ipsum dolor sit amet, conse.'},
			{id: 4, message: 'Lorem ipsum dolor sit amet, conse adipiscing elit, sed do eiusmod tempor incididunt ut labore. sed do eiusmod', me: true},
			{id: 5, message: 'Lorem ipsum dolor sit amet, conse.'},
			{id: 6, message: 'Lorem ipsum dolor sit amet, conse adipiscing elit, sed do eiusmod tempor incididunt ut labore. sed do eiusmod'},
			{id: 7, message: 'Lorem ipsum dolor sit amet, conse.', me: true},
			{id: 8, message: 'Lorem ipsum dolor sit amet, conse adipiscing elit, sed do eiusmod tempor incididunt ut labore. sed do eiusmod', me: true},
			{id: 9, message: 'Lorem ipsum dolor sit amet, conse.'},
			{id: 10, message: 'Lorem ipsum dolor sit amet, conse adipiscing elit, sed do eiusmod tempor incididunt ut labore. sed do eiusmod', me: true},
			{id: 11, message: 'Lorem ipsum dolor sit amet, conse.'},
			{id: 12, message: 'Lorem ipsum dolor sit amet, conse adipiscing elit, sed do eiusmod tempor incididunt ut labore. sed do eiusmod'},
		],
	},
];

function Header({navigation}) {
	const insets = useSafeAreaInsets();

	return (
		<View className="bg-main flex-row items-center p-6 rounded-b-3xl" style={{paddingTop: insets.top + 16}}>
			<Button onPress={() => navigation.goBack()}>
				<MaterialIcons name="arrow-back-ios" size={20} color={Colors.white} />
			</Button>

			<View className="flex-row items-center ml-2">
				<View className="w-12 h-12 relative">
					<Image source={require('@/assets/images/person-1.webp')} className="w-12 h-12 rounded-full" />
					<View className="w-4 h-4 rounded-full bg-green border-[3px] border-main absolute top-0 left-0" />
				</View>

				<View className="ml-3">
					<Text className="font-rubik font-medium text-sm text-white">Martijn Dragonj</Text>
					<Text className="mt-1 font-rubik text-xs text-white/40">Online</Text>
				</View>
			</View>

			<View className="flex-row items-center ml-auto">
				<Button>
					<Octicons name="search" size={16} color={Colors.white} />
				</Button>

				<Button className="mx-5">
					<Feather name="phone-call" size={16} color={Colors.white} />
				</Button>

				<Button>
					<Fontisto name="more-v-a" size={16} color={Colors.white} />
				</Button>
			</View>
		</View>
	);
}

function Chat({me, message}) {
	return (
		<View className={`${me ? 'flex-row-reverse ' : 'flex-row'} items-center mb-6`}>
			{me && (
				<View className="w-8 items-center">
					<Ionicons name="checkmark-done" size={16} color={Constants.HexToRgba(Colors.black, 0.5)} />
				</View>
			)}

			<View className={`p-4 rounded-2xl w-[60%] ${me ? 'bg-main' : 'bg-light'}`}>
				<Text className={`font-rubik font-light text-sm ${me ? 'text-white' : 'text-black'}`}>{message}</Text>
			</View>

			<Text className={`${me ? 'mr-3' : 'ml-3'} font-rubik text-2xs text-black/30`}>21:22</Text>
		</View>
	);
}

function ChatContainer({navigation}) {
	const [opened, setOpen] = useState(false);

	const opacity = useSharedValue(0);
	const transform = useSharedValue(30);

	const animation = useAnimatedStyle(() => {
		return {
			opacity: opacity.value,
			transform: [{translateY: transform.value}],
		};
	});

	useEffect(() => {
		if (opened) {
			opacity.value = withTiming(1);
			transform.value = withTiming(0);
		} else {
			opacity.value = 0;
			transform.value = 30;
		}
	}, [opened]);

	function Dropup() {
		return (
			<Animated.View className="absolute bottom-7 right-24 w-40 z-20" style={[animation, {zIndex: opened ? 20 : -1}]}>
				<View className="bg-white rounded-3xl py-3">
					<Button className="px-6 py-3">
						<Text className="font-rubik font-light text-sm text-black">Camera</Text>
					</Button>

					<Button className="px-6 py-3">
						<Text className="font-rubik font-light text-sm text-black">Photo and video</Text>
					</Button>

					<Button className="px-6 py-3">
						<Text className="font-rubik font-light text-sm text-black">File</Text>
					</Button>

					<Button className="px-6 py-3">
						<Text className="font-rubik font-light text-sm text-black">Location</Text>
					</Button>

					<Button className="px-6 py-3">
						<Text className="font-rubik font-light text-sm text-black">Person</Text>
					</Button>
				</View>

				<Button className="p-4 ml-auto" onPress={() => setOpen(false)}>
					<AntDesign name="close" size={20} color={Colors.white} />
				</Button>
			</Animated.View>
		);
	}

	return (
		<View className="flex-1 bg-white relative">
			{opened && <BlurView style={{position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, flex: 1, zIndex: 10}} blurType="dark" blurAmount={8} reducedTransparencyFallbackColor="black" />}

			<Header navigation={navigation} />

			<View className="px-6 flex-1">
				<SectionList
					sections={messages}
					keyExtractor={(item, index) => item + index}
					renderItem={({item}) => <Chat {...item} />}
					renderSectionHeader={({section: {title}}) => (
						<View className="bg-main rounded-full py-2 px-4 mx-auto z-50 my-4">
							<Text className="font-rubik text-2xs text-white">{title}</Text>
						</View>
					)}
					showsVerticalScrollIndicator={false}
					className="-mr-6"
					inverted
				/>

				<View className="flex-row items-start h-20 bg-white pt-1">
					<View className="bg-light rounded-3xl py-[14px] px-4 flex-row items-center flex-1">
						<Button>
							<MaterialIcons name="emoji-emotions" size={20} color={Colors.main} />
						</Button>

						<Input placeholder="Write a message" placeholderTextColor={Constants.HexToRgba(Colors.black, 0.5)} className="font-rubik font-light text-sm text-black mx-2 flex-1" />

						<Button onPress={() => setOpen(true)}>
							<AntDesign name="menuunfold" size={14} color={Colors.main} />
						</Button>
					</View>

					<Button className="w-12 h-12 rounded-full bg-main items-center justify-center ml-6">
						<Feather name="send" size={20} color={Colors.white} />
					</Button>
				</View>
			</View>

			<Dropup />
		</View>
	);
}

export default ChatContainer;