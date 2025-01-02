import React, { useState } from 'react';
import { FlatList, Image, Text, View } from 'react-native';

// Components
import { Header } from '@/components';

// Commons

// Layout
import Layout from '@/Layout';
import { TouchableOpacity } from 'react-native-gesture-handler';

const dataFriendRequests = [
    {
        id: 1,
        name: 'Herse Hedma',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        mutualFriends: 5,
        timeAgo: '1p',
    },
    {
        id: 2,
        name: 'Sarah Parker',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        mutualFriends: 3,
        timeAgo: '5p',
    },
    {
        id: 3,
        name: 'Michael Chen',
        avatar: 'https://randomuser.me/api/portraits/men/52.jpg',
        mutualFriends: 8,
        timeAgo: '15p',
    },
]

function FriendRequest({ user, onAccept, onReject }) {
    return (
        <View className="flex-row justify-between bg-light rounded-2xl py-4 px-5 mb-3 shadow-sm">
            {/* Avatar */}
            <Image
                source={{ uri: user.avatar }}
                className="flex mt-1 w-16 h-16 rounded-full"
            />
            <View className="flex-col gap-1">
                <View className="flex-row ml-3">
                    {/* User Info */}
                    <View className="flex-1 ml-3">
                        <Text className="font-medium text-[15px]">{user.name}</Text>
                    </View>

                    {/* Points */}
                    <Text className="text-gray-500 text-sm mr-4 pl-3">{user.timeAgo}</Text>
                </View>
                {/* Buttons */}
                <View className="flex-row gap-2">
                    <TouchableOpacity
                        onPress={onAccept}
                        className="bg-purple px-8 py-2 rounded-full"
                    >
                        <Text className="text-[14px] font-medium text-white">Accept   </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={onReject}
                        className="bg-gray-200 px-8 py-2 rounded-full"
                    >
                        <Text className="text-[14px] font-medium text-gray-600">Reject   </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

function InvitationsContainer({ navigation }) {
    const [friendRequests, setFriendRequests] = useState(dataFriendRequests);

    const handleAccept = (userId) => {
        console.log('Accepted friend:', userId);
        setFriendRequests((prev) => prev.filter((request) => request.id !== userId));
    };

    const handleReject = (userId) => {
        console.log('Rejected friend:', userId);
        setFriendRequests((prev) => prev.filter((request) => request.id !== userId));
    };


    const renderFriendRequest = ({ item }) => (
        <FriendRequest
            user={item}
            onAccept={() => handleAccept(item.id)}
            onReject={() => handleReject(item.id)}
        />
    );

    return (
        <Layout>
            <Header title="Invitations" goBack search navigation={navigation} />
            <View className="flex-1 mb-4 mt-6">
                <View className="flex-1">
                    <FlatList
                        data={friendRequests}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={renderFriendRequest}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingVertical: 8 }}
                        ItemSeparatorComponent={() => <View className="h-[1px]" />}
                        ListEmptyComponent={
                            <Text className="text-center text-gray-500 mt-4">No friend requests</Text>
                        }
                    />
                </View>
            </View>
        </Layout>
    );
}

export default InvitationsContainer;
