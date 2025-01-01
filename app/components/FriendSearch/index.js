import {Image, Text, View} from "react-native";
import React from "react";

// Components
import {Button} from '@/components';
import {baseURL} from "../../services/axiosInstance";

function FriendSearchCard({friend}) {
	const avatar = `${baseURL}/${friend.avatar}`;

	return (
		<View className="flex-row items-center gap-7 pt-4">
			{/* Avatar */}
			<View className="w-14 h-14 relative">
				<Image
					source={{uri: avatar}}
					className="w-14 h-14 rounded-full"
				/>
			</View>

			{/* Content */}
			<View className="flex-col">
				<Text ellipsizeMode='tail' numberOfLines={1} style={{width: 190}}
					className="font-rubik font-medium text-base text-black">
					{friend.firstName + " " + friend.lastName}
				</Text>
				{/* Buttons */}
				<View className="flex-row gap-3 pt-2">
					<Button
						className="px-4 py-1.5 bg-main hover:bg-purple-500  rounded-md transition-colors duration-100">
						<Text className='font-rubik font-medium text-sm text-white'>Add Friend</Text>
					</Button>
					<Button
						className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors duration-100">
						<Text className='font-rubik font-medium text-sm text-black'>Remove</Text>
					</Button>
				</View>
			</View>
		</View>
	);
}

export default React.memo(FriendSearchCard);
