const types = {
	ADD_STORY: 'ADD_STORY',
};

export const actions = {
	setAddStory: (dispatch, status) => dispatch({type: types.ADD_STORY, isOpenAddStory: status}),
};

const initialState = {
	isOpenAddStory: false,
};

export const reducer = (state = initialState, action) => {
	const {type, isOpenAddStory} = action;

	switch (type) {
		case types.ADD_STORY:
			return {...state, isOpenAddStory};

		default:
			return state;
	}
};
