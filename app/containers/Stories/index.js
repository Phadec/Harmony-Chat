import React from 'react';
import {Text, View} from 'react-native';
import {FlatList} from 'react-native-gesture-handler';

// Components
import {Header, StoryCard} from '@/components';

// Layout
import Layout from '@/Layout';

const stories = [
	{id: 1, photo: require('@/assets/images/story-1.png'), name: 'Mayke Schuurs', emoji: '😎'},
	{id: 2, photo: require('@/assets/images/story-2.png'), name: 'Daisy Murphy', emoji: '🌿'},
	{id: 3, photo: require('@/assets/images/story-3.png'), name: 'Veerle de Bree', emoji: '👽'},
	{id: 4, photo: require('@/assets/images/story-4.png'), name: 'Stormie Hansford', emoji: '🙌🏻'},
	{id: 5, photo: require('@/assets/images/story-5.png'), name: 'Paulina Gayoso', emoji: '🫰🏽'},
	{id: 6, photo: require('@/assets/images/story-2.png'), name: 'Stina Gunnarsdottir', emoji: '🦦'},
	{id: 7, photo: require('@/assets/images/story-1.png'), name: 'Wan Gengxin', emoji: '🪵'},
	{id: 8, photo: require('@/assets/images/story-2.png'), name: 'Alexander Ljung', emoji: '🩰'},
	{id: 9, photo: require('@/assets/images/story-3.png'), name: 'Daisy Murphy', emoji: '👽'},
	{id: 10, photo: require('@/assets/images/story-4.png'), name: 'Paulina Gayoso', emoji: '🙌🏻'},
	{id: 11, photo: require('@/assets/images/story-5.png'), name: 'Mayke Schuurs', emoji: '🫰🏽'},
	{id: 12, photo: require('@/assets/images/story-2.png'), name: 'Stina Gunnarsdottir', emoji: '🦦'},
];

function StoriesContainer({navigation}) {
	return (
		<Layout>
			<Header title="Stories" stories navigation={navigation} />

			<Text className="font-rubik text-sm text-black mt-6 mb-4">Your friends stories</Text>

			<View className="flex-1 bg-light rounded-3xl px-4 mb-4">
				<FlatList data={stories} keyExtractor={item => item.id} renderItem={({item}) => <StoryCard {...item} navigation={navigation} />} showsVerticalScrollIndicator={false} className="py-4" />
			</View>
		</Layout>
	);
}

export default StoriesContainer;
