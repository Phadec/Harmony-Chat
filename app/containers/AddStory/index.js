import React from 'react';
import {Image, View, Text} from 'react-native';
import Octicons from 'react-native-vector-icons/Octicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';

// Components
import {Input, Button} from '@/components';

// Common
import {Colors, Constants} from '@/common';

function AddStory() {
	return (
		<View className="flex-1 px-6">
			<View className="flex-row items-center justify-between mb-6">
				<Text className="font-rubik font-medium text-base text-black">Add story</Text>

				<View className="flex-row items-center">
					<Button>
						<Octicons name="link" size={20} color={Colors.main} />
					</Button>

					<Button className="ml-6">
						<MaterialIcons name="emoji-emotions" size={20} color={Colors.main} />
					</Button>
				</View>
			</View>

			<View className="relative flex-1">
				<Image source={require('@/assets/images/image-3.webp')} className="w-full h-full rounded-3xl" />
			</View>

			<View className="bg-light rounded-3xl p-4 flex-row items-center mt-5 mb-6">
				<Input placeholder="Write a comment..."
					   placeholderTextColor={Constants.HexToRgba(Colors.black, 0.4)}
					   className="font-rubik text-xs text-black mr-auto flex-1" />
				<Feather name="send" size={20} color={Colors.main} />
			</View>
		</View>
	);
}

export default AddStory;
