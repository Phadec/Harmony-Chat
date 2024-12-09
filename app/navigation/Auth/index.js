/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {enableScreens} from 'react-native-screens';

// Containers
import {LoginContainer, SignupContainer, ForgotPasswordContainer} from '@/containers';

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

function Auth() {
	return (
		<Stack.Navigator initialRouteName="Login" screenOptions={{presentation: 'modal'}}>
			<Stack.Screen name="Login" component={LoginContainer} options={() => options} />
			<Stack.Screen name="Signup" component={SignupContainer} options={() => options} />
			<Stack.Screen name="ForgotPassword" component={ForgotPasswordContainer} options={() => options} />
		</Stack.Navigator>
	);
}
export default Auth;
