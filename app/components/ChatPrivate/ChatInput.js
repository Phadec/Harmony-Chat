import React, {useState} from 'react';
import {Text, View} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import {Button, Input} from '@/components';
import {Colors, Constants} from '@/common';

function ChatInput({
					   setOpen,
					   onSend,
					   notifyTyping,
					   notifyStopTyping,
					   me,
					   reply,
					   closeReply,
					   fullName,
				   }) {
	const [message, setMessage] = useState('');

	const handleSend = () => {
		if (onSend(message)) {
			setMessage('');
			notifyStopTyping();
		}
	};

	return (
		<View className="flex-col">
			{reply && (
				<View
					className="bg-white rounded-t-lg px-3 py-2 flex-row justify-between items-center"
				>
					<View className="flex-1">
						<Text className="text-black font-semibold text-sm">
							Replying to {me ? 'yourself' : fullName}
						</Text>
						<Text className="text-sm text-gray-800" numberOfLines={1}>
							{reply}
						</Text>
					</View>
					<Button onPress={closeReply}>
						<AntDesign name="close" size={20} color={Colors.gray} />
					</Button>
				</View>
			)}
			<View className="flex-row items-start h-20 bg-white pt-1">
				<View className="bg-gray-50 rounded-2xl py-[14px] mb-2 px-4 flex-row items-center flex-1">
					<Button>
						<MaterialIcons name="emoji-emotions" size={20} color={Colors.main}/>
					</Button>

					<Input
						value={message}
						onChangeText={(text) => {
							setMessage(text);
							notifyTyping();
						}}
						onBlur={notifyStopTyping}
						placeholder="Write a message"
						placeholderTextColor={Constants.HexToRgba(Colors.black, 0.5)}
						className="font-rubik font-light text-sm text-black mx-2 flex-1"
					/>

					<Button onPress={() => setOpen(true)}>
						<AntDesign name="menuunfold" size={14} color={Colors.main}/>
					</Button>
				</View>

				<Button
					onPress={handleSend}
					className="w-12 h-12 rounded-full bg-main items-center justify-center mt-3 ml-6">
					<Feather name="send" size={20} color={Colors.white}/>
				</Button>
			</View>
		</View>

	);
};

export default React.memo(ChatInput);
