import React, {useCallback, useEffect, useRef, useState} from 'react';
import {SectionList, Image, Text, View, Dimensions, ActivityIndicator} from 'react-native';
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
import {useRoute} from "@react-navigation/native";
import {ChatService} from "../../services/Chat";

function Header({navigation}) {
	const route = useRoute();

	const insets = useSafeAreaInsets();

	return (
		<View className="bg-main flex-row items-center mb-3 p-4 rounded-b-3xl" style={{paddingTop: insets.top + 16}}>
			<Button onPress={() => navigation.goBack()}>
				<MaterialIcons name="arrow-back-ios" size={20} color={Colors.white}/>
			</Button>

			<View className="flex-row items-center ml-2">
				<View className="w-12 h-12 relative">
					<Image source={require('@/assets/images/person-1.webp')} className="w-12 h-12 rounded-full"/>
					<View className="w-4 h-4 rounded-full bg-green border-[3px] border-main absolute top-0 left-0"/>
				</View>

				<View className="ml-3">
					<Text className="font-rubik font-medium text-sm text-white">Martijn Dragonj</Text>
					<Text className="mt-1 font-rubik text-xs text-white/40">Online</Text>
				</View>
			</View>

			<View className="flex-row items-center ml-auto">
				<Button>
					<Octicons name="search" size={16} color={Colors.white}/>
				</Button>

				<Button className="mx-5">
					<Feather name="phone-call" size={16} color={Colors.white}/>
				</Button>

				<Button>
					<Fontisto name="more-v-a" size={16} color={Colors.white}/>
				</Button>
			</View>
		</View>
	);
}

const moment = require('moment-timezone');

function formatChatDate(chatDate, format = "YYYY-MM-DD HH:mm:ss") {
	// Chuyển từ UTC sang Asia/Ho_Chi_Minh
	const formattedDate = moment.utc(chatDate).tz("Asia/Ho_Chi_Minh").format(format);
	return formattedDate;
}

function Chat({me, message, date}) {
	// Lấy chiều rộng màn hình
	const {width} = Dimensions.get('window');
	const maxWidth = width * 0.6; // 60% chiều rộng màn hình

	// Tính độ rộng động của View dựa trên độ dài tin nhắn
	const calculatedWidth = Math.min(maxWidth, message.length * 8 + 40);

	return (
		<View className={`${me ? 'flex-row-reverse' : 'flex-row'} items-center mb-6`}>
			{/* Hiển thị icon cho tin nhắn của me */}
			{me && (
				<View className="w-8 items-center">
					<Ionicons name="checkmark-done" size={16} color="rgba(0, 0, 0, 0.5)"/>
				</View>
			)}

			{/* View tin nhắn có chiều rộng động */}
			<View
				style={{
					padding: 10,
					borderRadius: 14,
					backgroundColor: me ? '#9e5bd8' : '#E0E0E0',
					width: calculatedWidth, // Áp dụng chiều rộng động
				}}>
				<Text
					style={{
						paddingStart: 5,
						fontFamily: 'Rubik',
						fontWeight: '300',
						fontSize: 14,
						color: me ? 'white' : 'black',
					}}>
					{message}
				</Text>
			</View>

			{/* Hiển thị thời gian */}
			<Text className={`${me ? 'mr-3' : 'ml-3'} font-rubik text-2xs text-black/30`}>
				{moment(message.date).format('HH:mm')}
			</Text>
		</View>
	);
}

function ChatContainer({navigation}) {
	const route = useRoute();
	const [messages, setMessages] = useState([]);
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [inputMessage, setInputMessage] = useState('');

	const recipientId = route.params?.recipientId; // ID người nhận
	const chatService = new ChatService();

	// Hàm gọi API lấy danh sách tin nhắn
	const fetchMessages = useCallback(async (pageNumber) => {
		if (loading || !hasMore) return;

		setLoading(true);
		try {
			const response = await chatService.getChats(recipientId, pageNumber, 20);

			// Thêm trường để xác định tin nhắn của người dùng
			const processedMessages = response.messages.$values.map(message => ({
				...message,
				me: message.userId !== recipientId, // Xác định "me"
			}));

			// Nhóm tin nhắn theo ngày
			const groupedMessages = groupMessagesByDate(processedMessages);

			console.log('groupedMessages:', groupedMessages);

			setMessages(prevMessages =>
				pageNumber === 1
					? groupedMessages
					: [...prevMessages, ...groupedMessages]
			);

			setHasMore(response.totalPages > pageNumber);
			setPage(pageNumber);
		} catch (error) {
			console.error('Lỗi tải tin nhắn:', error);
		} finally {
			setLoading(false);
		}
	}, [recipientId, loading, hasMore]);

	useEffect(() => {
		fetchMessages(1);
	}, [recipientId]);

	const groupMessagesByDate = (messages) => {
		const groupedMessages = []; // Mảng chứa tin nhắn đã được nhóm

		messages.forEach(message => {
			const date = formatChatDate(message.date, "YYYY-MM-DD"); // Lấy ngày của tin nhắn
			const existingGroup = groupedMessages.find(group => group.title === date);

			if (existingGroup) {
				existingGroup.data.push(message);
			} else {
				groupedMessages.push({title: date, data: [message]});
			}
		});

		return groupedMessages;
	};

	const sendMessage = async (messageText, attachment = null) => {
		try {
			if (!messageText) return;
			await chatService.sendMessage(
				recipientId,
				messageText,
				attachment
			);
			// Sau khi gửi, tải lại tin nhắn mới nhất
			fetchMessages(1);
			setInputMessage('');
		} catch (error) {
			console.error('Lỗi gửi tin nhắn:', error);
		}
	};

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

	return (
		<View className="flex-1 bg-white relative">
			{opened &&
				<BlurView style={{position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, flex: 1, zIndex: 10}}
						  blurType="dark" blurAmount={8} reducedTransparencyFallbackColor="black"/>}

			<Header navigation={navigation}/>

			<View className="px-6 flex-1">
				<SectionList
					sections={messages}
					keyExtractor={(item) => item.id}
					renderSectionHeader={({section: {title}}) => (
						<View className="bg-main rounded-full py-2 px-4 mx-auto z-50 my-4">
							<Text className="font-rubik text-2xs text-white">{
								// Nếu ngày hiện tại thì in ra "Hôm nay" nếu không thì in ra ngày
								moment(title).isSame(moment(), 'day')
									? 'Today'
									: moment(title).format('DD/MM/YY')
							}</Text>
						</View>
					)}
					renderItem={({item}) => <Chat {...item} />}
					showsVerticalScrollIndicator={false}
					className="-mr-6"
					onEndReached={() => hasMore && fetchMessages(page + 1)}
					onEndReachedThreshold={0.1}
					ListFooterComponent={
						loading ? <ActivityIndicator size="small" color="#0000ff"/> : null
					}
					inverted={true}	// Hiển thị tin nhắn mới nhất ở dưới cùng
				/>

				<View className="flex-row items-start h-20 bg-white pt-1">
					<View className="bg-light rounded-3xl py-[14px] px-4 flex-row items-center flex-1">
						<Button>
							<MaterialIcons name="emoji-emotions" size={20} color={Colors.main}/>
						</Button>

						<Input
							value={inputMessage}
							onChangeText={(text) => setInputMessage(text)}
							placeholder="Write a message"
							placeholderTextColor={Constants.HexToRgba(Colors.black, 0.5)}
							className="font-rubik font-light text-sm text-black mx-2 flex-1"/>

						<Button onPress={() => setOpen(true)}>
							<AntDesign name="menuunfold" size={14} color={Colors.main}/>
						</Button>
					</View>

					<Button
						onPress={() => sendMessage(inputMessage)}
						className="w-12 h-12 rounded-full bg-main items-center justify-center ml-4 mt-3.5">
						<Feather name="send" size={20} color={Colors.white}/>
					</Button>
				</View>
			</View>

			{/*Drop Up Container*/}
			<Animated.View className="absolute bottom-7 right-24 w-40 z-20"
						   style={[animation, {zIndex: opened ? 20 : -1}]}>
				<View className="bg-white rounded-3xl py-3">
					<Button className="px-6 py-3">
						<Text className="font-rubik font-light text-sm text-black">Camera</Text>
					</Button>

					{/*Truy cập ảnh và video*/}
					<Button className="px-6 py-3">
						<Text className="font-rubik font-light text-sm text-black">Photo and video</Text>
					</Button>

					{/*Truy cập các file*/}
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
					<AntDesign name="close" size={20} color={Colors.white}/>
				</Button>
			</Animated.View>
		</View>
	);
}

export default ChatContainer;
