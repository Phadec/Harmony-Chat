import React, {useState, useEffect, useRef, useLayoutEffect, useCallback} from 'react';
import {
	View,
	FlatList,
	Image,
	Text,
	TouchableOpacity,
} from 'react-native';
import {useFocusEffect} from "@react-navigation/native";

// Components
import {Header, CustomContextMenu} from '@/components';

// Layout
import Layout from '@/Layout';

// Service
import {SignalRService} from "../../services/signalR";
import {GroupService} from "@/services";

// Hooks
import {useContextMenu} from "@/hooks";

// Constants
import {baseURL} from "../../services/axiosInstance";


const GroupItem = ({group, navigation, index, totalItems}) => {
	const avatarUrl = `${baseURL}/${group.avatar}`;
	const {
		menuRef,
		isSelected,
		setIsSelected,
		handleSelect,
		handlePress,
		handleLongPress,
		getMenuPosition
	} = useContextMenu({
		navigationTarget: 'GroupChat',
		navigationParams: {},
		onSelectCallbacks: {
			// Tùy chỉnh các callback cho message
			mark_read: () => console.log('Custom mark read for message'),
		}
	});

	return (
		<CustomContextMenu
			menuRef={menuRef}
			isSelected={isSelected}
			onClose={() => setIsSelected(false)}
			onSelect={handleSelect}
			menuPosition={getMenuPosition()}>

			{/* Group item (children)*/}
			<TouchableOpacity
				onPress={handlePress}
				onLongPress={handleLongPress}
			>
				<View className={`flex-row items-center rounded-2xl py-2 px-14 mb-3 ${
					isSelected ? 'bg-gray-100' : 'bg-light'
				}`}>
					<View className="relative w-11 h-11 rounded-full">
						<Image
							source={{uri: avatarUrl}}
							className="rounded-full w-10 h-10"
						/>
					</View>
					<View className="ml-3 flex-1">
						<Text className="font-rubik font-medium text-sm text-black leading-5">
							{group.name}
						</Text>
					</View>
				</View>
			</TouchableOpacity>
		</CustomContextMenu>
	);
};

function GroupsContainer({navigation}) {
	const [groups, setGroups] = useState([]);
	const signalRService = SignalRService.getInstance();
	// Tạo một ref để track subscription
	const subscriptionRef = useRef(null);

	const fetchGroupsDetails = async () => {
		try {
			const groupService = new GroupService();
			const groups = await groupService.getGroupDetails();
			if (groups) {
				setGroups(groups.$values);
			}
		} catch (error) {
			console.error('Error fetching groups:', error);
		}
	};

	useEffect(() => {
		let isMounted = true;

		const setupSignalR = async () => {
			try {
				// Ensure connection
				if (signalRService.hubConnection.state !== 'Connected') {
					await signalRService.start();
				}

				// Unsubscribe from previous subscription
				if (subscriptionRef.current) {
					subscriptionRef.current.unsubscribe();
				}

				// Setup new subscription
				subscriptionRef.current = signalRService.groupCreated$.subscribe((data) => {
					console.log("[GroupsContainer] Group notification received:", data);
					if (isMounted) {
						fetchGroupsDetails();
					}
				});

				// Initial fetch
				if (isMounted) {
					await fetchGroupsDetails();
				}
			} catch (error) {
				console.error('Error setting up SignalR:', error);
			}
		};

		setupSignalR();

		// Cleanup
		return () => {
			isMounted = false;
			if (subscriptionRef.current) {
				subscriptionRef.current.unsubscribe();
			}
		};
	}, []);

	// Handle focus events
	useFocusEffect(
		React.useCallback(() => {
			console.log("[GroupsContainer] Screen focused, fetching groups...");
			fetchGroupsDetails();
		}, [])
	);


	return (
		<Layout>
			<Header title="Groups" groups navigation={navigation}/>
			<View className="flex-1 mt-6">
				<FlatList
					data={groups}
					keyExtractor={item => item.id}
					renderItem={({item}) => (
						<GroupItem
							group={item}
							navigation={navigation}
							index={groups.indexOf(item)}
							totalItems={groups.length}
						/>
					)}
					showsVerticalScrollIndicator={false}
				/>
			</View>
		</Layout>
	);
}

export default GroupsContainer;
