import React, {useEffect, useState} from 'react';
import {
	Image,
	View,
	Text,
	TouchableWithoutFeedback,
	KeyboardAvoidingView,
	Keyboard, FlatList, Alert
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';

import {baseURL} from "../../services/axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Components
import {Input, Button} from '@/components';

// Common
import {Colors, Constants} from '@/common';

// Services
import {FriendService} from "../../services/Friend";
import {useDispatch} from "react-redux";
import {actions} from "../../redux/reducer/GroupRedux";

import {navigationRef} from '@/RootNavigation';
import {GroupService} from "../../services/Group";

function AddGroup() {
	const dispatch = useDispatch();

	const [friends, setFriends] = useState([]);
	const [friendSelected, setFriendSelected] = useState([]);
	const [groupName, setGroupName] = useState('');

	// Lấy danh sách bạn bè từ lần mount đầu tiên
	useEffect(() => {
		// Lấy userId từ AsyncStorage
		// Lấy danh sách bạn bè đúng 1 lần khi component được render
		const fetchFriends = async () => {
			try {
				const userId = await AsyncStorage.getItem('userId');
				setFriendSelected([userId]);

				// Tiến hành call API lấy danh sách bạn bè
				const friendsService = new FriendService();
				const friends = await friendsService.getFriends();
				if (friends) {
					setFriends(friends.$values);
				}
			} catch (error) {
				console.error('Error fetching friends:', error);
			}
		}
		fetchFriends();
		console.log("First friend selected:", friendSelected);
	}, []);


	// Hàm xử lý khi chọn hoặc bỏ chọn bạn bè
	const handleSelectFriend = (friendId, isSelected) => {
		setFriendSelected((prev) => {
			return isSelected ? [...prev, friendId] : prev.filter(id => id !== friendId);
		});
	};

	// Xử lý sự kiện tạo nhóm
	const handleCreateGroup = async () => {
		if (friendSelected.length < 3) {
			Alert.alert('', 'Group must have at least 3 members');
			return;
		}
		if (!groupName) {
			Alert.alert('', 'Please enter group name');
			return;
		}

		try {
			// Tạo FormData
			const data = new FormData();
			data.append('Name', groupName);

			// Thêm từng `MemberId` vào FormData
			friendSelected.forEach((id) => {
				data.append('MemberIds', id);
			});
			// THêm avatar vào FormData
			data.append('AvatarFile', '');

			console.log('FormData:', data);
			// Gửi API
			const groupService = new GroupService();
			const response = await groupService.createGroup(data);
			if (!response) {
				console.error('Error creating group');
				return;
			}

			// Đóng bottom sheet
			actions.setAddGroup(dispatch, false);

			// Hiển thị thông báo thành công
			Alert.alert('Success', 'Group created successfully', [
					{
						text: 'OK',
						onPress: () => {
							// Điều hướng đến màn hình groups
							navigationRef.current?.navigate('Root:Groups');
						}
					}
				]
			);
		} catch (error) {
			console.error('Error creating group:', error);
		}
	}

	return (
		<KeyboardAvoidingView behavior="padding" className='flex-1'>
			<TouchableWithoutFeedback
				onPress={Keyboard.dismiss}>
				<View className="flex-1 px-6">
					<View className="flex-row items-center justify-between mb-3">
						<Text className="font-rubik font-medium text-base text-black">Add group</Text>
						<View className="flex-row items-center">
							<Button
								onPress={handleCreateGroup}
								className="ml-6">
								<MaterialIcons name="add-circle" size={25} color={Colors.main}/>
							</Button>
						</View>
					</View>

					{/*Nơi đặt tên nhóm*/}
					<View className='px-4'>
						<Input
							onChangeText={(text) => setGroupName(text)}
							placeholderTextColor={Constants.HexToRgba(Colors.black, 0.4)}
							placeholder="Group name..."></Input>
					</View>

					{/*Tìm kiếm bạn bè*/}
					<View className="bg-light rounded-2xl px-4 flex-row items-center">
						<Feather name="search" size={20} color={Colors.main}/>
						<Input placeholder="Search friends..."
							   placeholderTextColor={Constants.HexToRgba(Colors.black, 0.4)}
							   className="font-rubik text-xs text-black mr-auto flex-1 pl-3"/>

					</View>

					{/*Danh sách bạn bè*/}
					<View className="mt-5 p-2">
						<FlatList
							data={friends}
							key={item => item.id}
							renderItem={
								({item}) => <FriendCard friend={item} onSelectFriend={handleSelectFriend}/>
							}/>
					</View>
				</View>
			</TouchableWithoutFeedback>
		</KeyboardAvoidingView>
	);
}

function FriendCard({friend, onSelectFriend}) {
	const [isSelected, setSelected] = useState(false);

	const handlePress = () => {
		// Đảo trạng thái isSelected
		const newSelectedState = !isSelected;
		setSelected(newSelectedState);

		// Gọi hàm callback và truyền id cùng trạng thái mới
		onSelectFriend(friend.id, newSelectedState);
	};

	return (
		<Button
			onPress={handlePress}
			className="flex-row items-center justify-between mb-5"
		>
			<View className="flex-row items-center">
				<Image
					source={{uri: `${baseURL}/${friend.avatar}`}}
					className="w-10 h-10 rounded-full"
				/>
				<Text className="font-rubik font-medium text-base text-black ml-4">
					{friend.fullName}
				</Text>
			</View>

			{isSelected ? (
				<MaterialIcons name="check-circle" size={24} color={Colors.main}/>
			) : (
				<Feather name="circle" size={22} color={Colors.main}/>
			)}
		</Button>
	);
}

export default AddGroup;
