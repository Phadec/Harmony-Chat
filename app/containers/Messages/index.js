import React, {useCallback, useEffect, useState} from 'react';
import {View, FlatList} from 'react-native';
import {useFocusEffect} from "@react-navigation/native";
import {useDispatch, useSelector} from "react-redux";
import {fetchChatList} from "../../redux/reducer/ChatListRedux";

// Components
import {Header, BubbleStory, MessageCard, GroupMessageCard} from '@/components';

// Layout
import Layout from '@/Layout';

// Services
import {ChatService} from "@/services";
import {SignalRService} from '../../services/signalR';


function MessagesContainer({navigation}) {
	const dispatch = useDispatch();
	const {chatList, error} = useSelector((state) => state.chatList);
	const chatService = new ChatService();
	const signalRService = SignalRService.getInstance();

	// Cập nhật hàm fetch
	const fetchAndSetRelationships = () => {
		dispatch(fetchChatList(chatService));
	};

	// Cập nhật useEffect cho SignalR
	useEffect(() => {
		const startSignalRConnection = async () => {
			if (signalRService.hubConnection.state !== signalRService.hubConnection.state.Connected) {
				await signalRService.start();
			}
		};

		startSignalRConnection().then(() => {
			const subscription = signalRService.messageReceived$.subscribe(() => {
				fetchAndSetRelationships();
			});

			return () => {
				subscription.unsubscribe();
			};
		}).catch((error) => {
			console.error('Error while starting SignalR connection:', error);
		});

		return () => {
			signalRService.stopConnection();
		};
	}, [signalRService]);

	// Cập nhật useFocusEffect
	useFocusEffect(
		React.useCallback(() => {
			console.log("[MessageContainer] Screen focused, fetching groups...");
			fetchAndSetRelationships();
		}, [])
	);

	return (
		<Layout>
			<Header title="Messages" messages search navigation={navigation}/>
			<View className="my-6 -mx-6">
				<FlatList
					data={chatList.filter(item => item.relationshipType === 'Private')}
					keyExtractor={(item) => item.contactId}
					renderItem={({item}) => <BubbleStory item={item} navigation={navigation}/>}
					horizontal
					showsHorizontalScrollIndicator={false}
					className="pl-6"
				/>
			</View>
			<FlatList
				data={chatList}
				keyExtractor={(item) => {
					if (item.relationshipType === 'Group') {
						return item.groupId;
					}
					return item.contactId;
				}}
				renderItem={({item}) => {
					if (item.relationshipType === 'Private') {
						return <MessageCard item={item} navigation={navigation}/>;
					}
					return <GroupMessageCard item={item} navigation={navigation}/>
				}}
				showsVerticalScrollIndicator={false}
			/>
		</Layout>
	);
}

export default MessagesContainer;
