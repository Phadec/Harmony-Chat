import React from 'react';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';

// Components
import {Colors, Constants} from '@/common';

function TabBarIcon({name, focused}) {
	if (name === 'Messages') return <FontAwesome name="comments-o" size={24} color={focused ? Colors.white : Constants.HexToRgba(Colors.white, 0.4)} />;
	if (name === 'Stories') return <MaterialIcons name="history-toggle-off" size={24} color={focused ? Colors.white : Constants.HexToRgba(Colors.white, 0.4)} />;
	if (name === 'Groups') return <Feather name="users" size={24} color={focused ? Colors.white : Constants.HexToRgba(Colors.white, 0.4)} />;
	if (name === 'Settings') return <Feather name="settings" size={24} color={focused ? Colors.white : Constants.HexToRgba(Colors.white, 0.4)} />;
	if (name === 'Calls') return <Feather name="phone-call" size={24} color={focused ? Colors.white : Constants.HexToRgba(Colors.white, 0.4)} />;
}

export default TabBarIcon;
