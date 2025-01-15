// ChatListRedux.js

// Action Types
export const FETCH_CHAT_LIST_START = 'FETCH_CHAT_LIST_START';
export const FETCH_CHAT_LIST_SUCCESS = 'FETCH_CHAT_LIST_SUCCESS';
export const FETCH_CHAT_LIST_FAILURE = 'FETCH_CHAT_LIST_FAILURE';
export const UPDATE_CHAT = 'UPDATE_CHAT';
export const REMOVE_CHAT = 'REMOVE_CHAT';

const initialState = {
    chatList: [],
    error: null,
}

// Reducer
export const reducer = (state = initialState, action) => {
    console.log('Action received in reducer:', action);
    switch (action.type) {
        case FETCH_CHAT_LIST_START:
            return { ...state, error: null };
        case FETCH_CHAT_LIST_SUCCESS:
            console.log('Fetched chat list:', action.payload);
            return { ...state, chatList: action.payload };
        case FETCH_CHAT_LIST_FAILURE:
            return { ...state, error: action.payload };
        case UPDATE_CHAT:
            console.log('Previous state:', state.chatList);
            const updatedChatList = state.chatList.map((chat) =>
                chat.chatId === action.payload.chatId ? { ...chat, ...action.payload } : chat
            );
            console.log('Updated state:', updatedChatList);
            return {
                ...state,
                chatList: updatedChatList,
            };
        case REMOVE_CHAT:
            return {
                ...state,
                chatList: state.chatList.filter((chat) => chat.chatId !== action.payload),
            };
        default:
            return state;
    }
}

// Action Creators
export const fetchChatListStart = () => ({ type: FETCH_CHAT_LIST_START });
export const fetchChatListSuccess = (chatList) => ({
    type: FETCH_CHAT_LIST_SUCCESS, payload: chatList
});
export const fetchChatListFailure = (error) => ({
    type: FETCH_CHAT_LIST_FAILURE,
    payload: error,
});
export const updateChatList = (chat) => ({
    type: UPDATE_CHAT,
    payload: chat,
});
export const removeChat = (id) => ({ type: REMOVE_CHAT, payload: id });

// Lấy danh sách chat từ server
export const fetchChatList = (chatService) => async (dispatch) => {
    dispatch(fetchChatListStart());
    try {
        const response = await chatService.getRelationships();
        dispatch(fetchChatListSuccess(response.$values || []));
    } catch (err) {
        dispatch(fetchChatListFailure(err.message));
    }
};
