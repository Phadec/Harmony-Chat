const types = {
	ADD_GROUP: 'ADD_GROUP', // Thông báo khi nào thì mở bottom sheet tạo nhóm
	REFRESH_GROUPS: 'REFRESH_GROUPS', // Thông báo khi nào thì cần refresh danh sách nhóm
};

export const actions = {
	setAddGroup: (dispatch, status) => dispatch({type: types.ADD_GROUP, isOpenAddGroup: status}),
	refreshGroups: () => ({type: types.REFRESH_GROUPS}),
};

const initialState = {
	isOpenAddGroup: false,
	groups: [],
	needsRefresh: false,
};

export const reducer = (state = initialState, action) => {
	const {type, isOpenAddGroup} = action;

	switch (type) {
		case types.ADD_GROUP:
			return {...state, isOpenAddGroup};
		case types.REFRESH_GROUPS:
			return {...state, needsRefresh: true};
		default:
			return state;
	}
};
