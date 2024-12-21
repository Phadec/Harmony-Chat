import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useRoute} from "@react-navigation/native";

import {SectionList, Image, Text, View, Dimensions, ActivityIndicator} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import Animated, {useSharedValue, useAnimatedStyle, withTiming} from 'react-native-reanimated';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import AntDesign from 'react-native-vector-icons/AntDesign';

// Components
import {Button, Input} from '@/components';

// Commons
import {Colors, Constants} from '@/common';

// Services
import {ChatService} from "../../services/Chat";
import SignalR from "../../services/SignalR/signalR";
// Components
import ChatRow from "./chatRow";
import ChatHeader from "./chatHeader";

const moment = require('moment-timezone');

const formatChatDate = (chatDate, format = "YYYY-MM-DD HH:mm:ss") => {
	return moment.utc(chatDate).tz("Asia/Ho_Chi_Minh").format(format);
};

const groupMessagesByDate = (messages) => {
	return messages.reduce((groups, message) => {
		const date = formatChatDate(message.date, "YYYY-MM-DD");
		const existingGroup = groups.find(group => group.title === date);

		if (existingGroup) {
			existingGroup.data.push(message);
		} else {
			groups.push({title: date, data: [message]});
		}

		return groups;
	}, []);
};

function ChatContainer({navigation}) {
	const route = useRoute();
	const [messages, setMessages] = useState([]);
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [inputMessage, setInputMessage] = useState('');

	const recipientId = route.params?.recipientId; // ID người nhận
	const chatService = new ChatService();
	const signalrService = SignalR.getInstance();

	// Sửa lại hàm sendMessage
	const sendMessage = useCallback(async (messageText, attachment = null) => {
		if (!messageText.trim()) return;

		try {
			setLoading(true);
			const response = await chatService.sendMessage(
				recipientId,
				messageText,
				attachment
			);
			console.log('Message sent:', response);

			const processedMessage = {
				...response,
				me: true,
			};

			setMessages(prevMessages => {
				const updatedMessages = groupMessagesByDate([processedMessage]);
				const existingGroupIndex = prevMessages.findIndex(
					group => group.title === updatedMessages[0].title
				);

				if (existingGroupIndex !== -1) {
					const newMessages = [...prevMessages];
					newMessages[existingGroupIndex].data.unshift(processedMessage);
					return newMessages;
				}

				return [...updatedMessages, ...prevMessages];
			});

			await signalrService.sendNewMessageNotification(response);
			setInputMessage('');
		} catch (error) {
			console.error('Error sending message:', error);
		} finally {
			setLoading(false);
		}

	}, [recipientId]);


	// Sửa lại fetchMessages để thêm các ID đã có vào Set
	const fetchMessages = useCallback(async (pageNumber) => {
		if (loading || (!hasMore && pageNumber > 1)) return;

		setLoading(true);
		try {
			const response = await chatService.getChats(recipientId, pageNumber, 20);

			const processedMessages = response.messages.$values.map(message => ({
				...message,
				me: message.userId !== recipientId,
			}));

			const groupedMessages = groupMessagesByDate(processedMessages);

			setMessages(prevMessages =>
				pageNumber === 1 ? groupedMessages : [...prevMessages, ...groupedMessages]
			);

			setHasMore(response.totalPages > pageNumber);
			setPage(pageNumber);
		} catch (error) {
			console.error('Error loading messages:', error);
		} finally {
			setLoading(false);
		}
	}, [recipientId, loading, hasMore]);

	useEffect(() => {
		fetchMessages(page);
	});

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

			<ChatHeader navigation={navigation}/>

			<View className="px-6 flex-1">
				<SectionList
					sections={messages}
					keyExtractor={(item, index) => `${index}:${item.id}`}
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
					renderItem={({item}) => <ChatRow {...item} />}
					showsVerticalScrollIndicator={false}
					className="-mr-6"
					onEndReached={() => hasMore && fetchMessages(page + 1)}
					onEndReachedThreshold={0.1}
					ListFooterComponent={
						loading ? <ActivityIndicator size="small" color="#0000ff"/> : null
					}
					inverted={true}    // Hiển thị tin nhắn mới nhất ở dưới cùng
				/>

				<View className="flex-row items-start h-20 bg-white pt-1">
					<View className="bg-light rounded-3xl py-[14px] px-4 flex-row items-center flex-1">
						<Button>
							<MaterialIcons name="emoji-emotions" size={20} color={Colors.main}/>
						</Button>

						<Input
							value={inputMessage}
							onChangeText={setInputMessage}
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
