import React, {createContext, useContext, useEffect, useState} from 'react';
import {View} from 'react-native';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';

// It allows you to use navigation in places where you cannot access the navigation directly.
import {navigationRef} from '@/RootNavigation';

// Main Screens
import Messages from './Messages';
import Friends from './Friends';
import Groups from './Groups';
import Settings from './Settings';
import Calls from './Calls';
import Auth from './Auth';

import {OnboardingContainer} from '../containers';

// Components
import {TabBar, TabBarIcon} from '@/components';

import PushNotification from 'react-native-push-notification';
import {CallManager} from "../services/Call";
import CallingNotificationService from "../services/Notifications/CallingNotification";
import {AuthProvider, useAuth} from "../hooks/AuthContext";

// Create context for overlay
export const OverlayContext = createContext()

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
	const {isOverlayVisible} = useContext(OverlayContext);

	const {isLoggedIn} = useAuth();  // Kiểm tra trạng thái đăng nhập

	useEffect(() => {
		if (isLoggedIn) {
			// Initialize service
			CallingNotificationService.getInstance();
		}
	}, [isLoggedIn]);

	return (
		<View className="flex-1">
			<Tab.Navigator
				initialRouteName="Messages"
				tabBar={props => (
					<View style={{
						position: 'relative',
						left: 0, right: 0, top: 0, bottom: 0,
						zIndex: 10,
					}}>
						<TabBar {...props} />
					</View>
				)}>

				<Tab.Screen
					name="Root:Friends"
					component={Friends}
					icon="Friends"
					options={{
						tabBarIcon: ({focused}) => <TabBarIcon focused={focused} name="Friends"/>,
						headerShown: false,
					}}
				/>
				<Tab.Screen
					name="Root:Messages"
					component={Messages}
					options={{
						tabBarIcon: ({focused}) => <TabBarIcon focused={focused} name="Messages"/>,
						headerShown: false,
					}}
				/>

				<Tab.Screen
					name="Root:Groups"
					component={Groups}
					options={{
						tabBarIcon: ({focused}) => <TabBarIcon focused={focused} name="Groups"/>,
						headerShown: false,
					}}
				/>

				<Tab.Screen
					name="Root:Calls"
					component={Calls}
					options={{
						tabBarIcon: ({focused}) => <TabBarIcon focused={focused} name="Calls"/>,
						headerShown: false,
					}}
				/>

				<Tab.Screen
					name="Root:Settings"
					component={Settings}
					options={{
						tabBarIcon: ({focused}) => <TabBarIcon focused={focused} name="Settings"/>,
						headerShown: false,
					}}
				/>
			</Tab.Navigator>
		</View>
	);
}

function Navigation() {
	const [isOverlayVisible, setIsOverlayVisible] = useState(false);

	return (
		<OverlayContext.Provider value={{isOverlayVisible, setIsOverlayVisible}}>
			<AuthProvider>
				<NavigationContainer theme={Themes} ref={navigationRef}>
					<Stack.Navigator initialRouteName="Onboarding">
						<Stack.Screen name="Root" component={BottomTabNavigator} options={() => options}/>
						<Stack.Screen name="Auth" component={Auth} options={() => options}/>
						<Stack.Screen name="Onboarding" component={OnboardingContainer} options={() => options}/>
					</Stack.Navigator>
				</NavigationContainer>
			</AuthProvider>
		</OverlayContext.Provider>
	);
}

export default Navigation;
