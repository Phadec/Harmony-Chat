import { useState, useRef, useEffect } from "react";
import {
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CameraPreview from "./CammeraPreview";
import {
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  User,
} from "@stream-io/video-react-native-sdk";

const apiKey = "your-api-key";
const userId = "user-id";
const token = "authentication-token";
const callId = "my-call-id";
const user: User = { id: userId };

const OngoingCallScreen = () => {
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [remoteUid, setRemoteUid] = useState(0);
  const [isHost, setIsHost] = useState(true);

  const leaveChannel = () => {
    setIsJoined(false);
    setRemoteUid(0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    Alert.alert("Mic", isMuted ? "Mic đã được bật" : "Mic đã được tắt");
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    // Thêm logic để bật/tắt loa ở đây
    Alert.alert(
      "Loa",
      isSpeakerOn ? "Đã chuyển sang tai nghe" : "Đã chuyển sang loa ngoài"
    );
  };

  const toggleVideo = () => {
    setIsCameraOn(!isCameraOn);
    // Thêm logic để bật/tắt video ở đây
    Alert.alert(
      "Camera",
      isCameraOn ? "Camera đã được bật" : "Camera đã được tắt"
    );
  };

  const openChat = () => {
    // Thêm logic để mở cửa sổ chat ở đây
    Alert.alert("Chat", "Đã mở cửa sổ chat");
  };

  const endCall = () => {
    // Thêm logic để kết thúc cuộc gọi ở đây
    Alert.alert("Kết thúc", "Cuộc gọi đã kết thúc");
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("~/assets/images/call-page/image-hide.png")}
        style={styles.backgroundImage}
      />
      <View style={styles.overlay}>
        <View style={styles.topRight}>
          <Image
            source={{
              uri: "https://example.com/path-to-small-caller-image.jpg",
            }}
            style={styles.smallImage}
          />
        </View>
        <CameraPreview style={styles.cameraPreview} />
        <View style={styles.bottomControls}>
          <TouchableOpacity style={styles.controlButton} onPress={toggleMute}>
            <Ionicons
              name={isMuted ? "mic-off" : "mic"}
              size={24}
              color="white"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={toggleSpeaker}
          >
            <Ionicons
              name={isSpeakerOn ? "volume-high" : "volume-mute"}
              size={24}
              color="white"
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={toggleVideo}>
            <Ionicons
              name={isCameraOn ? "videocam" : "videocam-off"}
              size={24}
              color="white"
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={openChat}>
            <Ionicons name="chatbubble-ellipses" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.controlButton, styles.endCallButton]}
            onPress={endCall}
          >
            <Ionicons name="call" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  topRight: {
    position: "absolute",
    top: 40,
    right: 20,
  },
  smallImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  cameraPreview: {
    position: "absolute",
    top: 20,
    right: 20,
    paddingTop: 20,
    paddingRight: 20,
  },
  bottomControls: {
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  endCallButton: {
    backgroundColor: "red",
  },
});

export default OngoingCallScreen;
