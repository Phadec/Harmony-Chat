import React, {useCallback} from 'react';
import {View, Text, FlatList, ActivityIndicator} from 'react-native';

// Icons
import Feather from 'react-native-vector-icons/Feather';

// Components
import {Input, Header, FriendSearchCard} from '@/components';

// Common
import {Colors, Constants} from '@/common';

// Hooks
import {useSearchFriends} from "@/hooks";

// Layout
import Layout from "../../Layout";

const SearchInput = React.memo(({value, onChangeText}) => (
	<View className="bg-light rounded-2xl px-4 flex-row items-center">
		<Feather name="search" size={20} color={Colors.main}/>
		<Input
			value={value}
			onChangeText={onChangeText}
			placeholder="Search..."
			placeholderTextColor={Constants.HexToRgba(Colors.black, 0.4)}
			className="font-rubik text-xs text-black mr-auto flex-1 pl-3"
		/>
	</View>
));

function AddFriend({navigation}) {
	const {friends, setFriends, searchTerm, isLoading, error, handleSearch} = useSearchFriends();

	// Hàm để loại bỏ bạn bè khỏi danh sách
	const handleFriendUpdate = useCallback(
		(friendId) => {
			setFriends((prevFriends) => prevFriends.filter((friend) => friend.id !== friendId));
		},
		[setFriends]
	);

	// Render item
	const renderItems = useCallback(({item}) =>
			<FriendSearchCard friend={item} query={searchTerm} onFriendUpdate={handleFriendUpdate}/>
		, []);

	const ListEmptyComponent = useCallback(() => (
		searchTerm ? (
			<Text className="text-center text-gray-500 mt-4">
				No results found
			</Text>
		) : null
	), [searchTerm]);

	return (
		<Layout>
			<Header title="Add friend" goBack navigation={navigation}/>

			<View className="flex-1 pt-4">
				{/*Tìm kiếm bạn bè*/}
				<SearchInput value={searchTerm} onChangeText={handleSearch}/>

				{/* Friends list */}
				<View className="flex-1 items-center bg-light rounded-2xl my-4">
					{isLoading ? (
						<ActivityIndicator size="small" color={Colors.main}/>
					) : (
						<FlatList
							data={friends}
							keyExtractor={(item) => item.id.toString()}
							renderItem={renderItems}
							showsVerticalScrollIndicator={false}
							ListEmptyComponent={ListEmptyComponent}
						/>
					)}
				</View>
			</View>
		</Layout>
	);
}

export default AddFriend;
