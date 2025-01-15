import React, {createContext, useContext, useState} from 'react';
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
import CallingContainer from '../containers/Calling';

// Components
import {TabBar, TabBarIcon} from '@/components';

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
			<NavigationContainer theme={Themes} ref={navigationRef}>
				<Stack.Navigator 
					initialRouteName="Onboarding" 
					screenOptions={{
						headerShown: false,
						animation: 'slide_from_right',
					}}
				>
					<Stack.Screen 
						name="Root" 
						component={BottomTabNavigator}
					/>
					<Stack.Screen 
						name="Auth" 
						component={Auth}
					/>
					<Stack.Screen 
						name="Onboarding" 
						component={OnboardingContainer}
					/>
					<Stack.Screen 
						name="Calling" 
						component={CallingContainer}
						options={{
							animation: 'slide_from_bottom',
							presentation: 'modal',
							gestureEnabled: false
						}}
					/>
				</Stack.Navigator>
			</NavigationContainer>
		</OverlayContext.Provider>
	);
}

export default Navigation;
