// Tách MessageContent thành component riêng
import React, { useState, memo } from 'react';
import useChatMessage from "../../hooks/ChatPrivate/ChatMessage";
import { GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { Text, View, Image, Modal, Pressable, ImageBackground } from "react-native";
import Video from 'react-native-video';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { baseURL } from '@/services/axiosInstance';

function createMediaURL(base, path) {
  const trimmedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const trimmedPath = path.startsWith('/') ? path.substring(1) : path;
  return `${trimmedBase}/${trimmedPath}`;
}

function getAttachmentType(url) {
  const extension = url.split('.').pop().toLowerCase();
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif'];
  const videoExtensions = ['mp4', 'mov', 'avi', 'mkv'];
  
  if (imageExtensions.includes(extension)) {
    return 'image';
  } else if (videoExtensions.includes(extension)) {
    return 'video';
  } else {
    return 'unknown';
  }
}

const ReplyPreview = memo(({ repliedMessage }) => {
    if (!repliedMessage) return null;
    
    return (
        <View className="border-l-2 border-main/50 pl-2 mb-2 w-full">
            <Text className="text-xs font-medium mb-1" 
                style={{ color: repliedMessage.me ? '#fff' : '#9e5bd8' }}>
                {repliedMessage.senderFullName}
            </Text>
            <Text className="text-xs" 
                style={{ color: repliedMessage.me ? '#fff/70' : '#666' }}
                numberOfLines={1}>
                {repliedMessage.message}
                {repliedMessage.attachmentUrl && ' [Media]'}
            </Text>
        </View>
    );
});

export const MessageContent = React.memo(
    ({ message, me, formattedTime, width, composedGesture }) => {
        const [modalVisible, setModalVisible] = useState(false);
        const attachmentType = message.attachmentUrl ? getAttachmentType(message.attachmentUrl) : null;

        const renderVideoPreview = () => {
            const thumbnailUrl = createMediaURL(baseURL, message.attachmentUrl).replace(/\.(mp4|mov|avi|mkv)$/, '.jpg');
            
            return (
                <Pressable 
                    onPress={() => setModalVisible(true)}
                    className="relative"
                >
                    <ImageBackground
                        source={{ uri: thumbnailUrl }}
                        style={{ width: 200, height: 200 }}
                        imageStyle={{ borderRadius: 8 }}
                        className="justify-center items-center overflow-hidden"
                    >
                        <View className="absolute bg-black/30 w-full h-full" />
                        <View className="absolute">
                            <Ionicons 
                                name="play-circle" 
                                size={50} 
                                color="white" 
                                style={{ opacity: 0.9 }}
                            />
                        </View>
                    </ImageBackground>
                </Pressable>
            );
        };

        return (
            <>
                <GestureDetector gesture={composedGesture}>
                    <View className={`flex-row items-center ${me ? 'justify-end' : 'justify-start'} py-1`}>
                        {me && (
                            <Text className={`${me ? 'mr-3' : 'ml-3'} font-rubik text-2xs text-black/30`}>
                                {formattedTime}
                            </Text>
                        )}
                        <View style={{ padding: 10, borderRadius: 16, backgroundColor: me ? '#9e5bd8' : '#f8f8f8', width: 'auto', maxWidth: 300, alignItems: 'center' }}>
                            {message.repliedToMessage && (
                                <ReplyPreview 
                                    repliedMessage={{
                                        ...message.repliedToMessage,
                                        me: message.userId === message.repliedToMessage.id
                                    }} 
                                />
                            )}
                            <Text style={{
                                paddingStart: 5,
                                fontFamily: 'Rubik',
                                fontWeight: '300',
                                fontSize: 14,
                                color: me ? 'white' : 'black',
                                textAlign: 'center' // Center text
                            }}>
                                {message.message}
                            </Text>
                            {message.attachmentUrl && (
                                <View className="mt-2 rounded-lg overflow-hidden">
                                    {attachmentType === 'image' ? (
                                        <Image
                                            source={{ uri: createMediaURL(baseURL, message.attachmentUrl) }}
                                            style={{ width: 200, height: 200, borderRadius: 8 }}
                                            resizeMode="cover"
                                        />
                                    ) : attachmentType === 'video' ? (
                                        renderVideoPreview()
                                    ) : null}
                                </View>
                            )}
                        </View>
                        {!me && (
                            <Text className={`${me ? 'mr-3' : 'ml-3'} font-rubik text-2xs text-black/30`}>
                                {formattedTime}
                            </Text>
                        )}
                    </View>
                </GestureDetector>

                {message.attachmentUrl && (
                    <Modal
                        animationType="slide"
                        transparent={true}
                        visible={modalVisible}
                        onRequestClose={() => setModalVisible(false)}
                    >
                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)' }}>
                            <Pressable onPress={() => setModalVisible(false)} style={{ position: 'absolute', top: 20, right: 20 }}>
                                <Text style={{ color: 'white', fontSize: 18 }}>Close</Text>
                            </Pressable>
                            {attachmentType === 'image' ? (
                                <Image
                                    source={{ uri: createMediaURL(baseURL, message.attachmentUrl) }}
                                    style={{ width: '90%', height: '90%' }}
                                    resizeMode="contain"
                                />
                            ) : attachmentType === 'video' ? (
                                <Video
                                    source={{ uri: createMediaURL(baseURL, message.attachmentUrl) }}
                                    style={{ width: '90%', height: '90%' }}
                                    resizeMode="contain"
                                    controls={true}
                                    controlsTimeout={3000}
                                    paused={false}
                                />
                            ) : null}
                        </View>
                    </Modal>
                )}
            </>
        );
    }
);

// Component chính
function ChatMessage({ message, onSwipe, onLongPress, onCloseActions }) {
	const {
		calculatedWidth,
		composedGesture,
		panStyle,
	} = useChatMessage(
		message,
		onSwipe,
		onLongPress,
		onCloseActions
	);

	return (
		<View className={`flex-col ${message.me ? 'mr-3' : ''}`}>
			<Animated.View
				style={[panStyle]}
				className={`w-fit ${message.me ? 'flex-row-reverse' : 'flex-row'} items-center`}>
				<MessageContent
					message={message}
					me={message.me}
					formattedTime={message.formattedTime}
					width={calculatedWidth}
					composedGesture={composedGesture}
				/>
			</Animated.View>
		</View>
	);
}

export default React.memo(ChatMessage);