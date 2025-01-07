import React, {useCallback, useState} from "react";
import {Pressable, Text, View} from "react-native";

import Animated, {useSharedValue, useAnimatedStyle, withTiming, withSpring} from "react-native-reanimated";

const REACTIONS = [
	{ emoji: '❤️', name: 'heart' },
	{ emoji: '😆', name: 'laugh' },
	{ emoji: '😮', name: 'wow' },
	{ emoji: '😢', name: 'cry' },
	{ emoji: '😠', name: 'angry' },
	{ emoji: '👍', name: 'thumbsup' }
];

const useContextActionMessage = (me) => {
	// Component reaction emojis
	const ReactionEmojis = () => {
		return (
			<View
				className={`${me ? 'flex-row-reverse' : 'flex-row'} items-center`}>
				<Animated.View
					style={{
						maxWidth: 165,
						backgroundColor: '#f8f8f8'
					}}
					className={"flex-row rounded-2xl px-1 flex-nowrap"}>
					{REACTIONS.map((reaction, index) => (
						<Pressable
							className="px-1 py-2"
							key={reaction.name}
						>
							<Text>{reaction.emoji}</Text>
						</Pressable>
					))}
				</Animated.View>
			</View>
		)
	}
	// Component menu actions for message
	const ContextMenuActions = () => {

	}
}
