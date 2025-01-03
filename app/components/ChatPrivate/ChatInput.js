import React from 'react';
import {View} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import {Button, Input} from '@/components';
import {Colors, Constants} from '@/common';

function ChatInput ({setOpen}){
	return (
		<View className="flex-row items-start h-20 bg-white pt-1">
			<View className="bg-light rounded-2xl py-[14px] mb-2 px-4 flex-row items-center flex-1">
				<Button>
					<MaterialIcons name="emoji-emotions" size={20} color={Colors.main} />
				</Button>

				<Input
					placeholder="Write a message"
					placeholderTextColor={Constants.HexToRgba(Colors.black, 0.5)}
					className="font-rubik font-light text-sm text-black mx-2 flex-1"
				/>

				<Button onPress={() => setOpen(true)}>
					<AntDesign name="menuunfold" size={14} color={Colors.main} />
				</Button>
			</View>

			<Button className="w-12 h-12 rounded-full bg-main items-center justify-center mt-3 ml-6">
				<Feather name="send" size={20} color={Colors.white} />
			</Button>
		</View>
	);
};

export default ChatInput;
