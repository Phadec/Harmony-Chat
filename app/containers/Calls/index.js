import React from 'react';
import {View, Text, Image, FlatList} from 'react-native';
import Octicons from 'react-native-vector-icons/Octicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';

// Components
import {Header, Input, Button} from '@/components';

// Commons
import {Colors, Constants} from '@/common';

// Layout
import Layout from '@/Layout';

const calls = [
	{id: 1, name: 'Mayke Schuurs', type: 'outgoing', video: true, photo: require('@/assets/images/story-1.png')},
	{id: 2, name: 'Xenie Doleželová', type: 'incoming', group: true, photo: require('@/assets/images/story-2.png')},
	{id: 3, name: 'Farrokh Rastegar', type: 'missed', call: true, photo: require('@/assets/images/story-3.png')},
	{id: 4, name: 'Victoria Pacheco', type: 'outgoing', video: true, photo: require('@/assets/images/story-4.png')},
	{id: 5, name: 'Edward Lindgren', type: 'incoming', group: true, photo: require('@/assets/images/story-5.png')},
	{id: 6, name: 'Loni Bowcher', type: 'missed', call: true, photo: require('@/assets/images/story-3.png')},
	{id: 7, name: 'Sebastian Westergren', type: 'outgoing', video: true, photo: require('@/assets/images/story-1.png')},
	{id: 8, name: 'Victoria Pacheco', type: 'incoming', group: true, photo: require('@/assets/images/story-4.png')},
	{id: 9, name: 'Edward Lindgren', type: 'missed', call: true, photo: require('@/assets/images/story-5.png')},
	{id: 10, name: 'Loni Bowcher', type: 'outgoing', video: true, photo: require('@/assets/images/story-3.png')},
];

function CallCard({photo, name, type, video, group, call, navigation}) {
	return (
		<Button className="flex-row items-center bg-light py-4 px-14 rounded-[22px] mb-3" onPress={() => navigation.navigate('Calling')}>
			<Image source={photo} className="w-12 h-12 rounded-full" />

			<View className="ml-4 mr-auto">
				<Text className="font-rubik font-medium text-sm text-black">{name}</Text>
				<View className="flex-row items-center mt-1">
					<Feather name={`phone-${type || 'missed'}`} size={12} color={Constants.HexToRgba(Colors.black, 0.5)} />
					<Text className="font-rubik text-xs text-black/40 ml-1">22:34</Text>
				</View>
			</View>

			{video && <Octicons name="device-camera-video" size={16} color={Constants.HexToRgba(Colors.black, 0.5)} />}
			{group && <Feather name="users" size={16} color={Constants.HexToRgba(Colors.black, 0.5)} />}
			{call && <Feather name="phone-call" size={16} color={Constants.HexToRgba(Colors.black, 0.5)} />}
		</Button>
	);
}

function CallsContainer({navigation}) {
	return (
		<Layout>
			<Header title="Calls" search navigation={navigation} />

			<View className="flex-1 mt-6">
				<View className="flex-row items-center justify-between mb-5">
					<View className="flex-row items-center bg-light p-3 rounded-3xl flex-1">
						<Octicons name="search" size={18} color={Constants.HexToRgba(Colors.black, 0.5)} />

						<Input placeholder="Search a person" className="font-rubik text-sm text-black ml-2 flex-1" placeholderTextColor={Constants.HexToRgba(Colors.black, 0.5)} />

						<MaterialIcons name="mic" size={20} color={Constants.HexToRgba(Colors.black, 0.5)} />
					</View>

					<Button className="w-12 h-12 rounded-[22px] bg-purple items-center justify-center ml-3" onPress={() => navigation.navigate('CallList')}>
						<Feather name="phone" size={16} color={Colors.white} />
					</Button>
				</View>

				<FlatList data={calls} keyExtractor={item => item.id} renderItem={({item}) => <CallCard {...item} navigation={navigation} />} showsVerticalScrollIndicator={false} />
			</View>
		</Layout>
	);
}

export default CallsContainer;
