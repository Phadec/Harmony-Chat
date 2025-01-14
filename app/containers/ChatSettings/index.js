import React from 'react';
import {View, ScrollView} from 'react-native';

// Components
import {Header, SettingItem} from '@/components';

// Layout
import Layout from '@/Layout';

function ChatSettingsContainer({navigation}) {
	return (
		<Layout>
			<Header title="Chat" goBack search navigation={navigation} />

			<View className="flex-1 mb-4 mt-6">
				<ScrollView showsVerticalScrollIndicator={false}>
					<SettingItem title="Media visibility" toggler />
					<SettingItem title="Font size" value="Small" />
					<SettingItem title="App langauge" value="English" />
					<SettingItem title="Chat background" value="Standard" />
				</ScrollView>
			</View>
		</Layout>
	);
}

export default ChatSettingsContainer;
