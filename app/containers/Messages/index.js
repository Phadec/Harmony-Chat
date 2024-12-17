import React, {useCallback, useEffect, useState} from 'react';
import {View, FlatList} from 'react-native';

// Components
import {Header, BubbleStory, MessageCard} from '@/components';

// Layout
import Layout from '@/Layout';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {ChatService} from "../../services/Chat";
import {useFocusEffect} from "@react-navigation/native";

const stories = [
	{id: 1, photo: require('@/assets/images/story-1.png'), color: 'blue'},
	{id: 2, photo: require('@/assets/images/story-2.png'), color: 'red'},
	{id: 3, photo: require('@/assets/images/story-3.png'), color: 'yellow'},
	{id: 4, photo: require('@/assets/images/story-4.png'), color: 'purple'},
	{id: 5, photo: require('@/assets/images/story-5.png'), color: 'green'},
	{id: 6, photo: require('@/assets/images/story-2.png'), color: 'red'},
];

function MessagesContainer({navigation}) {

	const chatService = new ChatService();
	const [relationships, setRelationships] = useState([]);

	// Hàm gọi API lấy danh sách tin nhắn
	const fetchAndSetRelationships = async () => {
		try {
			const relations = await chatService.getRelationships();
			if (relations?.$values?.length > 0) {
				setRelationships(relations.$values);
			} else {
				console.warn('No relationships found.');
			}
		} catch (error) {
			console.error('Error fetching relationships:', error);
		}
	};

	// Gọi lại API khi màn hình được focus
	useFocusEffect(
		React.useCallback(() => {
			fetchAndSetRelationships();
		}, [])
	);

	return (
		<Layout>
			<Header title="Messages" messages search navigation={navigation} />

			<View className="my-6 -mx-6">
				<FlatList
					data={relationships}
					keyExtractor={item => item.contactId}
					renderItem={({item}) => <BubbleStory item={item} navigation={navigation} />}
					horizontal showsHorizontalScrollIndicator={false} className="pl-6" />
			</View>

			<FlatList
				data={relationships}
				key={item => item.contactId}
				renderItem={
					({item}) => <MessageCard item={item} navigation={navigation} />
				}
				showsVerticalScrollIndicator={false} />
		</Layout>
	);
}

export default MessagesContainer;
