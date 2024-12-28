import React, {useState, useEffect} from 'react';
import {SectionList, Image, Text, View, Platform, TouchableWithoutFeedback, KeyboardAvoidingView, Keyboard} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import Animated, {useSharedValue, useAnimatedStyle, withTiming} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Octicons from 'react-native-vector-icons/Octicons';
import Feather from 'react-native-vector-icons/Feather';
import Fontisto from 'react-native-vector-icons/Fontisto';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ChatService } from '../../services/Chat';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Components
import {Button, Input} from '@/components';

// Commons
import {Colors, Constants} from '@/common';

const initialMessages = [
	{
		title: 'Today',
		data: [
			{id: 1, user: 'Herse Hedman', profile: require('@/assets/images/story-1.png'), color: 'blue', message: 'Lorem ipsum dolor sit amet, conse.'},
			{id: 2, user: 'Herse Hedman', profile: require('@/assets/images/story-2.png'), color: 'red', message: 'Lorem ipsum dolor sit amet, conse.', reactions: ['❤️ 21', '🔥 21']},
			{id: 3, view: 7, read: 20, message: 'Lorem ipsum dolor sit amet, conse.', me: true},
			{id: 4, user: 'Sudanka Bakalowits', profile: require('@/assets/images/story-3.png'), color: 'green', message: 'Lorem ipsum dolor sit amet, conse.', image: require('@/assets/images/image-1.webp'), reactions: ['👌🏻 21', '🔥 21']},
			{id: 5, user: 'Bithika Abhedananda', profile: require('@/assets/images/story-4.png'), color: 'red', message: 'Lorem ipsum dolor sit amet, conse.', reactions: ['❤️ 21', '🔥 21']},
			{id: 6, message: 'Lorem ipsum dolor sit amet, conse.', me: true},
		],
	},
	{
		title: 'Yesterday',
		data: [
			{id: 1, user: 'Herse Hedman', profile: require('@/assets/images/story-1.png'), color: 'blue', message: 'Lorem ipsum dolor sit amet, conse.'},
			{id: 2, user: 'Herse Hedman', profile: require('@/assets/images/story-2.png'), color: 'red', message: 'Lorem ipsum dolor sit amet, conse.', reactions: ['❤️ 21', '🔥 21']},
			{id: 3, view: 7, read: 20, message: 'Lorem ipsum dolor sit amet, conse.', me: true},
			{id: 4, user: 'Sudanka Bakalowits', profile: require('@/assets/images/story-3.png'), color: 'green', message: 'Lorem ipsum dolor sit amet, conse.', image: require('@/assets/images/image-1.webp'), reactions: ['👌🏻 21', '🔥 21']},
			{id: 5, user: 'Bithika Abhedananda', profile: require('@/assets/images/story-4.png'), color: 'red', message: 'Lorem ipsum dolor sit amet, conse.', reactions: ['❤️ 21', '🔥 21']},
			{id: 6, message: 'Lorem ipsum dolor sit amet, conse.', me: true},
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
				<Image source={require('@/assets/images/person-1.webp')} className="w-12 h-12 rounded-full" />

				<View className="ml-3">
					<Text className="font-rubik font-medium text-sm text-white">FAM 👨‍👩‍👧‍👧</Text>

					<View className="flex-row items-center">
						<Feather name="users" size={12} color={Constants.HexToRgba(Colors.white, 0.7)} />
						<Text className="mt-1 font-rubik text-xs text-white/40 ml-2">8 members</Text>
					</View>
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

function Chat({me, profile, color, user, message, reactions, image, view, read}) {
	return (
		<View className="mt-6">
			{!me && (
				<Button className="flex-row items-center">
					<View className={`w-8 h-8 border rounded-full overflow-hidden items-center justify-center`} style={{borderColor: Colors[color]}}>
						<Image source={profile} className="w-7 h-7" />
					</View>

					<Text className="font-rubik font-medium text-sm ml-3" style={{color: Colors[color]}}>
						{user}
					</Text>
				</Button>
			)}

			<View className={`p-4 rounded-2xl w-[80%] mt-3 ${me ? 'bg-main ml-auto' : 'bg-light'} relative`}>
				<Text className={`font-rubik font-light text-sm ${me ? 'text-white' : 'text-black'}`}>{message}</Text>

				<View className="flex-row items-center mt-3">
					<Text className={`font-rubik text-2xs ${me ? 'text-white/50' : 'text-black/50'}`}>21:22</Text>

					<View className="flex-row items-center ml-auto">
						{view && (
							<View className="flex-row items-center">
								<Octicons name="eye" size={10} color={Constants.HexToRgba(Colors.white, 0.5)} />
								<Text className="font-rubik text-2xs text-white/50 ml-1">7</Text>
							</View>
						)}

						{read && (
							<View className="flex-row items-center ml-4">
								<Ionicons name="checkmark-done" size={14} color={Constants.HexToRgba(Colors.white, 0.5)} />
								<Text className="font-rubik text-2xs text-white/50 ml-1">20</Text>
							</View>
						)}
					</View>
				</View>

				{image && (
					<View className="-mx-2 -mb-2">
						<Image source={image} className="w-full h-64 rounded-2xl mt-2 overflow-hidden" />
					</View>
				)}

				{reactions && (
					<View className="bg-light border-2 border-white rounded-full py-[6px] px-10 flex-row items-center absolute -bottom-4 right-4">
						{reactions.map((item, i) => (
							<Text key={i} className="font-rubik text-2xs text-black mr-2">
								{item}
							</Text>
						))}
					</View>
				)}
			</View>
		</View>
	);
}

function GroupChatContainer({navigation}) {
	const [opened, setOpen] = useState(false);
	const [messages, setMessages] = useState(initialMessages);
	const [message, setMessage] = useState('');
	const [userId, setUserId] = useState(null);

	const opacity = useSharedValue(0);
	const transform = useSharedValue(30);

	const animation = useAnimatedStyle(
		() => {
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

	useEffect(() => {
		async function getUserId() {
			const id = await AsyncStorage.getItem('userId');
			setUserId(id);
		}
		getUserId();
	}, []);

	async function handleSendMessage() {
		if (message.trim()) {
			const chatService = new ChatService();
			const response = await chatService.sendMessage(null, message); // Assuming group chat doesn't need recipientId
			if (response) {
				const newMessage = {
					id: response.id,
					userId: userId,
					message: response.message,
					date: response.date,
					me: true,
				};
				setMessages(prevMessages => {
					const updatedMessages = [...prevMessages];
					updatedMessages[0].data.unshift(newMessage);
					return updatedMessages;
				});
				setMessage('');
			}
		}
	}

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
			{opened && <BlurView
				style={{position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, flex: 1, zIndex: 10}}
				blurType="dark" blurAmount={8} r
				educedTransparencyFallbackColor="black" />}

			<Header navigation={navigation} />

			<View className="px-6 flex-1">
				<SectionList
					sections={messages}
					keyExtractor={(item, index) => item.id.toString()}
					renderItem={({item}) => <Chat {...item} />}
					renderSectionHeader={({section: {title}}) => (
						<View className="bg-main rounded-full py-2 px-4 mx-auto z-50 my-4">
							<Text className="font-rubik text-2xs text-white">{title}</Text>
						</View>
					)}
					showsVerticalScrollIndicator={false}
					inverted
				/>

				<View className="flex-row items-start h-20 bg-white pt-1">
					<View className="bg-light rounded-3xl py-[14px] px-4 flex-row items-center flex-1">
						<Button>
							<MaterialIcons name="emoji-emotions" size={20} color={Colors.main} />
						</Button>

						<Input
							placeholder="Write a message"
							placeholderTextColor={Constants.HexToRgba(Colors.black, 0.5)}
							className="font-rubik font-light text-sm text-black mx-2 flex-1"
							value={message}
							onChangeText={setMessage}
						/>

						<Button onPress={() => setOpen(true)}>
							<AntDesign name="menuunfold" size={14} color={Colors.main} />
						</Button>
					</View>

					<Button className="w-12 h-12 rounded-full bg-main items-center justify-center ml-6" onPress={handleSendMessage}>
						<Feather name="send" size={20} color={Colors.white} />
					</Button>
				</View>
			</View>

			<Dropup />
		</View>
	);
}

export default GroupChatContainer;
