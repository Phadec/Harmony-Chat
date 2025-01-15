import React, {useCallback, useEffect, useState, useRef} from 'react';
import {View, SectionList, Text, ActivityIndicator, Image, Alert} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import {useSharedValue, useAnimatedStyle, withTiming} from 'react-native-reanimated';
import {GestureHandlerRootView} from "react-native-gesture-handler";

// Components
import {
	HeaderPrivateChat, ChatMessage,
	ChatInput, DropUp, TypingIndicator
} from '@/components';
import {useRoute} from "@react-navigation/native";
import useChatPrivate from "../../hooks/ChatPrivate";
import MessageOverlay from "../../components/ChatPrivate/MessageOverlay";


function ChatPrivateContainer({navigation}) {
	const route = useRoute();
	const recipientId = route.params?.recipientId;
	const avatar = route.params?.avatar;
	const fullName = route.params?.contactNickName || route.params?.contactFullName;
	const {
		messages = [],
		loading,
		hasMore,
		page,
		isTyping, // Trạng thái hiển thị "Đang nhập..."
		fetchMessages,
		sendMessage,
		handleEndReached,
		notifyTyping, // Gọi khi người dùng nhập
		notifyStopTyping, // Gọi khi người dùng dừng nhập
		isSelf,
		replyTo,
		replyId,
		swipeToReply,
		closeReplyBox,
		deleteMessage,
		togglePin,
		pinnedMessages,
		handleReactionAdded,
		currentUserId, // Thêm currentUserId từ hook
	} = useChatPrivate(recipientId);

	const [opened, setOpen] = useState(false);
	const opacity = useSharedValue(0);
	const transform = useSharedValue(30);

	const handleMessageDeleted = useCallback((messageId) => {
		deleteMessage(messageId);
	}, [deleteMessage]);

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
		fetchMessages(1);
	}, [recipientId]);

	// Thêm debug log để kiểm tra dữ liệu messages
    useEffect(() => {
        console.log('Messages in container:', messages);
    }, [messages]);

	// Component TypingIndicator
	const TypingIndicatorRender = () => {
		return (
			<View className="flex-row items-center mb-4">
				<View
					className={`w-4 h-4 rounded-full flex items-center justify-center mr-2`}>
					<Image
						source={avatar}
						className="w-4 h-4 rounded-full"
					/>
				</View>
				<TypingIndicator/>
			</View>
		)
	}

	// Thêm state để track tin nhắn đang được selected
	const [selectedMessage, setSelectedMessage] = useState(null);
	const [positionMessage, setPositionMessage] = useState(null); // Vị trí của tin nhắn được selected

	// Handler để xử lý longPress để hiển thị menu action và reactions
	const handleMessageLongPress = useCallback((message, position) => {
		console.log("Message and Position received:", message, position);
		setSelectedMessage(message);
		setPositionMessage(position);
	}, []);

	// Đóng menu action và reactions
	const handleCloseActions = useCallback(() => {
		setSelectedMessage(null);
		setPositionMessage(null);
	}, []);

	const sectionListRef = useRef(null);

	const handleScrollToMessage = useCallback((messageId) => {
		console.log('Scrolling to message:', messageId);
		
		// Find section and message indices
		let targetSectionIndex = -1;
		let targetItemIndex = -1;

		messages.forEach((section, sectionIndex) => {
			const itemIndex = section.data.findIndex(msg => msg.id === messageId);
			if (itemIndex !== -1) {
				targetSectionIndex = sectionIndex;
				targetItemIndex = itemIndex;
			}
		});

		if (targetSectionIndex !== -1 && targetItemIndex !== -1) {
			// Scroll to message
			sectionListRef.current?.scrollToLocation({
				sectionIndex: targetSectionIndex,
				itemIndex: targetItemIndex,
				animated: true,
				viewPosition: 0.5, // Center the item
			});

			// Optional: Highlight the message temporarily
			const targetMessage = messages[targetSectionIndex].data[targetItemIndex];
			if (targetMessage) {
				// Add visual feedback like highlighting
				// You can implement this by adding a temporary style to the message
			}
		}
	}, [messages]);

	const handleSendMedia = useCallback(async (media) => {
        try {
            if (!media?.uri) {
                throw new Error('Invalid media file');
            }

            const attachment = {
                uri: media.uri,
                type: media.type || 'application/octet-stream',
                fileName: media.fileName || 'attachment',
                fileSize: media.fileSize
            };
            
            const response = await sendMessage('', attachment, replyId);
            
            if (response) {
                setOpen(false);
                // Reply box will be closed by the hook after successful send
            }
        } catch (error) {
            if (error.message?.includes('connection is not in the \'Connected\' State')) {
                Alert.alert('Error', 'Lost connection to server. Please try again.');
            } else {
                Alert.alert('Error', 'Failed to send media');
            }
        }
    }, [sendMessage, setOpen, replyId]);

	return (
		<GestureHandlerRootView style={{flex: 1}}>
			<View className="flex-1 bg-white relative">
				{opened && (
					<BlurView
						style={{position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, flex: 1, zIndex: 10,}}
						blurType="dark" blurAmount={1}
						reducedTransparencyFallbackColor="black"
					/>
				)}
				<HeaderPrivateChat 
					navigation={navigation}
					messages={messages}
					onScrollToMessage={handleScrollToMessage}
					item={route.params} // Truyền toàn bộ route.params
				/>
				{pinnedMessages.length > 0 && (
					<View className="px-4 py-2 bg-gray-200">
						<Text className="font-rubik text-xs mb-1">Pinned Messages:</Text>
						{pinnedMessages.map((msg) => (
							<Text
								key={msg.id}
								className="text-black text-xs mb-1"
								onPress={() => handleScrollToMessage(msg.id)}
							>
								{msg.message}
							</Text>
						))}
					</View>
				)}
				<View className="px-5 flex-1">
					<SectionList
						ref={sectionListRef}
						sections={messages}
						keyExtractor={useCallback((item) => item.id, [])}
						renderItem={useCallback(({item}) => (
							<ChatMessage
								message={item}
								onSwipe={swipeToReply}
								onLongPress={handleMessageLongPress}
								onCloseActions={handleCloseActions}
								onReactionAdded={handleReactionAdded} // Add this prop
							/>
						), [swipeToReply, handleMessageLongPress, handleCloseActions, selectedMessage, positionMessage])}

						// Cải thiện performance với getItemLayout
						getItemLayout={useCallback((data, index) => ({
							length: 70, // Chiều cao trung bình của mỗi item
							offset: 70 * index,
							index,
						}), [])}
						renderSectionHeader={({section: {title}}) => (
							<View className="bg-main rounded-full py-2 px-4 mx-auto z-50 my-4">
								<Text className="font-rubik text-2xs text-white">{title}</Text>
							</View>
						)}
						showsVerticalScrollIndicator={false}
						ListFooterComponent={
							loading ? <ActivityIndicator size="small" color="#0000ff"/> : null
						}
						ListHeaderComponent={
							isTyping ? <TypingIndicatorRender/> : null // Hiển thị "Đang nhập..."
						}
						className="-mr-6"
						inverted
						onEndReached={handleEndReached} // Khi cuộn đến cuối danh sách
						onEndReachedThreshold={0.5}
						removeClippedSubviews={true} // Loại bỏ các phần tử nằm ngoài viewport
					/>

					{/* Message Overlay để người dùng có thể tương tác vs Tin nhắn */}
					{selectedMessage && (
						<View
							className="absolute left-0 right-0 top-0 bottom-0"
							style={{ zIndex: 1000 }}
						>
							{/* Blur Layer */}
							<BlurView
								style={{position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,}}
								blurType="black"
								blurAmount={1}
								reducedTransparencyFallbackColor="black"
							/>

							{/* Actions Layer - Trực tiếp render với selectedMessage */}
							<MessageOverlay
								message={selectedMessage}
								messageId={selectedMessage?.id}
								position={positionMessage}
								onClose={handleCloseActions}
								onMessageDeleted={handleMessageDeleted}
								pinned={selectedMessage?.pinned}
								onPinToggle={togglePin}
								onReactionAdded={handleReactionAdded}
								currentUserId={currentUserId} // Thêm currentUserId
							/>
						</View>
					)}

					{/* Chat Input để người dùng nhắn tin*/}
					<ChatInput setOpen={setOpen}
							   onSend={sendMessage}
							   notifyTyping={notifyTyping} // Gửi sự kiện "typing"
							   notifyStopTyping={notifyStopTyping} // Gửi sự kiện "stop typing"
							   me={isSelf}
							   reply={replyTo}
							   replyId={replyId}
							   closeReply={closeReplyBox}
							   fullName={fullName}
					/>
				</View>

				{/*Attachment Menu*/}
				<DropUp animation={animation} opened={opened} setOpen={setOpen} onSendMedia={handleSendMedia} recipientId={recipientId} />
			</View>
		</GestureHandlerRootView>
	);
}

export default ChatPrivateContainer;
