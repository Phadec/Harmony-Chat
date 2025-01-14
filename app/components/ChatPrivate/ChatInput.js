import React, { useState, useCallback, memo } from 'react';
import { Text, View, LayoutAnimation } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import { Button, Input } from '@/components';
import { Colors, Constants } from '@/common';
import EmojiSelector from 'react-native-emoji-selector'; // Import react-native-emoji-selector

// Tách ReplyBox thành component riêng
const ReplyBox = memo(({ reply, me, fullName, closeReply }) => {
	if (!reply) return null;

	return (
		<View className="bg-white rounded-t-lg px-3 py-2 flex-row justify-between items-center">
			<View className="flex-1">
				<Text className="text-black font-semibold text-sm">
					Replying to {me ? 'yourself' : fullName}
				</Text>
				<Text className="text-sm text-gray-800" numberOfLines={1}>
					{reply}
				</Text>
			</View>
			<Button onPress={closeReply}>
				<AntDesign name="close" size={20} color={Colors.gray} />
			</Button>
		</View>
	);
});

// Tách InputBox thành component riêng
const InputBox = memo(({
						   message,
						   setMessage,
						   notifyTyping,
						   notifyStopTyping,
						   setOpen,
						   toggleEmojiPicker // Add toggleEmojiPicker prop
					   }) => (
	<View className="bg-gray-50 rounded-2xl py-[14px] mb-2 px-4 flex-row items-center flex-1">
		<Button onPress={toggleEmojiPicker}> {/* Handle emoji button press */}
			<MaterialIcons name="emoji-emotions" size={20} color={Colors.main}/>
		</Button>

		<Input
			value={message}
			onChangeText={(text) => {
				setMessage(text);
				notifyTyping();
			}}
			onBlur={notifyStopTyping}
			placeholder="Write a message"
			placeholderTextColor={Constants.HexToRgba(Colors.black, 0.5)}
			className="font-rubik font-light text-sm text-black mx-2 flex-1"
		/>

		<Button onPress={() => setOpen(true)}>
			<AntDesign name="menuunfold" size={14} color={Colors.main}/>
		</Button>
	</View>
));

const ChatInput = ({
					   setOpen,
					   onSend,
					   notifyTyping,
					   notifyStopTyping,
					   me,
					   reply,
					   replyId,
					   closeReply,
					   fullName,
				   }) => {
	const [message, setMessage] = useState('');
	const [isEmojiPickerVisible, setEmojiPickerVisible] = useState(false); // Add state for emoji picker visibility

	const toggleEmojiPicker = useCallback(() => {
		setEmojiPickerVisible((prev) => !prev);
	}, []);

	const handleEmojiSelect = useCallback((emoji) => {
		setMessage((prev) => prev + emoji);
		setEmojiPickerVisible(false);
	}, []);

	// Memoize handleSend
	const handleSend = useCallback(() => {
		if (message.trim() && onSend(message, replyId)) {
			LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
			setMessage('');
			notifyStopTyping();
		}
	}, [message, onSend, notifyStopTyping]);

	// Memoize message setter
	const handleMessageChange = useCallback((text) => {
		setMessage(text);
		notifyTyping();
	}, [notifyTyping]);

	return (
		<View className="flex-col">
			{isEmojiPickerVisible && (
				<EmojiSelector onEmojiSelected={handleEmojiSelect} /> // Render react-native-emoji-selector
			)}
			<ReplyBox
				reply={reply}
				me={me}
				fullName={fullName}
				closeReply={closeReply}
			/>

			<View className="flex-row items-start h-20 bg-white pt-1">
				<InputBox
					message={message}
					setMessage={handleMessageChange}
					notifyTyping={notifyTyping}
					notifyStopTyping={notifyStopTyping}
					setOpen={setOpen}
					toggleEmojiPicker={toggleEmojiPicker} // Pass toggleEmojiPicker to InputBox
				/>

				<Button
					onPress={handleSend}
					disabled={!message.trim()}
					className="w-12 h-12 rounded-full bg-main items-center justify-center mt-3 ml-6">
					<Feather name="send" size={20} color={Colors.white}/>
				</Button>
			</View>
		</View>
	);
};

// Tối ưu việc re-render với custom compare function
export default memo(ChatInput, (prevProps, nextProps) => {
	return (
		prevProps.reply === nextProps.reply &&
		prevProps.me === nextProps.me &&
		prevProps.fullName === nextProps.fullName
	);
});
