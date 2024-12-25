import React, {useState, useEffect} from 'react';
import {View, FlatList} from 'react-native';

// Components
import {Header, GroupCard} from '@/components';

// Layout
import Layout from '@/Layout';
import {ChatService} from "../../services/Chat";
import {SignalRService} from "../../services/signalR";

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
			<Header title="Groups" groups navigation={navigation}/>

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
