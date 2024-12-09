import React, {useState} from 'react';
import {View, Text, Image, FlatList} from 'react-native';
import Octicons from 'react-native-vector-icons/Octicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Feather from 'react-native-vector-icons/Feather';

// Components
import {Header, Input, Button} from '@/components';

// Commons
import {Colors, Constants} from '@/common';

// Layout
import Layout from '@/Layout';

const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

const friends = [
	{id: 1, name: 'Mayke Schuurs', photo: require('@/assets/images/story-1.png')},
	{id: 2, name: 'Xenie Doleželová', photo: require('@/assets/images/story-2.png')},
	{id: 3, name: 'Farrokh Rastegar', photo: require('@/assets/images/story-3.png')},
	{id: 4, name: 'Victoria Pacheco', photo: require('@/assets/images/story-4.png')},
	{id: 5, name: 'Edward Lindgren', photo: require('@/assets/images/story-5.png')},
	{id: 6, name: 'Loni Bowcher', photo: require('@/assets/images/story-3.png')},
	{id: 7, name: 'Sebastian Westergren', photo: require('@/assets/images/story-1.png')},
	{id: 8, name: 'Victoria Pacheco', photo: require('@/assets/images/story-4.png')},
	{id: 9, name: 'Edward Lindgren', photo: require('@/assets/images/story-5.png')},
	{id: 10, name: 'Loni Bowcher', photo: require('@/assets/images/story-3.png')},
];

function Friend({photo, name}) {
	const [opened, setOpened] = useState(false);

	return (
		<View className="bg-light rounded-2xl py-4 px-14 mb-3">
			<Button className="flex-row items-center" onPress={() => setOpened(!opened)}>
				<View className="w-12 h-12 relative">
					<Image source={photo} className="w-12 h-12 rounded-full" />

					<View className="absolute -bottom-[2px] -right-[2px]">
						<Text>🤪</Text>
					</View>
				</View>

				<View className="ml-4 mr-auto">
					<Text className="font-rubik font-medium text-xs text-black">{name}</Text>
					<Text className="font-rubik text-xs text-black/40 mt-1">0555 555 555 55</Text>
				</View>

				<MaterialIcons name={`${opened ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}`} size={24} color={Colors.black} />
			</Button>

			{opened && (
				<View className="flex-row items-center justify-between mt-6">
					<Button className="w-10 h-10 rounded-full bg-purple/40 items-center justify-center">
						<MaterialCommunityIcons name="heart" color={Colors.main} size={16} />
					</Button>

					<Button className="w-10 h-10 rounded-full bg-purple/40 items-center justify-center">
						<MaterialIcons name="block" color={Colors.main} size={16} />
					</Button>

					<Button className="w-10 h-10 rounded-full bg-purple/40 items-center justify-center">
						<FontAwesome name="comments-o" color={Colors.main} size={16} />
					</Button>

					<Button className="w-10 h-10 rounded-full bg-purple/40 items-center justify-center">
						<Octicons name="device-camera-video" color={Colors.main} size={16} />
					</Button>

					<Button className="w-10 h-10 rounded-full bg-purple/40 items-center justify-center">
						<Feather name="phone-call" color={Colors.main} size={16} />
					</Button>
				</View>
			)}
		</View>
	);
}

function CallListContainer({navigation}) {
	return (
		<Layout>
			<Header title="Call List" goBack search navigation={navigation} />

			<View className="flex-1 mb-4 mt-6">
				<View className="flex-row items-center justify-between mb-5">
					<View className="flex-row items-center bg-light p-3 rounded-3xl flex-1">
						<Octicons name="search" size={18} color={Constants.HexToRgba(Colors.black, 0.5)} />

						<Input placeholder="Search a person" className="font-rubik text-sm text-black ml-2 flex-1" placeholderTextColor={Constants.HexToRgba(Colors.black, 0.5)} />

						<MaterialIcons name="mic" size={20} color={Constants.HexToRgba(Colors.black, 0.5)} />
					</View>

					<Button className="w-12 h-12 rounded-[22px] bg-purple items-center justify-center ml-3">
						<Octicons name="filter" size={16} color={Colors.white} />
					</Button>
				</View>

				<View className="flex-row flex-1">
					<FlatList data={friends} keyExtractor={item => item.id} renderItem={({item}) => <Friend {...item} />} showsVerticalScrollIndicator={false} className="w-full" />

					<FlatList
						data={letters}
						keyExtractor={item => item}
						renderItem={({item}) => (
							<Button className="p-2 items-end">
								<Text className="font-rubik font-medium text-xs text-black uppercase">{item}</Text>
							</Button>
						)}
						showsVerticalScrollIndicator={false}
						className="basis-7 ml-4"
					/>
				</View>
			</View>
		</Layout>
	);
}

export default CallListContainer;
