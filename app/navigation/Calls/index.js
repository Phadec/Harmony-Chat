/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {enableScreens} from 'react-native-screens';

// Containers
import {CallsContainer, CallListContainer, CallingContainer} from '@/containers';

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

function Calls() {
	return (
		<Stack.Navigator initialRouteName="CallList" screenOptions={{presentation: 'modal'}}>
			<Stack.Screen name="CallList" component={CallListContainer} options={() => options} />
			<Stack.Screen name="Calling" component={CallingContainer} options={() => options} />
		</Stack.Navigator>
	);
}
export default Calls;
