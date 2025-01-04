import React, {useState, useEffect, useRef} from 'react';
import {SectionList, Image, Text, View, Platform, TouchableWithoutFeedback, TouchableOpacity, KeyboardAvoidingView, Keyboard, Modal} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import Animated, {useSharedValue, useAnimatedStyle, withTiming} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Octicons from 'react-native-vector-icons/Octicons';
import Feather from 'react-native-vector-icons/Feather';
import Fontisto from 'react-native-vector-icons/Fontisto';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {SignalRService} from '../../services/signalR';
import AudioRecorderPlayer from 'react-native-audio-recorder-player'; // Add this import
import {useFocusEffect} from '@react-navigation/native';

// Components
import {Button, Input} from '@/components';

// Commons
import {Colors, Constants} from '@/common';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {ChatGroup} from '../../services/ChatGroup';
import {ChatService} from '../../services/Chat';
import {baseURL} from '../../services/axiosInstance';

const GroupInfo = ({avatar, nameGroup, countMembers}) => {
	return (
		<View className="flex-row items-center ml-2">
			<Image source={{uri: avatar ? `${baseURL}/${avatar}` : undefined}} className="w-12 h-12 rounded-full" />
			<View className="ml-3">
				<Text className="font-rubik font-medium text-sm text-white">{nameGroup}</Text>
				<View className="flex-row items-center">
					<Feather name="users" size={12} color={Constants.HexToRgba(Colors.white, 0.7)} />
					<Text className="mt-1 font-rubik text-xs text-white/40 ml-2">{countMembers} members</Text>
				</View>
			</View>
		</View>
	);
};

function Header({navigation, route}) {
	const insets = useSafeAreaInsets();
	const {avatar, nameGroup, recipientId} = route.params;
	const chatService = new ChatGroup();
	const [countMembers, setCountMember] = useState(0);
	const [opened, setOpen] = useState(false);

	const opacity = useSharedValue(0);
	const transform = useSharedValue(30);

	const animation = useAnimatedStyle(() => ({
		opacity: opacity.value,
		transform: [{translateY: transform.value}],
	}));

	useEffect(() => {
		if (recipientId) {
			chatService
				.getGroupMembers(recipientId)
				.then(item => {
					setCountMember(item?.$values?.length || 0);
				})
				.catch(err => console.error(err));
		}
	}, [recipientId]);

	useEffect(() => {
		opacity.value = withTiming(opened ? 1 : 0, {duration: 300});
		transform.value = withTiming(opened ? 0 : 30, {duration: 300});
	}, [opened]);

	return (
		<View className="bg-main flex-row items-center p-6 rounded-b-3xl" style={{paddingTop: insets.top + 16}}>
			{/* Back Button */}
			<Button onPress={() => navigation.goBack()}>
				<MaterialIcons name="arrow-back-ios" size={20} color={Colors.white} />
			</Button>

			{/* Group Info */}
			<GroupInfo avatar={avatar} nameGroup={nameGroup} countMembers={countMembers} />

			{/* More Options Button */}
			<View className="flex-row items-center ml-auto">
				<Button onPress={() => setOpen(prev => !prev)} className="p-5">
					<Fontisto name="more-v-a" size={16} color={Colors.white} />
				</Button>
			</View>

			{/* Dropdown Settings */}
			{opened && (
				<>
					<BlurView
						style={{
							position: 'absolute',
							left: 0,
							right: 0,
							top: 0,
							bottom: 0,
							flex: 1,
							zIndex: 10,
						}}
						blurType="dark"
						blurAmount={8}
						reducedTransparencyFallbackColor="black"
					/>
					<Animated.View className="absolute right-5 w-40 z-20" style={[animation, {zIndex: opened ? 20 : -1, top: 10}]}>
						<Button className="p-4 ml-auto" onPress={() => setOpen(false)}>
							<AntDesign name="close" size={20} color={Colors.white} />
						</Button>
						<View className="bg-white rounded-3xl py-3">
							<Button className="px-6 py-3" onPress={() => handleLeaveGroup(chatService, recipientId, navigation)}>
								<Text className="font-rubik font-light text-sm text-black">Delete Chat</Text>
							</Button>
							<Button className="px-6 py-3" onPress={() => handleChangeCover()}>
								<Text className="font-rubik font-light text-sm text-black">Edit cover</Text>
							</Button>
						</View>
					</Animated.View>
				</>
			)}
		</View>
	);
}

function handleLeaveGroup(chatService, groupId, navigation) {
	chatService.deleteGroup(groupId);
	navigation.goBack();
}

function handleChangeCover() {
	console.log('Change cover');
}


function getReactionIcon(type) {
	switch (type) {
		case 'like':
			return '👍';
		case 'love':
			return '❤️';
		case 'haha':
			return '😄';
		case 'wow':
			return '😲';
		case 'sad':
			return '😢';
		case 'angry':
			return '😠';
		default:
			return null;
	}
}

function Chat({me, message, date, reaction, onLongPress, onDelete, isDeleted, attachmentUrl, isPinned, onPin, onUnpin, audioUrl}) {
	const adjustedDate = new Date(date);
	adjustedDate.setHours(adjustedDate.getHours() + 7);
	const [modalVisible, setModalVisible] = useState(false);
	const audioRecorderPlayer = new AudioRecorderPlayer(); // Add this line

	return (
		<>
			<TouchableOpacity onLongPress={onLongPress}>
				<View className={`${me ? 'flex-row-reverse' : 'flex-row'} items-end mb-1`}>
					{me && (
						<View className="w-8 items-center">
							<Ionicons name="checkmark-done" size={16} color={Constants.HexToRgba(Colors.black, 0.5)} />
						</View>
					)}

					<View className={`p-3 rounded-2xl max-w-[85%] ${me ? 'bg-main' : 'bg-light'}`}>
						{attachmentUrl && (
							<TouchableOpacity onPress={() => setModalVisible(true)} className="mb-2">
								{attachmentUrl.endsWith('.mp4') ? (
									<Video
										source={{uri: `${baseURL}/${attachmentUrl}`}}
										style={{width: 200, height: 200}}
										paused={false} // Set paused to false for preview
										resizeMode="cover"
									/>
								) : (
									<Image source={{uri: `${baseURL}/${attachmentUrl}`}} style={{width: 200, height: 200}} resizeMode="cover" />
								)}
							</TouchableOpacity>
						)}
						{audioUrl && (
							<Button onPress={() => audioRecorderPlayer.startPlayer(audioUrl)}>
								<Text className={`font-rubik font-light text-sm ${me ? 'text-white text-right' : 'text-black'}`}>Play Audio</Text>
							</Button>
						)}
						<Text className={`font-rubik font-light text-sm ${me ? 'text-white text-right' : 'text-black'}`}>{message}</Text>
					</View>

					{reaction && (
						<View className={`mx-2 px-2 py-1 rounded-xl ${me ? 'bg-main' : 'bg-light'}`}>
							<Text className={`text-xs ${me ? 'text-white' : 'text-black'}`}>{getReactionIcon(reaction)}</Text>
						</View>
					)}

					<Text className={`${me ? 'mr-3' : 'ml-3'} font-rubik text-2xs text-black/30`}>{adjustedDate.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'})}</Text>

					{me && !isDeleted && (
						<View className="flex-row items-center">
							<Button onPress={onDelete} className="ml-2 p-2 bg-purple-500 rounded-full shadow-lg">
								<AntDesign name="delete" size={16} color={Colors.white} />
							</Button>
							<Button onPress={isPinned ? onUnpin : onPin} className="ml-2 p-2 bg-yellow-500 rounded-full shadow-lg">
								<AntDesign name={isPinned ? 'pushpin' : 'pushpino'} size={16} color={Colors.white} />
							</Button>
						</View>
					)}
				</View>
			</TouchableOpacity>

			{attachmentUrl && attachmentUrl.endsWith('.mp4') && (
				<Modal visible={modalVisible} transparent={true} animationType="slide" onRequestClose={() => setModalVisible(false)}>
					<View className="flex-1 justify-center items-center bg-black/80">
						<Video source={{uri: `${baseURL}/${attachmentUrl}`}} style={{width: '100%', height: '100%'}} resizeMode="contain" controls={true} />
						<Button className="absolute top-10 right-10" onPress={() => setModalVisible(false)}>
							<AntDesign name="close" size={30} color={Colors.white} />
						</Button>
					</View>
				</Modal>
			)}

			{attachmentUrl && !attachmentUrl.endsWith('.mp4') && (
				<Modal visible={modalVisible} transparent={true} animationType="slide" onRequestClose={() => setModalVisible(false)}>
					<View className="flex-1 justify-center items-center bg-black/80">
						<Image source={{uri: `${baseURL}/${attachmentUrl}`}} style={{width: '100%', height: '100%'}} resizeMode="contain" />
						<Button className="absolute top-10 right-10" onPress={() => setModalVisible(false)}>
							<AntDesign name="close" size={30} color={Colors.white} />
						</Button>
					</View>
				</Modal>
			)}
		</>
	);
}

function formatChatsByDate(messages, userId) {
	const sortedMessages = messages.sort((a, b) => new Date(a.date) - new Date(b.date));
	const groupedChats = sortedMessages.reduce((acc, message) => {
		const date = new Date(message.date).toDateString();
		if (!acc[date]) {
			acc[date] = [];
		}
		// Get the first reaction if exists
		const reaction = message.reactions && message.reactions.$values && message.reactions.$values.length > 0 ? message.reactions.$values[0].reactionType : null;

		acc[date].push({
			...message,
			me: message.userId === userId,
			reaction: reaction,
		});
		return acc;
	}, {});

	return Object.keys(groupedChats)
		.map(date => ({
			title: date,
			data: groupedChats[date],
		}))
		.sort((a, b) => new Date(a.title) - new Date(b.title));
}

function PinnedMessages({pinnedMessages, onPinnedMessagePress}) {
	return (
		<View className="bg-light p-4 rounded-b-3xl">
			<Text className="font-rubik font-medium text-sm text-black mb-2">Pinned Messages</Text>
			{pinnedMessages.map(message => (
				<TouchableOpacity key={message.id} onPress={() => onPinnedMessagePress(message.id)}>
					<View className="p-2 bg-white rounded-xl mb-2 shadow-sm">
						<Text className="font-rubik text-sm text-black">{message.message}</Text>
					</View>
				</TouchableOpacity>
			))}
		</View>
	);
}

function GroupChatContainer({navigation, route}) {
	const {recipientId} = route.params;
	const [opened, setOpen] = useState(false);
	const [chats, setChats] = useState([]);
	const [userId, setUserId] = useState(null);
	const [message, setMessage] = useState('');
	const [selectedMessage, setSelectedMessage] = useState(null);
	const [pinnedMessages, setPinnedMessages] = useState([]);
	const signalRService = SignalRService.getInstance();
	const sectionListRef = useRef(null);
	const audioRecorderPlayer = new AudioRecorderPlayer(); // Add this line
	const [isRecording, setIsRecording] = useState(false); // Add this line
	const [recordingText, setRecordingText] = useState(''); // Add this line
	const [isEmojiModalVisible, setIsEmojiModalVisible] = useState(false); // Add this line

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

	useEffect(() => {
		async function getUserId() {
			const id = await AsyncStorage.getItem('userId');
			setUserId(id);
		}
		getUserId();
	}, []);

	useFocusEffect(
		React.useCallback(() => {
			async function fetchChats() {
				const chatService = new ChatService();
				const response = await chatService.getChats(recipientId, 1, 20);
				console.log(response);
				if (response && response.messages && Array.isArray(response.messages.$values)) {
					const formattedChats = formatChatsByDate(response.messages.$values, userId);
					setChats(formattedChats);
				}
			}
			if (recipientId && userId) {
				fetchChats();
			}
		}, [recipientId, userId]),
	);

	useEffect(() => {
		const subscription = signalRService.messageReceived$.subscribe(msg => {
			console.log('Message received:', msg);
			if (msg && msg.id) {
				setChats(prevChats => {
					const updatedChats = [...prevChats];
					const messageDate = new Date(msg.date).toDateString();
					const existingSection = updatedChats.find(section => section.title === messageDate);
					const newMsg = {
						...msg,
						me: msg.userId === userId,
						reaction: msg.reaction,
					};

					if (existingSection) {
						existingSection.data.push(newMsg);
					} else {
						updatedChats.push({
							title: messageDate,
							data: [newMsg],
						});
					}
					return updatedChats;
				});
			} else if (msg && msg.type === 'ReactionAdded') {
				setChats(prevChats => {
					return prevChats.map(section => ({
						...section,
						data: section.data.map(chat => (chat.id === msg.reaction.chatId ? {...chat, reaction: msg.reaction.reactionType} : chat)),
					}));
				});
			} else if (msg && msg.type === 'ReactionRemoved') {
				setChats(prevChats => {
					return prevChats.map(section => ({
						...section,
						data: section.data.map(chat => (chat.id === msg.reaction.chatId ? {...chat, reaction: null} : chat)),
					}));
				});
			} else if (msg && msg.type === 'MessageDeleted') {
				setChats(prevChats => {
					return prevChats.map(section => ({
						...section,
						data: section.data.map(chat => (chat.id === msg.messageId ? {...chat, isDeleted: true, reaction: null, message: 'Message has been deleted'} : chat)),
					}));
				});
			}
		});

		return () => subscription.unsubscribe();
	}, [signalRService, userId]);

	useEffect(() => {
		const pinned = chats.flatMap(section => section.data.filter(chat => chat.isPinned));
		setPinnedMessages(pinned);
	}, [chats]);

	async function handleSendMessage() {
		if (message.trim()) {
			console.log(`Sending message by ${recipientId}:`, message);
			const chatService = new ChatGroup();
			try {
				const formData = new FormData();
				formData.append('UserId', userId);
				formData.append('RecipientId', recipientId);
				formData.append('Message', message);

				const response = await chatService.sendMessage(recipientId, message, formData);
				console.log('Send message response:', response);
				if (response) {
					const newMessage = {
						id: response.id,
						userId: userId,
						message: response.message,
						date: new Date(new Date(response.date).setHours(new Date(response.date).getHours() - 7)), // Adjust the date by subtracting 7 hours
						me: true,
					};
					setChats(prevChats => {
						const updatedChats = [...prevChats];
						const messageDate = new Date(newMessage.date).toDateString();
						const existingSection = updatedChats.find(section => section.title === messageDate);
						if (existingSection) {
							existingSection.data.push(newMessage);
						} else {
							updatedChats.push({
								title: messageDate,
								data: [newMessage],
							});
						}
						return updatedChats;
					});
					setMessage('');
				}
			} catch (error) {
				console.error('Send message error:', error);
				if (error.response) {
					console.error('Error response data:', error.response.data);
					console.error('Error response status:', error.response.status);
					console.error('Error response headers:', error.response.headers);
				} else if (error.request) {
					console.error('Error request:', error.request);
				} else {
					console.error('Error message:', error.message);
				}
				console.error('Send message failed:', error.config);
			}
		}
	}

	async function handleUpload(type) {
		console.log('handleUpload called with type:', type); // Add debug log
		try {
			let result;
			const options = {
				mediaType: 'mixed', // 'photo', 'video', or 'mixed'
				includeBase64: false,
			};

			if (type === 'camera') {
				result = await launchCamera(options);
			} else if (type === 'photo' || type === 'video') {
				result = await launchImageLibrary(options);
			} else if (type === 'file') {
				result = await DocumentPicker.pick({
					type: [DocumentPicker.types.allFiles],
				});
			}

			if (result && result.assets && result.assets.length > 0) {
				const file = result.assets[0];
				const fileName = file.fileName || `attachment.${file.type.split('/')[1]}`;
				console.log('Selected file:', file);
				const formData = new FormData();
				formData.append('UserId', userId);
				formData.append('RecipientId', recipientId);
				formData.append('Message', '');
				formData.append('Attachment', {
					uri: file.uri,
					type: file.type,
					name: fileName,
				});

				console.log('Sending message with formData:', formData); // Log the formData

				const chatService = new ChatService();
				try {
					const response = await chatService.sendMessage(recipientId, '', formData);
					console.log('Upload response:', response);

					if (response) {
						const newMessage = {
							id: response.id,
							userId: userId,
							message: response.message,
							date: new Date(new Date(response.date).setHours(new Date(response.date).getHours() - 7)),
							me: true,
							attachmentUrl: response.attachmentUrl,
						};
						setChats(prevChats => {
							const updatedChats = [...prevChats];
							const messageDate = new Date(newMessage.date).toDateString();
							const existingSection = updatedChats.find(section => section.title === messageDate);
							if (existingSection) {
								existingSection.data.push(newMessage);
							} else {
								updatedChats.push({
									title: messageDate,
									data: [newMessage],
								});
							}
							return updatedChats;
						});
					}
				} catch (error) {
					if (error.response) {
						console.error('Error response data:', error.response.data);
						console.error('Error response status:', error.response.status);
						console.error('Error response headers:', error.response.headers);
					} else if (error.request) {
						console.error('Error request:', error.request);
					} else {
						console.error('Error message:', error.message);
					}
					console.error('Send message failed:', error.config); // Log the error config
				}
			}
		} catch (err) {
			console.log('ImagePicker Error: ', err);
		}
	}

	async function handleRecordVoice() {
		try {
			const result = await audioRecorderPlayer.startRecorder();
			console.log('Recording started:', result);
			setIsRecording(true); // Add this line
			setRecordingText('Recording...'); // Add this line
		} catch (err) {
			console.log('Recording Error: ', err);
		}
	}

	async function handleStopRecording() {
		try {
			const result = await audioRecorderPlayer.stopRecorder();
			console.log('Recording stopped:', result);
			setIsRecording(false);
			setRecordingText('');

			// Ensure the file URI is correctly formatted
			const fileUri = result.startsWith('file://') ? result : `file://${result}`;
			console.log('File URI:', fileUri);

			const formData = new FormData();
			formData.append('UserId', userId);
			formData.append('RecipientId', recipientId);
			formData.append('Message', '');
			formData.append('Attachment', {
				uri: fileUri,
				type: 'audio/mp4',
				name: 'voice_message.mp4',
			});

			console.log('FormData:', formData); // Log the formData

			const chatService = new ChatService();
			try {
				const response = await chatService.sendMessage(recipientId, '', formData);
				console.log('Upload response:', response);

				if (response) {
					const newMessage = {
						id: response.id,
						userId: userId,
						message: response.message,
						date: new Date(new Date(response.date).setHours(new Date(response.date).getHours() - 7)),
						me: true,
						audioUrl: response.attachmentUrl,
					};
					setChats(prevChats => {
						const updatedChats = [...prevChats];
						const messageDate = new Date(newMessage.date).toDateString();
						const existingSection = updatedChats.find(section => section.title === messageDate);
						if (existingSection) {
							existingSection.data.push(newMessage);
						} else {
							updatedChats.push({
								title: messageDate,
								data: [newMessage],
							});
						}
						return updatedChats;
					});
				}
			} catch (error) {
				if (error.response) {
					console.error('Error response data:', error.response.data);
					console.error('Error response status:', error.response.status);
					console.error('Error response headers:', error.response.headers);
				} else if (error.request) {
					console.error('Error request:', error.request);
				} else {
					console.error('Error message:', error.message);
				}
				console.error('Send message failed:', error.config); // Log the error config
			}
		} catch (err) {
			console.log('Stop Recording Error: ', err);
		}
	}

	function Dropup() {
		console.log('Rendering Dropup');
		return (
			<Animated.View className="absolute bottom-7 right-24 w-40 z-20" style={[animation, {zIndex: opened ? 20 : -1}]}>
				<View className="bg-white rounded-3xl py-3">
					<Button className="px-6 py-3" onPress={() => handleUpload('camera')}>
						<Text className="font-rubik font-light text-sm text-black">Camera</Text>
					</Button>

					<Button className="px-6 py-3" onPress={() => handleUpload('photo')}>
						<Text className="font-rubik font-light text-sm text-black">Photo and video</Text>
					</Button>

					<Button className="px-6 py-3" onPress={() => handleUpload('file')}>
						<Text className="font-rubik font-light text-sm text-black">File</Text>
					</Button>

					<Button className="px-6 py-3" onPress={() => handleUpload('location')}>
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

	function handleLongPress(message) {
		setSelectedMessage(message);
	}

	async function handleAddReaction(reactionType) {
		const chatService = new ChatService();
		await chatService.addReaction(selectedMessage.id, reactionType);
		setChats(prevChats => {
			return prevChats.map(section => ({
				...section,
				data: section.data.map(msg =>
					msg.id === selectedMessage.id
						? {
								...msg,
								reactions: {
									$values:
										msg.reactions && msg.reactions.$values
											? [
													...msg.reactions.$values,
													{
														reactionType: reactionType,
														reactedByUser: {
															id: userId,
														},
													},
											  ]
											: [
													{
														reactionType: reactionType,
														reactedByUser: {
															id: userId,
														},
													},
											  ],
								},
						  }
						: msg,
				),
			}));
		});
		setSelectedMessage(null);
	}

	async function handleRemoveReaction() {
		const chatService = new ChatService();
		await chatService.removeReaction(selectedMessage.id);
		setChats(prevChats => {
			return prevChats.map(section => ({
				...section,
				data: section.data.map(msg => {
					if (msg.id === selectedMessage.id) {
						const {reaction, ...rest} = msg;
						return rest;
					}
					return msg;
				}),
			}));
		});
		setSelectedMessage(null);
	}

	async function handleDeleteMessage(messageId, isPinned) {
		const chatService = new ChatService();
		await chatService.deleteMessage(messageId);
		if (isPinned) {
			await handleUnpinMessage(messageId);
		}
		setChats(prevChats => {
			return prevChats.map(section => ({
				...section,
				data: section.data.map(msg => (msg.id === messageId ? {...msg, isDeleted: true, reaction: null, message: 'Message has been deleted'} : msg)),
			}));
		});
	}

	async function handlePinMessage(messageId) {
		const chatService = new ChatService();
		await chatService.pinMessage(messageId);
		setChats(prevChats => {
			return prevChats.map(section => ({
				...section,
				data: section.data.map(msg => (msg.id === messageId ? {...msg, isPinned: true} : msg)),
			}));
		});
	}

	async function handleUnpinMessage(messageId) {
		const chatService = new ChatService();
		await chatService.unpinMessage(messageId);
		setChats(prevChats => {
			return prevChats.map(section => ({
				...section,
				data: section.data.map(msg => (msg.id === messageId ? {...msg, isPinned: false} : msg)),
			}));
		});
	}

	function handlePinnedMessagePress(messageId) {
		const sectionIndex = chats.findIndex(section => section.data.some(chat => chat.id === messageId));
		const itemIndex = chats[sectionIndex].data.findIndex(chat => chat.id === messageId);
		sectionListRef.current.scrollToLocation({
			sectionIndex,
			itemIndex,
			animated: true,
		});
	}

	return (
		<View className="flex-1 bg-white relative">
			{opened && <BlurView style={{position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, flex: 1, zIndex: 10}} blurType="dark" blurAmount={8} r educedTransparencyFallbackColor="black" />}

			<Header navigation={navigation} route={route} />

			{pinnedMessages.length > 0 && <PinnedMessages pinnedMessages={pinnedMessages} onPinnedMessagePress={handlePinnedMessagePress} />}

			<View className="px-6 flex-1" style={{position: 'relative', zIndex: -1}}>
				<SectionList
					ref={sectionListRef}
					sections={chats}
					keyExtractor={(item, index) => `${item.id}-${index}`} // Ensure unique key for each item
					renderItem={({item}) => <Chat {...item} onLongPress={() => handleLongPress(item)} onDelete={() => handleDeleteMessage(item.id, item.isPinned)} onPin={() => handlePinMessage(item.id)} onUnpin={() => handleUnpinMessage(item.id)} />}
					renderSectionHeader={({section: {title}}) => (
						<View className="bg-main rounded-full py-2 px-4 mx-auto z-50 my-4">
							<Text className="font-rubik text-2xs text-white">{title}</Text>
						</View>
					)}
					showsVerticalScrollIndicator={false}
					className="-mr-6"
				/>

				<View className="flex-row items-start h-20 bg-white pt-1">
					<View className="bg-light rounded-3xl py-[14px] px-4 flex-row items-center flex-1">
						<Button onPress={() => setIsEmojiModalVisible(true)}>
							<MaterialIcons name="emoji-emotions" size={20} color={Colors.main} />
						</Button>

						<Input placeholder="Write a message" placeholderTextColor={Constants.HexToRgba(Colors.black, 0.5)} className="font-rubik font-light text-sm text-black mx-2 flex-1" value={message} onChangeText={setMessage} />

						<Button onPress={() => setOpen(true)}>
							<AntDesign name="menuunfold" size={14} color={Colors.main} />
						</Button>

						<TouchableWithoutFeedback onPressIn={handleRecordVoice} onPressOut={handleStopRecording}>
							<View className="ml-2">
								<Feather name="mic" size={20} color={Colors.main} />
							</View>
						</TouchableWithoutFeedback>
					</View>

					<Button className="w-12 h-12 rounded-full bg-main items-center justify-center ml-6" onPress={handleSendMessage} style={{alignSelf: 'center'}}>
						<Feather name="send" size={20} color={Colors.white} />
					</Button>
				</View>

				{isRecording && (
					<View className="absolute bottom-20 left-0 right-0 bg-white p-4 rounded-3xl shadow-lg">
						<Text className="font-rubik text-sm text-black text-center">{recordingText}</Text>
					</View>
				)}
			</View>

			<Dropup />

			{selectedMessage && (
				<Modal transparent={true} animationType="slide" visible={!!selectedMessage} onRequestClose={() => setSelectedMessage(null)}>
					<View className="flex-1 justify-center items-center bg-black/50">
						<View className="bg-white rounded-3xl p-6">
							<Text className="font-rubik font-medium text-lg mb-4 text-center">Reactions</Text>
							<View className="flex-row flex-wrap justify-around gap-4 mb-4">
								<Button className="p-3 bg-gray-100 rounded-full" onPress={() => handleAddReaction('like')}>
									<Text style={{fontSize: 24}}>👍</Text>
								</Button>
								<Button className="p-3 bg-gray-100 rounded-full" onPress={() => handleAddReaction('love')}>
									<Text style={{fontSize: 24}}>❤️</Text>
								</Button>
								<Button className="p-3 bg-gray-100 rounded-full" onPress={() => handleAddReaction('haha')}>
									<Text style={{fontSize: 24}}>😄</Text>
								</Button>
								<Button className="p-3 bg-gray-100 rounded-full" onPress={() => handleAddReaction('wow')}>
									<Text style={{fontSize: 24}}>😲</Text>
								</Button>
								<Button className="p-3 bg-gray-100 rounded-full" onPress={() => handleAddReaction('sad')}>
									<Text style={{fontSize: 24}}>😢</Text>
								</Button>
								<Button className="p-3 bg-gray-100 rounded-full" onPress={() => handleAddReaction('angry')}>
									<Text style={{fontSize: 24}}>😠</Text>
								</Button>
							</View>
							<View className="flex-row justify-around">
								<Button className="px-6 py-3 bg-gray-100 rounded-full" onPress={handleRemoveReaction}>
									<Text style={{fontSize: 20}}>❌</Text>
								</Button>
								<Button className="px-6 py-3 bg-gray-100 rounded-full" onPress={() => setSelectedMessage(null)}>
									<Text style={{fontSize: 20}}>✖️</Text>
								</Button>
							</View>
						</View>
					</View>
				</Modal>
			)}

			{/* Emoji Modal */}
			<Modal transparent={true} animationType="slide" visible={isEmojiModalVisible} onRequestClose={() => setIsEmojiModalVisible(false)}>
				<View className="flex-1 justify-center items-center bg-black/50">
					<View className="bg-white rounded-3xl p-6">
						<Text className="font-rubik font-medium text-lg mb-4 text-center">Select Emoji</Text>
						<View className="flex-row flex-wrap justify-around gap-4 mb-4">
							<Button className="p-3 bg-gray-100 rounded-full" onPress={() => setMessage(message + '😀')}>
								<Text style={{fontSize: 24}}>😀</Text>
							</Button>
							<Button className="p-3 bg-gray-100 rounded-full" onPress={() => setMessage(message + '😁')}>
								<Text style={{fontSize: 24}}>😁</Text>
							</Button>
							<Button className="p-3 bg-gray-100 rounded-full" onPress={() => setMessage(message + '😂')}>
								<Text style={{fontSize: 24}}>😂</Text>
							</Button>
							<Button className="p-3 bg-gray-100 rounded-full" onPress={() => setMessage(message + '🤣')}>
								<Text style={{fontSize: 24}}>🤣</Text>
							</Button>
							<Button className="p-3 bg-gray-100 rounded-full" onPress={() => setMessage(message + '😃')}>
								<Text style={{fontSize: 24}}>😃</Text>
							</Button>
							<Button className="p-3 bg-gray-100 rounded-full" onPress={() => setMessage(message + '😄')}>
								<Text style={{fontSize: 24}}>😄</Text>
							</Button>
							<Button className="p-3 bg-gray-100 rounded-full" onPress={() => setMessage(message + '😅')}>
								<Text style={{fontSize: 24}}>😅</Text>
							</Button>
							<Button className="p-3 bg-gray-100 rounded-full" onPress={() => setMessage(message + '😆')}>
								<Text style={{fontSize: 24}}>😆</Text>
							</Button>
						</View>
						<Button className="px-6 py-3 bg-gray-100 rounded-full" onPress={() => setIsEmojiModalVisible(false)}>
							<Text style={{fontSize: 20}}>Close</Text>
						</Button>
					</View>
				</View>
			</Modal>
		</View>
	);
}

export default GroupChatContainer;
