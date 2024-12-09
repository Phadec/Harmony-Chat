import React from 'react';
import {View, FlatList, Image, Text} from 'react-native';
import Octicons from 'react-native-vector-icons/Octicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

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
	return (
		<View className="flex-row items-center bg-light rounded-2xl py-4 px-20 mb-3">
			<Image source={photo} className="w-12 h-12 rounded-full" />

			<View className="ml-4 mr-auto">
				<Text className="font-rubik font-medium text-xs text-black">{name}</Text>
				<Text className="font-rubik text-xs text-black/40 mt-1">0555 555 555 55</Text>
			</View>

			<Octicons name="link" size={16} color={Colors.purple} />
		</View>
	);
}

function InviteFriendsContainer({navigation}) {
	return (
		<Layout>
			<Header title="Invite friends" goBack search navigation={navigation} />

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

export default InviteFriendsContainer;
