import React, { useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';

// Components
import { Header } from '@/components';
import Layout from '@/Layout';

// Commons
import { Colors } from '@/common';

const mockBlockedUsers = [
    {
        id: '1',
        name: 'John Doe',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        blockedDate: '2024-02-15',
        mutualFriends: 5
    },
    {
        id: '2',
        name: 'Jane Smith',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        blockedDate: '2024-02-10',
        mutualFriends: 3
    },
    {
        id: '3',
        name: 'Mike Johnson',
        avatar: 'https://randomuser.me/api/portraits/men/52.jpg',
        blockedDate: '2024-02-08',
        mutualFriends: 8
    }
];

function BlockedUserItem({ user, onUnblock }) {
    return (
        <View className="flex-row items-center justify-between bg-white p-4 mb-3 rounded-2xl">
            <View className="flex-row items-center flex-1">
                <Image
                    source={{ uri: user.avatar }}
                    className="w-12 h-12 rounded-full"
                />
                <View className="ml-3 flex-1">
                    <Text className="font-rubik font-medium text-base">{user.name}</Text>
                    <Text className="font-rubik text-xs text-black/40">
                        {user.mutualFriends} mutual friends • Blocked on {new Date(user.blockedDate).toLocaleDateString()}
                    </Text>
                </View>
            </View>

            <TouchableOpacity
                className="bg-light px-4 py-2 rounded-xl"
                onPress={() => onUnblock(user)}
            >
                <Text className="font-rubik text-sm text-purple">Unblock</Text>
            </TouchableOpacity>
        </View>
    );
}

function BlockedUsersContainer({ navigation }) {
    const [blockedUsers, setBlockedUsers] = useState(mockBlockedUsers);

    const handleUnblock = (user) => {
        // Xử lý unblock user
        setBlockedUsers(prev => prev.filter(u => u.id !== user.id));
        Toast.show({
            type: 'success',
            text1: `Unblocked ${user.name}`,
            position: 'top',
            visibilityTime: 2000,
        }); 
    };

    const EmptyState = () => (
        <View className="flex-1 items-center justify-center">
            <MaterialIcons
                name="block"
                size={48}
                color={Colors.black + '40'}
            />
            <Text className="font-rubik text-base text-black/40 mt-2 text-center">
                No blocked users{'\n'}Your blocked users will appear here
            </Text>
        </View>
    );

    return (
        <Layout>
            <Header title="Blocked Users" goBack navigation={navigation} />

            <View className="flex-1 mt-6">
                {blockedUsers.length > 0 ? (
                    <FlatList
                        data={blockedUsers}
                        renderItem={({ item }) => (
                            <BlockedUserItem
                                user={item}
                                onUnblock={handleUnblock}
                            />
                        )}
                        keyExtractor={item => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerClassName="pb-6"
                        ListHeaderComponent={
                            <Text className="font-rubik text-sm text-black/60 mb-4">
                                {blockedUsers.length} blocked {blockedUsers.length === 1 ? 'user' : 'users'}
                            </Text>
                        }
                    />
                ) : (
                    <EmptyState />
                )}
            </View>
        </Layout>
    );
}

export default BlockedUsersContainer;