import React from 'react';
import {Text, View} from 'react-native';
import {Menu, MenuTrigger, MenuOptions, MenuOption} from 'react-native-popup-menu';
import {menuStyles, menuStyle} from "../../styles/Menu"; // Giả sử bạn đã có component này

const MenuItemContent = ({icon, text, color = '#000'}) => (
	<View style={menuStyle.menuOption}>
		<Text style={menuStyle.menuIcon}>{icon}</Text>
		<Text style={[menuStyle.menuText, {color}]}>{text}</Text>
	</View>
);

const CustomContextMenu = ({
							   menuRef,
							   isSelected,
							   onClose,
							   onSelect,
							   children,
							   menuPosition = {},
							   options = [
								   {value: 'mark_read', icon: '🔄', text: 'Mark as read'},
								   {value: 'mute', icon: '🔕', text: 'Mute'},
								   {value: 'hide', icon: '👁️', text: 'Hide'},
								   {value: 'delete', icon: '🗑️', text: 'Delete', color: 'red'}
							   ]
						   }) => {
	return (
		<Menu
			ref={menuRef}
			onClose={onClose}>
			<MenuTrigger customStyles={{triggerTouchable: {activeOpacity: 1}}}/>

			{children}

			<MenuOptions
				customStyles={{
					...menuStyles,
					optionsContainer: {
						...menuStyles.optionsContainer,
						...menuPosition
					}
				}}>
				{options.map((option, index) => (
					<React.Fragment key={option.value}>
						<MenuOption
							value={option.value}
							onSelect={() => onSelect(option.value)}
						>
							<MenuItemContent
								icon={option.icon}
								text={option.text}
								color={option.color}
							/>
						</MenuOption>
						{/*{index === options.length - 2 && (*/}
						{/*	<View style={menuStyles.separator}/>*/}
						{/*)}*/}
					</React.Fragment>
				))}
			</MenuOptions>
		</Menu>
	);
};

export default CustomContextMenu;
