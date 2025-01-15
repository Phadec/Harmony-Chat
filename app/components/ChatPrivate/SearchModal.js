import React, { useState, useMemo } from 'react';
import { 
    View, 
    Text, 
    Modal, 
    TextInput, 
    FlatList, 
    TouchableOpacity, 
    Image 
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Colors } from '@/common';
import { baseURL } from '@/services/axiosInstance';

const SearchModal = ({ 
    visible, 
    onClose, 
    messages, 
    onMessagePress, 
    currentUserAvatar,
    opponentAvatar // Thêm prop này
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    
    const filteredMessages = useMemo(() => {
        if (!searchQuery.trim()) return [];
        
        const searchText = searchQuery.toLowerCase();
        return messages.filter(message => {
            // Kiểm tra tin nhắn không bị xóa
            if (message.isDeleted || !message.message) return false;
            
            return (
                message.message.toLowerCase().includes(searchText) ||
                (message.senderFullName && 
                 message.senderFullName.toLowerCase().includes(searchText))
            );
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [messages, searchQuery]);

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            className="p-4 border-b border-gray-200 active:bg-gray-100"
            onPress={() => {
                onMessagePress(item);
                onClose();
            }}
        >
            <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                    <Image 
                        source={
                            item.me 
                                ? { uri: `${baseURL}/${currentUserAvatar}` }
                                : { uri: opponentAvatar } // Sử dụng opponentAvatar trực tiếp
                        }
                        className="w-6 h-6 rounded-full mr-2"
                        style={{ backgroundColor: '#e0e0e0' }}
                    />
                    <Text className="font-rubik text-xs text-gray-600">
                        {item.me ? 'You' : item.senderFullName}
                    </Text>
                </View>
                <Text className="font-rubik text-xs text-gray-400">
                    {item.sectionDate}
                </Text>
            </View>
            
            <Text className="font-rubik text-sm mb-1" numberOfLines={2}>
                {item.message}
            </Text>

            {item.attachmentUrl && (
                <Text className="font-rubik text-xs text-main">
                    [Media attachment]
                </Text>
            )}
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={true}
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-white">
                <View className="flex-row items-center p-4 bg-main">
                    <TouchableOpacity onPress={onClose} className="mr-3">
                        <Ionicons name="arrow-back" size={24} color={Colors.white} />
                    </TouchableOpacity>
                    <View className="flex-1 bg-white/10 rounded-full flex-row items-center px-4 py-2">
                        <Ionicons name="search" size={20} color={Colors.white} />
                        <TextInput
                            className="flex-1 ml-2 font-rubik text-white"
                            placeholder="Search messages..."
                            placeholderTextColor="rgba(255,255,255,0.6)"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoFocus
                        />
                    </View>
                </View>
                
                {searchQuery ? (
                    <FlatList
                        data={filteredMessages}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        ListEmptyComponent={
                            <View className="flex-1 justify-center items-center p-4 mt-8">
                                <Text className="font-rubik text-gray-500">
                                    No messages found
                                </Text>
                            </View>
                        }
                    />
                ) : (
                    <View className="flex-1 justify-center items-center">
                        <Text className="font-rubik text-gray-500">
                            Enter text to search messages
                        </Text>
                    </View>
                )}
            </View>
        </Modal>
    );
};

export default SearchModal;
