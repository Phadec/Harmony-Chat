// Tách MessageContent thành component riêng
import React, { useState, memo, useEffect, useCallback } from 'react';
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

// Sửa lại mapping cho reaction types để khớp với API
const REACTION_EMOJIS = {
    'THUMBSUP': '👍',
    'HEART': '❤️',
    'LAUGH': '😆',
    'WOW': '😮',
    'CRY': '😢',
    'ANGRY': '😠'
};

const Reactions = memo(({ reactions, me }) => {
    if (!reactions?.length) return null;

    // Filter out null values before processing
    const validReactions = reactions.filter(r => r != null && r.reactionType && r.reactedByUser);
    
    // If no valid reactions after filtering, return null
    if (!validReactions.length) return null;

    // Sort reactions by createdAt, handling potential null values
    const sortedReactions = validReactions.sort((a, b) => 
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );

    const reactionGroups = sortedReactions.reduce((acc, reaction) => {
        const type = reaction.reactionType;
        if (!acc[type]) {
            acc[type] = [];
        }
        acc[type].push(reaction);
        return acc;
    }, {});

    return (
        <View 
            className={`absolute bottom-[-14px] ${me ? 'right-2' : 'left-2'} 
                bg-white rounded-full px-2.5 py-1.5 flex-row items-center`}
            style={{
                shadowColor: "#000",
                shadowOffset: {
                    width: 0,
                    height: 2,
                },
                shadowOpacity: 0.15,
                shadowRadius: 3.84,
                elevation: 5,
                borderWidth: 0.5,
                borderColor: 'rgba(0,0,0,0.1)',
            }}>
            {Object.entries(reactionGroups).map(([type, reactions], index, array) => (
                <View 
                    key={type} 
                    className={`flex-row items-center ${index !== array.length - 1 ? 'mr-1.5' : ''}`}
                    style={{
                        transform: [{ scale: 1.1 }], // Slightly larger emojis
                    }}>
                    <Text 
                        className="text-sm" 
                        style={{ 
                            textShadowColor: 'rgba(0,0,0,0.1)',
                            textShadowOffset: { width: 1, height: 1 },
                            textShadowRadius: 1,
                        }}>
                        {REACTION_EMOJIS[type]}
                    </Text>
                    {reactions.length > 1 && (
                        <Text className="text-xs text-gray-600 ml-1 font-medium">
                            {reactions.length}
                        </Text>
                    )}
                </View>
            ))}
        </View>
    );
});

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
    ({ message, me, formattedTime, width, composedGesture, onReactionAdded }) => {
        const [modalVisible, setModalVisible] = useState(false);
        const attachmentType = message.attachmentUrl ? getAttachmentType(message.attachmentUrl) : null;
        const [localReactions, setLocalReactions] = useState(message.reactions?.$values || []);

        // Thêm useEffect để cập nhật localReactions khi message.reactions thay đổi
        useEffect(() => {
            setLocalReactions(message.reactions?.$values || []);
        }, [message.reactions]);

        // Sửa lại hàm xử lý reaction
        const handleReactionAdded = useCallback((messageId, newReaction) => {
            console.log('Adding reaction:', { messageId, newReaction });
            if (messageId === message.id) {
                setLocalReactions(prev => {
                    console.log('Previous reactions:', prev);
                    // Lọc bỏ reaction cũ của user hiện tại
                    const updatedReactions = prev.filter(
                        r => r.reactedByUser.id !== newReaction.reactedByUser.id
                    );
                    console.log('After filtering:', updatedReactions);
                    const result = [...updatedReactions, newReaction];
                    console.log('Final reactions:', result);
                    return result;
                });
            }
            onReactionAdded?.(messageId, newReaction);
        }, [message.id, onReactionAdded]);

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
                        <View className="relative">
                            <View style={{ padding: 10, borderRadius: 16, backgroundColor: message.message === "Message has been deleted" ? '#e0e0e0' : (me ? '#9e5bd8' : '#f8f8f8'), width: 'auto', maxWidth: 300, alignItems: 'center' }}>
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
                            {/* Only show reactions if message is not deleted */}
                            {message.message !== "Message has been deleted" && (
                                <Reactions 
                                    reactions={localReactions}
                                    me={me}
                                    onReactionAdded={handleReactionAdded}
                                    messageId={message.id}
                                />
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
function ChatMessage({ message, onSwipe, onLongPress, onCloseActions, onReactionAdded }) {
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
					onReactionAdded={onReactionAdded} // Pass to MessageContent
				/>
			</Animated.View>
		</View>
	);
}

export default React.memo(ChatMessage);