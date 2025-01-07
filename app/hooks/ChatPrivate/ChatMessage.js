import React, {useCallback, useMemo, useRef} from 'react';
import {Dimensions, TouchableOpacity} from 'react-native';

// Animated, Gesture Handler
import {
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withSpring, withTiming,
} from "react-native-reanimated";
import {Gesture} from "react-native-gesture-handler";

export const useChatMessage = (message, onSwipe, onLongPress, onCloseActions) => {
	// Calculate dynamic width
	const {width} = Dimensions.get('window');
	const maxWidth = width * 0.6;

	const calculatedWidth = useMemo(() => {
		return Math.min(maxWidth, message.message.length * 8 + 30);
	}, [message.message.length, maxWidth]);


	// Lưu vị trí và kích thước của message
	const messageRef = useRef(null);

	// Refactor lại cho Fling Gesture Handler (Vuốt)
	const x = useSharedValue(0);
	const offset = useSharedValue({x: 0, y: 0});
	const popupPosition = useSharedValue({x: 0, y: 0});
	const popupAlpha = useSharedValue(0);

	const panGesture = Gesture.Pan()
		.failOffsetY([-1, 1]) // Thêm ngưỡng fail cho vuốt dọc
		.activeOffsetX(message.me ? [-5, -5] : [5, 5]) // Thêm để tối ưu việc nhận diện hướng vuốt
		.onStart((_e) => {
			x.value = withTiming(0);
		})
		.onUpdate((event) => {
			// Kiểm tra xem đây có phải là vuốt dọc không
			const isVerticalSwipe = Math.abs(event.translationY) > Math.abs(event.translationX);

			// Nếu là vuốt dọc, bỏ qua gesture
			if (isVerticalSwipe) {
				return;
			}

			// Giới hạn khoảng cách vuốt
			const maxSwipe = 80;
			// Hướng vuốt
			const direction = message.me ? -1 : 1;

			// Kiểm tra hướng vuốt trái phải
			if ((message.me && event.translationX > 0) || (!message.me && event.translationX < 0)) {
				// Nếu là tin nhắn của mình và vuốt phải -> không cho phép
				// Nếu là tin nhắn người khác và vuốt trái -> không cho phép
				return;
			}

			// Cập nhật giá trị animation chỉ khi vuốt đúng hướng
			x.value = Math.min(Math.abs(event.translationX), maxSwipe) * direction;
		})
		.onEnd(() => {
			// Kiểm tra ngưỡng để gọi onSwipe
			const threshold = 40; // Ngưỡng để trigger action

			if (Math.abs(x.value) > threshold) {
				// Gọi callback và truyền các tham số vào hàm onSwipe để reply tin nhắn
				runOnJS(onSwipe)(message.message, message.me, message.id);
			}
			// Animation trở về vị trí ban đầu
			x.value = withSpring(0, {
				damping: 15,
				stiffness: 150
			});
		});

	const panStyle = useAnimatedStyle(() => {
		return {
			transform: [{translateX: x.value}]
		}
	})

	// Tạo cử chỉ Long Press Gesture Handler
	const longPressGesture = Gesture.LongPress()
		.minDuration(500)
		.onStart((event) => {
			// Truyền cả message và vị trí về cho component cha
			// để hiển thị context menu action và reaction emojis
			runOnJS(onLongPress)(message, event);
		})
	;

	// Xử lý tap outside để đóng menu
	const tapGesture = Gesture.Tap()
		.onEnd(() => {
			runOnJS(onCloseActions);
		});

	// Race condition giữa Pan và Long Press
	const composedGesture = Gesture.Race(panGesture, longPressGesture, tapGesture);

	return {
		calculatedWidth,
		composedGesture,
		panStyle,
	};
};

export default useChatMessage;
