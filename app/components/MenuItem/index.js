// components/MenuItemContent.js
import React from 'react';
import { View, Text } from 'react-native';
import {menuItemStyles} from "../../styles/Menu";

export const MenuItemContent = ({ icon, text, color = '#000' }) => (
	<View style={menuItemStyles.menuOption}>
		<Text style={menuItemStyles.menuIcon}>{icon}</Text>
		<Text style={[menuItemStyles.menuText, { color }]}>{text}</Text>
	</View>
);
