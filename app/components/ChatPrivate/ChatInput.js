import React, { useState, useCallback, memo, useRef, useEffect } from 'react';
import { Text, View, LayoutAnimation, TextInput, Animated, KeyboardAvoidingView, Platform, BackHandler, TouchableWithoutFeedback } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import { Button, Input } from '@/components';
import { Colors, Constants } from '@/common';
import EmojiPicker from 'react-native-emoji-modal';

// Tách ReplyBox thành component riêng
const ReplyBox = memo(({ reply, me, fullName, closeReply }) => {
	if (!reply) return null;

	return (
		<View className="bg-gray-100 rounded-t-lg px-3 py-2 flex-row justify-between items-center border-b border-gray-200">
			<View className="flex-1 flex-row items-center">
				<Feather name="corner-up-left" size={16} color={Colors.gray} className="mr-2" />
				<View>
					<Text className="text-main font-medium text-sm">
						Replying to {me ? 'yourself' : fullName}
					</Text>
					<Text className="text-sm text-gray-500" numberOfLines={1}>
						{reply}
					</Text>
				</View>
			</View>
			<Button onPress={closeReply} className="ml-2">
				<AntDesign name="close" size={20} color={Colors.gray} />
			</Button>
		</View>
	);
});

// Wrap InputBox with forwardRef
const InputBox = React.forwardRef(({
    message,
    setMessage,
    notifyTyping,
    notifyStopTyping,
    setOpen,
    toggleEmojiPicker,
    isEmojiPickerOpen,
    onContainerPress
}, ref) => {  // Add ref as second parameter
    // Add effect to blur input when emoji picker opens
    useEffect(() => {
        if (isEmojiPickerOpen && ref.current) {
            ref.current.blur();
        }
    }, [isEmojiPickerOpen]);

    return (
        <TouchableWithoutFeedback onPress={onContainerPress}>
            <View className={`bg-gray-50 rounded-2xl mb-2 px-4 flex-row items-center flex-1 ${
                isEmojiPickerOpen ? 'py-2' : 'py-[14px]'
            }`}>
                <Button onPress={() => {
                    ref.current?.blur(); // Use passed ref instead of inputRef
                    toggleEmojiPicker();
                }}>
                    <MaterialIcons 
                        name="emoji-emotions" 
                        size={20} 
                        color={isEmojiPickerOpen ? Colors.main : Colors.gray}
                    />
                </Button>

                <TextInput
                    ref={ref} // Use passed ref instead of inputRef
                    value={message}
                    onChangeText={(text) => {
                        setMessage(text);
                        notifyTyping();
                    }}
                    onBlur={notifyStopTyping}
                    placeholder="Write a message"
                    placeholderTextColor={Constants.HexToRgba(Colors.black, 0.5)}
                    className="font-rubik font-light text-sm text-black mx-2 flex-1"
                    keyboardType="default"
                    multiline
                    style={{
                        minHeight: isEmojiPickerOpen ? 20 : 25,
                        maxHeight: isEmojiPickerOpen ? 40 : 70
                    }}
                    editable={!isEmojiPickerOpen} // Disable input when picker is open
                    pointerEvents={isEmojiPickerOpen ? 'none' : 'auto'} // Prevent touch events
                    onTouchStart={(e) => {
                        if (isEmojiPickerOpen) {
                            e.preventDefault();
                        }
                    }}
                />

                <Button onPress={() => setOpen(true)}>
                    <AntDesign name="menuunfold" size={14} color={Colors.main}/>
                </Button>
            </View>
        </TouchableWithoutFeedback>
    );
});

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
	const [showEmojiPicker, setShowEmojiPicker] = useState(false);
	const slideAnim = useRef(new Animated.Value(0)).current;
	const inputRef = useRef(null);

	const animateContainer = useCallback((toValue) => {
		Animated.spring(slideAnim, {
			toValue,
			duration: 300,
			useNativeDriver: true,
			friction: 8
		}).start();
	}, []);

	const toggleEmojiPicker = useCallback(() => {
		LayoutAnimation.configureNext(
            LayoutAnimation.create(
                250, // duration
                LayoutAnimation.Types.easeInEaseOut,
                LayoutAnimation.Properties.opacity
            )
        );
		setShowEmojiPicker(prev => !prev);
	}, []);

	const handleEmojiSelect = useCallback((emoji) => {
		setMessage(prev => prev + emoji);
	}, []);

	const handleCloseEmojiPicker = useCallback(() => {
		LayoutAnimation.configureNext(
            LayoutAnimation.create(
                200,
                LayoutAnimation.Types.easeInEaseOut,
                LayoutAnimation.Properties.opacity
            )
        );
		setShowEmojiPicker(false);
	}, []);

	const handleSend = useCallback(async () => {
        try {
            // Only allow sending if there's a message or it's a reply
            if (!message.trim() && !replyId) return;

            console.log('Attempting to send message with reply:', {
                message: message.trim(),
                replyToId: replyId, // Log the actual replyId
                replyContent: reply
            });

            // Send message with explicit replyId
            const result = await onSend(
                message.trim(), 
                null, 
                replyId || null // Ensure replyId is explicitly null if not present
            );

            if (result) {
                console.log('Message sent successfully:', result);
                setMessage('');
                notifyStopTyping();
                
                // Clear reply after successful send
                if (closeReply) {
                    closeReply();
                }
            }
        } catch (error) {
            console.error('Error in handleSend:', error);
        }
    }, [message, onSend, notifyStopTyping, replyId, reply, closeReply]);

    // Add effect to verify reply props
    useEffect(() => {
        if (reply || replyId) {
            console.log('Reply state:', {
                replyId,
                replyContent: reply,
                hasCloseReply: !!closeReply
            });
        }
    }, [reply, replyId, closeReply]);

	const handleMessageChange = useCallback((text) => {
		setMessage(text);
		notifyTyping();
	}, [notifyTyping]);

	// Handle back button
	useEffect(() => {
		const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
			if (showEmojiPicker) {
				handleCloseEmojiPicker();
				return true;
			}
			return false;
		});

		return () => backHandler.remove();
	}, [showEmojiPicker]);

	// Handle input container press
	const handleInputContainerPress = useCallback(() => {
		if (showEmojiPicker) {
			handleCloseEmojiPicker();
		}
		// Focus input after a short delay to ensure emoji picker is closed
		setTimeout(() => {
			inputRef.current?.focus();
		}, 100);
	}, [showEmojiPicker]);

	// Disable send button only if no message AND no reply
	const isDisabled = !message.trim() && !replyId;

	return (
		<KeyboardAvoidingView 
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			className="relative bg-white"
			keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
		>
			<View className="flex-col">
				{reply && (
					<ReplyBox
						reply={reply}
						me={me}
						fullName={fullName}
						closeReply={closeReply}
					/>
				)}

				<View className={`flex-row items-start pt-1 ${
					showEmojiPicker ? 'h-16' : 'h-20'
				}`}>
					<InputBox
						ref={inputRef}
						message={message}
						setMessage={handleMessageChange}
						notifyTyping={notifyTyping}
						notifyStopTyping={notifyStopTyping}
						setOpen={setOpen}
						toggleEmojiPicker={toggleEmojiPicker}
						isEmojiPickerOpen={showEmojiPicker}
						onContainerPress={handleInputContainerPress}
					/>

					<Button
						onPress={handleSend}
						 disabled={isDisabled}
						className={`rounded-full bg-main items-center justify-center mt-2 ml-6 ${
							showEmojiPicker ? 'w-10 h-10' : 'w-12 h-12 mt-3'
						}`}
					>
						<Feather 
							name="send" 
							size={showEmojiPicker ? 18 : 20} 
							color={Colors.white}
						/>
					</Button>
				</View>

				{showEmojiPicker && (
					<View className="h-[250px] bg-white border-t border-gray-200">
						<View className="flex-row justify-between items-center px-4 py-2 border-b border-gray-100">
                            <Text className="text-sm text-gray-500">Choose emoji</Text>
                            <Button onPress={handleCloseEmojiPicker}>
                                <AntDesign name="close" size={20} color={Colors.gray} />
                            </Button>
                        </View>
						<EmojiPicker
							onEmojiSelected={handleEmojiSelect}
							backgroundStyle={{
								backgroundColor: 'white',
							}}
							containerStyle={{
								height: 220, // Giảm chiều cao để chứa header
							}}
							headerStyle={{
								backgroundColor: 'white',
							}}
						/>
					</View>
				)}
			</View>
		</KeyboardAvoidingView>
	);
};

// Tối ưu việc re-render với custom compare function
export default memo(ChatInput, (prevProps, nextProps) => {
	const propsEqual = 
		prevProps.reply === nextProps.reply &&
		prevProps.replyId === nextProps.replyId &&
		prevProps.me === nextProps.me &&
		prevProps.fullName === nextProps.fullName;
		
	console.log('ChatInput memo check:', {
		propsEqual,
		prevReplyId: prevProps.replyId,
		nextReplyId: nextProps.replyId
	});
	
	return propsEqual;
});
