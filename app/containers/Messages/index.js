import React from 'react';
import {View, FlatList} from 'react-native';

// Components
import {Header, BubbleStory, MessageCard} from '@/components';

// Layout
import Layout from '@/Layout';

const stories = [
	{id: 1, photo: require('@/assets/images/story-1.png'), color: 'blue'},
	{id: 2, photo: require('@/assets/images/story-2.png'), color: 'red'},
	{id: 3, photo: require('@/assets/images/story-3.png'), color: 'yellow'},
	{id: 4, photo: require('@/assets/images/story-4.png'), color: 'purple'},
	{id: 5, photo: require('@/assets/images/story-5.png'), color: 'green'},
	{id: 6, photo: require('@/assets/images/story-2.png'), color: 'red'},
];

const messages = [
	{id: 1, color: 'black', name: 'Mayke Schuurs', time: '16:30', photo: require('@/assets/images/story-1.png')},
	{id: 2, color: 'orange', name: 'Xenie Doleželová', time: '17:20', photo: require('@/assets/images/story-2.png')},
	{id: 3, color: 'green', name: 'Farrokh Rastegar', time: '18:12', photo: require('@/assets/images/story-3.png')},
	{id: 4, color: 'black', name: 'Victoria Pacheco', time: '16:30', photo: require('@/assets/images/story-4.png')},
	{id: 5, color: 'black', name: 'Edward Lindgren', time: '16:30', photo: require('@/assets/images/story-5.png')},
	{id: 6, color: 'black', name: 'Loni Bowcher', time: '16:30', photo: require('@/assets/images/story-3.png')},
	{id: 7, color: 'black', name: 'Sebastian Westergren', time: '16:30', photo: require('@/assets/images/story-1.png')},
	{id: 8, color: 'black', name: 'Victoria Pacheco', time: '16:30', photo: require('@/assets/images/story-4.png')},
	{id: 9, color: 'black', name: 'Edward Lindgren', time: '16:30', photo: require('@/assets/images/story-5.png')},
	{id: 10, color: 'black', name: 'Loni Bowcher', time: '16:30', photo: require('@/assets/images/story-3.png')},
];

function MessagesContainer({navigation}) {
	return (
		<Layout>
			<Header title="Messages" messages search navigation={navigation} />

			<View className="my-6 -mx-6">
				<FlatList data={stories} keyExtractor={item => item.id} renderItem={({item}) => <BubbleStory {...item} navigation={navigation} />} horizontal showsHorizontalScrollIndicator={false} className="pl-6" />
			</View>

			<FlatList data={messages} key={item => item.id} renderItem={({item}) => <MessageCard {...item} navigation={navigation} />} showsVerticalScrollIndicator={false} />
		</Layout>
	);
}

export default MessagesContainer;
