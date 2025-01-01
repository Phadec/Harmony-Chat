import React, {useState} from 'react';
import {Image, View, Text, Platform, TouchableWithoutFeedback, KeyboardAvoidingView, Keyboard} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import Octicons from 'react-native-vector-icons/Octicons';
import Entypo from 'react-native-vector-icons/Entypo';

// Components
import {Input, Button} from '@/components';

// Common
import {Colors, Constants} from '@/common';

// Services
import {AuthService} from "@/services/Auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

async function setUserInStorage(data) {
	// Store user data in AsyncStorage
	await AsyncStorage.setItem('token', data.token);
	await AsyncStorage.setItem('userId', data.id);
	await AsyncStorage.setItem('userAvatar', data.avatar);
	await AsyncStorage.setItem('role', data.role);
}

function LoginContainer({navigation}) {
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [isLoggingIn, setIsLoggingIn] = useState(false); // Trạng thái đang đăng nhập
	const authService = new AuthService();

	const handleLogin = async () => {
		if (isLoggingIn) {
			console.log('Login request already in progress'); // Log khi đang đăng nhập
			return; // Ngừng nếu đang đăng nhập
		}
		if (!username || !password) {
			return; // Ngừng nếu chưa nhập username hoặc password
		}
		setIsLoggingIn(true); // Đặt trạng thái đang đăng nhập
		console.log('Starting login...'); // Log khi bắt đầu đăng nhập
		try {
			const response = await authService.login(username, password);
			if (response.data === undefined) {
				console.error('Invalid response data');
				setIsLoggingIn(false); // Đặt lại trạng thái khi có lỗi
				return;
			}

			// Store user data in AsyncStorage
			await setUserInStorage(response.data);

			// Điều hướng dựa trên role của người dùng
			if (response.data.role === 'User') {
				navigation.navigate('Root', {screen: 'Root:Messages'});
			}
		} catch (error) {
			console.error('Login failed:', error.response ? error.response.data : error.message);
		} finally {
			console.log('Login process finished');
			setIsLoggingIn(false); // Đặt lại trạng thái sau khi hoàn tất
		}
	};

	return (
		<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
			<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
				<View className="flex-1 bg-main">
					<Image source={require('@/assets/images/shape.png')}
						   className="absolute left-0 right-0 top-0 bottom-0 w-full h-full"/>

					<Image source={require('@/assets/images/logo-thin.png')} className="w-7 h-5 mt-24 mx-auto"
						   resizeMode="contain"/>
					<Text className="font-rubik font-medium text-2xl text-white mt-auto text-center mb-9">Login</Text>

					<View className="bg-white rounded-t-3xl py-10 px-6 h-[60vh]">
						<View className="flex-row items-center bg-light rounded-3xl p-4 mb-4">
							<Feather name="user" size={16} color={Colors.black}/>
							<Input placeholder="Username"
								   onChangeText={setUsername}
								   value={username}
								   placeholderTextColor={Constants.HexToRgba(Colors.black, 0.4)}
								   className="font-rubik font-light text-sm text-black ml-2 flex-1"/>
						</View>

						<View className="flex-row items-center bg-light rounded-3xl p-4">
							<Feather name="lock" size={16} color={Colors.black}/>
							<Input placeholder="Password"
								   value={password}
								   onChangeText={setPassword}
								   placeholderTextColor={Constants.HexToRgba(Colors.black, 0.4)}
								   className="font-rubik font-light text-sm text-black ml-2 flex-1"/>
							<Octicons name="eye-closed" size={16} color={Constants.HexToRgba(Colors.black, 0.5)}/>
						</View>

						<View className="mt-4 flex-row items-center justify-between">
							<Button className="flex-row items-center">
								<View
									className="w-4 h-4 rounded-md border border-black/30 relative items-center justify-center">
									<View className="w-3 h-3 rounded-md bg-black/60"/>
								</View>

								<Text className="font-rubik text-sm text-black/30 ml-2">Remember me</Text>
							</Button>

							<Button onPress={() => navigation.navigate('ForgotPassword')}>
								<Text className="font-rubik text-sm text-black/30 ml-2">Forgot password</Text>
							</Button>
						</View>

						<Button className="bg-main py-4 rounded-2xl mt-14 items-center"
								onPress={handleLogin}
								disabled={isLoggingIn} // Disable nút khi đang đăng nhập
						>
							<Text className="font-rubik text-sm text-white">Login</Text>
						</Button>

						<Button className="flex-row items-center justify-center mt-6"
								onPress={() => navigation.navigate('Signup')}>
							<Text className="font-rubik text-sm text-black">
								Don't have an account? <Text className="text-main">Sign up</Text>
							</Text>
						</Button>

						<View className="mt-10 flex-row items-center justify-center">
							<Button>
								<Entypo name="facebook-with-circle" size={32} color="#3B5998"/>
							</Button>

							<Button className="mx-6">
								<Entypo name="twitter-with-circle" size={32} color="#00ACED"/>
							</Button>

							<Button>
								<Entypo name="google--with-circle" size={32} color="#DD4B39"/>
							</Button>
						</View>
					</View>
				</View>
			</TouchableWithoutFeedback>
		</KeyboardAvoidingView>
	);
}

export default LoginContainer;
