import React, { useState } from 'react';
import { Image, View, Text, Modal, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { useDispatch } from 'react-redux';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';
import Octicons from 'react-native-vector-icons/Octicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Components
import { Button } from '@/components';

// Common
import { Colors } from '@/common';

// Actions
import { actions } from '@/redux/reducer/StoryRedux';

// Mock data
const mockUsers = [
    {
        id: '1',
        name: 'John Doe',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        mutualFriends: 5,
        status: 'none'
    },
    {
        id: '2',
        name: 'Jane Smith',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        mutualFriends: 3,
        status: 'pending'
    },
    {
        id: '3',
        name: 'Mike Johnson',
        avatar: 'https://randomuser.me/api/portraits/men/52.jpg',
        mutualFriends: 8,
        status: 'friend'
    },
    {
        id: '4',
        name: 'Sarah Wilson',
        avatar: 'https://randomuser.me/api/portraits/women/45.jpg',
        mutualFriends: 12,
        status: 'friend'
    },
    {
        id: '5',
        name: 'Alex Brown',
        avatar: 'https://randomuser.me/api/portraits/men/36.jpg',
        mutualFriends: 6,
        status: 'none'
    }
];

function Header({ title, stories, messages, search, goBack, navigation }) {
	const dispatch = useDispatch();
	const [showSearch, setShowSearch] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');
	const [filteredUsers, setFilteredUsers] = useState(mockUsers);
	const [users, setUsers] = useState(mockUsers);

	const handleSearch = (text) => {
		setSearchQuery(text);
		const filtered = users.filter(user =>
			user.name.toLowerCase().includes(text.toLowerCase())
		);
		setFilteredUsers(filtered);
	};

	const handleAddFriend = (userId) => {
		setUsers(prevUsers =>
			prevUsers.map(user =>
				user.id === userId ? { ...user, status: 'pending' } : user
			)
		);
		setFilteredUsers(prevUsers =>
			prevUsers.map(user =>
				user.id === userId ? { ...user, status: 'pending' } : user
			)
		);
	};

	const handleCancelRequest = (userId) => {
		setUsers(prevUsers =>
			prevUsers.map(user =>
				user.id === userId ? { ...user, status: 'none' } : user
			)
		);
		setFilteredUsers(prevUsers =>
			prevUsers.map(user =>
				user.id === userId ? { ...user, status: 'none' } : user
			)
		);
	};

	const renderUserItem = ({ item }) => (
		<TouchableOpacity
			className="flex-row items-center p-4 border-b border-gray-100"
			onPress={() => {
				setShowSearch(false);
				// Xử lý khi chọn user (nếu kết bạn rồi thì mở đoạn chat)
			}}
		>
			<Image
				source={{ uri: item.avatar }}
				className="w-12 h-12 rounded-full"
			/>
			<View className="ml-3 flex-1">
				<Text className="font-rubik font-medium text-base">{item.name}</Text>
				<Text className="font-rubik text-xs text-black/40">
					{item.mutualFriends} mutual friends
				</Text>
			</View>

			{/* Action Button based on status */}
			{item.status === 'none' ? (
				<Button
					className="bg-purple px-4 py-2 rounded-xl"
					onPress={(e) => {
						e.stopPropagation();
						handleAddFriend(item.id);
					}}
				>
					<Text className="font-rubik text-sm text-white">Add</Text>
				</Button>
			) : item.status === 'pending' ? (
				<Button
					className="bg-light px-4 py-2 rounded-xl"
					onPress={(e) => {
						e.stopPropagation();
						handleCancelRequest(item.id);
					}}
				>
					<Text className="font-rubik text-sm text-black/60">Cancel Request</Text>
				</Button>
			) : item.status === 'friend' ? (
				<View className="bg-light px-4 py-2 rounded-xl">
					<Text className="font-rubik text-sm text-black/60">Friends</Text>
				</View>
			) : null}
		</TouchableOpacity>
	);

	return (
		<>
			<View className="flex-row items-center">
				{goBack ? (
					<Button className="flex-row items-center" onPress={() => navigation.goBack()}>
						<MaterialIcons name="arrow-back-ios" size={16} color={Colors.black} />
						<Text className="font-rubik font-medium text-xl text-black ml-2">{title}</Text>
					</Button>
				) : (
					<Text className="font-rubik font-medium text-xl text-black">{title}</Text>
				)}

				<View className="flex-row items-center ml-auto">
					{messages && (
						<Button className="mr-4 opacity-40">
							<Entypo name="unread" size={20} color={Colors.black} />
						</Button>
					)}

					{search && (
						<Button onPress={() => setShowSearch(true)}>
							<Octicons name="search" size={20} color={Colors.black} />
						</Button>
					)}

					{stories && (
						<Button onPress={() => actions.setAddStory(dispatch, true)}>
							<AntDesign name="pluscircleo" size={20} color={Colors.black} />
						</Button>
					)}

					<Button
						className="w-12 h-12 rounded-full relative ml-6 cursor-pointer"
						onPress={() => navigation.navigate('Profile')}
					>
						<View className="w-3 h-3 rounded-full bg-orange border-2 border-white absolute left-0 top-0 z-10" />
						<Image source={require('@/assets/images/person-1.webp')} className="w-12 h-12 rounded-full" />
					</Button>
				</View>
			</View>

			{/* Search Modal */}
			<Modal
				visible={showSearch}
				animationType="slide"
				transparent={true}
				onRequestClose={() => setShowSearch(false)}
			>
				<View className="flex-1 bg-black/50">
					<View className="flex-1 mt-20 bg-white rounded-t-3xl">
						<View className="p-4 border-b border-gray-100">
							<View className="flex-row items-center">
								<Button
									className="mr-3"
									onPress={() => setShowSearch(false)}
								>
									<MaterialIcons name="arrow-back" size={24} color={Colors.black} />
								</Button>
								<View className="flex-1 flex-row items-center bg-light rounded-xl px-3">
									<Ionicons name="search" size={20} color={Colors.black + '40'} />
									<TextInput
										placeholder="Search users..."
										value={searchQuery}
										onChangeText={handleSearch}
										className="flex-1 py-2 px-2 font-rubik"
										autoFocus={true}
									/>
								</View>
							</View>
						</View>

						<FlatList
							data={filteredUsers}
							renderItem={renderUserItem}
							keyExtractor={item => item.id}
							contentContainerClassName="pb-6"
							ListEmptyComponent={
								<View className="flex-1 items-center justify-center p-8">
									<MaterialIcons
										name="search-off"
										size={48}
										color={Colors.black + '40'}
									/>
									<Text className="font-rubik text-base text-black/40 mt-2 text-center">
										No users found
									</Text>
								</View>
							}
						/>
					</View>
				</View>
			</Modal>
		</>
	);
}

export default Header;
