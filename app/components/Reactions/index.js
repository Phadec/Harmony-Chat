import React, {useCallback} from 'react';
import {View, Pressable, Text, Alert} from 'react-native';
import Animated from "react-native-reanimated";
import {ChatService} from "@/services";

const REACTIONS = [
    {emoji: '❤️', name: 'HEART'},
    {emoji: '😆', name: 'LAUGH'},
    {emoji: '😮', name: 'WOW'},
    {emoji: '😢', name: 'CRY'},
    {emoji: '😠', name: 'ANGRY'},
    {emoji: '👍', name: 'THUMBSUP'}
];

const Reactions = React.memo(({ message, onClose }) => {
    const chatService = new ChatService();

    const handleReaction = useCallback(async (reactionType) => {
        try {
            console.log('Attempting to add reaction:', {
                messageId: message.id,
                reactionType
            });
            
            const result = await chatService.addReaction(message.id, reactionType);
            console.log('Reaction result:', result);
            
            if (onClose) {
                onClose();
            }
        } catch (error) {
            console.error('Failed to add reaction:', error);
            Alert.alert(
                'Lỗi',
                'Không thể thêm biểu cảm. Vui lòng thử lại.'
            );
        }
    }, [message.id, onClose]);

    return (
        <View className={`${message.me ? "flex-row-reverse" : "flex-row"} items-center`}>
            <Animated.View
                style={{
                    maxWidth: 165,
                    backgroundColor: "#f8f8f8",
                }}
                className={"flex-row rounded-2xl px-1 flex-nowrap"}
            >
                {REACTIONS.map((reaction) => (
                    <Pressable
                        className="px-1 py-2"
                        key={reaction.name}
                        onPress={() => handleReaction(reaction.name)}
                    >
                        <Text>{reaction.emoji}</Text>
                    </Pressable>
                ))}
            </Animated.View>
        </View>
    );
});

export default Reactions;
