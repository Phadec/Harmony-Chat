import React, {useEffect} from 'react';
import {Text, View} from 'react-native';
import {FlatList} from 'react-native-gesture-handler';

// Components
import {Header, FriendCard} from '@/components';

// Services
import {FriendService} from '@/services/Friend';

// Layout
import Layout from '@/Layout';
import {SignalRService} from "../../services/signalR";

const stories = [
	{id: 1, photo: require('@/assets/images/story-1.png'), name: 'Mayke Schuurs', emoji: '😎'},
	{id: 2, photo: require('@/assets/images/story-2.png'), name: 'Daisy Murphy', emoji: '🌿'},
	{id: 3, photo: require('@/assets/images/story-3.png'), name: 'Veerle de Bree', emoji: '👽'},
	{id: 4, photo: require('@/assets/images/story-4.png'), name: 'Stormie Hansford', emoji: '🙌🏻'},
	{id: 5, photo: require('@/assets/images/story-5.png'), name: 'Paulina Gayoso', emoji: '🫰🏽'},
	{id: 6, photo: require('@/assets/images/story-2.png'), name: 'Stina Gunnarsdottir', emoji: '🦦'},
	{id: 7, photo: require('@/assets/images/story-1.png'), name: 'Wan Gengxin', emoji: '🪵'},
	{id: 8, photo: require('@/assets/images/story-2.png'), name: 'Alexander Ljung', emoji: '🩰'},
	{id: 9, photo: require('@/assets/images/story-3.png'), name: 'Daisy Murphy', emoji: '👽'},
	{id: 10, photo: require('@/assets/images/story-4.png'), name: 'Paulina Gayoso', emoji: '🙌🏻'},
	{id: 11, photo: require('@/assets/images/story-5.png'), name: 'Mayke Schuurs', emoji: '🫰🏽'},
	{id: 12, photo: require('@/assets/images/story-2.png'), name: 'Stina Gunnarsdottir', emoji: '🦦'},
];

function FriendsContainer({navigation}) {
	const [friends, setFriends] = React.useState([]);
	const friendsService = new FriendService();
	const signalRService = SignalRService.getInstance();

	// Call API to get friends
	const fetchFriends = async () => {
		const response = await friendsService.getFriends();
		console.log("Friends response:", response);
		if (response.$values.length < 1) return;

		setFriends(response.$values);
	};

	useEffect(() => {
		const startSignalRConnection = async () => {
			// Kiểm tra nếu SignalR đã được kết nối
			if (signalRService.hubConnection.state !== signalRService.hubConnection.state.Connected) {
				await signalRService.start(); // Chỉ bắt đầu kết nối nếu chưa kết nối
			}
			console.log("SignalR connection state:", signalRService.hubConnection.state);
		};

		// Khởi động kết nối SignalR và subscribe vào sự kiện
		startSignalRConnection().then(() => {
			const subscription = signalRService.messageReceived$.subscribe((event) => {
				console.log("SignalR event received:", event);
				fetchFriends(); // Cập nhật danh sách bạn bè
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
			<Header title="Friends" friends navigation={navigation}/>

			<Text className="font-rubik text-sm text-black mt-6 mb-4">Your friends</Text>

			<View className="flex-1 bg-light rounded-3xl px-4 mb-4">
				<FlatList data={friends}
						  keyExtractor={item => item.id}
						  renderItem={({item}) =>
							  <FriendCard item={item} navigation={navigation}/>
						  }
						  showsVerticalScrollIndicator={false} className="py-4"/>
			</View>
		</Layout>
	);
}

export default FriendsContainer;
