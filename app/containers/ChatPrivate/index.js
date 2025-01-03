import React, {useEffect, useState} from 'react';
import {View, SectionList, Text} from 'react-native';
import {BlurView} from '@react-native-community/blur';
import {useSharedValue, useAnimatedStyle, withTiming} from 'react-native-reanimated';

// Components
import {HeaderPrivateChat, ChatMessage, ChatInput, Dropup} from '@/components';

const messages = [
	{
		title: 'Today',
		data: [
			{id: 1, message: 'Lorem ', me: true},
			{id: 2, message: 'Lorem ipsum dolor sit amet, conse adipiscing elit, sed do eiusmod tempor incididunt ut labore. sed do eiusmod', me: true},
			{id: 3, message: 'Lorem ipsum dolor sit amet, conse.'},
			{id: 4, message: 'Lorem ipsum dolor sit amet, conse adipiscing elit, sed do eiusmod tempor incididunt ut labore. sed do eiusmod', me: true},
			{id: 5, message: 'Lorem ipsum dolor sit amet, conse.'},
			{id: 6, message: 'Lorem ipsum dolor sit amet, conse adipiscing elit, sed do eiusmod tempor incididunt ut labore. sed do eiusmod'},
			{id: 7, message: 'Lorem ipsum dolor sit amet, conse.', me: true},
			{id: 8, message: 'Lorem ipsum dolor sit amet, conse adipiscing elit, sed do eiusmod tempor incididunt ut labore. sed do eiusmod', me: true},
			{id: 9, message: 'Lorem ipsum dolor sit amet, conse.'},
			{id: 10, message: 'Lorem ipsum dolor sit amet, conse adipiscing elit, sed do eiusmod tempor incididunt ut labore. sed do eiusmod', me: true},
			{id: 11, message: 'Lorem ipsum dolor sit amet, conse.'},
			{id: 12, message: 'Lorem ipsum dolor sit amet, conse adipiscing elit, sed do eiusmod tempor incididunt ut labore. sed do eiusmod'},
		],
	},
	{
		title: 'Yesterday',
		data: [
			{id: 1, message: 'Lorem ipsum dolor sit amet, conse.', me: true},
			{id: 2, message: 'Lorem ipsum dolor sit amet, conse adipiscing elit, sed do eiusmod tempor incididunt ut labore. sed do eiusmod', me: true},
			{id: 3, message: 'Lorem ipsum dolor sit amet, conse.'},
			{id: 4, message: 'Lorem ipsum dolor sit amet, conse adipiscing elit, sed do eiusmod tempor incididunt ut labore. sed do eiusmod', me: true},
			{id: 5, message: 'Lorem ipsum dolor sit amet, conse.'},
			{id: 6, message: 'Lorem ipsum dolor sit amet, conse adipiscing elit, sed do eiusmod tempor incididunt ut labore. sed do eiusmod'},
			{id: 7, message: 'Lorem ipsum dolor sit amet, conse.', me: true},
			{id: 8, message: 'Lorem ipsum dolor sit amet, conse adipiscing elit, sed do eiusmod tempor incididunt ut labore. sed do eiusmod', me: true},
			{id: 9, message: 'Lorem ipsum dolor sit amet, conse.'},
			{id: 10, message: 'Lorem ipsum dolor sit amet, conse adipiscing elit, sed do eiusmod tempor incididunt ut labore. sed do eiusmod', me: true},
			{id: 11, message: 'Lorem ipsum dolor sit amet, conse.'},
			{id: 12, message: 'Lorem ipsum dolor sit amet, conse adipiscing elit, sed do eiusmod tempor incididunt ut labore. sed do eiusmod'},
		],
	},
];

function ChatPrivateContainer({navigation}) {
	const [opened, setOpen] = useState(false);
	const opacity = useSharedValue(0);
	const transform = useSharedValue(30);


	const animation = useAnimatedStyle(() => {
		return {
			opacity: opacity.value,
			transform: [{translateY: transform.value}],
		};
	});

	useEffect(() => {
		if (opened) {
			opacity.value = withTiming(1);
			transform.value = withTiming(0);
		} else {
			opacity.value = 0;
			transform.value = 30;
		}
	}, [opened]);

	return (
		<View className="flex-1 bg-white relative">
			{opened && (
				<BlurView
					style={{position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, flex: 1, zIndex: 10,}}
					blurType="dark"
					blurAmount={8}
					reducedTransparencyFallbackColor="black"
				/>
			)}

			<HeaderPrivateChat navigation={navigation} />

			<View className="px-5 flex-1">
				<SectionList
					sections={messages}
					keyExtractor={(item, index) => item + index}
					renderItem={({item}) => <ChatMessage {...item} />}
					renderSectionHeader={({section: {title}}) => (
						<View className="bg-main rounded-full py-2 px-4 mx-auto z-50 my-4">
							<Text className="font-rubik text-2xs text-white">{title}</Text>
						</View>
					)}
					showsVerticalScrollIndicator={false}
					className="-mr-6"
					inverted
				/>

				<ChatInput setOpen={setOpen} />
			</View>

			{/*<Dropup animation={animation} opened={opened} setOpen={setOpen} />*/}
		</View>
	);
}

export default ChatPrivateContainer;
