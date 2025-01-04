import React, {useEffect, useState} from 'react';
import {View, FlatList} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';

// Components
import {Header, GroupCard} from '@/components';

// Layout
import Layout from '@/Layout';

import {ChatGroup} from '../../services/ChatGroup';
import {SignalRService} from '../../services/signalR';

function GroupsContainer({ navigation }) {
	const chatService = new ChatGroup();
	const signalRService = SignalRService.getInstance(); 
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
			if (signalRService.hubConnection.state !== signalRService.hubConnection.state.Connected) {
				await signalRService.start();
			}
		};

		// Khởi động kết nối SignalR và subscribe vào sự kiện
		startSignalRConnection()
			.then(() => {
				const subscription = signalRService.messageReceived$.subscribe((event) => {
					console.log('SignalR event received:', event);
					fetchAndSetRelationships(); // Cập nhật danh sách tin nhắn khi nhận được tin nhắn
				});

				// Cleanup khi component unmount
				return () => {
					console.log('Unsubscribing from SignalR messages');
					subscription.unsubscribe(); // Hủy đăng ký sự kiện
				};
			})
			.catch(error => {
				console.error('Error while starting SignalR connection:', error);
			});

		return () => {
			console.log('Disconnecting SignalR connection');
			signalRService.stopConnection(); // Ngừng kết nối khi component unmount
		};
	}, [signalRService]);

	// Reload messages when the screen is focused or data is changed
	useFocusEffect(
		React.useCallback(() => {
			console.log('[GroupsContainer] Screen focused, fetching groups...');
			fetchAndSetRelationships();
		}, []),
	);

	// Hàm để điều hướng và fetch lại nhóm
	const handleLeaveGroup = async (chatService, groupId, navigation) => {
		await chatService.deleteGroup(groupId); // Xóa nhóm
		navigation.goBack(); // Quay lại màn hình trước
	};

	return (
		<Layout>
			<Header title="Groups" groups navigation={navigation} />

			<View className="flex-1 mt-6">
				<FlatList
					data={relationships}
					keyExtractor={item => {
						if (item.relationshipType === 'Group') {
							return item.groupId;
						}
						return item.contactId;
					}}
					renderItem={({ item }) => {
						if (item.relationshipType == 'Private') {
							return <MessageCard item={item} navigation={navigation} />;
						}
						return <GroupCard keyExtractor={item => item.id} item={item} navigation={navigation} />;
					}}
					showsVerticalScrollIndicator={false}
				/>
			</View>
		</Layout>
	);
}

export default GroupsContainer;