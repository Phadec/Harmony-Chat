import React from 'react';
import {View, Pressable, Text} from 'react-native';
import Animated from "react-native-reanimated";

const REACTIONS = [
	{emoji: '❤️', name: 'heart'},
	{emoji: '😆', name: 'laugh'},
	{emoji: '😮', name: 'wow'},
	{emoji: '😢', name: 'cry'},
	{emoji: '😠', name: 'angry'},
	{emoji: '👍', name: 'thumbsup'}
];

const Reactions = React.memo(({message}) => (
	<View className={`${message.me ? "flex-row-reverse" : "flex-row"} items-center`}>
		<Animated.View
			style={{
				maxWidth: 165,
				backgroundColor: "#f8f8f8",
			}}
			className={"flex-row rounded-2xl px-1 flex-nowrap"}
		>
			{REACTIONS.map((reaction) => (
				<Pressable
					className="px-1 py-2"
					key={reaction.name}
					onPress={() => {
						console.log("Reacted with", reaction.name);
					}}
				>
					<Text>{reaction.emoji}</Text>
				</Pressable>
			))}
		</Animated.View>
	</View>
));

export default Reactions;
