const types = {
	DRAWER_OPENED: 'DRAWER_OPENED',
};

export const actions = {
	setDrawerStatus: (dispatch, status) => dispatch({type: types.DRAWER_OPENED, isDrawerOpened: status}),
};

const initialState = {
	isDrawerOpened: false,
};

export const reducer = (state = initialState, action) => {
	const {type, isDrawerOpened} = action;

	switch (type) {
		case types.DRAWER_OPENED:
			return {...state, isDrawerOpened};

		default:
			return state;
	}
};
