import {Pressable, Text, View, Alert} from "react-native";
import React from "react";
import {ChatService} from "../../services/Chat";

function ContextMenuActions({me, onClose, messageId, onMessageDeleted, pinned, onPinToggle}) {
    const chatService = new ChatService();

    const handleUnsend = async () => {
        Alert.alert(
            "Confirm Unsend",
            "Are you sure you want to unsend this message?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Unsend",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await chatService.deleteMessage(messageId);
                            onMessageDeleted?.(messageId, "Message has been deleted");
                            onClose();
                        } catch (error) {
                            console.error('Error unsending message:', error);
                        }
                    }
                }
            ]
        );
    };

    const handlePinToggle = async () => {
        await onPinToggle?.(messageId, pinned);
        onClose();
    };

    const menuItems = [
        {
            id: 'unsend',
            label: 'Unsend',
            icon: '🗑',
            onPress: handleUnsend,
            textColor: '#E76F51' // Màu đỏ cho Unsend
        },
        {
            id: pinned ? 'unpin' : 'pin',
            label: pinned ? 'Unpin' : 'Pin',
            icon: '📌',
            onPress: handlePinToggle,
            textColor: '#3182CE' // Màu xanh cho Pin
        }
    ];

    return (
        <View
            style={{backgroundColor: '#f8f8f8'}}
            className={`absolute ${me ? 'right-0' : ''} rounded-xl shadow-lg min-w-[200px] overflow-hidden`}>
            {menuItems.map((item, index) => (
                <Pressable
                    key={item.id}
                    onPress={() => {
                        item.onPress();
                        onClose();
                    }}
                    className={`flex-row items-center justify-between px-4 py-2 active:bg-gray-200
            ${index !== menuItems.length - 1 ? 'border-b border-gray-200' : ''}`}
                >
                    <Text
                        style={item.textColor ? {color: item.textColor} : null}
                        className="text-base font-normal"
                    >
                        {item.label}
                    </Text>
                    <Text className="">{item.icon}</Text>
                </Pressable>
            ))}
        </View>
    );
}

export default ContextMenuActions;
