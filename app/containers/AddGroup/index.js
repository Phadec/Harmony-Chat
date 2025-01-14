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

// Utils
import {baseURL} from "../../services/axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Components
import {Input, Button, FriendAddGroupCard} from '@/components';

// Common
import {Colors, Constants} from '@/common';

// Hooks
import {useAddGroup} from "@/hooks";

function AddGroup() {
	const {
		friends,
		setGroupName,
		handleSelectFriend,
		handleCreateGroup,
	} = useAddGroup();

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
								({item}) => <FriendAddGroupCard friend={item} onSelectFriend={handleSelectFriend}/>
							}/>
					</View>
				</View>
			</TouchableWithoutFeedback>
		</KeyboardAvoidingView>
	);
}
export default AddGroup;
