import React from 'react';
import {View} from 'react-native';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';

// It allows you to use navigation in places where you cannot access the navigation directly.
import {navigationRef} from '@/RootNavigation';

// Main Screens
import Messages from './Messages';
import Stories from './Stories';
import Groups from './Groups';
import Settings from './Settings';
import Calls from './Calls';
import Auth from './Auth';
import {OnboardingContainer} from '../containers';

// Components
import {TabBar, TabBarIcon} from '@/components';

const Themes = {
	...DefaultTheme,
	colors: {
		...DefaultTheme.colors,
		background: 'transparent',
	},
};

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

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function BottomTabNavigator() {
	return (
		<View className="flex-1">
			<Tab.Navigator tabBar={props => <TabBar {...props} />} initialRouteName="Messages">

{/*
			<Tab.Screen
					name="Root:Stories"
					component={Stories}
					icon="Stories"
					options={{
						tabBarIcon: ({focused}) => <TabBarIcon focused={focused} name="Stories" />,
						headerShown: false,
					}}
				/>
*/}
				<Tab.Screen
					name="Root:Messages"
					component={Messages}
					options={{
						tabBarIcon: ({focused}) => <TabBarIcon focused={focused} name="Messages" />,
						headerShown: false,
					}}
				/>

				<Tab.Screen
					name="Root:Groups"
					component={Groups}
					options={{
						tabBarIcon: ({focused}) => <TabBarIcon focused={focused} name="Groups" />,
						headerShown: false,
					}}
				/>

				<Tab.Screen
					name="Root:Calls"
					component={Calls}
					options={{
						tabBarIcon: ({focused}) => <TabBarIcon focused={focused} name="Calls" />,
						headerShown: false,
					}}
				/>

				<Tab.Screen
					name="Root:Settings"
					component={Settings}
					options={{
						tabBarIcon: ({focused}) => <TabBarIcon focused={focused} name="Settings" />,
						headerShown: false,
					}}
				/>
			</Tab.Navigator>
		</View>
	);
}

function Navigation() {
	return (
		<NavigationContainer theme={Themes} ref={navigationRef}>
			<Stack.Navigator initialRouteName="Onboarding">
				<Stack.Screen name="Root" component={BottomTabNavigator} options={() => options} />
				<Stack.Screen name="Auth" component={Auth} options={() => options} />
				<Stack.Screen name="Onboarding" component={OnboardingContainer} options={() => options} />
			</Stack.Navigator>
		</NavigationContainer>
	);
}

export default Navigation;
