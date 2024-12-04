// AppNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import Login from "~/pages/login/Login";
import ChatScreen from "~/pages/chat/ChatLayout";
import MessageListScreen from "~/pages/chat-list/ListChat";
import LoginComponent from "~/pages/login/LoginComponent"; // Màn hình Chat List (nếu có)

const Stack = createStackNavigator();

export type RootStackParamList = {
    Login: undefined; // Màn hình Login không nhận tham số
    Chat: undefined; // Màn hình Chat không nhận tham số
    MessageListScreen: undefined; // Màn hình Message List không nhận tham số
};

const AppNavigator = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName="Login">
                <Stack.Screen name="Login" component={LoginComponent} />
                <Stack.Screen name="Chat" component={ChatScreen} />
                <Stack.Screen name="MessageListScreen" component={MessageListScreen} />
            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;
