import { format, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import { vi } from 'date-fns/locale';

export const formatChatSectionList = (hostID, messages) => {

	// Nhóm tin nhắn theo ngày
	const groupedMessages = messages.reduce((acc, message) => {
		const messageDate = new Date(message.date);
		const dateKey = format(messageDate, 'yyyy-MM-dd');

		if (!acc[dateKey]) {
			acc[dateKey] = [];
		}
		acc[dateKey].push(message);
		return acc;
	}, {});

	// Format tiêu đề section và sắp xếp theo thời gian
	const sections = Object.entries(groupedMessages).map(([date, messages]) => {
		const messageDate = new Date(date);
		let title = '';

		if (isToday(messageDate)) {
			title = 'Hôm nay';
		} else if (isYesterday(messageDate)) {
			title = 'Hôm qua';
		} else if (isThisWeek(messageDate)) {
			title = format(messageDate, 'EEEE', { locale: vi }); // Thứ trong tuần
		} else if (isThisMonth(messageDate)) {
			title = format(messageDate, 'dd MMMM', { locale: vi });
		} else {
			title = format(messageDate, 'dd/MM/yyyy', { locale: vi });
		}

		return {
			title,
			data: messages.map(msg => ({
				id: msg.id,
				message: msg.message,
				me: msg.userId === hostID, // Xác định "me"
				time: format(new Date(msg.date), 'HH:mm'),
				isRead: msg.isRead,
				isDeleted: msg.isDeleted,
				isPinned: msg.isPinned,
				reactions: msg.reactions.$values,
				attachmentUrl: msg.attachmentUrl,
				senderName: msg.senderFullName,
				repliedToMessage: msg.repliedToMessage
			}))
		};
	});

	// Sắp xếp sections theo thời gian mới nhất
	return sections.sort((a, b) => {
		const dateA = new Date(a.data[0].date);
		const dateB = new Date(b.data[0].date);
		return dateB - dateA;
	});
};
