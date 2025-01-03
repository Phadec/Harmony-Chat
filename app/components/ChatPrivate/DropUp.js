import React from 'react';
import {View, Text} from 'react-native';
import Animated from 'react-native-reanimated';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {Button} from '@/components';
import {Colors} from '@/common';

function DropUp ({animation, opened, setOpen}) {
	return (
		<Animated.View
			className="absolute bottom-7 right-24 w-40 z-20"
			style={[animation, {zIndex: opened ? 20 : -1}]}>
			<View className="bg-white rounded-3xl py-3">
				<Button className="px-6 py-3">
					<Text className="font-rubik font-light text-sm text-black">Camera</Text>
				</Button>
				<Button className="px-6 py-3">
					<Text className="font-rubik font-light text-sm text-black">Photo and video</Text>
				</Button>
				<Button className="px-6 py-3">
					<Text className="font-rubik font-light text-sm text-black">File</Text>
				</Button>
				<Button className="px-6 py-3">
					<Text className="font-rubik font-light text-sm text-black">Location</Text>
				</Button>
				<Button className="px-6 py-3">
					<Text className="font-rubik font-light text-sm text-black">Person</Text>
				</Button>
			</View>

			<Button className="p-4 ml-auto" onPress={() => setOpen(false)}>
				<AntDesign name="close" size={20} color={Colors.white} />
			</Button>
		</Animated.View>
	);
};

export default DropUp;
