import React from 'react';
import {TouchableOpacity} from 'react-native';
import {styled} from 'nativewind';

const StyledButton = styled(TouchableOpacity);

function Button(props) {
	return (
		<StyledButton activeOpacity={0.5} {...props}>
			{props.children}
		</StyledButton>
	);
}

export default Button;
