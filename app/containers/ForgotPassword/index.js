import React, {useState} from 'react';
import {
	Image,
	View,
	Text,
	Platform,
	TouchableWithoutFeedback,
	KeyboardAvoidingView,
	Keyboard,
	Alert
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

// Components
import {Input, Button} from '@/components';

// Common
import {Colors, Constants} from '@/common';

// Services
import {AuthService} from '@/services/Auth';

function ForgotPasswordContainer({navigation}) {
	const [username, setUsername] = useState('');
	const authService = new AuthService();

	const onResetPassword = async () => {
		const data = {
			username,
		};

		// Kiểm tra các fileds có rỗng không
		if (!data.username) {
			Alert.alert('Please fill all fields to continue');
			return;
		}

		// Gọi API reset password
		const response = await authService.resetPassword(data.username);
		if (response.status === 200) {
			Alert.alert('Reset password successfully');
			navigation.navigate('Login');
		} else {
			Alert.alert('Reset password failed');
		}
	}

	return (
		<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
			<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
				<View className="flex-1 bg-main">
					<Image source={require('@/assets/images/shape.png')}
						   className="absolute left-0 right-0 top-0 bottom-0 w-full h-full"/>

					<Image source={require('@/assets/images/logo-thin.png')} className="w-7 h-5 mt-24 mx-auto"
						   resizeMode="contain"/>
					<Text className="font-rubik font-medium text-2xl text-white mt-auto text-center mb-9">Forgot
						Password</Text>

					<View className="bg-white rounded-t-3xl py-10 px-6 h-[40vh]">
						<View className="flex-row items-center bg-light rounded-3xl p-4 mb-4">
							<Feather name="user" size={16} color={Colors.black}/>
							<Input
								value={username}
								onChangeText={setUsername}
								placeholder="Username" placeholderTextColor={Constants.HexToRgba(Colors.black, 0.4)}
								   className="font-rubik font-light text-sm text-black ml-2 flex-1"/>
						</View>

						<Button
							// onPress={() => navigation.navigate('Root', {screen: 'Root:Messages'})}
							className="bg-main py-4 rounded-2xl mt-10 items-center"
						>
							<Text className="font-rubik text-sm text-white">Reset Password</Text>
						</Button>

						<Button className="flex-row items-center justify-center mt-12"
								onPress={() => navigation.navigate('Login')}>
							<Text className="font-rubik text-sm text-black">Back</Text>
						</Button>
					</View>
				</View>
			</TouchableWithoutFeedback>
		</KeyboardAvoidingView>
	);
}

export default ForgotPasswordContainer;
