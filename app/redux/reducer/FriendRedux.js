// FriendRedux.js

// Action Types
export const FETCH_FRIENDS_START = 'FETCH_FRIENDS_START';
export const FETCH_FRIENDS_SUCCESS = 'FETCH_FRIENDS_SUCCESS';
export const FETCH_FRIENDS_FAILURE = 'FETCH_FRIENDS_FAILURE';
export const UPDATE_FRIEND = 'UPDATE_FRIEND';
export const REMOVE_FRIEND = 'REMOVE_FRIEND';

const initialState = {
	friends: [],
	error: null,
}

// Reducer
export const reducer = (state = initialState, action) => {
	// Các action sẽ được xử lý ở đây
	switch (action.type) {
		case FETCH_FRIENDS_START:
			return {...state, error: null,};
		case FETCH_FRIENDS_SUCCESS:
			return {...state, friends: action.payload,};
		case FETCH_FRIENDS_FAILURE:
			return {...state, error: action.payload,};
		case UPDATE_FRIEND:
			return {
				...state,
				friends: state.friends.map((friend) =>
					friend.id === action.payload.id ? {...friend, ...action.payload} : friend
				),
			};
		case REMOVE_FRIEND:
			return {
				...state,
				friends: state.friends.filter((friend) => friend.id !== action.payload),
			};
		default:
			return state;
	}
}

// Action Creators
// Tín hiệu động lấy danh sách bạn bè
export const fetchFriendsStart = () => ({type: FETCH_FRIENDS_START});
// Lấy danh sách bạn bè nếu thành công
export const fetchFriendsSuccess = (friends) => ({
	type: FETCH_FRIENDS_SUCCESS, payload: friends
});
// Lỗi khi lấy danh sách bạn bè thì thông báo
export const fetchFriendsFailure = (error) => ({
	type: FETCH_FRIENDS_FAILURE,
	payload: error,
});
// Cập nhật bạn bè khi có thay đổi
export const updateFriend = (friend) => ({
	type: UPDATE_FRIEND,
	payload: friend,
});
// Xóa bạn bè
export const removeFriend = (id) => ({type: REMOVE_FRIEND, payload: id});
// Lấy danh sách bạn bè từ server
export const fetchFriends = (friendService) => async (dispatch) => {
	dispatch(fetchFriendsStart());
	try {
		const response = await friendService.getFriends();
		dispatch(fetchFriendsSuccess(response.$values || []));
	} catch (err) {
		dispatch(fetchFriendsFailure(err.message));
	}
};


