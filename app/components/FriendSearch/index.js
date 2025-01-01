import {Image, Text, View} from "react-native";
import React from "react";

// Components
import {Button} from '@/components';

// Hooks
import {useFriendSearchActions} from "@/hooks";

import {baseURL} from "../../services/axiosInstance";

function FriendSearchCard({friend, onFriendUpdate}) {
	const avatar = `${baseURL}/${friend.avatar}`;
	const {
		friendState, addFriend, cancelRequest, acceptRequest, rejectRequest
	} = useFriendSearchActions({
		hasSentRequest: friend.hasSentRequest,
		requestId: friend.requestId,
		hasReceivedRequest: friend.hasReceivedRequest,
		receivedRequestId: friend.receivedRequestId
	})

	// Handle accept request
	const handleAccept = async () => {
		await acceptRequest(friendState.receivedRequestId);
		onFriendUpdate(friend.id); // Gọi callback để cập nhật danh sách
	};

	// Render button component based on friend state
	const RenderButtons = () => {
		if (friendState.hasSentRequest) {
			return (
				<View className="flex-row gap-3 pt-2">
					<Button
						onPress={() => cancelRequest(friendState.requestId)}
						className="flex-1 items-center px-4 py-1.5 bg-gray-200 hover:bg-purple-500 rounded-md transition-colors duration-100">
						<Text className="font-rubik font-medium text-sm text-black">Cancel Request</Text>
					</Button>
				</View>
			);
		}

		if (friendState.hasReceivedRequest) {
			return (
				<View className="flex-row gap-3 pt-2">
					<Button
						onPress={handleAccept}
						className="px-6 py-1.5 bg-main hover:bg-purple-500 rounded-md transition-colors duration-200"
					>
						<Text className="font-rubik font-medium text-sm text-white">Accept</Text>
					</Button>
					<Button
						onPress={() => rejectRequest(friendState.receivedRequestId)}
						className="px-6 py-1.5 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors duration-200"
					>
						<Text className="font-rubik font-medium text-sm text-black">Reject</Text>
					</Button>
				</View>
			);
		}

		return (
			<View className="flex-row gap-3 pt-2">
				<Button
					onPress={() => addFriend(friend.id, friend.firstName + " " + friend.lastName)}
					className="flex-1 items-center px-4 py-1.5 bg-main hover:bg-purple-500 rounded-md transition-colors duration-100"
				>
					<Text className="font-rubik font-medium text-sm text-white">Add Friend</Text>
				</Button>
			</View>
		);
	};

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
				<RenderButtons/>
			</View>
		</View>
	);
}

export default React.memo(FriendSearchCard);
