/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {enableScreens} from 'react-native-screens';

// Containers
import {FriendsContainer, ChatPrivateContainer, FriendRequests, AddFriend} from '@/containers';

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
			<Stack.Screen name="Chat" component={ChatPrivateContainer} options={() => options} />
			<Stack.Screen name="AddFriend" component={AddFriend} options={() => options} />
			<Stack.Screen name="FriendRequests" component={FriendRequests} options={() => options} />
		</Stack.Navigator>
	);
}
export default Friends;
