import React from 'react';
import {View, FlatList} from 'react-native';

// Components
import {Header, GroupCard} from '@/components';

// Layout
import Layout from '@/Layout';

const messages = [
	{id: 1, color: 'black', name: 'FAM 👨‍👩‍👧‍👧', time: '16:30', photo: require('@/assets/images/story-1.png')},
	{id: 2, color: 'orange', name: 'Business 💼', time: '17:20', photo: require('@/assets/images/story-2.png')},
	{id: 3, color: 'green', name: 'Girls 👨‍👩‍👧‍👧', time: '18:12', photo: require('@/assets/images/story-3.png')},
	{id: 4, color: 'black', name: 'Shopping 👛', time: '16:30', photo: require('@/assets/images/story-4.png')},
	{id: 5, color: 'black', name: 'FAM 👨‍👩‍👧‍👧', time: '16:30', photo: require('@/assets/images/story-5.png')},
	{id: 6, color: 'black', name: 'Business 💼', time: '16:30', photo: require('@/assets/images/story-3.png')},
	{id: 7, color: 'black', name: 'Girls 👨‍👩‍👧‍👧', time: '16:30', photo: require('@/assets/images/story-1.png')},
	{id: 8, color: 'black', name: 'Shopping 👛', time: '16:30', photo: require('@/assets/images/story-4.png')},
	{id: 9, color: 'black', name: 'FAM 👨‍👩‍👧‍👧', time: '16:30', photo: require('@/assets/images/story-5.png')},
	{id: 10, color: 'black', name: 'Business 💼', time: '16:30', photo: require('@/assets/images/story-3.png')},
];

function GroupsContainer({navigation}) {
	return (
		<Layout>
			<Header title="Groups" stories navigation={navigation} />

			<View className="flex-1 mt-6">
				<FlatList data={messages} key={item => item.id} renderItem={({item}) => <GroupCard {...item} navigation={navigation} />} showsVerticalScrollIndicator={false} />
			</View>
		</Layout>
	);
}

export default GroupsContainer;
