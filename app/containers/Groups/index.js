import React, {useState, useEffect} from 'react';
import {View, FlatList, Image, Text} from 'react-native';
import {useFocusEffect} from "@react-navigation/native";

// Components
import {Header, Button} from '@/components';

// Layout
import Layout from '@/Layout';

// Service
import {SignalRService} from "../../services/signalR";
import {GroupService} from "../../services/Group";

// Utils
import {baseURL} from "../../services/axiosInstance";

function GroupsContainer({navigation}) {
	const [groups, setGroups] = useState([]);
	const signalRService = SignalRService.getInstance();

	const fetchGroupsDetails = async () => {
		try {
			const groupService = new GroupService();
			const groups = await groupService.getGroupDetails();
			if (groups) {
				setGroups(groups.$values);
			}
		} catch (error) {
			console.error('Error fetching groups:', error);
		}
	};

	// Setup SignalR listeners
	useEffect(() => {
		const startSignalRConnection = async () => {
			// Kiểm tra nếu SignalR đã được kết nối
			if (signalRService.hubConnection.state !== signalRService.hubConnection.state.Connected) {
				await signalRService.start(); // Chỉ bắt đầu kết nối nếu chưa kết nối
			}
		};

		// Khởi động kết nối SignalR và subscribe vào sự kiện
		startSignalRConnection().then(() => {
			const subscription = signalRService.groupCreated$.subscribe(() => {
				fetchGroupsDetails(); // Cập nhật danh sách nhóm khi có nhóm mới được tạo
			});

			// Cleanup khi component unmount
			return () => {
				subscription.unsubscribe(); // Hủy đăng ký sự kiện
			};
		}).catch((error) => {
			// console.error('Error while starting SignalR connection:', error);
		});
	}, [signalRService]);

	// Fetch groups khi màn hình được focus
	useFocusEffect(
		React.useCallback(() => {
			fetchGroupsDetails();
		}, [])
	);

	return (
		<Layout>
			<Header title="Groups" groups navigation={navigation}/>

			<View className="flex-1 mt-6">
				<FlatList
					data={groups}
					keyExtractor={item => item.groupId}
					renderItem={({item}) => (
						<GroupItem group={item} navigation={navigation}/>
					)}
					showsVerticalScrollIndicator={false}
				/>
			</View>
		</Layout>
	);
}

function GroupItem({group, navigation}) {
	const avatarUrl = `${baseURL}/${group.avatar}`;

	return (
		<Button
			className="flex-row items-center bg-light rounded-2xl py-2 px-14 mb-3"
			onPress={() => navigation.navigate('GroupChat', { groupId: group.groupId, groupName: group.name })}
		>
			<View className="relative w-11 h-11 rounded-full">
				<Image
					source={{uri: avatarUrl}}
					className="rounded-full w-10 h-10"
				/>
			</View>
			<View className="ml-3 flex-1">
				<Text className="font-rubik font-medium text-sm text-black leading-5">
					{group.name}
				</Text>
			</View>
		</Button>
	);
}

export default GroupsContainer;
