import React from 'react';
import {View, ScrollView} from 'react-native';

// Components
import {Header, SettingItem} from '@/components';

// Layout
import Layout from '@/Layout';

function SecuritySettingsContainer({navigation}) {
	return (
		<Layout>
			<Header title="Security" goBack search navigation={navigation} />

			<View className="flex-1 mb-4 mt-6">
				<ScrollView showsVerticalScrollIndicator={false}>
					<SettingItem title="Last seen and online" value="Nobody" />
					<SettingItem title="Profile picture" value="My contacts" />
					<SettingItem title="About me" value="Everyone" />
					<SettingItem title="Groups" value="My contacts" />
					<SettingItem title="Stories" value="Nobody" />
					<SettingItem title="Calls" value="In silent" />
					<SettingItem title="Blocked" value="7 conversations" />
					<SettingItem title="Read receipt" toggler />
				</ScrollView>
			</View>
		</Layout>
	);
}

export default SecuritySettingsContainer;
