import React, {useCallback, useEffect, useState} from 'react';

// Redux
import {useDispatch, useSelector} from "react-redux";
import {actions as ChatRedux } from "@/redux/reducer/ChatPrivateRedux";

// Services
import {ChatService} from "@/services";
import {formatChatSectionList} from "../../utils/SectionListDT";
import AsyncStorage from "@react-native-async-storage/async-storage";

const useChatPrivate = (socket, recipientId) => {
	const dispatch = useDispatch();
	const {loading, messages} = useSelector(state => state.chatPrivate);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [message, setMessage] = useState('');
	const chatService = new ChatService();

	// Gọi API lấy tin nhắn
	const fetchMessages = useCallback(async (page) => {
		// Nếu đang loading hoặc không còn tin nhắn nào
		if (loading || !hasMore) return;
		ChatRedux.loading(dispatch, true)

		// Gọi API lấy tin nhắn
		try {
			const response = await chatService.getChats(recipientId, page, 20);
			const messages = response.$values;

			// Nếu không còn tin nhắn nào
			if (messages.length === 0) {
				setHasMore(false);
				return;
			}

			// Format tin nhắn theo cấu trúc của SectionList
			const formattedMessages = formatChatSectionList(
				await AsyncStorage.getItem('userId'),
				messages
			)

			// Cập nhật tin nhắn vào store

		}catch (error) {
			console.error('Error fetching messages:', error);
		}
	}, [recipientId, loading, hasMore]);

	useEffect(() => {

	}, [socket]);

	return {
		loading, messages, message, setMessage
	};
}
