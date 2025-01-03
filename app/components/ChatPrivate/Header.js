import React from 'react';
import {View, Text, Image} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

// icons
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Octicons from 'react-native-vector-icons/Octicons';
import Feather from 'react-native-vector-icons/Feather';
import Fontisto from 'react-native-vector-icons/Fontisto';

// components
import {Button} from '@/components';

// common
import {Colors} from '@/common';

function HeaderPrivateChat({navigation}) {
	const insets = useSafeAreaInsets();

	return (
		<View className="bg-main flex-row items-center p-6 rounded-b-3xl"
			  style={{paddingTop: insets.top + 16}}>
			<Button onPress={() => navigation.goBack()}>
				<MaterialIcons name="arrow-back-ios" size={20} color={Colors.white}/>
			</Button>

			<View className="flex-row items-center ml-2">
				<View className="w-12 h-12 relative">
					<Image source={require('@/assets/images/person-1.webp')}
						   className="w-12 h-12 rounded-full"/>
					<View className="w-4 h-4 rounded-full bg-green border-[3px] border-main absolute top-0 left-0"/>
				</View>

				<View className="ml-3">
					<Text className="font-rubik font-medium text-sm text-white">
						Martijn Dragonj
					</Text>
					<Text className="mt-1 font-rubik text-xs text-white/40">Online</Text>
				</View>
			</View>

			<View className="flex-row items-center ml-auto">
				<Button>
					<Octicons name="search" size={16} color={Colors.white}/>
				</Button>
				<Button className="mx-5">
					<Feather name="phone-call" size={16} color={Colors.white}/>
				</Button>
				<Button>
					<Fontisto name="more-v-a" size={16} color={Colors.white}/>
				</Button>
			</View>
		</View>
	);
};

export default HeaderPrivateChat;
