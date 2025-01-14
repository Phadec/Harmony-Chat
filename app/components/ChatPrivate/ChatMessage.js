// Tách MessageContent thành component riêng
import React, { useState } from 'react';
import useChatMessage from "../../hooks/ChatPrivate/ChatMessage";
import { GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { Text, View, Image, Modal, Pressable } from "react-native";
import Video from 'react-native-video';
import { baseURL } from '@/services/axiosInstance';

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

export const MessageContent = React.memo(
	({ message, me, formattedTime, width, composedGesture }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const attachmentType = message.attachmentUrl ? getAttachmentType(message.attachmentUrl) : null;

    return (
      <>
        <GestureDetector gesture={composedGesture}>
          <View className={`flex-row items-center ${me ? 'justify-end' : 'justify-start'} py-1 `}>
            {me && (
              <Text className={`${me ? 'mr-3' : 'ml-3'} font-rubik text-2xs text-black/30`}>
                {formattedTime}
              </Text>
            )}
            <View style={{ padding: 10, borderRadius: 16, backgroundColor: me ? '#9e5bd8' : '#f8f8f8', width: 'auto', maxWidth: 300, alignItems: 'center' }}>
              <Text style={{
                paddingStart: 5,
                fontFamily: 'Rubik',
                fontWeight: '300',
                fontSize: 14,
                color: me ? 'white' : 'black',
                textAlign: 'center' // Center text
              }}>
                {message.message}
              </Text>
              {message.attachmentUrl && (
                <Pressable onPress={() => setModalVisible(true)}>
                  <View style={{ marginTop: 5, borderRadius: 8, overflow: 'hidden', alignItems: 'center' }}>
                    {attachmentType === 'image' ? (
                      <Image
                        source={{ uri: createMediaURL(baseURL, message.attachmentUrl) }}
                        style={{ width: 200, height: 200 }}
                      />
                    ) : attachmentType === 'video' ? (
                      <Video
                        source={{ uri: createMediaURL(baseURL, message.attachmentUrl) }}
                        style={{ width: 200, height: 200 }}
                        resizeMode="contain"
                        controls
                        paused={true} // Prevent auto-play
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
        </GestureDetector>

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
  }
);

// Component chính
function ChatMessage({ message, onSwipe, onLongPress, onCloseActions }) {
	const {
		calculatedWidth,
		composedGesture,
		panStyle,
	} = useChatMessage(
		message,
		onSwipe,
		onLongPress,
		onCloseActions
	);

	return (
		<View className={`flex-col ${message.me ? 'mr-3' : ''}`}>
			<Animated.View
				style={[panStyle]}
				className={`w-fit ${message.me ? 'flex-row-reverse' : 'flex-row'} items-center`}>
				<MessageContent
					message={message}
					me={message.me}
					formattedTime={message.formattedTime}
					width={calculatedWidth}
					composedGesture={composedGesture}
				/>
			</Animated.View>
		</View>
	);
}

export default React.memo(ChatMessage);