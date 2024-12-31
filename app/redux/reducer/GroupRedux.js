const types = {
	ADD_GROUP: 'ADD_GROUP',
};

export const actions = {
	setAddGroup: (dispatch, status) => dispatch({type: types.ADD_GROUP, isOpenAddGroup: status}),
};

const initialState = {
	isOpenAddStory: false,
};

export const reducer = (state = initialState, action) => {
	const {type, isOpenAddGroup} = action;

	switch (type) {
		case types.ADD_GROUP:
			return {...state, isOpenAddGroup};
		default:
			return state;
	}
};
