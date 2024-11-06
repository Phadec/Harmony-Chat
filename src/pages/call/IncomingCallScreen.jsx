import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Animated,
  TouchableHighlight,
} from "react-native";
import HideImage from "~/assets/images/call-page/image-hide.png";
import Avatar from "~/assets/images/call-page/Ellipse 311.png";
import CallIcon from "~/assets/images/call-page/Call-button.png";
import Message from "~/assets/images/call-page/Message.png";
import Alarm from "~/assets/images/call-page/Alarm.png";
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from "react-native-gesture-handler";

const SLIDE_WIDTH = 260;
const ICON_SIZE = 50; // Kích thước của Call Icon
const SLIDER_WIDTH = 260; // Chiều rộng của slider
const SLIDER_PADDING = 5; // Padding của slider
const SLIDE_THRESHOLD = SLIDE_WIDTH - ICON_SIZE - 20; // Ngưỡng để xác nhận trượt

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backgourndImage: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(6, 13, 10, 0.7)", // Lớp phủ tối
    paddingTop: 60,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 50,
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  incomingText: {
    fontSize: 16,
    color: "white",
    // marginBottom: 50,
  },
  actionButtons: {
    flexDirection: "row",
    paddingTop: 150,
    marginBottom: 20,
    justifyContent: "space-between",
  },
  button: {
    marginHorizontal: 60,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
  },
  sliderContainer: {
    padding: SLIDER_PADDING,
    width: SLIDE_WIDTH,
    backgroundColor: "rgba(255, 255, 255, 0.2)", // 20% opaque white
    borderRadius: 50,
    overflow: "hidden", // Đảm bảo hiệu ứng không vượt quá border radius
    justifyContent: "center", // Căn giữa nội dung theo chiều ngang
    position: "relative", // Để có thể di chuyển các phần tử
  },
  subSlider: {
    backgroundColor: "rgba(255, 255, 255, 0.3)", // Lớp mờ thêm
    borderRadius: 45, // Bo tròn để nằm gọn trong slider container
    padding: SLIDER_PADDING,
    flexDirection: "row",
    alignItems: "center",
  },
  slideAnswer: { paddingLeft: 35, color: "rgba(255, 255, 255, 0.8)" },
  sliderText: {
    color: "white",
    fontWeight: "bold",
  },
  slider: {
    width: 150,
    height: 50,
    backgroundColor: "green",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
});

const IncomingCallScreen = () => {
  const [slideValue] = useState(new Animated.Value(0)); // Giá trị dùng để di chuyển nút trượt

  // Xử lý sự kiện trượt (theo dõi giá trị trượt)
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: slideValue } }],
    { useNativeDriver: false }
  );

  // Xử lý trạng thái khi trượt hoàn thành
  // Xử lý trạng thái khi trượt hoàn thành
  const onHandlerStateChange = (event) => {
    if (event.nativeEvent.translationX > SLIDE_THRESHOLD) {
      // Nếu người dùng trượt đủ khoảng cách, chấp nhận cuộc gọi
      alert("Cuộc gọi đã được chấp nhận");
      // Thực hiện các thao tác khác khi chấp nhận cuộc gọi...
    } else {
      // Nếu người dùng trượt không đủ, đưa nút trượt về vị trí ban đầu
      Animated.spring(slideValue, {
        toValue: 0,
        useNativeDriver: false,
      }).start();
    }
  };

  // Xử lý khi nhấn vào Call Icon (chỉ bắt đầu việc trượt)
  const handleIconPressIn = () => {
    console.log("Press");
    Animated.spring(slideValue, {
      toValue: SLIDE_THRESHOLD / 2, // Di chuyển một nửa khoảng cách để bắt đầu kéo
      useNativeDriver: false,
    }).start();
  };
  // Giới hạn việc trượt để không vượt quá slide threshold
  const slideInterpolate = slideValue.interpolate({
    inputRange: [0, SLIDE_THRESHOLD],
    outputRange: [0, SLIDE_THRESHOLD],
    extrapolate: "clamp", // Giới hạn trượt không quá SLIDE_THRESHOLD
  });
  return (
    <View style={styles.container}>
      <ImageBackground
        style={styles.backgourndImage}
        blurRadius={0}
        source={HideImage}
      >
        <View style={styles.overlay}>
          {/* Ảnh đại diện */}
          <View
            style={{
              alignItems: "center",
              flex: 2,
              justifyContent: "center",
            }}
          >
            <Image style={styles.avatar} source={Avatar}></Image>
            <Text style={styles.name}>Borsha Akther</Text>
            <Text style={styles.incomingText}>Incomming call</Text>
          </View>

          {/* Nút tương tác */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.button}>
              <Image source={Message} />
              <Text style={styles.buttonText}>Remind me</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button}>
              <Image source={Alarm} />
              <Text style={styles.buttonText}>Message</Text>
            </TouchableOpacity>
          </View>

          {/* Thao tác trượt để chấp nhận cuộc gọi */}
          <GestureHandlerRootView style={{ flex: 1 }}>
            <PanGestureHandler
              onGestureEvent={onGestureEvent}
              onHandlerStateChange={onHandlerStateChange}
            >
              <Animated.View style={[styles.sliderContainer]}>
                <View style={styles.subSlider}>
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={handleIconPressIn}
                  >
                    <Image
                      source={CallIcon}
                      style={{
                        width: ICON_SIZE,
                        height: ICON_SIZE,
                      }}
                    />
                  </TouchableOpacity>
                  <Text style={styles.slideAnswer}>Slide to answer</Text>
                </View>
              </Animated.View>
            </PanGestureHandler>
          </GestureHandlerRootView>
        </View>
      </ImageBackground>
    </View>
  );
};

export default IncomingCallScreen;
