/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {enableScreens} from 'react-native-screens';

// Containers
import {StoriesContainer, StoryContainer} from '@/containers';
import {ChatContainer} from "../../containers";

enableScreens();

const Stack = createStackNavigator();

const options = {
	headerBackTitleVisible: true,
	cardStyleInterpolator: ({current: {progress}}) => {
		return {
			cardStyle: {
				opacity: progress,
			},
		};
	},
	cardStyle: {
		backgroundColor: 'transparent',
	},
	headerShown: false,
};

function Stories() {
	return (
		<Stack.Navigator initialRouteName="Friends">
			<Stack.Screen name="Stories" component={StoriesContainer} options={() => options} />
			<Stack.Screen name="Chat" component={ChatContainer} options={() => options} />
			{/*<Stack.Screen name="Story" component={StoryContainer} options={() => options} />*/}
		</Stack.Navigator>
	);
}
export default Stories;
