import {Pressable, Text, View} from "react-native";
import React from "react";

function ContextMenuActions({me, onClose}) {
	const menuItems = [
		{
			id: 'unsend',
			label: 'Unsend',
			icon: '🗑',
			onPress: () => {
				console.log('Unsend');
			},
			textColor: '#E76F51' // Màu đỏ cho Unsend
		},
		{
			id: 'more',
			label: 'More',
			icon: '🗑',
			onPress: () => {
				console.log('More');
			}
		}
	];

	return (
		<View
			style={{backgroundColor: '#f8f8f8'}}
			className={`absolute ${me ? 'right-0' : ''} rounded-xl shadow-lg min-w-[200px] overflow-hidden`}>
			{menuItems.map((item, index) => (
				<Pressable
					key={item.id}
					onPress={() => {
						item.onPress();
						onClose();
					}}
					className={`flex-row items-center justify-between px-4 py-2 active:bg-gray-200
            ${index !== menuItems.length - 1 ? 'border-b border-gray-200' : ''}`}
				>
					<Text
						style={item.textColor ? {color: item.textColor} : null}
						className="text-base font-normal"
					>
						{item.label}
					</Text>
					<Text className="">{item.icon}</Text>
				</Pressable>
			))}
		</View>
	);
}

export default ContextMenuActions;
