import React, {useCallback, useEffect, useRef, useState, useMemo} from 'react';

// Services
import {ChatService} from "@/services";
import {SignalRService} from "../../services/signalR";

// Utils
import {formatMessages} from "../../utils/SectionListDT";


const useChatPrivate = (recipientId) => {
	const [messages, setMessages] = useState([]);
	const [page, setPage] = useState(1);
	const [loading, setLoading] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [isTyping, setIsTyping] = useState(false); // State để hiển thị "Đang nhập..."
	const typingTimeoutRef = useRef(null); // Timeout để dừng hiển thị "Đang nhập..."

	const loadingRef = useRef(false); // Ngăn chặn việc gọi API nhiều lần
	const chatService = useRef(new ChatService());
	const signalR = useRef(SignalRService.getInstance());

	const [isSelf, setIsSelf] = useState(false);
	const [replyTo, setReplyTo] = useState(null);
	const [replyId, setReplyId] = useState(null);
	const [pinnedMessages, setPinnedMessages] = useState([]);


	// Hàm xử lý khi người dùng vuốt tin nhắn để trả lời
	const swipeToReply = useCallback((messageData, me, replyId) => {
		setReplyTo(
			messageData.length > 40 ? `${messageData.slice(0, 40)}...` : messageData
		);
		setIsSelf(me);
		setReplyId(replyId);
	}, []);

	// Đóng reply box
	const closeReplyBox = () => {
		setReplyTo(null);
		setReplyId(null);
	}

	// Gọi API lấy tin nhắn giữa người dùng và người nhận
	const fetchMessages = useCallback(async (pageNumber) => {
		if (loadingRef.current || (!hasMore && pageNumber > 1)) return;

		loadingRef.current = true;
		setLoading(true);

		try {
			const response = await chatService.current.getChats(recipientId, pageNumber, 20);
			const formattedMessages = formatMessages(response.messages.$values, recipientId);

			setMessages(prev =>
				pageNumber === 1 ? formattedMessages : [...prev, ...formattedMessages]
			);

			// Cập nhật trạng thái có thêm tin nhắn hay không
			setHasMore(response.totalPages > pageNumber);
			setPage(pageNumber);

			// Update pinned messages
			const newPinnedMessages = response.messages.$values.filter(msg => msg.isPinned);
			setPinnedMessages(prev => {
				const existingPinnedIds = new Set(prev.map(msg => msg.id));
				const mergedPinnedMessages = [...prev, ...newPinnedMessages.filter(msg => !existingPinnedIds.has(msg.id))];
				return mergedPinnedMessages;
			});
		} catch (error) {
			console.error('Error loading messages:', error);
		} finally {
			setLoading(false);
			loadingRef.current = false;
		}
	}, [recipientId, hasMore]);

	// Gửi tin nhắn
	const sendMessage = useCallback(async (messageText, attachment, replyId) => {
        try {
            console.log('Recipient ID:', recipientId); // Log recipientId

            if (!recipientId) {
                throw new Error('Recipient ID is missing');
            }

            if (attachment && !attachment.uri) {
                throw new Error('Invalid attachment: missing URI');
            }

            console.log('Attempting to send message:', {
                messageText,
                attachment: attachment ? {
                    uri: attachment.uri,
                    type: attachment.type,
                    fileName: attachment.fileName,
                    fileSize: attachment.fileSize
                } : null,
                replyId
            });

            const response = await chatService.current.sendMessage(
                recipientId,
                messageText,
                attachment,
                replyId
            );

            if (!response) {
                throw new Error('No response from server');
            }

            console.log('Message sent successfully:', response);

            // Format and update messages
            const formattedMessage = formatMessages([{
                ...response,
                message: response.message || '',
                attachmentUrl: response.attachmentUrl, // rename to attachmentUrl
                repliedTo: response.repliedToMessage,
                senderName: response.senderFullName,
            }], recipientId)[0];

            setMessages(prev => {
                const existingGroupIndex = prev.findIndex(
                    group => group.title === formattedMessage.title
                );

                if (existingGroupIndex !== -1) {
                    const newMessages = [...prev];
                    newMessages[existingGroupIndex].data.unshift(
                        formattedMessage.data[0]
                    );
                    return newMessages;
                }
                return [formattedMessage, ...prev];
            });

            return true;
        } catch (error) {
            console.error('Error sending message:', error);
            return false;
        }
    }, [recipientId]);

	// tải thêm tin nhắn cũ.
	const handleEndReached = useCallback(() => {
		if (hasMore && !loading) {
			fetchMessages(page + 1);
		}
	}, [hasMore, loading, fetchMessages, page]);

	// Lắng nghe tin nhắn mới từ SignalR
	useEffect(() => {

		// Subscribe để lắng nghe tin nhắn mới
		const subscription = signalR.current.messageReceived$.subscribe((newMessage) => {
			if (
				newMessage &&
				(newMessage.userId === recipientId || newMessage.toUserId === recipientId)
			) {
				const formattedMessage = formatMessages([newMessage], recipientId)[0];

				setMessages((prev) => {
					const existingGroupIndex = prev.findIndex(
						(group) => group.title === formattedMessage.title
					);

					if (existingGroupIndex !== -1) {
						const newMessages = [...prev];
						newMessages[existingGroupIndex].data.unshift(
							formattedMessage.data[0]
						);
						return newMessages;
					}

					return [formattedMessage, ...prev];
				});
			}
		});

		// Unsubscribe khi component bị hủy
		return () => subscription.unsubscribe();
	}, [recipientId]);

	// Lắng nghe sự kiện "Typing Indicator" từ SignalR
	useEffect(() => {
		const handleTyping = (senderId, typing) => {
			if (senderId !== recipientId) return; // Chỉ xử lý nếu người gửi là đối tác chat
			setIsTyping(typing);

			if (typing) {
				// Nếu đối tác đang nhập, đặt timeout để tự động dừng sau 3 giây
				clearTimeout(typingTimeoutRef.current);
				typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
			}
		};

		// Lắng nghe sự kiện "TypingIndicator" và "StopTypingIndicator"
		signalR.current.hubConnection.on("TypingIndicator", handleTyping);
		signalR.current.hubConnection.on("StopTypingIndicator", () => setIsTyping(false));

		return () => {
			signalR.current.hubConnection.off("TypingIndicator", handleTyping);
			signalR.current.hubConnection.off("StopTypingIndicator");
		};
	}, [recipientId]);

	// Gửi sự kiện "typing" và "stop typing" khi người dùng nhập tin nhắn
	const notifyTyping = useCallback(() => {
		signalR.current.hubConnection.invoke("NotifyTyping", recipientId, true);
	}, [recipientId]);

	const notifyStopTyping = useCallback(() => {
		signalR.current.hubConnection.invoke("NotifyTyping", recipientId, false);
	}, [recipientId]);

	// Add delete message function
	const deleteMessage = useCallback(async (messageId) => {
		try {
			console.log('Deleting message with ID:', messageId);
			await chatService.current.deleteMessage(messageId);
			console.log('API delete successful');
			
			setMessages(prevMessages => {
				console.log('Previous messages:', prevMessages);
				
				const updatedMessages = prevMessages.map(section => ({
					...section,
					data: section.data.map(msg => {
						if (msg.id === messageId) {
							console.log('Found message to update:', msg);
							return {
								...msg,
								content: "Message has been deleted",
								message: "Message has been deleted" // Add this in case your structure uses 'message' instead of 'content'
							};
						}
						return msg;
					})
				}));
				
				console.log('Updated messages:', updatedMessages);
				return updatedMessages;
			});
			
			return true;
		} catch (error) {
			console.error('Error deleting message:', error);
			return false;
		}
	}, []);

	const togglePin = useCallback(async (messageId, pinned) => {
		try {
			let result;
			if (pinned) {
				result = await chatService.current.unpinMessage(messageId);
			} else {
				result = await chatService.current.pinMessage(messageId);
			}
			console.log('Pin/Unpin response:', result);

			setMessages(prevMessages =>
				prevMessages.map(section => ({
					...section,
					data: section.data.map(msg =>
						msg.id === messageId
							? { ...msg, isPinned: !pinned }
							: msg
					)
				}))
			);

			setPinnedMessages(prev => {
				if (pinned) {
					return prev.filter(msg => msg.id !== messageId);
				} else {
					const newPinnedMessage = messages.flatMap(section =>
						section.data.filter(msg => msg.id === messageId)
					)[0];
					return [...prev, newPinnedMessage];
				}
			});
		} catch (error) {
			console.error('Error toggling pin:', error);
		}
	}, [messages]);

	return {
		messages,
		loading,
		hasMore,
		page,
		isTyping, // Trạng thái hiển thị "Đang nhập..."
		fetchMessages,
		sendMessage,
		handleEndReached,
		notifyTyping, // Gọi khi người dùng nhập
		notifyStopTyping, // Gọi khi người dùng dừng nhập
		isSelf,
		replyTo,
		replyId,
		swipeToReply,
		closeReplyBox,
		deleteMessage,
		togglePin,
		pinnedMessages,
	};
}

export default useChatPrivate;
