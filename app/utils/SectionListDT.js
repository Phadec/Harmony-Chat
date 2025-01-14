import { format, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import { vi } from 'date-fns/locale';
import moment from "moment-timezone";

export const formatMessages = (messages, recipientId) => {
	const groupedMessages = messages.reduce((groups, message) => {
		if (!message.date) {
			console.warn('Invalid message date:', message);
			return groups;
		}

		const messageDate = moment.utc(message.date).tz('Asia/Ho_Chi_Minh');

		let date;
		if (messageDate.isSame(moment().tz('Asia/Ho_Chi_Minh'), 'day')) {
			date = '1_Today';
		} else if (messageDate.isSame(moment().tz('Asia/Ho_Chi_Minh').subtract(1, 'day'), 'day')) {
			date = '2_Yesterday';
		} else {
			date = '3_' + messageDate.format('DD/MM/YYYY');
		}

		const processedMessage = {
			...message,
			me: message.userId !== recipientId,
			formattedTime: messageDate.format('HH:mm')
		};

		const existingGroup = groups.find(group => group.title === date);
		if (existingGroup) {
			existingGroup.data.push(processedMessage);
		} else {
			groups.push({
				title: date,
				data: [processedMessage]
			});
		}

		return groups;
	}, []);

	// Sort theo prefix
	return groupedMessages
		.sort((a, b) => {
			const prefixA = parseInt(a.title.split('_')[0], 10);
			const prefixB = parseInt(b.title.split('_')[0], 10);
			return prefixA - prefixB;
		})
		.map(group => ({
			...group,
			title: group.title.slice(2).replace('_', '')
		}));
};


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
