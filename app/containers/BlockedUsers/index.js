import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Toast from 'react-native-toast-message';

// Components
import { Header } from '@/components';
import Layout from '@/Layout';

// Commons
import { Colors } from '@/common';

// Services
import { FriendService } from '@/services';

import {baseURL} from "../../services/axiosInstance";

function BlockedUserItem({ user, onUnblock }) {
    return (
        <View className="flex-row items-center justify-between bg-white p-4 mb-3 rounded-2xl">
            <View className="flex-row items-center flex-1">
                <Image
                    source={{ uri: `${baseURL}/${user.blockedAvatar}`}}
                    className="w-12 h-12 rounded-full"
                />
                <View className="ml-3 flex-1">
                    <Text className="font-rubik font-medium text-base">
                        {user.blockedFullName}
                    </Text>
                    <Text className="font-rubik text-xs text-black/40">
                        {user.blockedTagName}
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
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const friendService = new FriendService();

    useEffect(() => {
        fetchBlockedUsers();
    }, []);

    const fetchBlockedUsers = async () => {
        try {
            setLoading(true);
            const response = await friendService.getBlockedUsers();
            setBlockedUsers(response.$values);
        } catch (error) {
            console.error('Error fetching blocked users:', error);
            Toast.show({
                type: 'error',
                text1: 'Failed to load blocked users',
                position: 'top',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUnblock = async (user) => {
        try {
            Alert.alert(
                "",
                `Are you sure you want to unblock ${user.blockedFullName}? They will be able to:
                • See your posts
                • Send you messages
                • Find you in search`,
                [
                    {
                        text: "Cancel",
                        style: "cancel"
                    },
                    {
                        text: "Unblock",
                        onPress: async () => {
                            const response = await friendService.unblockUser(user.blockedUserId);
                            if (response) {
                                setBlockedUsers(prev => prev.filter(u => u.blockedUserId !== user.blockedUserId));
                                Toast.show({
                                    type: 'success',
                                    text1: `Unblocked ${user.blockedFullName}`,
                                    position: 'top',
                                    visibilityTime: 2000,
                                });
                            }
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Error unblocking user:', error);
            Toast.show({
                type: 'error',
                text1: 'Failed to unblock user',
                position: 'top',
            });
        }
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
                {loading ? (
                    <ActivityIndicator size="large" color={Colors.purple} />
                ) : blockedUsers?.length > 0 ? (
                    <FlatList
                        data={blockedUsers}
                        renderItem={({ item }) => (
                            <BlockedUserItem
                                user={item}
                                onUnblock={handleUnblock}
                            />
                        )}
                        keyExtractor={item => item.blockedUserId}
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