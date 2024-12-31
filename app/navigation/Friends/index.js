/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {enableScreens} from 'react-native-screens';

// Containers
import {FriendsContainer, ChatContainer} from '@/containers';

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

function Friends() {
	return (
		<Stack.Navigator initialRouteName="Friends">
			<Stack.Screen name="Friends" component={FriendsContainer} options={() => options} />
			<Stack.Screen name="Chat" component={ChatContainer} options={() => options} />
			{/*<Stack.Screen name="AddFriend" component={null} options={() => options} />*/}
		</Stack.Navigator>
	);
}
export default Friends;
