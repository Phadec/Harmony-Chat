import React, { useState } from 'react';
import {
	Image,
	View,
	Text,
	Platform,
	TouchableWithoutFeedback,
	KeyboardAvoidingView,
	Keyboard,
	ScrollView, TouchableOpacity, Alert
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import Octicons from 'react-native-vector-icons/Octicons';

// Components
import { Input, Button } from '@/components';

// Common
import { Colors, Constants } from '@/common';
import DateTimePicker from "react-native-modal-datetime-picker";
import { formatInTimeZone } from "date-fns-tz";
import { AuthService } from "../../services/Auth";

import { uuidv4 } from 'react-native-uuid';

function SignupContainer({ navigation }) {
	const [open, setOpen] = useState(false)
	const [isCloseEyePassword, setIsCloseEyePassword] = useState(true);
	const [isCloseEyeCP, setIsCloseEyeCP] = useState(true);

	const [date, setDate] = useState('')
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [email, setEmail] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [file, setFile] = useState('');

	const [isMatch, setIsMatch] = useState(true);

	const authService = new AuthService();

	const onRegister = async () => {
		const data = {
			username,
			password,
			confirmPassword,
			firstName,
			lastName,
			date,
			email
		}

		// Kiểm tra các fileds có rỗng không
		if (!data.username || !data.password ||
			!data.confirmPassword || !data.firstName ||
			!data.lastName || !data.date || !data.email) {
			Alert.alert('Please fill all fields to continue');
			return;
		}

		if (data.password !== data.confirmPassword) {
			setIsMatch(false)
			return;
		}

		try {
			// Call the API to register the account
			const response = await authService.register(data);
			// Chuyển người dùng đến trang EmailVerification vaf tao UUID cho người dùng
			navigation.navigate('EmailVerification', { email: data.email});
		} catch (error) {
			// Kiểm tra lỗi trả về từ server
			if (error.response) {
				// Lỗi từ server (mã lỗi 400)
				console.log("Response Error:", error.response.data);
				const errorMessage = error.response.data.message || "Something went wrong!";

				// Hiển thị lỗi trong giao diện
				Alert.alert("Registration Failed", errorMessage);
			} else if (error.request) {
				// Không nhận được phản hồi từ server
				console.log("Request Error:", error.request);
				Alert.alert("Network Error", "Unable to connect to the server. Please check your network.");
			} else {
				// Lỗi khác
				console.log("Error:", error.message);
				Alert.alert("Error", error.message);
			}
		}
	};

	return (

		<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
			className="flex-1">
			<TouchableWithoutFeedback onPress={Keyboard.dismiss}>

				<View className="flex-1 bg-main">
					<Image source={require('@/assets/images/shape.png')}
						className="absolute left-0 right-0 top-0 bottom-0 w-full h-full" />
					<Image source={require('@/assets/images/logo-thin.png')} className="w-7 h-5 mt-10 mx-auto"
						resizeMode="contain" />
					<Text className="font-rubik font-medium text-2xl text-white mt-auto text-center mb-9">Sign
						up</Text>
					<ScrollView
						className="bg-white rounded-t-2xl py-10 px-6 h-[68vh]"
						showsVerticalScrollIndicator={false}>

						<View className="flex-row items-center bg-light rounded-2xl p-2 mb-2 mt-3">
							<Feather name="user" size={16} color={Colors.black} />
							<Input
								value={firstName}
								onChangeText={(text) => setFirstName(text)}
								placeholder="Frist name"
								placeholderTextColor={Constants.HexToRgba(Colors.black, 0.4)}
								className="font-rubik font-light text-sm text-black ml-2 flex-1" />
						</View>

						<View className="flex-row items-center bg-light rounded-2xl p-2 mb-2">
							<Feather name="user" size={16} color={Colors.black} />
							<Input placeholder="Last name"
								value={lastName}
								onChangeText={(text) => setLastName(text)}
								placeholderTextColor={Constants.HexToRgba(Colors.black, 0.4)}
								className="font-rubik font-light text-sm text-black ml-2 flex-1" />
						</View>

						<View className="flex-row items-center bg-light rounded-2xl p-2 mb-2">
							<TouchableOpacity onPress={() => setOpen(true)} className="flex-row items-center">
								<Feather name="calendar" size={16} color={Colors.black} />
								<Input
									placeholder="Date of birth"
									value={
										date
											? formatInTimeZone(date, 'Asia/Ho_Chi_Minh', 'dd-MM-yyyy').toString()
											: ''
									}
									editable={false}
									placeholderTextColor={Constants.HexToRgba(Colors.black, 0.4)}
									className="font-rubik font-light text-sm text-black ml-2 flex-1"
								/>
								<DateTimePicker
									mode={"date"}
									isVisible={open}
									onConfirm={(date) => {
										setDate(date);
										setOpen(false);
									}}
									onCancel={() => setOpen(false)}
								/>
							</TouchableOpacity>
						</View>

						<View className="flex-row items-center bg-light rounded-2xl p-2 mb-2">
							<Feather name="mail" size={16} color={Colors.black} />
							<Input placeholder="Email"
								value={email}
								onChangeText={(text) => setEmail(text)}
								placeholderTextColor={Constants.HexToRgba(Colors.black, 0.4)}
								className="font-rubik font-light text-sm text-black ml-2 flex-1" />
						</View>

						<View className="flex-row items-center bg-light rounded-2xl p-2 mb-2">
							<Feather name="at-sign" size={16} color={Colors.black} />
							<Input placeholder="Username"
								value={username}
								onChangeText={(text) => setUsername(text)}
								placeholderTextColor={Constants.HexToRgba(Colors.black, 0.4)}
								className="font-rubik font-light text-sm text-black ml-2 flex-1" />
						</View>

						<View className="flex-row items-center bg-light rounded-2xl p-2 mb-2">
							<Feather name="lock" size={16} color={Colors.black} />
							<Input
								value={password}
								onChangeText={(text) => setPassword(text)}
								secureTextEntry={isCloseEyePassword}
								placeholder="Password"
								placeholderTextColor={Constants.HexToRgba(Colors.black, 0.4)}
								className="font-rubik font-light text-sm text-black ml-2 flex-1" />
							<Octicons
								onPress={() => setIsCloseEyePassword(!isCloseEyePassword)}
								name={`${isCloseEyePassword ? 'eye-closed' : 'eye'}`} size={16}
								color={Constants.HexToRgba(Colors.black, 0.5)}
							/>
						</View>

						<View className={`flex-row items-center rounded-2xl p-2 mb-2 ${(isMatch) ? 'bg-light' : 'border border-red'
							}`}>
							<Feather name="lock" size={16} color={Colors.black} />
							<Input
								value={confirmPassword}
								onChangeText={(text) => {
									setConfirmPassword(text);
									setIsMatch(true);
								}}
								secureTextEntry={isCloseEyeCP}
								placeholder="Confim password"
								placeholderTextColor={Constants.HexToRgba(Colors.black, 0.4)}
								className="font-rubik font-light text-sm text-black ml-2 flex-1" />
							<Octicons
								onPress={() => setIsCloseEyeCP(!isCloseEyeCP)}
								name={`${isCloseEyeCP ? 'eye-closed' : 'eye'}`} size={16}
								color={Constants.HexToRgba(Colors.black, 0.5)} />
						</View>

						<Button
							onPress={() => onRegister()}
							className="bg-main py-4 rounded-2xl items-center">
							<Text className="font-rubik text-sm text-white">Sign up</Text>
						</Button>

						<Button className="flex-row items-center justify-center mt-3 pb-5"
							onPress={() => navigation.navigate('Login')}>
							<Text className="font-rubik text-sm text-black">
								Do you have an account? <Text className="text-main">Sign in</Text>
							</Text>
						</Button>
					</ScrollView>
				</View>
			</TouchableWithoutFeedback>
		</KeyboardAvoidingView>
	);
}

export default SignupContainer;
