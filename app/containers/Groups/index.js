import React, { useEffect, useState }  from 'react';
import {View, FlatList} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

// Components
import {Header, GroupCard} from '@/components';

// Layout
import Layout from '@/Layout';

import { ChatGroup } from '../../services/ChatGroup';
import { SignalRService } from '../../services/signalR';

const messages = [
	{id: 1, color: 'black', name: 'FAM 👨‍👩‍👧‍👧', time: '16:30', photo: require('@/assets/images/story-1.png')},
	{id: 2, color: 'orange', name: 'Business 💼', time: '17:20', photo: require('@/assets/images/story-2.png')},
	{id: 3, color: 'green', name: 'Girls 👨‍👩‍👧‍👧', time: '18:12', photo: require('@/assets/images/story-3.png')},
	{id: 4, color: 'black', name: 'Shopping 👛', time: '16:30', photo: require('@/assets/images/story-4.png')},
	{id: 5, color: 'black', name: 'FAM 👨‍👩‍👧‍👧', time: '16:30', photo: require('@/assets/images/story-5.png')},
	{id: 6, color: 'black', name: 'Business 💼', time: '16:30', photo: require('@/assets/images/story-3.png')},
	{id: 7, color: 'black', name: 'Girls 👨‍👩‍👧‍👧', time: '16:30', photo: require('@/assets/images/story-1.png')},
	{id: 8, color: 'black', name: 'Shopping 👛', time: '16:30', photo: require('@/assets/images/story-4.png')},
	{id: 9, color: 'black', name: 'FAM 👨‍👩‍👧‍👧', time: '16:30', photo: require('@/assets/images/story-5.png')},
	{id: 10, color: 'black', name: 'Business 💼', time: '16:30', photo: require('@/assets/images/story-3.png')},
];

function GroupsContainer({navigation}) {
	const chatService = new ChatGroup();
	const signalRService = SignalRService.getInstance(); // Đảm bảo sử dụng Singleton instance
	const [relationships, setRelationships] = useState([]);

	// Hàm gọi API lấy danh sách tin nhắn
	const fetchAndSetRelationships = async () => {
		try {
			const relations = await chatService.getUserGroupsWithDetails();
			if (relations?.$values?.length > 0) {
				setRelationships(relations.$values);
			} else {
				console.warn('No groups found.');
			}
		} catch (error) {
			console.error('Error fetching groups:', error);
		}
	};

	// Lắng nghe sự kiện messageReceived từ SignalR
	useEffect(() => {
	const startSignalRConnection = async () => {
		// Kiểm tra nếu SignalR đã được kết nối
		if (signalRService.hubConnection.state !== signalRService.hubConnection.state.Connected) {
		await signalRService.start(); // Chỉ bắt đầu kết nối nếu chưa kết nối
		}
	};

	// Khởi động kết nối SignalR và subscribe vào sự kiện
	startSignalRConnection().then(() => {
		const subscription = signalRService.messageReceived$.subscribe(() => {
		fetchAndSetRelationships(); // Cập nhật danh sách tin nhắn khi nhận được tin nhắn
		});

		// Cleanup khi component unmount
		return () => {
		console.log('Unsubscribing from SignalR messages');
		subscription.unsubscribe(); // Hủy đăng ký sự kiện
		};
	}).catch((error) => {
		console.error('Error while starting SignalR connection:', error);
	});

	// Cleanup khi component unmount
	return () => {
		console.log('Disconnecting SignalR connection');
		signalRService.stopConnection(); // Ngừng kết nối khi component unmount
	};
	}, [signalRService]); // Chỉ chạy khi signalRService thay đổi (singleton instance)
	
	// Reload messages when the screen is focused
	useFocusEffect(
		React.useCallback(() => {
			fetchAndSetRelationships();
		}, [])
	);
	
	return (
		<Layout>
			<Header title="Groups" stories navigation={navigation} />

			<View className="flex-1 mt-6">
				<FlatList data={relationships} key={item => item.id} renderItem={({item}) => <GroupCard {...item} navigation={navigation} />} showsVerticalScrollIndicator={false} />
			</View>
		</Layout>
	);
}

export default GroupsContainer;
