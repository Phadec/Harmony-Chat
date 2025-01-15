import React, {useState} from 'react';
import {View, Text, Image} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

// icons
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Octicons from 'react-native-vector-icons/Octicons';
import Feather from 'react-native-vector-icons/Feather';
import Fontisto from 'react-native-vector-icons/Fontisto';

// components
import {Button} from '@/components';
import SearchModal from './SearchModal'; // Kiểm tra đường dẫn này

// common
import {Colors} from '@/common';
// route
import {useRoute} from '@react-navigation/native';

// services
import {baseURL} from '../../services/axiosInstance'; // Import baseURL

function HeaderPrivateChat({navigation, messages = [], onScrollToMessage, isGroupChat}) {
	// Set default value
	const insets = useSafeAreaInsets();
	const route = useRoute();
	const item = isGroupChat ? route.params : route.params?.item;
	const avatarUrl = isGroupChat ? item?.avatar?.uri: `${baseURL}/${item?.avatar}`; // Correct avatarUrl
	const [searchVisible, setSearchVisible] = useState(false);

	console.log('HeaderPrivateChat:', route);

	const handleMessagePress = message => {
		if (message && message.id) {
			onScrollToMessage(message.id);
		}
	};

	const processMessagesForSearch = () => {
		try {
			// Kiểm tra messages
			if (!Array.isArray(messages)) {
				console.log('Messages is not an array:', messages);
				return [];
			}

			// Debug log
			console.log('Processing messages:', messages);

			const flattened = messages.reduce((acc, section) => {
				if (!section?.data) return acc;
				return [
					...acc,
					...section.data.map(msg => ({
						...msg,
						sectionDate: section.title || 'Unknown Date',
						opponentAvatar: avatarUrl, // Add this line
					})),
				];
			}, []);

			console.log('Flattened messages:', flattened);
			return flattened;
		} catch (error) {
			console.error('Error in processMessagesForSearch:', error);
			return [];
		}
	};

	const handleCallPress = () => {
		navigation.navigate('Calling', {
			caller: {
				fullName: item?.contactFullName,
				avatar: avatarUrl,
				status: item?.status,
				userId: item?.userId,
				recipientId: route.params?.recipientId, // Thêm recipientId
			},
		});
	};

	const countMembers = item?.members?.length || 0;

	return (
		<View className={`bg-main flex-row items-center p-6 ${isGroupChat ? 'rounded-b-3xl' : ''}`} style={{ paddingTop: insets.top + 16 }}>
		  <Button onPress={() => navigation.goBack()}>
			<MaterialIcons name="arrow-back-ios" size={20} color={Colors.white} />
		  </Button>
	  
		  <View className="flex-row items-center ml-2">
			<View className="w-12 h-12 relative">
			  <Image source={{ uri: avatarUrl }} className="w-12 h-12 rounded-full" />
			  {!isGroupChat && (
				<View className={`w-4 h-4 rounded-full ${item?.status ? 'bg-green' : 'bg-gray'} border-[3px] border-main absolute top-0 left-0`} />
			  )}
			</View>
	  
			<View className="ml-3">
			  <Text className="font-rubik font-medium text-sm text-white">
				{isGroupChat ? item?.nameGroup : item?.contactFullName}
			  </Text>
			  <View className="flex-row items-center">
				{isGroupChat ? (
				  <>
					<Feather name="users" size={12} />
					<Text className="mt-1 font-rubik text-xs text-white/40 ml-2">{countMembers} members</Text>
				  </>
				) : (
				  <Text className="mt-1 font-rubik text-xs text-white/40">{item?.status ? 'Online' : 'Offline'}</Text>
				)}
			  </View>
			</View>
		  </View>
	  
		  <View className="flex-row items-center ml-auto">
			{!isGroupChat && (
			  <>
				<Button onPress={() => setSearchVisible(true)}>
				  <Octicons name="search" size={16} color={Colors.white} />
				</Button>
				<Button className="mx-5" onPress={handleCallPress}>
				  <Feather name="phone-call" size={16} color={Colors.white} />
				</Button>
			  </>
			)}
			<Button>
			  <Fontisto name="more-v-a" size={16} color={Colors.white} />
			</Button>
		  </View>
	  
		  {!isGroupChat && (
			<SearchModal
			  visible={searchVisible}
			  onClose={() => setSearchVisible(false)}
			  messages={processMessagesForSearch()}
			  onMessagePress={handleMessagePress}
			  currentUserAvatar={item?.avatar}
			  opponentAvatar={avatarUrl}
			/>
		  )}
		</View>
	  );
}

export default HeaderPrivateChat;
