import React from "react";
import {Image, Text, View} from "react-native";
import {FlatList} from 'react-native-gesture-handler';
import {useFocusEffect} from "@react-navigation/native";

// Layout
import Layout from "../../Layout";

// Components
import {Header, Button} from "@/components";

// Services
import {FriendService} from "../../services";
import {SignalRService} from "../../services/signalR";

// Constants
import {baseURL} from "../../services/axiosInstance";


function FriendRequestItem({request}) {
	const avatarUrl = `${baseURL}/${request.avatar}`;

	// Accept friend request
	const acceptFriendRequest = async () => {
		try {
			const friendService = new FriendService();
			const response = await friendService.acceptFriendRequest(request.id);
			if (response) {
				console.log('Accept friend request successfully');
			}
		} catch (error) {
			console.log('Error accept friend request:', error);
		}
	}

	// Reject friend request
	const rejectFriendRequest = async () => {
		try {
			const friendService = new FriendService();
			const response = await friendService.rejectRequest(request.id);
			if (response) {
				console.log('Reject friend request successfully');
			}
		} catch (error) {
			console.log('Error reject friend request:', error);
		}
	}

	return (
		<View className="flex-row justify-items-center gap-5 my-1">
			{/* Avatar */}
			<View className="relative w-20 h-20 rounded-full">
				<Image
					source={{uri: avatarUrl}}
					className="rounded-full w-20 h-20"
				/>
			</View>

			{/* Content */}
			<View className="flex-col">
				<Text
					ellipsizeMode='tail' numberOfLines={1} style={{width: 190}}
					className="font-rubik font-medium text-base text-black my-2">{request.senderName}</Text>
				{/* Buttons */}
				<View className="flex-row gap-3">
					<Button
						onPress={acceptFriendRequest}
						className="px-6 py-2 bg-main hover:bg-purple-500  rounded-md transition-colors duration-200">
						<Text className='font-rubik font-medium text-sm text-white'>Accept</Text>
					</Button>
					<Button
						onPress={rejectFriendRequest}
						className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors duration-200">
						<Text className='font-rubik font-medium text-sm text-black'>Reject</Text>
					</Button>
				</View>
			</View>
		</View>
	);
}

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

	return (
		<Layout>
			<Header title="Friend requests" goBack navigation={navigation}/>
			<View className="flex-1 items-center bg-light rounded-2xl my-4">
				{/*	To do: Hiển thị các item*/}
				<FlatList
					data={friendRequests}
					keyExtractor={(item) => item.id}
					renderItem={({item}) => <FriendRequestItem request={item}/>}
					showsVerticalScrollIndicator={false}
				/>
			</View>
		</Layout>
	);
}

export default FriendRequests;
