import React from 'react';
import {View, Image, Text} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Components
import {Button} from '@/components';

// Common
import {Constants, Colors} from '@/common';

function GroupCard({name, time, photo, navigation}) {
	return (
		<Button className="flex-row items-center bg-light rounded-2xl py-4 px-14 mb-3" onPress={() => navigation.navigate('GroupChat')}>
			<View className="relative w-11 h-11 rounded-full">
				<Image source={photo} className="rounded-full w-11 h-11" />
			</View>

			<View className="ml-3 flex-1">
				<Text className="font-rubik font-medium text-sm text-black leading-5">{name}</Text>

				<View className="flex-row items-center mt-1">
					<Ionicons name="checkmark-done-outline" size={14} color={Constants.HexToRgba(Colors.black, 0.4)} />
					<Text className="font-rubik text-xs text-black/40 ml-1">Mayke: Nostrud exercitation..</Text>
				</View>
			</View>

			<View className="ml-2">
				<Text className="font-rubik text-xs text-black/40">{time}</Text>

				<View className="bg-red rounded-2xl items-center mt-1 w-6 ml-auto py-1">
					<Text className="font-rubik font-medium text-2xs text-white">12</Text>
				</View>
			</View>
		</Button>
	);
}

export default GroupCard;