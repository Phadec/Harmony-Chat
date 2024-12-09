import React from 'react';
import {View, ScrollView} from 'react-native';

// Components
import {Header, SettingItem} from '@/components';

// Layout
import Layout from '@/Layout';

function StorageSettingsContainer({navigation}) {
	return (
		<Layout>
			<Header title="Storage space" goBack search navigation={navigation} />

			<View className="flex-1 mb-4 mt-6">
				<ScrollView showsVerticalScrollIndicator={false}>
					<SettingItem title="Network usage" />
					<SettingItem title="Use less data for searches" toggler />
					<SettingItem title="Download media automatically" />
					<SettingItem title="Media upload quality" />
				</ScrollView>
			</View>
		</Layout>
	);
}

export default StorageSettingsContainer;
