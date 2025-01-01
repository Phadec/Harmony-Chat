import {Image, Text, View} from "react-native";
import React from "react";
// Components
import {Button} from '@/components';

// Services
import {FriendService} from "@/services";

// Constants
import {baseURL} from "../../services/axiosInstance";

function FriendRequestCard({request}) {
	const avatarUrl = `${baseURL}/${request.avatar}`;

	// Accept friend request
	const acceptFriendRequest = async () => {
		try {
			const friendService = new FriendService();
			const response = await friendService.acceptFriendRequest(request.id);
			if (response) {
				console.log('Accept friend request successfully');
			}
		} catch (error) {
			console.log('Error accept friend request:', error);
		}
	}

	// Reject friend request
	const rejectFriendRequest = async () => {
		try {
			const friendService = new FriendService();
			const response = await friendService.rejectRequest(request.id);
			if (response) {
				console.log('Reject friend request successfully');
			}
		} catch (error) {
			console.log('Error reject friend request:', error);
		}
	}

	return (
		<View className="flex-row justify-items-center gap-5 my-1">
			{/* Avatar */}
			<View className="relative w-20 h-20 rounded-full">
				<Image
					source={{uri: avatarUrl}}
					className="rounded-full w-20 h-20"
				/>
			</View>

			{/* Content */}
			<View className="flex-col">
				<Text
					ellipsizeMode='tail' numberOfLines={1} style={{width: 190}}
					className="font-rubik font-medium text-base text-black my-2">{request.senderName}</Text>
				{/* Buttons */}
				<View className="flex-row gap-3">
					<Button
						onPress={acceptFriendRequest}
						className="px-6 py-2 bg-main hover:bg-purple-500  rounded-md transition-colors duration-200">
						<Text className='font-rubik font-medium text-sm text-white'>Accept</Text>
					</Button>
					<Button
						onPress={rejectFriendRequest}
						className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors duration-200">
						<Text className='font-rubik font-medium text-sm text-black'>Reject</Text>
					</Button>
				</View>
			</View>
		</View>
	);
}

export default FriendRequestCard;
