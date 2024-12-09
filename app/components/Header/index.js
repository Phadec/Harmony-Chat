import React from 'react';
import {Image, View, Text} from 'react-native';
import {useDispatch} from 'react-redux';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';
import Octicons from 'react-native-vector-icons/Octicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Components
import {Button} from '@/components';

// Common
import {Colors} from '@/common';

// Actions
import {actions} from '@/redux/reducer/StoryRedux';

function Header({title, stories, messages, search, goBack, navigation}) {
	const dispatch = useDispatch();

	return (
		<View className="flex-row items-center">
			{goBack ? (
				<Button className="flex-row items-center" onPress={() => navigation.goBack()}>
					<MaterialIcons name="arrow-back-ios" size={16} color={Colors.black} />
					<Text className="font-rubik font-medium text-xl text-black ml-2">{title}</Text>
				</Button>
			) : (
				<Text className="font-rubik font-medium text-xl text-black">{title}</Text>
			)}

			<View className="flex-row items-center ml-auto">
				{messages && (
					<Button className="mr-4 opacity-40">
						<Entypo name="unread" size={20} color={Colors.black} />
					</Button>
				)}

				{search && (
					<Button>
						<Octicons name="search" size={20} color={Colors.black} />
					</Button>
				)}

				{stories && (
					<Button onPress={() => actions.setAddStory(dispatch, true)}>
						<AntDesign name="pluscircleo" size={20} color={Colors.black} />
					</Button>
				)}

				<Button className="w-12 h-12 rounded-full relative ml-6">
					<View className="w-3 h-3 rounded-full bg-orange border-2 border-white absolute left-0 top-0 z-10" />

					<Image source={require('@/assets/images/person-1.webp')} className="w-12 h-12 rounded-full" />
				</Button>
			</View>
		</View>
	);
}

export default Header;
