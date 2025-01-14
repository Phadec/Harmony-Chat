const types = {
	OPEN_ADD_GROUP: 'OPEN_ADD_GROUP', // Thông báo khi nào thì mở bottom sheet tạo nhóm
	GET_GROUPS: 'GET_GROUPS', // Lấy danh sách nhóm
	ADD_GROUP: 'ADD_GROUP', // Thêm nhóm mới
	DELETE_GROUP: 'DELETE', // Xóa nhóm
	MUTE_GROUP: 'MUTE_GROUP', // Cập nhật thông tin nhóm
};

export const actions = {
	setOpenAddGroup: (dispatch, status) => dispatch({type: types.OPEN_ADD_GROUP, payload: status}),
	// Lấy danh sách nhóm từ server
	fetchGroups: async (dispatch, groupService) => {
		try {
			const response = await groupService.getGroupDetails();
			console.log('fetchGroups:', response);
			if (response) {
				dispatch({type: types.GET_GROUPS, payload: response.$values});
			}
		} catch (error) {
			console.error('Error fetching groups:', error);
		}
	},
	// Thêm nhóm mới vào danh sách
	addGroup: (dispatch, group) => dispatch({type: types.ADD_GROUP, payload: group}),
	// Tắt thông báo nhóm
	muteGroup: async (dispatch, groupService, groupId) => {
		try {
			const response = await groupService.muteGroupNotification(groupId);
			if (response) {
				// Cập nhật thông tin nhóm trong store
				dispatch({type: types.MUTE_GROUP, payload: groupId});
				console.log('Mute notification successfully');
			}
		} catch (error) {
			console.error('Error muting chat:', error);
		}
	},
	// Xóa nhóm
	deleteGroup: async (dispatch, groupService, groupId) => {
		try {
			const response = await groupService.deleteGroup(groupId);
			if (response) {
				// Xóa nhóm khỏi store
				dispatch({type: types.DELETE_GROUP, payload: groupId});
				console.log('Delete group successfully');
			}
		} catch (error) {
			console.error('Error deleting group:', error);
		}
	}
};

const initialState = {
	isOpenAddGroup: false,
	groups: [],
};

export const reducer = (state = initialState, action) => {
	const {type, payload} = action;
	switch (type) {
		case types.OPEN_ADD_GROUP:
			return {...state, isOpenAddGroup: payload};
		case types.GET_GROUPS:
			return {...state, groups: payload};
		case types.ADD_GROUP:
			return {...state, groups: [...state.groups, payload]};
		case types.MUTE_GROUP:
			return {
				...state,
				groups: state.groups.map(group => {
					if (group.id === payload) {
						group.notificationsMuted = !group.notificationsMuted;
					}
					return group;
				})
			};
		case types.DELETE_GROUP:
			return {
				...state,
				groups: state.groups.filter(group => group.id !== payload)
			};
		default:
			return state;
	}
};
