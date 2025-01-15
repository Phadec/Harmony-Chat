import React from 'react';
import {Image, View, Text, TouchableOpacity, Alert} from 'react-native';
import Svg, {Circle} from 'react-native-svg';

// Components
import {Button} from '@/components';

// Icons
import MaterialIcons from "react-native-vector-icons/MaterialIcons";

// Commons
import {Colors} from '@/common';

// Services
import {FriendService} from "@/services";


import {baseURL} from "../../services/axiosInstance";

// Redux
import {CustomContextMenu} from "../index";
import {useContextMenu} from "../../hooks";
import {useDispatch} from "react-redux";
import {removeFriend, updateFriend} from "../../redux/reducer/FriendRedux";

function StoryShape({size, count}) {
	const numberOfDots = (2 * 3.14 * 26) / count;

	return (
		<Svg width={size} height={size}>
			<Circle cx={size / 2} cy={size / 2} r={size / 2 - 2} fill="none" stroke={Colors.orange}
					strokeDasharray={`${numberOfDots} 4`} strokeDashoffsett={numberOfDots} strokeWidth={3}/>
		</Svg>
	);
}

function Status({color}) {
	return <View className="w-3 h-3 rounded-full border-2 border-white absolute -left-[1px] -top-[1px] "
				 style={{backgroundColor: Colors[color]}}/>;
}

function FriendCard({item, navigation}) {
	const dispatch = useDispatch();
	const avatar = `${baseURL}/${item.avatar}`


	const {
		menuRef,
		isSelected,
		setIsSelected,
		handleSelect,
		handlePress,
		handleLongPress,
		getMenuPosition
	} = useContextMenu({
		item: item,
		navigationTarget: 'ChatPrivate',
		navigationParams: {
			recipientId: item.id,
			contactFullName: item.fullName,
			contactNickname: item.nickname,
			status: item.status,
			avatar: {uri: avatar},
			online: item.online,
			tagName: item.tagName,
		},
		onSelectCallbacks: {
			mute: () => handleMuteFriendNotification(),	// Mute
			delete: () => unFriend(), // Unfriend
			block: () => handleBlockUser() //block user
		}
	});

	// Hàm Mute
	const handleMuteFriendNotification = async () => {
		try {
			if (!item) {
				console.warn('No item found to mute.');
				return;
			}
			const friendService = new FriendService();
			const response = await friendService.muteFriendNotification(item.id);

			if (response) {
				console.log('Muted success for friend:', item.fullName);
				dispatch(updateFriend({...item, notificationsMuted: !item.notificationsMuted}));
			}
		} catch (error) {
			console.error('Error muting chat:', error);
		}
	};

	// unFriend
	const unFriend = async () => {
		try {
			const friendService = new FriendService();
			const response = await friendService.unFriend(item.id);
			if (response) {
				Alert.alert(`Unfriend with ${item.fullName} successfully!`);
				// Dispatch action để cập nhật Redux store
				dispatch(removeFriend(item.id));
			}
		}catch (error) {
			console.log('Error unfriend:', error);
		}
	}

	//Block
	const handleBlockUser = async () => {
		try {
			Alert.alert(
				"",
				`Are you sure you want to block ${item.fullName}? You won't be able to:
				• See their posts
				• Receive messages from them
				• They won't be able to find you`,
				[
					{
						text: "Cancel",
						style: "cancel"
					},
					{
						text: "Block",
						style: 'destructive',
						onPress: async () => {
							const friendService = new FriendService();
							const response = await friendService.blockUser(item.id);
							if (response) {
								dispatch(removeFriend(item.id));
							}
						}
					}
				]
			);
		} catch (error) {
			console.error('Error blocking user:', error);
		}
	};

	return (
		<CustomContextMenu
			menuRef={menuRef}
			isSelected={isSelected}
			onClose={() => setIsSelected(false)}
			onSelect={handleSelect}
			menuPosition={getMenuPosition()}
			options={[
				{
					value: 'mute', icon: <MaterialIcons name='notifications-off' size={20}/>,
					text: item.notificationsMuted ? 'Unmute' : 'Mute'
				},
				{value: 'hide', icon: <MaterialIcons name='visibility' size={20}/>, text: 'Hide'},
				{value: 'delete', icon: <MaterialIcons name='person-remove' size={20}/>, text: 'Unfriend', color: 'red'},
				{value: 'block', icon: <MaterialIcons name='block' size={20}/>, text: 'Block', color: 'red'}
			]}
		>
			<TouchableOpacity
				onPress={handlePress}
				onLongPress={handleLongPress}>
				<View
					className={`flex-row items-center rounded-2xl py-2 px-14 mb-3 ${isSelected ? 'bg-gray-100' : 'bg-light'}`}>
					<View className="relative w-11 h-11 rounded-full justify-center items-center">
						{/*<StoryShape size={56} count={16} />*/}

						<Image source={{uri: avatar}}
							   className="w-11 h-11 rounded-full absolute"/>
						{/*Kiểm tra trạng thái nếu online thì hiện ko thì tắt*/}
						{item.status === 'online' ? <Status color={"green"}/> : ''}
					</View>

					<View className="ml-4">
						<Text className="font-rubik font-medium text-sm text-black">{
							item.nickName ? item.nickName : item.fullName
						}</Text>
					</View>

					<Text className="ml-auto">
						{
							item.notificationsMuted &&
							<MaterialIcons name='notifications-off' size={20} color={Colors.black}/>
						}
					</Text>
				</View>
			</TouchableOpacity>
		</CustomContextMenu>
	);
}

export default FriendCard;
