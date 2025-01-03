import React, {useState} from "react";
import {Image, Text, View} from "react-native";

// common
import {Colors, Constants} from '@/common';

// components
import {Button} from "@/components";

// icons
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import Feather from "react-native-vector-icons/Feather";

// constants
import {baseURL} from "../../services/axiosInstance";


function FriendAddGroupCard({friend, onSelectFriend}) {
	const [isSelected, setSelected] = useState(false);

	const handlePress = () => {
		// Đảo trạng thái isSelected
		const newSelectedState = !isSelected;
		setSelected(newSelectedState);

		// Gọi hàm callback và truyền id cùng trạng thái mới
		onSelectFriend(friend.id, newSelectedState);
	};

	return (
		<Button
			onPress={handlePress}
			className="flex-row items-center justify-between mb-5"
		>
			<View className="flex-row items-center">
				<Image
					source={{uri: `${baseURL}/${friend.avatar}`}}
					className="w-10 h-10 rounded-full"
				/>
				<Text className="font-rubik font-medium text-base text-black ml-4">
					{friend.fullName}
				</Text>
			</View>

			{isSelected ? (
				<MaterialIcons name="check-circle" size={24} color={Colors.main}/>
			) : (
				<Feather name="circle" size={22} color={Colors.main}/>
			)}
		</Button>
	);
}

export default FriendAddGroupCard;
