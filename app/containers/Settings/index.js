import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

// Components
import { Header, Button } from '@/components';

// Common
import { Colors } from '@/common';

// Layout
import Layout from '@/Layout';

function SettingsContainer({ navigation }) {
	return (
		<Layout>
			<Header title="Settings" search navigation={navigation} />

			<View className="bg-light rounded-3xl px-4 mb-4 mt-6">
				<ScrollView showsVerticalScrollIndicator={false}>
					<Button className="flex-row items-center py-6" onPress={() => navigation.navigate('BlockedUsers')}>
						<MaterialCommunityIcons name="block-helper" size={20} color={Colors.purple} />
						<Text className="font-rubik font-medium text-sm text-black ml-2">Blocked users</Text>
					</Button>

					<Button className="flex-row items-center py-6 border-b-[1px] border-purple/10" onPress={() => navigation.navigate('AccountSettings')}>
						<MaterialCommunityIcons name="account-box-outline" size={20} color={Colors.purple} />
						<Text className="font-rubik font-medium text-sm text-black ml-2">Account</Text>
					</Button>

					<Button className="flex-row items-center py-6 border-b-[1px] border-purple/10" onPress={() => navigation.navigate('SecuritySettings')}>
						<MaterialCommunityIcons name="security" size={20} color={Colors.purple} />
						<Text className="font-rubik font-medium text-sm text-black ml-2">Security</Text>
					</Button>

					<Button className="flex-row items-center py-6 border-b-[1px] border-purple/10" onPress={() => navigation.navigate('About')}>
						<MaterialIcons name="question-mark" size={20} color={Colors.purple} />
						<Text className="font-rubik font-medium text-sm text-black ml-2">About and help</Text>
					</Button>

					<Button className="flex-row items-center py-6 border-b-[1px] border-purple/10" onPress={() => navigation.navigate('InviteFriends')}>
						<MaterialCommunityIcons name="account-group" size={20} color={Colors.purple} />
						<Text className="font-rubik font-medium text-sm text-black ml-2">Invite friends</Text>
					</Button>

					<Button className="flex-row items-center py-6" onPress={() => navigation.navigate('StorageSettings')}>
						<MaterialCommunityIcons name="database-sync" size={20} color={Colors.purple} />
						<Text className="font-rubik font-medium text-sm text-black ml-2">Storage space</Text>
					</Button>

					<Button className="flex-row items-center py-6">
						<MaterialIcons name="logout" size={20} color={Colors.purple} />
						<Text className="font-rubik font-medium text-sm text-black ml-2">Log Out</Text>
					</Button>
				</ScrollView>
			</View>
		</Layout>
	);
}

export default SettingsContainer;
