/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {enableScreens} from 'react-native-screens';

// Containers
import {GroupsContainer, GroupChatContainer} from '@/containers';

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

function Groups() {
	return (
		<Stack.Navigator initialRouteName="Groups">
			<Stack.Screen name="GroupChat" component={GroupChatContainer} options={() => options} />
			<Stack.Screen name="Groups" component={GroupsContainer} options={() => options} />
		</Stack.Navigator>
	);
}
export default Groups;
