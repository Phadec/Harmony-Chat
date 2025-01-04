import React, {useEffect, useState} from 'react';
import {View, SectionList, Text, ActivityIndicator, Image} from 'react-native';
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


function ChatPrivateContainer({navigation}) {
	const route = useRoute();
	const recipientId = route.params?.recipientId;
	const avatar = route.params?.avatar;
	const fullName = route.params?.contactNickName || route.params?.contactFullName;
	const {
		messages,
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
		swipeToReply,
		closeReplyBox
	} = useChatPrivate(recipientId);

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

	useEffect(() => {
		fetchMessages(1);
	}, [recipientId]);



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

	return (
		<View className="flex-1 bg-white relative">
			{opened && (
				<BlurView
					style={{position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, flex: 1, zIndex: 10,}}
					blurType="dark" blurAmount={8}
					reducedTransparencyFallbackColor="black"
				/>
			)}
			<HeaderPrivateChat navigation={navigation}/>
			<View className="px-5 flex-1">
				<SectionList
					sections={messages}
					keyExtractor={(item) => item.id}
					renderItem={({item}) => <ChatMessage
						{...item}
						onSwipe={swipeToReply}
					/>}
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

				<ChatInput setOpen={setOpen}
						   onSend={sendMessage}
						   notifyTyping={notifyTyping} // Gửi sự kiện "typing"
						   notifyStopTyping={notifyStopTyping} // Gửi sự kiện "stop typing"
						   me={isSelf}
						   reply={replyTo}
						   closeReply={closeReplyBox}
						   fullName={fullName}
				/>
			</View>

			{/*Attachment Menu*/}
			<DropUp animation={animation} opened={opened} setOpen={setOpen}/>
		</View>
	);
}

export default ChatPrivateContainer;
