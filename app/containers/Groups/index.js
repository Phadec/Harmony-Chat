import React, {useState, useEffect} from 'react';
import {View, FlatList} from 'react-native';

// Components
import {Header, GroupCard} from '@/components';

// Layout
import Layout from '@/Layout';
import {ChatService} from "../../services/Chat";
import {SignalRService} from "../../services/signalR";

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
	const [groups, setGroups] = useState([]);
	const signalRService = SignalRService.getInstance();  // Đảm bảo sử dụng Singleton instance

	const fetchGroups = async () => {
		try {
			const chatService = new ChatService();
			const relationships = await chatService.getRelationships();
			if (relationships) {
				// Lấy ra các nhóm từ data có filed 'relationshipType' = 'Group'
				const groupFiltered = relationships.$values.filter(
					item => item.relationshipType === 'Group');
				setGroups(groupFiltered)
			}
		}
		catch (error) {
			console.error('Error fetching groups:', error);
		}
	};

	// Lấy danh sách nhóm khi component được render
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
				fetchGroups(); // Cập nhật danh sách tin nhắn khi nhận được tin nhắn
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
	}, [signalRService]);

	return (
		<Layout>
			<Header title="Groups" stories navigation={navigation}/>

			<View className="flex-1 mt-6">
				<FlatList
					data={groups}
					key={item => item.groupId}
					renderItem={
						({item}) => <GroupCard item={item} navigation={navigation}/>
					}
					showsVerticalScrollIndicator={false}/>
			</View>
		</Layout>
	);
}

export default GroupsContainer;
