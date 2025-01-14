import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, TouchableOpacity, useWindowDimensions, Animated, Image} from 'react-native';
import {RTCView} from "react-native-webrtc";
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {Button} from '@/components';
import {Colors} from '@/common';
import {CallManager} from "../../services/Call";
import {baseURL} from "../../services/axiosInstance";

function CallingContainer({navigation, route}) {
	// State management
	const [callDuration, setCallDuration] = useState(0);
	const [friend] = useState(route.params?.friend);

	const avatar = {uri: `${baseURL}/${friend.avatar}`};
	const [isMuted, setIsMuted] = useState(false);
	const [isVideoEnabled, setIsVideoEnabled] = useState(true);
	const [showControls, setShowControls] = useState(true);

	// Animation cho việc ẩn/hiện controls
	const fadeAnim = React.useRef(new Animated.Value(1)).current;

	const callManager = CallManager.getInstance();
	const {width, height} = useWindowDimensions();

	// Timer để tự động ẩn controls sau 5 giây
	useEffect(() => {
		let timer;
		if (showControls && callManager.isInCall) {
			timer = setTimeout(() => {
				fadeOut();
			}, 5000);
		}
		return () => clearTimeout(timer);
	}, [showControls]);

	// Animation ẩn controls
	const fadeOut = () => {
		setShowControls(false);
		Animated.timing(fadeAnim, {
			toValue: 0,
			duration: 300,
			useNativeDriver: true,
		}).start();
	};

	// Animation hiện controls
	const fadeIn = () => {
		setShowControls(true);
		Animated.timing(fadeAnim, {
			toValue: 1,
			duration: 300,
			useNativeDriver: true,
		}).start();
	};

	// Thêm useEffect để theo dõi trạng thái cuộc gọi
	useEffect(() => {
		console.log('Call State:', callManager.isCalling); // Debug log
		if (callManager.isCalling) {
			setShowControls(true);
			fadeIn();
		}
	}, [callManager.isCalling]);

	// Xử lý khi chạm vào màn hình
	const handleScreenPress = () => {
		if (callManager.isInCall) {
			showControls ? fadeOut() : fadeIn();
		}
	};

	// Các hàm xử lý cuộc gọi
	const handleAcceptCall = useCallback(async () => {
		await callManager.acceptCall();
	}, []);

	const handleEndCall = useCallback(async () => {
		await callManager.endCall();
		navigation.goBack();
	}, [navigation]);

	// Toggle mute stream
	const handleToggleMute = useCallback(async () => {
		const localStream = callManager.localStream.getValue();
		if (!localStream) return;

		const audioTracks = localStream.getAudioTracks();
		if (!audioTracks) return;
		audioTracks.forEach(track => {
			track.enabled = !track.enabled;
		});
		setIsMuted(!isMuted);
	}, [isMuted]);

	// Toggle video stream
	const handleToggleVideo = useCallback(async () => {
		const localStream = callManager.localStream.getValue();
		if (!localStream) return;

		const videoTracks = localStream.getVideoTracks();
		if (!videoTracks) return;
		videoTracks.forEach(track => {
			track.enabled = !track.enabled;
		});
		setIsVideoEnabled(!isVideoEnabled);
	}, [isVideoEnabled]);

	return (
		<TouchableOpacity
			activeOpacity={1}
			onPress={handleScreenPress}
			className="flex-1 bg-black"
		>
			{/* Main video stream - Video của người được gọi khi đã kết nối */}
			{callManager.isInCall && (
				<RTCView
					streamURL={callManager.remoteStream.getValue()?.toURL()}
					className="absolute top-0 left-0 right-0 bottom-0"
					objectFit="cover"
				/>
			)}

			{/* Local video stream - Video của người gọi */}
			{callManager.isInCall ? (
				// Khi đã kết nối - hiển thị nhỏ ở góc
				<RTCView
					streamURL={callManager.localStream.getValue()?.toURL()}
					className="absolute top-4 right-4 w-28 h-36 rounded-xl overflow-hidden"
					objectFit="cover"
				/>
			) : (
				// Khi chưa kết nối - hiển thị full màn hình
				isVideoEnabled ? (<RTCView
						streamURL={callManager.localStream.getValue()?.toURL()}
						className="absolute top-0 left-0 right-0 bottom-0"
						objectFit="cover"
					/>)
					: (<View className="absolute top-0 left-0 right-0 bottom-0 bg-gray-300"/>)
			)}

			{/* UI Controls - Sẽ ẩn/hiện khi chạm màn hình */}
			<Animated.View
				style={{
					opacity: fadeAnim,
					position: 'absolute',
					left: 0,
					right: 0,
					top: 0,
					bottom: 0,
				}}
				pointerEvents={showControls ? 'auto' : 'none'}
			>
				{/* Header với thông tin người gọi */}
				<View className="absolute top-24 left-0 right-0 p-4 bg-transparent">
					{/* Caller info - Chỉ hiển thị khi chưa kết nối */}
					{!callManager.isInCall && (
						<View className="items-center mt-4">
							<Image
								className="w-24 h-24 rounded-full"
								source={avatar}/>

							<Text className="text-white text-xl font-medium pt-4">
								{friend?.fullName}
							</Text>
							<Text className="text-white/80 text-sm mt-1">
								{callManager.isCalling ? 'Đang gọi...' : 'Cuộc gọi đến...'}
							</Text>
						</View>
					)}
				</View>

				{/* Bottom control bar */}
				<View className="absolute bottom-20 left-0 right-0 flex items-center">
					{/* Container chính với background và bo tròn */}
					<View className="rounded-full bg-neutral-400/80 px-4 py-3 flex-row items-center space-x-8">
						<Button
							className="w-12 h-12 rounded-full bg-white/20 items-center justify-center"
							onPress={handleToggleVideo}>
							<Feather
								name={isVideoEnabled ? "video" : "video-off"}
								size={24}
								color={Colors.white}
							/>
						</Button>

						<Button
							className="w-12 h-12 rounded-full bg-white/20 items-center justify-center"
							onPress={handleToggleMute}>
							<MaterialIcons
								name={isMuted ? "mic-off" : "mic"}
								size={24}
								color={Colors.white}
							/>
						</Button>

						<Button
							className="w-12 h-12 rounded-full bg-rose-600 items-center justify-center"
							onPress={handleEndCall}>
							<MaterialCommunityIcons
								name="phone-hangup"
								size={24}
								color={Colors.white}
							/>
						</Button>

						{callManager.isReceivingCall && !callManager.isInCall && (
							<Button
								className="w-12 h-12 rounded-full bg-green-500 items-center justify-center"
								onPress={handleAcceptCall}>
								<MaterialCommunityIcons
									name="phone"
									size={24}
									color={Colors.white}
								/>
							</Button>
						)}
					</View>
				</View>
			</Animated.View>
		</TouchableOpacity>
	);
}

export default CallingContainer;
