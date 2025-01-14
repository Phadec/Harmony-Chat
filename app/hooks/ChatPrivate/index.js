import React, {useCallback, useEffect, useRef, useState} from 'react';
import { useAuth } from '../../contexts/AuthContext'; // Fix the import path

// Services
import {ChatService} from "@/services";
import {SignalRService} from "../../services/signalR";

// Utils
import {formatMessages} from "../../utils/SectionListDT";


const useChatPrivate = (recipientId) => {
	const { user } = useAuth(); // Get current user
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
	const swipeToReply = useCallback((messageData, me, messageId) => {
        console.log('SwipeToReply:', { messageData, me, messageId });
        setReplyTo(messageData);
        setIsSelf(me);
        setReplyId(messageId); // Đảm bảo messageId được truyền đúng
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

	// Sửa lại hàm sendMessage để xử lý reply
    const sendMessage = useCallback(async (messageText, replyToId = null) => {
        try {
            console.log('Sending message:', {
                messageText,
                replyToId,
                recipientId
            });

            if (!messageText?.trim()) {
                console.error('Empty message');
                return false;
            }

            const response = await chatService.current.sendMessage(
                recipientId,
                messageText.trim(),
                null,
                replyToId // Đảm bảo truyền replyToId
            );

            console.log('Send response:', response);

            if (response) {
                // Cập nhật messages với thông tin reply
                setMessages(prev => {
                    const formattedMessage = formatMessages([{
                        ...response,
                        message: messageText.trim(),
                        repliedToMessage: response.repliedToMessage, // Lấy từ response
                        repliedToId: replyToId
                    }], recipientId)[0];

                    const existingGroupIndex = prev.findIndex(
                        group => group.title === formattedMessage.title
                    );

                    if (existingGroupIndex !== -1) {
                        const newMessages = [...prev];
                        newMessages[existingGroupIndex].data.unshift(formattedMessage.data[0]);
                        return newMessages;
                    }
                    return [formattedMessage, ...prev];
                });

                return true;
            }

            return false;
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

	const handleReactionAdded = useCallback((messageId, newReaction) => {
    console.log('handleReactionAdded:', { messageId, newReaction });
    
    setMessages(prevMessages => 
        prevMessages.map(section => ({
            ...section,
            data: section.data.map(msg => {
                if (msg.id === messageId) {
                    if (!newReaction) {
                        // If reaction is null, remove all reactions
                        return {
                            ...msg,
                            reactions: { $values: [] }
                        };
                    }
                    
                    // Initialize reactions if they don't exist
                    const currentReactions = msg.reactions?.$values || [];
                    
                    // Remove old reaction from same user if exists
                    const filteredReactions = currentReactions.filter(
                        r => r?.reactedByUser?.id !== user?.id
                    );
                    
                    return {
                        ...msg,
                        reactions: {
                            $values: [...filteredReactions, newReaction].filter(Boolean)
                        }
                    };
                }
                return msg;
            })
        }))
    );
}, [user?.id]);

	return {
		messages: messages || [], // Ensure messages is always an array
		currentUserId: user?.id, // Add currentUserId to return object
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
		handleReactionAdded,
	};
}

export default useChatPrivate;
