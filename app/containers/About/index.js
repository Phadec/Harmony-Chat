import React from 'react';
import {View, ScrollView} from 'react-native';

// Components
import {Header, SettingItem} from '@/components';

// Layout
import Layout from '@/Layout';

function AboutContainer({navigation}) {
	return (
		<Layout>
			<Header title="About and help" goBack search navigation={navigation} />

			<View className="flex-1 mb-4 mt-6">
				<ScrollView showsVerticalScrollIndicator={false}>
					<SettingItem title="FAQs" onPress={() => navigation.navigate('FAQs')} />
					<SettingItem title="Contact us" />
					<SettingItem title="Terms and Privacy Policy" />
					<SettingItem title="App info" />
				</ScrollView>
			</View>
		</Layout>
	);
}

export default AboutContainer;
