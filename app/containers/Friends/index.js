import React, {useCallback, useEffect} from 'react';
import {Text, View} from 'react-native';
import {FlatList} from 'react-native-gesture-handler';

// Components
import {Header, FriendCard, Button} from '@/components';

// Services
import {FriendService} from '@/services/Friend';

// Layout
import Layout from '@/Layout';
import {SignalRService} from "../../services/signalR";
import {useFocusEffect} from "@react-navigation/native";

// Redux
import {useDispatch, useSelector} from "react-redux";
import {fetchFriends} from "../../redux/reducer/FriendRedux";

function FriendsContainer({navigation}) {
	const dispatch = useDispatch();
	const {friends, error} = useSelector((state) => state.friend);
	console.log('Friends:', friends);

	const friendService = new FriendService();
	const signalRService = SignalRService.getInstance();
	const subscriptionRef = React.useRef(null);

	// Setup SignalR Subscription
	const setupSignalRSubscription = () => {
		if (subscriptionRef.current) {
			subscriptionRef.current.unsubscribe();
		}

		// Đồng bộ danh sách bạn bè khi có sự thay đổi
		subscriptionRef.current = signalRService.messageReceived$.subscribe(() => {
			dispatch(fetchFriends(friendService));
		});
	};

	// Initialize SignalR and fetch friends on mount
	useEffect(() => {
		const initializeSignalR = async () => {
			try {
				if (signalRService.hubConnection.state !== 'Connected') {
					await signalRService.start();
				}
				setupSignalRSubscription();
			} catch (err) {
				console.error('SignalR initialization error:', err);
			}
		};

		initializeSignalR();

		return () => {
			if (subscriptionRef.current) {
				subscriptionRef.current.unsubscribe();
				subscriptionRef.current = null;
			}
		};
	}, []);

	// Refetch friends when screen focuses
	useFocusEffect(
		useCallback(() => {
			dispatch(fetchFriends(friendService));
			setupSignalRSubscription();

			return () => {
				if (subscriptionRef.current) {
					subscriptionRef.current.unsubscribe();
					subscriptionRef.current = null;
				}
			};
		}, [])
	);
	return (
		<Layout>
			<Header title="Friends" friends navigation={navigation}/>
			{/* Lời mời kết bạn */}
			<View className="flex flex-row justify-between mt-6 mb-3">
				<Text className="font-rubik text-sm text-black px-3 py-1.5 ">Your friends</Text>
				<Button
					onPress={() => navigation.navigate('FriendRequests')}
					className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium text-sm text-gray-900 transition-colors duration-200">
					<Text className="font-rubik text-sm text-black">Friend Requests</Text>
				</Button>
			</View>

			<View className="flex-1 bg-light rounded-3xl px-4 mb-4">
				{
					error ? (
						<Text>Error: {error}</Text>
					) : (
						<FlatList
							data={friends}
							keyExtractor={(item) => item.id}
							renderItem={({item}) => <FriendCard item={item} navigation={navigation}/>}
							showsVerticalScrollIndicator={false}
							className="py-4"
						/>
					)}
			</View>
		</Layout>
	);
}

export default FriendsContainer;
