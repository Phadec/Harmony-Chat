import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Dimensions, TouchableOpacity} from 'react-native';

// Animated, Gesture Handler
import {
	runOnJS,
	useAnimatedStyle,
	useSharedValue,
	withSpring, withTiming, withSequence, withDelay, interpolate
} from "react-native-reanimated";
import {Gesture} from "react-native-gesture-handler";
import {ChatService} from "@/services";

export const useChatMessage = (avatar, message, onSwipe, onLongPress) => {
	const chatService = useRef(new ChatService()).current;


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

	// Xử lý double tap để tim message
	const [isHeartTap, setIsHeartTap] = useState(false);
	const animationHeart = useRef(new Animated.Value(0)).current;
	const isAnimating = useSharedValue(false);

	useEffect(() => {
		if (isHeartTap) {
			Animated.timing(animationHeart, {
				toValue: 1,
				duration: 200,
				useNativeDriver: true,
			}).start(() => {
				isAnimating.current = false;
			});
		} else {
			animationHeart.setValue(0);
			isAnimating.current = false;
		}
	}, [isHeartTap, animationHeart]);

	const heartAnimationStyle = {
		transform: [
			{
				scale: animationHeart.interpolate({
					inputRange: [0, 0.1, 0.8, 1],
					outputRange: [0, 2, 2, 1],
				}),
			},
			{
				translateY: animationHeart.interpolate({
					inputRange: [0, 0.1, 0.8, 1],
					outputRange: [0, -40, -40, 1],
				}),
			},
		]
	};

	const heartCircleAnimation = {
		opacity: animationHeart,
	};

	// Hàm xử lý reactions
	// State để track tin nhắn đang được Double Tap
	const [messageTapId, setMessageTapId] = useState(null);
	const [reactions, setReactions] = useState([]);

	// GỌI đúng 1 lần để setReactions
	useEffect(() => {
		setReactions(
			message.reactions.$values.length > 0
				? message.reactions.$values.map((reaction) => ({
					reactionType: reaction.reactionType,
					userId: reaction.reactedByUser.id,
					fullName: reaction.reactedByUser.fullName,
					avatar: reaction.reactedByUser.avatar
				}))
				: []
		)
	}, [message.reactions.$values]);

	const onAddReaction = useCallback(async (chatId, reactionType) => {
		// Set reactions nếu là reaction của mình thì update lại reaction của mình lúc trước nếu không thì thêm mới
		setReactions((prev) => {
			const newReactions = [...prev]; // Tạo bản sao của mảng cũ

			// Tìm index của reaction hiện tại
			const currentIndex = message.me
				? newReactions.findIndex((reaction) => reaction.userId === message.userId)
				: newReactions.findIndex((reaction) => reaction.userId === message.toUserId);

			if (currentIndex !== -1) {
				// Nếu đã có reaction
				if (newReactions[currentIndex].reactionType === reactionType) {
					return newReactions; // Trả về mảng nếu reaction giống nhau
				}
				// Tạo bản sao mới với reaction đã cập nhật
				return newReactions.map((reaction, i) =>
					i === currentIndex
						? {...reaction, reactionType}
						: reaction
				);
			} else {
				// Thêm reaction mới và trả về mảng mới
				return [...newReactions, {
					reactionType,
					userId: message.me ? message.userId : message.toUserId,
					fullName: message.me ? message.senderFullName : message.senderFullName,
					avatar: message.me ? avatar: undefined,
				}];
			}
		});

		const response = await chatService.addReaction(chatId, reactionType);
		if (!response) {
			// Detach reaction nếu call API thất bại
			setReactions((prev) => {
				const newReactions = [...prev];
				const index = newReactions.findIndex((reaction) =>
					reaction.userId === message.userId
				);
				if (index !== -1) {
					return newReactions.filter((_, i) => i !== index);
				}
				return newReactions;
			});
		}
	}, []);

	const scale = useSharedValue(0);
	const translateY = useSharedValue(0);
	const opacity = useSharedValue(0);
	const startHeartAnimation = () => {
		'worklet';
		scale.value = withSequence(
			withSpring(1.5, {damping: 10}),
			withSpring(1, {damping: 8})
		);

		translateY.value = withSequence(
			withSpring(-60, {damping: 12}),
			withSpring(-30, {damping: 8})
		);

		opacity.value = withSequence(
			withTiming(1, {duration: 200}),
			withTiming(0, {duration: 800})
		);
	};

	const resetAnimation = () => {
		'worklet';
		scale.value = 0;
		translateY.value = 0;
		opacity.value = 0;
		isAnimating.value = false;
	};

	const doubleTapGesture = Gesture.Tap()
		.maxDuration(300)
		.numberOfTaps(2)
		.onStart(() => {
			'worklet';
			if (!isAnimating.value) {
				isAnimating.value = true;
				startHeartAnimation();
				runOnJS(onAddReaction)(message.id, '❤️');

				// Sử dụng withDelay với worklet function
				withDelay(1000, withTiming(0, {
					duration: 0
				}, (finished) => {
					if (finished) {
						resetAnimation();
					}
				}));
			}
		});
	const heartStyle = useAnimatedStyle(() => {
		return {
			position: 'absolute',
			alignSelf: 'center',
			transform: [
				{translateX: interpolate(x.value, [-60, 60], [-60, 60])},
				{translateY: translateY.value},
				{scale: scale.value}
			],
			opacity: opacity.value
		};
	});

	// Race condition giữa Pan và Long Press
	const composedGesture = Gesture.Race(
		panGesture,
		longPressGesture,
		doubleTapGesture);

	return {
		reactions,
		calculatedWidth,
		composedGesture,
		panStyle,
		heartStyle,
		opacity
	};
};

export default useChatMessage;
