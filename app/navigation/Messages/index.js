/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {enableScreens} from 'react-native-screens';

// Containers
import {MessagesContainer, ChatContainer} from '@/containers';


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

function Messages() {
	return (
		<Stack.Navigator initialRouteName="Messages">
			<Stack.Screen name="Messages" component={MessagesContainer} options={() => options}/>
			<Stack.Screen name="Chat" component={ChatContainer} options={() => options}/>
		</Stack.Navigator>
	);
}

export default Messages;
