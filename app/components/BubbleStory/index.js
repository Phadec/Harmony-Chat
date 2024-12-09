import React from 'react';
import {View, Text, Image} from 'react-native';

// Components
import {Button} from '@/components';

// Common
import {Constants, Colors} from '@/common';

function Status({color}) {
	return <View className="w-3 h-3 rounded-full border-2 absolute -left-[1px] -top-[1px] bg-green" style={{borderColor: Colors['soft' + color]}} />;
}

function BubbleStory({photo, color}) {
	return (
		<Button className="w-16 h-16 rounded-3xl items-center justify-center mr-4" style={{backgroundColor: Colors['soft' + color]}}>
			<View className="relative w-11 h-11 border-2 rounded-full" style={{borderColor: Colors[color]}}>
				<Image source={photo} className="rounded-full w-10 h-10" />

				<Status color={color} />

				<View className="absolute -bottom-1 -right-1">
					<Text>🤪</Text>
				</View>
			</View>
		</Button>
	);
}

export default BubbleStory;
