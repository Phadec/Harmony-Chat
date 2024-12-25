import React from 'react';
import {Image, View, Text} from 'react-native';
import Svg, {Circle} from 'react-native-svg';

// Components
import {Button} from '@/components';

// Commons
import {Colors} from '@/common';
import {baseURL} from "../../services/axiosInstance";

function StoryShape({size, count}) {
	const numberOfDots = (2 * 3.14 * 26) / count;

	return (
		<Svg width={size} height={size}>
			<Circle cx={size / 2} cy={size / 2} r={size / 2 - 2} fill="none" stroke={Colors.orange}
					strokeDasharray={`${numberOfDots} 4`} strokeDashoffsett={numberOfDots} strokeWidth={3}/>
		</Svg>
	);
}

function StoryCard({item, navigation}) {
	const avatar = `${baseURL}/${item.avatar}`
	console.log(item)
	return (
		<Button className="flex-row items-center mb-4" onPress={() => navigation.navigate('Chat',
			{
				recipientId: item.id,
				contactFullName: item.fullName,
				contactNickname: item.nickname,
				status: item.status,
				avatar: {uri: avatar},
				online: item.online,
				tagName: item.tagName,
			}
		)}>
			<View className="relative w-14 h-14 rounded-full justify-center items-center">
				{/*<StoryShape size={56} count={16} />*/}

				<Image source={{uri: avatar}}
					   className="w-11 h-11 rounded-full absolute"/>
			</View>

			<View className="ml-4">
				<Text className="font-rubik font-medium text-sm text-black">{
					item.nickName ? item.nickName : item.fullName
				}</Text>
				{/*<Text className="font-rubik text-xs text-black/70 mt-[2px]">16:30</Text>*/}
			</View>

			<Text className="ml-auto">{
				['😎', '🌿', '👽', '🙌🏻', '🫰🏽', '🦦', '🪵', '🩰'][Math.floor(Math.random() * 8)]
			}</Text>
		</Button>
	);
}

export default StoryCard;
