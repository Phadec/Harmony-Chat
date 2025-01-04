import React, {useEffect, useState} from 'react';
import {Image, View, Text, TouchableWithoutFeedback, KeyboardAvoidingView, Keyboard, FlatList, Alert, StyleSheet} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';

// Utils
import {baseURL} from '../../services/axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Components
import {Input, Button} from '@/components';

// Common
import {Colors, Constants} from '@/common';

// Services
import {FriendService, GroupService} from '@/services';
import {SignalRService} from '../../services/signalR';
import {ChatGroup} from '../../services/ChatGroup';

// Redux
import {useDispatch, useSelector} from 'react-redux';
import {actions} from '../../redux/reducer/GroupRedux';

// Navigation
import {navigationRef} from '@/RootNavigation';

import {launchImageLibrary} from 'react-native-image-picker';

function AddGroup() {
	const dispatch = useDispatch();
	const [friends, setFriends] = useState([]);
	const [friendSelected, setFriendSelected] = useState([]);
	const [groupName, setGroupName] = useState('');
	const [imageUri, setImageUri] = useState(null);
	const signalRService = SignalRService.getInstance();

	useEffect(() => {
		// Thiết lập SignalR listeners
		signalRService.setupGroupListeners(groupId => {
			console.log('New group created:', groupId);
			dispatch(actions.refreshGroups());
		});

		// Cleanup when component unmounts
		return () => {
			signalRService.hubConnection.off('NotifyGroupMembers');
		};
	}, [dispatch]);

	useEffect(() => {
		const fetchFriends = async () => {
			try {
				const userId = await AsyncStorage.getItem('userId');
				setFriendSelected([userId]);

				const friendsService = new FriendService();
				const friends = await friendsService.getFriends();
				if (friends) {
					setFriends(friends.$values);
				}
			} catch (error) {
				console.error('Error fetching friends:', error);
			}
		};
		fetchFriends();
	}, []);

	const handleSelectFriend = (friendId, isSelected) => {
		setFriendSelected(prev => {
			return isSelected ? [...prev, friendId] : prev.filter(id => id !== friendId);
		});
	};

	const handleCreateGroup = async () => {
		if (friendSelected.length < 3) {
			Alert.alert('', 'Group must have at least 3 members');
			return;
		}
		if (!groupName) {
			Alert.alert('', 'Please enter group name');
			return;
		}

		try {
			const chatService = new ChatGroup();
			const response = await chatService.createGroupChat(groupName, friendSelected, imageUri);
			if (!response) return;

			actions.setAddGroup(dispatch, false);
			setGroupName('');
			setFriendSelected([]);
			setImageUri(null);

			signalRService.groupCreated$.next({
				groupId: response.id,
				message: 'New group created',
			});

			Alert.alert('Success', 'Group created successfully', [
				{
					text: 'OK',
					onPress: () => navigationRef.current?.navigate('Root:Groups'),
				},
			]);
		} catch (error) {
			Alert.alert('Error', 'Failed to create group');
		}
	};

	const pickImage = () => {
		launchImageLibrary({mediaType: 'photo', quality: 1}, response => {
			if (response.didCancel) {
				console.log('User cancelled image picker');
			} else if (response.error) {
				console.error('ImagePicker Error:', response.error);
			} else {
				const uri = response.assets[0]?.uri;
				if (uri) setImageUri(uri);
			}
		});
	};

	return (
		<KeyboardAvoidingView behavior="padding" style={{flex: 1}}>
			<TouchableWithoutFeedback onPress={Keyboard.dismiss}>
				<View style={{flex: 1, padding: 16}}>
					<View style={styles.header}>
						<Text style={styles.title}>Add group</Text>
						<Button onPress={handleCreateGroup}>
							<MaterialIcons name="add-circle" size={25} color={Colors.main} />
						</Button>
					</View>

					<Input style={styles.input} onChangeText={setGroupName} placeholder="Group name..." placeholderTextColor={Constants.HexToRgba(Colors.black, 0.9)} />

					<FlatList data={friends} keyExtractor={item => item.id.toString()} renderItem={({item}) => <FriendCard friend={item} onSelectFriend={handleSelectFriend} />} />

					<View style={{alignItems: 'center', marginVertical: 16}}>
						{imageUri ? (
							<Image
								source={{uri: imageUri}}
								style={{
									width: 100,
									height: 100,
									borderRadius: 50,
									borderWidth: 2,
									borderColor: Colors.main,
								}}
							/>
						) : (
							<TouchableWithoutFeedback onPress={pickImage}>
								<View
									style={{
										width: 100,
										height: 100,
										borderRadius: 50,
										backgroundColor: Colors.lightGray,
										alignItems: 'center',
										justifyContent: 'center',
									}}>
									<Feather name="camera" size={30} color={Colors.main} />
									<Text style={{fontSize: 12, color: Colors.main, marginTop: 8}}>Pick Avatar</Text>
								</View>
							</TouchableWithoutFeedback>
						)}
					</View>
					{imageUri && <Button title="Change Avatar" onPress={pickImage} style={{marginTop: 8, alignSelf: 'center'}} />}
				</View>
			</TouchableWithoutFeedback>
		</KeyboardAvoidingView>
	);
}

function FriendCard({friend, onSelectFriend}) {
	const [isSelected, setSelected] = useState(false);

	const handlePress = () => {
		const newSelectedState = !isSelected;
		setSelected(newSelectedState);
		onSelectFriend(friend.id, newSelectedState);
	};

	return (
		<Button onPress={handlePress} style={styles.friendCard}>
			<View style={styles.friendInfo}>
				<Image source={{uri: `${baseURL}/${friend.avatar}`}} style={styles.friendAvatar} />
				<Text style={styles.friendName}>{friend.fullName}</Text>
			</View>
			{isSelected ? <MaterialIcons name="check-circle" size={24} color={Colors.main} /> : <Feather name="circle" size={22} color={Colors.main} />}
		</Button>
	);
}

const styles = StyleSheet.create({
	header: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
	title: {fontSize: 18, fontWeight: '600', color: Colors.black},
	input: {marginVertical: 10, padding: 10, borderWidth: 1, borderRadius: 8, color: Colors.black},
	avatarPicker: {alignItems: 'center', marginVertical: 20, backgroundColor: Colors.red},
	image: {width: 100, height: 100, borderRadius: 50},
	friendCard: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10},
	friendInfo: {flexDirection: 'row', alignItems: 'center'},
	friendAvatar: {width: 40, height: 40, borderRadius: 20},
	friendName: {marginLeft: 10, fontSize: 16, color: Colors.black},
});

export default AddGroup;
