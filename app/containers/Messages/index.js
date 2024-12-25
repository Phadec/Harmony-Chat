import React, {useEffect, useState} from 'react';
import {View, FlatList} from 'react-native';

// Components
import {Header, BubbleStory, MessageCard, GroupCard} from '@/components';

// Layout
import Layout from '@/Layout';
import {ChatService} from "../../services/Chat";
import {SignalRService} from '../../services/signalR';

function MessagesContainer({navigation}) {
	const chatService = new ChatService();
	const signalRService = SignalRService.getInstance();  // Đảm bảo sử dụng Singleton instance
	const [relationships, setRelationships] = useState([]);

	// Hàm gọi API lấy danh sách tin nhắn
	const fetchAndSetRelationships = async () => {
		try {
			const relations = await chatService.getRelationships();
			if (relations?.$values?.length > 0) {
				setRelationships(relations?.$values);
			} else {
				console.warn('No relationships found.');
			}
		} catch (error) {
			console.error('Error fetching relationships:', error);
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

	return (
		<Layout>
			<Header title="Messages" messages search navigation={navigation}/>

			<View className="my-6 -mx-6">
				<FlatList
					data={relationships.filter(item => item.relationshipType === 'Private')}
					keyExtractor={(item) => {
						if (item.relationshipType === 'Private') {
							return item.contactId;
						}
					}}
					renderItem={({item}) => <BubbleStory item={item} navigation={navigation}/>}
					horizontal
					showsHorizontalScrollIndicator={false}
					className="pl-6"
				/>
			</View>

			<FlatList
				data={relationships}
				keyExtractor={(item) => {
					if (item.relationshipType === 'Group') {
						return item.groupId;
					}
					return item.contactId;
				}}
				renderItem={({item}) => {
					if (item.relationshipType === 'Private') {
						return <MessageCard item={item} navigation={navigation}/>;
					}
					return <GroupCard item={item} navigation={navigation}/>
				}}
				showsVerticalScrollIndicator={false}
			/>
		</Layout>
	);
}

export default MessagesContainer;
