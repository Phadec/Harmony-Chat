import React, {useCallback} from 'react';
import {View, Pressable, Text, Alert} from 'react-native';
import Animated from "react-native-reanimated";
import {ChatService} from "@/services";
import AntDesign from 'react-native-vector-icons/AntDesign';

const REACTIONS = [
    {emoji: '👍', name: 'THUMBSUP'},
    {emoji: '❤️', name: 'HEART'},
    {emoji: '😆', name: 'LAUGH'},
    {emoji: '😮', name: 'WOW'},
    {emoji: '😢', name: 'CRY'},
    {emoji: '😠', name: 'ANGRY'}
];

const Reactions = React.memo(({ message, onClose, onReactionAdded }) => {
    const chatService = new ChatService();

    const handleReaction = useCallback(async (reactionType) => {
        try {
            // Initialize reactions if they don't exist
            if (!message.reactions) {
                message.reactions = { $values: [] };
            }

            const result = await chatService.addReaction(message.id, reactionType);
            if (result) {
                const newReaction = {
                    reactionType: reactionType,
                    reactedByUser: {
                        id: message.currentUserId,
                        fullName: result.userFullName,
                    },
                    createdAt: new Date().toISOString()
                };
                
                // Filter out any existing reaction from this user and add new one
                message.reactions.$values = [
                    ...message.reactions.$values.filter(r => 
                        r && r.reactedByUser && r.reactedByUser.id !== message.currentUserId
                    ),
                    newReaction
                ];
                
                await onReactionAdded?.(message.id, newReaction);
                onClose?.();
            }
        } catch (error) {
            console.error('Reaction failed:', error);
            Alert.alert('Error', 'Could not add reaction');
        }
    }, [message, onReactionAdded, onClose]);

    const handleRemoveReaction = useCallback(async () => {
        try {
            console.log('Removing reaction for message:', message.id);
            const result = await chatService.removeReaction(message.id);
            
            if (result !== null) {
                // Initialize empty reactions array if needed
                if (!message.reactions) {
                    message.reactions = { $values: [] };
                }
                
                // Clear reactions and notify parent
                message.reactions.$values = [];
                console.log('Reactions cleared');
                await onReactionAdded?.(message.id, null);
                onClose?.();
            }
        } catch (error) {
            console.error('Remove reaction failed:', error);
            Alert.alert('Error', 'Could not remove reaction');
        }
    }, [message?.id, onReactionAdded, onClose]);

    return (
        <View className={`${message.me ? "flex-row-reverse" : "flex-row"} items-center`}>
            <Animated.View
                style={{
                    maxWidth: 205, // Increased to accommodate remove button
                    backgroundColor: "#f8f8f8",
                }}
                className={"flex-row rounded-2xl px-1 flex-nowrap items-center"}
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
                <Pressable
                    className="px-2 py-2 border-l border-gray-200 ml-1"
                    onPress={handleRemoveReaction}
                >
                    <AntDesign name="close" size={16} color="#666" />
                </Pressable>
            </Animated.View>
        </View>
    );
});

export default Reactions;
