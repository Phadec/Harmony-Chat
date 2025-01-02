import React, {useState} from 'react';
import {View, Text, Switch} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Components
import {Button} from '@/components';

// Common
import {Colors} from '@/common';

function SettingItem({title, value, toggler, onPress}) {
	const [isEnabled, setIsEnabled] = useState(false);
	const toggleSwitch = () => setIsEnabled(previousState => !previousState);

	return (
		<Button className="flex-row items-center justify-between bg-light rounded-[20px] p-4 mb-3" onPress={() => onPress && onPress()}>
			<Text className="font-rubik text-sm text-black">{title}</Text>

			{toggler ? (
				<View className="-scale-[0.6]">
					<Switch trackColor={Colors.purple} thumbColor={isEnabled ? Colors.white : Colors.purple} ios_backgroundColor={Colors.white} onValueChange={toggleSwitch} value={isEnabled} />
				</View>
			) : (
				<View className="flex-row items-center">
					<Text className="font-rubik text-xs text-black/40 mr-2">{value}</Text>
					<MaterialIcons name="keyboard-arrow-down" size={16} color={Colors.black} />
				</View>
			)}
		</Button>
	);
}

export default SettingItem;
