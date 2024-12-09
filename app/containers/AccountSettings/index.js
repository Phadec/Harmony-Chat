import React from 'react';
import {View, ScrollView} from 'react-native';

// Components
import {Header, SettingItem} from '@/components';

// Layout
import Layout from '@/Layout';

function AccountSettingsContainer({navigation}) {
	return (
		<Layout>
			<Header title="Account" goBack search navigation={navigation} />

			<View className="flex-1 mb-4 mt-6">
				<ScrollView showsVerticalScrollIndicator={false}>
					<SettingItem title="Status" value="Account" />
					<SettingItem title="Phone number" value="+90 555 555 55 55" />
					<SettingItem title="Last seen" value="Nobody" />
					<SettingItem title="Profile photo" value="Nobody" />
					<SettingItem title="About" value="Nobody" />
					<SettingItem title="Groups" value="Nobody" />
				</ScrollView>
			</View>
		</Layout>
	);
}

export default AccountSettingsContainer;
