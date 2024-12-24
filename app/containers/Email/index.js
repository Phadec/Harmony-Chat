import React, {useState, useEffect} from 'react';
import {View, Text, TouchableOpacity, Image, Linking, Modal} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRoute} from "@react-navigation/native";
import {HubConnectionBuilder, LogLevel} from "@microsoft/signalr";

const SuccessModal = ({visible, onClose}) => (
	<Modal
		animationType="fade"
		transparent={true}
		visible={visible}
		onRequestClose={onClose}
	>
		<View className="flex-1 bg-black/50 justify-center items-center">
			<View className="bg-white p-6 rounded-2xl w-[80%] items-center">
				<View className="w-16 h-16 bg-main rounded-full items-center justify-center mb-4">
					<View className="w-8 h-8 bg-green-500 rounded-full items-center justify-center">
						<Text className="text-teal-50 text-4xl">✓</Text>
					</View>
				</View>

				<Text className="text-xl font-bold text-center mb-2">
					Verified
				</Text>

				<Text className="text-gray-600 text-center mb-6">
					You have successfully verified the account
				</Text>

				<TouchableOpacity
					onPress={onClose}
					className="w-full bg-purple-600 py-3 rounded-lg"
				>
					<Text className="text-main text-center font-semibold">
						Get started
					</Text>
				</TouchableOpacity>
			</View>
		</View>
	</Modal>
);

function EmailVerificationContainer({navigation}) {
	const {email} = useRoute().params;
	const [timeLeft, setTimeLeft] = useState(30);
	const [canResend, setCanResend] = useState(false);
	const [connection, setConnection] = useState(null);
	const [emailConfirmed, setEmailConfirmed] = useState(false);
	const [showSuccessModal, setShowSuccessModal] = useState(false);

	useEffect(() => {
		const newConnection = new HubConnectionBuilder()
			.withUrl('http://10.0.2.2:5250/auth-hub')
			.withAutomaticReconnect([0, 1000, 5000, 10000, 30000])
			.build();

		newConnection.on('ReceiveEmailConfirmation', (userId) => {
			console.log(`Email for user ${userId} has been confirmed.`);
			setEmailConfirmed(true);
			setShowSuccessModal(true);
		});

		newConnection.start()
			.then(() => {
				console.log('Connected to AuthHub');
				setConnection(newConnection);
			})
			.catch(err => {
				console.error('SignalR Connection Error:', err);
			});

		return () => {
			if (newConnection) {
				newConnection.stop()
					.catch(err => console.error('Error stopping connection:', err));
			}
		};
	}, []);

	useEffect(() => {
		if (timeLeft > 0) {
			const timer = setTimeout(() => {
				setTimeLeft(timeLeft - 1);
			}, 1000);
			return () => clearTimeout(timer);
		} else {
			setCanResend(true);
		}
	}, [timeLeft]);

	const handleModalClose = () => {
		setShowSuccessModal(false);
		navigation.navigate('Login');
	};

	const handleResend = () => {
		if (canResend) {
			// Add your resend logic here
			setTimeLeft(30);
			setCanResend(false);
		}
	};

	return (
		<SafeAreaView className="flex-1 bg-white">
			<View className="flex-1 items-center justify-center px-6">
				<View className="w-50 h-50 bg-purple-100 rounded-full items-center justify-center mb-8">
					<Image
						source={require('@/assets/images/email.png')}
						className="w-20 h-20"
					/>
				</View>

				<Text className="text-2xl text-main font-bold mb-4 text-center">
					Account Verification
				</Text>

				<Text className="text-gray-600 text-center mb-8">
					Please verify your email using the link sent to{'\n'}
					<Text className="font-semibold">{email}</Text>
				</Text>

				<TouchableOpacity
					onPress={() => Linking.openURL('mailto:')}
					className="w-full bg-purple-600 py-4 rounded-lg mb-4"
				>
					<Text className="text-white text-center font-semibold">
						Open Email App
					</Text>
				</TouchableOpacity>

				<View className="flex-row items-center">
					<Text className="text-gray-600">
						Didn't receive the email?{' '}
					</Text>
					<TouchableOpacity
						onPress={handleResend}
						disabled={!canResend}
					>
						<Text className={`font-semibold ${canResend ? 'text-purple-600' : 'text-gray-400'}`}>
							Resend
						</Text>
					</TouchableOpacity>
					{!canResend && (
						<Text className="text-gray-400 ml-1">
							in {timeLeft}s
						</Text>
					)}
				</View>
			</View>

			<SuccessModal
				visible={showSuccessModal}
				onClose={handleModalClose}
			/>
		</SafeAreaView>
	);
}

export default EmailVerificationContainer;
