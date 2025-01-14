import {StyleSheet} from "react-native";

export const menuStyle = StyleSheet.create({
	menuOption: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 2,
		paddingHorizontal: 10,
	},
	menuIcon: {
		fontSize: 16,
		width: 24,
		marginRight: 12,
	},
	menuText: {
		fontSize: 14,
		fontWeight: '400',
	},
	separator: {
		height: 1,
		backgroundColor: '#E5E5E5',
		marginVertical: 4,
	}
});
export const menuStyles = {
	optionsContainer: {
		backgroundColor: 'white',
		padding: 5,
		borderRadius: 14,
		width: 200,
		shadowColor: "#000",
		shadowOffset: {
			width: 0,
			height: 2,
		},
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
		elevation: 5,
	},
	optionWrapper: {
		margin: 0,
	},
	optionText: {
		textAlign: 'right', // Align text to the right
	},
};
