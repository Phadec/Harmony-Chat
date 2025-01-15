/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {enableScreens} from 'react-native-screens';

// Containers
import {SettingsContainer, AccountSettingsContainer, ChatSettingsContainer, SecuritySettingsContainer, AboutContainer, FAQsContainer, InviteFriendsContainer, StorageSettingsContainer, InvitationsContainer, BlockedUsersContainer, ProfileContainer} from '@/containers';

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

function Settings() {
	return (
		<Stack.Navigator initialRouteName="Settings">
			<Stack.Screen name="Settings" component={SettingsContainer} options={() => options} />
			<Stack.Screen name="AccountSettings" component={ProfileContainer} options={() => options} />
			<Stack.Screen name="ChatSettings" component={ChatSettingsContainer} options={() => options} />
			<Stack.Screen name="SecuritySettings" component={SecuritySettingsContainer} options={() => options} />
			<Stack.Screen name="About" component={AboutContainer} options={() => options} />
			<Stack.Screen name="FAQs" component={FAQsContainer} options={() => options} />
			<Stack.Screen name="InviteFriends" component={InviteFriendsContainer} options={() => options} />
			<Stack.Screen name="StorageSettings" component={StorageSettingsContainer} options={() => options} />
			<Stack.Screen name="Invitations" component={InvitationsContainer} options={() => options} />
			<Stack.Screen name="BlockedUsers" component={BlockedUsersContainer} options={() => options} />
		</Stack.Navigator>
	);
}
export default Settings;
