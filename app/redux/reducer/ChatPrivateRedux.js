const types = {
	LOADING: 'LOADING',
	FETCH_MESSAGES: 'FETCH_MESSAGES',
	ADD_MESSAGE: 'ADD_MESSAGE',
};

export const actions = {
	loading: (dispatch, loading) => dispatch({type: types.LOADING, payload: loading}),
	fetchMessages: (dispatch, messages) => dispatch({type: types.FETCH_MESSAGES, messages}),
	addMessage: (dispatch, message) => dispatch({type: types.ADD_MESSAGE, message}),
}

const initialState = {
	loading: false,
	messages: [],
};

export const reducer = (state = initialState, action) => {
	const {type, payload} = action;

	switch (type) {
		case types.LOADING:
			return {...state, loading: payload};
		case types.FETCH_MESSAGES:
			return {...state, messages: payload};
		case types.ADD_MESSAGE:
			return {...state, messages: [...state.messages, payload]};
		default:
			return state;
	}
};
