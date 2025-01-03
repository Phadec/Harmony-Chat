import {formatInTimeZone} from "date-fns-tz";

export const formatChatDate = (dateInput) => {
	const timeZone = 'Asia/Ho_Chi_Minh';
	const date = new Date(dateInput);
	date.setHours(date.getHours() + 7); // Adjust the date by adding 7 hours

	// Kiểm tra nếu là hôm nay thi chỉ hiển thị giờ, ngược lại hiển thị ngày tháng va giờ
	const today = new Date();
	if (
		date.getDate() === today.getDate()
		&& date.getMonth() === today.getMonth()
		&& date.getFullYear() === today.getFullYear()
	) {
		return formatInTimeZone(date, timeZone, "HH:mm");
	}
	return formatInTimeZone(date, timeZone, "dd/MM HH:mm");
}
