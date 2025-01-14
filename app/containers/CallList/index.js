import React, {useCallback, useEffect, useRef, useState} from 'react';
import {View, Text, Image, FlatList} from 'react-native';
import Octicons from 'react-native-vector-icons/Octicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';

// Components
import {Header, Input, Button} from '@/components';

// Commons
import {Colors, Constants} from '@/common';

// Layout
import Layout from '@/Layout';
import {baseURL} from "../../services/axiosInstance";
import {FriendService} from "../../services";
import {CallManager, STATE} from "../../services/Call";

function Friend({friend, navigation}) {
	// States
	const [opened, setOpened] = useState(false);
	const [isCallAvailable, setIsCallAvailable] = useState(true);

	// Services
	const callManager = CallManager.getInstance();

	// Kiểm tra trạng thái cuộc gọi
	useEffect(() => {
		const subscription = callManager.callState.subscribe(state => {
			setIsCallAvailable(state === STATE.IDLE);
		});

		return () => subscription.unsubscribe();
	}, []);

	// Xử lý cuộc gọi video
	const handleVideoCall = useCallback(async () => {
		// if (!isCallAvailable) return;

		// Gọi API để tạo cuộc gọi
		const success = await callManager.initiateCall(friend.id, true);

		if (!success) {
			console.error('Không thể tạo cuộc gọi');
			return;
		}

		navigation.navigate('Calling', {friend});
	}, [friend, navigation, isCallAvailable]);

	const avatar = {uri: `${baseURL}/${friend.avatar}`};
	return (
		<View className="bg-light rounded-2xl py-4 px-14 mb-3">
			<Button className="flex-row items-center" onPress={() => setOpened(!opened)}>
				<View className="w-12 h-12 relative">
					<Image source={avatar} className="w-12 h-12 rounded-full"/>

					<View className="absolute -bottom-[2px] -right-[2px]">
						<Text>🤪</Text>
					</View>
				</View>

				<View className="ml-4 mr-auto">
					<Text className="font-rubik font-medium text-xs text-black">{
						friend.nickname || friend.fullName
					}</Text>
					<Text className="font-rubik text-xs text-black/40 mt-1">{friend.email}</Text>
				</View>

				<MaterialIcons name={`${opened ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}`} size={24}
							   color={Colors.black}/>
			</Button>

			{opened && (
				<View className="flex-row items-center justify-between mt-6">
					<Button className="w-10 h-10 rounded-full bg-purple/40 items-center justify-center">
						<MaterialCommunityIcons name="heart" color={Colors.main} size={16}/>
					</Button>

					<Button className="w-10 h-10 rounded-full bg-purple/40 items-center justify-center">
						<MaterialIcons name="block" color={Colors.main} size={16}/>
					</Button>

					<Button className="w-10 h-10 rounded-full bg-purple/40 items-center justify-center">
						<FontAwesome name="comments-o" color={Colors.main} size={16}/>
					</Button>

					<Button
						className='w-10 h-10 rounded-full items-center justify-center bg-purple/40'
						onPress={handleVideoCall}
						>
						<Octicons
							name="device-camera-video"
							color={Colors.main}
							size={16}
						/>
					</Button>

					<Button className="w-10 h-10 rounded-full bg-purple/40 items-center justify-center">
						<Feather name="phone-call" color={Colors.main} size={16}/>
					</Button>
				</View>
			)}
		</View>
	);
}

function CallListContainer({navigation}) {
	const [friendsCall, setFriendsCall] = useState();
	const friendService = useRef(new FriendService()).current;
	// Gọi API để lấy danh sách bạn bè lần đầu khi được mount
	const getFriends = async () => {
		try {
			const response = await friendService.getFriends();
			setFriendsCall(response.$values);
		} catch (e) {
			console.log(e);
		}
	}

	useEffect(() => {
		// Gọi API
		getFriends();
	}, []);

	return (
		<Layout>
			<Header title="Call List" search navigation={navigation}/>

			<View className="flex-1 mb-4 mt-6">
				<View className="flex-row items-center justify-between mb-5">
					<View className="flex-row items-center bg-light p-3 rounded-3xl flex-1">
						<Octicons name="search" size={18} color={Constants.HexToRgba(Colors.black, 0.5)}/>

						<Input placeholder="Search a person" className="font-rubik text-sm text-black ml-2 flex-1"
							   placeholderTextColor={Constants.HexToRgba(Colors.black, 0.5)}/>

						<MaterialIcons name="mic" size={20} color={Constants.HexToRgba(Colors.black, 0.5)}/>
					</View>

					<Button className="w-12 h-12 rounded-[22px] bg-purple items-center justify-center ml-3">
						<Octicons name="filter" size={16} color={Colors.white}/>
					</Button>
				</View>

				<View className="flex-row flex-1">
					<FlatList data={friendsCall}
							  keyExtractor={item => item.id}
							  renderItem={({item}) =>
								  <Friend
									  friend={item}
									  navigation={navigation}/>}
							  showsVerticalScrollIndicator={false}
							  className="w-full"/>
				</View>
			</View>
		</Layout>
	);
}

export default CallListContainer;
