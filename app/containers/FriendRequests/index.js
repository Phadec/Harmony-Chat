import React from "react";
import {Image, Text, View} from "react-native";
import {FlatList} from 'react-native-gesture-handler';
import {useFocusEffect} from "@react-navigation/native";

// Layout
import Layout from "../../Layout";

// Components
import {Header, Button, FriendRequestCard} from "@/components";

// Services
import {FriendService} from "@/services";
import {SignalRService} from "../../services/signalR";

function FriendRequests({navigation}) {
	const [friendRequests, setFriendRequests] = React.useState([]);
	const signalRService = SignalRService.getInstance();

	// Load friend requests
	const loadFriendRequests = async () => {
		// To do: Load friend requests
		try {
			const friendService = new FriendService();
			const data = await friendService.loadFriendRequests();

			setFriendRequests(data.$values);
		} catch (error) {
			console.log('Error Friend request:', error);
		}
	}

	React.useEffect(() => {
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
				console.log("SignalR event received Load Friend Request:", event);
				loadFriendRequests(); // Cập nhật danh sách bạn bè
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

	useFocusEffect(
		React.useCallback(() => {
			console.log('Load friend requests');
			loadFriendRequests();
		}, [])
	);

	const ComponentFriendRequest = () => {
		if (friendRequests.length === 0) {
			return (
				<View className="flex-1  bg-light rounded-2xl my-4">
					<View className="flex-1 items-center justify-center">
						<Text className="font-bold text-gray-700 text-xl font-rubik">
							No friend requests
						</Text>
						<Text className="text-gray-400 text-base font-rubik text-center">
							When someone sends you a friend request, you'll see it here.
						</Text>
					</View>
				</View>
			)
		}
		return (
			<View className="flex-1 items-center bg-light rounded-2xl my-4">
				<FlatList
					data={friendRequests}
					keyExtractor={(item) => item.id}
					renderItem={({item}) => <FriendRequestCard request={item}/>}
					showsVerticalScrollIndicator={false}
				/>
			</View>
		)
	}

	return (
		<Layout>
			<Header title="Friend requests" goBack navigation={navigation}/>
			<ComponentFriendRequest/>
		</Layout>
	);
}

export default FriendRequests;
