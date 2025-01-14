import React, {useEffect, useState, useRef} from 'react';
import {View, Image, Text, useWindowDimensions} from 'react-native';
import Animated, {useSharedValue, useAnimatedStyle, withTiming} from 'react-native-reanimated';
import {BlurView} from '@react-native-community/blur';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Feather from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { SignalRService } from "@/services/signalR";  // Add this import

// Components
import {Button} from '@/components';

// Commons
import {Colors} from '@/common';

function CallingContainer({navigation, route}) {
    // Thêm log để debug
    console.log('Received calling params:', route.params);
    
    const caller = route.params?.caller || {};
    const [callAccepted, setCallAccepted] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const signalR = useRef(SignalRService.getInstance());
    
    // Thêm log chi tiết
    useEffect(() => {
        console.log('Caller information:', {
            fullName: caller.fullName,
            avatar: caller.avatar,
            status: caller.status,
            userId: caller.userId
        });
        
        if (!caller?.fullName) {
            console.warn('No caller information provided');
            // navigation.goBack();  // Comment tạm thời để debug
        }
    }, [caller]);

    // Handle call duration
    useEffect(() => {
        let intervalId;
        if (callAccepted) {
            intervalId = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(intervalId);
    }, [callAccepted]);

    // Format duration to MM:SS
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Initialize call when component mounts
    useEffect(() => {
        if (caller.recipientId) {
            // Emit call start event
            signalR.current.hubConnection.invoke("StartCall", caller.recipientId)
                .catch(err => console.error("Error starting call:", err));

            // Listen for call accepted
            signalR.current.hubConnection.on("CallAccepted", () => {
                setCallAccepted(true);
            });

            // Listen for call rejected/ended
            signalR.current.hubConnection.on("CallEnded", () => {
                navigation.goBack();
            });
        }

        return () => {
            // Cleanup listeners when component unmounts
            signalR.current.hubConnection.off("CallAccepted");
            signalR.current.hubConnection.off("CallEnded");
        };
    }, [caller.recipientId]);

    const handleEndCall = () => {
        if (caller.recipientId) {
            signalR.current.hubConnection.invoke("EndCall", caller.recipientId)
                .catch(err => console.error("Error ending call:", err));
        }
        navigation.goBack();
    };

	const [call, setCall] = useState(false);

	const {width, height} = useWindowDimensions();

	const firstShapeHeight = useSharedValue(height / 3);

	const profileWidth = useSharedValue(200);
	const profileHeight = useSharedValue(200);
	const profileMargin = useSharedValue(-(height / 3) / 2.5);

	const friendMargin = useSharedValue(30);
	const friendOpacity = useSharedValue(0);

	const firstShapeHeightAnimated = useAnimatedStyle(() => {
		return {
			height: firstShapeHeight.value,
		};
	});

	const profileAnimated = useAnimatedStyle(() => {
		return {
			width: profileWidth.value,
			height: profileHeight.value,
			marginTop: profileMargin.value,
		};
	});

	const friendAnimated = useAnimatedStyle(() => {
		return {
			marginTop: friendMargin.value,
			opacity: friendOpacity.value,
		};
	});

	useEffect(() => {
		setTimeout(() => {
			setCall(true);

			firstShapeHeight.value = withTiming(0);
			profileMargin.value = withTiming(64);

			profileWidth.value = withTiming(width - 40);
			profileHeight.value = withTiming(height - 178);

			setTimeout(() => {
				friendMargin.value = withTiming(0);
				friendOpacity.value = withTiming(1);
			}, 1000);
		}, 3000);
	}, []);

	return (
		<View className="flex-1 bg-white items-center">
			<Animated.View className="bg-main h-[30vh]" style={[firstShapeHeightAnimated]}>
				<Image source={require('@/assets/images/shape.png')} resizeMode="cover" />
			</Animated.View>

			<Animated.View className={`overflow-hidden border-4 border-white ${call ? 'rounded-3xl' : 'rounded-full'}`} style={[profileAnimated]}>
					<Image 
						source={caller?.avatar ? {uri: caller.avatar} : require('@/assets/images/call-1.webp')} 
						className="w-full h-full"
					/>
			</Animated.View>

			<Animated.View className="absolute top-24 left-11 z-10" style={[friendAnimated]}>
				<Image source={require('@/assets/images/call-2.webp')} className="w-28 h-36 rounded-2xl" />

				<View className="py-1 px-5 rounded-full overflow-hidden relative mt-3">
					<BlurView style={{position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, flex: 1, zIndex: 10}} blurType="dark" blurAmount={10} reducedTransparencyFallbackColor="black" />

					<Text className="font-rubik text-xs text-white relative z-10 text-center">45:34</Text>
				</View>
			</Animated.View>

			{!call && (
				<>
					<View className="mt-3 mx-auto items-center">
						<Text className="font-rubik font-medium text-xl text-black">
							{caller.fullName || 'Unknown User'}
						</Text>
						<Text className="font-rubik text-sm text-black/40 mt-2">
							{callAccepted ? 'Connected' : 'Calling...'}
						</Text>
					</View>
				</>
			)}

			<View className={`${call ? 'flex-row' : 'flex-col'} justify-center items-center mt-auto mb-10`}>
				<View className="flex-row items-center h-14 rounded-full">
					{call && <Text className="font-rubik text-2xs color-main mr-8">45:34</Text>}

					<Button>
						<AntDesign name="sound" size={18} color={Colors.black} />
					</Button>

					<Button className="ml-11">
						<Feather name="video-off" size={18} color={Colors.black} />
					</Button>

					<Button className="ml-11">
						<Feather name="user-plus" size={18} color={Colors.black} />
					</Button>

					<Button className="ml-11">
						<MaterialIcons name="mic" size={18} color={Colors.black} />
					</Button>
				</View>

				<Button className={`w-14 h-14 rounded-full bg-red items-center justify-center ${call ? 'ml-5' : 'mt-14'}`} onPress={handleEndCall}>
					<MaterialCommunityIcons name="phone-hangup" size={18} color={Colors.white} />
				</Button>
			</View>
		</View>
	);
}

export default CallingContainer;
