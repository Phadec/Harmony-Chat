import React, {useCallback, useEffect, useState} from "react";
import {useDispatch} from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {Alert} from "react-native";

// Services
import {FriendService, GroupService} from "@/services";
import {SignalRService} from "../../services/signalR";

// Redux
import {actions as Group} from "@/redux/reducer/GroupRedux";

// Navigation
import {navigationRef} from "../../RootNavigation";

const useAddGroup = () => {
	const dispatch = useDispatch();
	const [friends, setFriends] = useState([]);
	const [friendSelected, setFriendSelected] = useState([]);
	const [groupName, setGroupName] = useState('');
	const signalRService = new SignalRService();

	// Chọn bạn bè để thêm vào nhóm
	const handleSelectFriend = useCallback((friendId, isSelected) => {
		setFriendSelected(prev =>
			isSelected ? [...prev, friendId] : prev.filter(id => id !== friendId)
		);
	}, []);

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
	}, []);

	// Gọi API tạo nhóm
	const handleCreateGroup = useCallback(async () => {
		if (friendSelected.length < 3) {
			Alert.alert('', 'Group must have at least 3 members');
			return;
		}
		if (!groupName) {
			Alert.alert('', 'Please enter group name');
			return;
		}

		try {
			const data = new FormData();
			data.append('Name', groupName);
			friendSelected.forEach(id => data.append('MemberIds', id));
			data.append('AvatarFile', '');

			const groupService = new GroupService();
			const response = await groupService.createGroup(data);
			if (!response) {
				return;
			}

			// Dispatch action ADD_GROUP để thêm nhóm mới vào Redux
			Group.addGroup(dispatch, {
				id: response.id,
				name: groupName,
				avatar: response.avatar || 'avatars/default.jpg',
				chatTheme: 'default',
				notificationsMuted: false,
			});

			// Đóng bottom sheet
			Group.setOpenAddGroup(dispatch, false);
			setGroupName('');
			setFriendSelected([]);

			Alert.alert('Success', 'Group created successfully', [
				{
					text: 'OK',
					onPress: () => {
						navigationRef.current?.navigate('Root:Groups');
					},
				},
			]);
		} catch (error) {
			Alert.alert('Error', 'Failed to create group');
		}
	}, [friendSelected, groupName, dispatch]);

	return {
		friends,
		setGroupName,
		handleSelectFriend,
		handleCreateGroup,
	};
}

export default useAddGroup;
