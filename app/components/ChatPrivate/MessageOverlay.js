import React, {useCallback, useMemo, useEffect, useState} from "react";
import {Dimensions, Pressable, Text, View, Image, Modal} from "react-native";
import Animated, {useSharedValue, useAnimatedStyle, withTiming} from "react-native-reanimated";
import ContextMenuActions from "../MessageContextMenu";
import Reactions from "../Reactions";
import Video from 'react-native-video';
import {baseURL} from '@/services/axiosInstance';

function createMediaURL(base, path) {
  const trimmedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const trimmedPath = path.startsWith('/') ? path.substring(1) : path;
  return `${trimmedBase}/${trimmedPath}`;
}

function getAttachmentType(url) {
  const extension = url.split('.').pop().toLowerCase();
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif'];
  const videoExtensions = ['mp4', 'mov', 'avi', 'mkv'];
  
  if (imageExtensions.includes(extension)) {
    return 'image';
  } else if (videoExtensions.includes(extension)) {
    return 'video';
  } else {
    return 'unknown';
  }
}

// Component Message Content
const MessageContent = React.memo(({message, me, formattedTime, width}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const attachmentType = message.attachmentUrl ? getAttachmentType(message.attachmentUrl) : null;

  return (
    <>
      <View className={`flex-row items-center ${me ? 'justify-end' : 'justify-start'} py-1 `}>
        {me && (
          <Text className={`${me ? 'mr-3' : 'ml-3'} font-rubik text-2xs text-black/30`}>
            {formattedTime}
          </Text>
        )}
        <View style={{
          padding: 10, 
          borderRadius: 16, 
          backgroundColor: message.message === "Message has been deleted" ? '#e0e0e0' : (me ? '#9e5bd8' : '#f8f8f8'), 
          width: 'auto', 
          maxWidth: 300
        }}>
          <Text style={{
            paddingStart: 5, 
            fontFamily: 'Rubik', 
            fontWeight: '300', 
            fontSize: 14, 
            color: message.message === "Message has been deleted" ? '#666' : (me ? 'white' : 'black'),
            fontStyle: message.message === "Message has been deleted" ? 'italic' : 'normal'
          }}>
            {message.message}
          </Text>
          {message.attachmentUrl && (
            <Pressable onPress={() => setModalVisible(true)}>
              <View style={{marginTop: 5, borderRadius: 8, overflow: 'hidden'}}>
                {attachmentType === 'image' ? (
                  <Image
                    source={{uri: createMediaURL(baseURL, message.attachmentUrl)}}
                    style={{width: 200, height: 200}}
                  />
                ) : attachmentType === 'video' ? (
                  <Video
                    source={{uri: createMediaURL(baseURL, message.attachmentUrl)}}
                    style={{width: 200, height: 200}}
                    resizeMode="contain"
                    controls
                  />
                ) : null}
              </View>
            </Pressable>
          )}
        </View>
        {!me && (
          <Text className={`${me ? 'mr-3' : 'ml-3'} font-rubik text-2xs text-black/30`}>
            {formattedTime}
          </Text>
        )}
      </View>

      {message.attachmentUrl && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)' }}>
            <Pressable onPress={() => setModalVisible(false)} style={{ position: 'absolute', top: 20, right: 20 }}>
              <Text style={{ color: 'white', fontSize: 18 }}>Close</Text>
            </Pressable>
            {attachmentType === 'image' ? (
              <Image
                source={{ uri: createMediaURL(baseURL, message.attachmentUrl) }}
                style={{ width: '90%', height: '90%' }}
                resizeMode="contain"
              />
            ) : attachmentType === 'video' ? (
              <Video
                source={{ uri: createMediaURL(baseURL, message.attachmentUrl) }}
                style={{ width: '90%', height: '90%' }}
                resizeMode="contain"
                controls
              />
            ) : null}
          </View>
        </Modal>
      )}
    </>
  );
});

function MessageOverlay({message, position, onClose, messageId, onMessageDeleted, pinned, onPinToggle}) {
	if (!position || !message) {
		return null; // Không render nếu dữ liệu chưa đầy đủ
	}

	const {width} = Dimensions.get("window");
	const maxWidth = width * 0.6;

	const calculatedWidth = useMemo(() => {
		return Math.min(maxWidth, message.message.length * 8 + 30);
	}, [message.message.length, maxWidth]);

	// Shared values for animations
	const opacity = useSharedValue(0);
	const scale = useSharedValue(0.9);

	// Animated styles
	const overlayStyle = useAnimatedStyle(() => ({
		opacity: withTiming(opacity.value, {duration: 200}),
		transform: [{scale: withTiming(scale.value, {duration: 200})}],
	}));

	useEffect(() => {
		// Animate overlay when it mounts
		opacity.value = 1;
		scale.value = 1;

		return () => {
			// Reset animation values when unmounted
			opacity.value = 0;
			scale.value = 0.9;
		};
	}, [opacity, scale]);

	const handleClose = useCallback(() => {
		opacity.value = 0;
		scale.value = 0.9;
		onClose();
	}, [opacity, scale, onClose]);

	return (
		<Pressable
			style={{position: "absolute", width: "100%", height: "100%", justifyContent: "center",
				backgroundColor: "rgba(0,0,0,0.2)",}}
			onPress={handleClose}>
			<Animated.View style={[overlayStyle]}>
				<View className={`flex-col ${message.me ? "mr-3" : "ml-3"}`}>
					{/* Component Reaction */}
					<Reactions message={message}/>

					{/* Message Content */}
					<Animated.View className={`w-fit ${message.me ? "flex-row-reverse" : "flex-row"} items-center`}>
						<MessageContent
							message={message}
							me={message.me}
							formattedTime={message.formattedTime}
							width={calculatedWidth}
						/>
					</Animated.View>

					{/* Context Menu Action */}
					<Pressable onPress={(e) => e.stopPropagation()}>
						<ContextMenuActions
							me={message.me}
							onClose={handleClose}
							messageId={messageId}
							onMessageDeleted={onMessageDeleted}
							pinned={message.isPinned}
							onPinToggle={onPinToggle}
						/>
					</Pressable>
				</View>
			</Animated.View>
		</Pressable>
	);
}

export default MessageOverlay;
