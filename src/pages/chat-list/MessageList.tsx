import { messages } from "~/common/Data";
import { Message } from "~/common/model";
import { FontAwesome } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { carouselStyles, listChatstyles } from "~/common/Styles";


const MessageList: React.FC = () => {
  const [visibleIcons, setVisibleIcons] = useState<number | null>(null);
  const [updatedMessages, setUpdatedMessages] = useState<Message[]>(messages);
  const translateXAnim = useRef(new Animated.Value(100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const handleLongPressMessage = (messageId: number) => {
    if (visibleIcons === messageId) {
      setVisibleIcons(null);
      translateXAnim.setValue(100);
      opacityAnim.setValue(0);
    } else {
      setVisibleIcons(messageId);
      translateXAnim.setValue(100);
      opacityAnim.setValue(0);

      Animated.parallel([
        Animated.timing(translateXAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handleDeleteMessage = (messageId: number) => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa tin nhắn này không?",
      [
        {
          text: "Hủy",
          onPress: () => console.log("Hủy xóa"),
          style: "cancel",
        },
        {
          text: "Xóa",
          onPress: () => {
            console.log(`Tin nhắn với ID ${messageId} đã được xóa`);
            setUpdatedMessages((prevMessages) =>
              prevMessages.filter((msg) => msg.id !== messageId)
            );
            setVisibleIcons(null);
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleToggleNotifications = (messageId: number) => {
    setUpdatedMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === messageId
          ? { ...msg, notificationsEnabled: !msg.notificationsEnabled }
          : msg
      )
    );
  };

  const renderItem = ({ item }: { item: Message }) => (
    <TouchableOpacity
      style={listChatstyles.messageItem}
      onLongPress={() => handleLongPressMessage(item.id)}
    >
      <View>
        {item.isOnline && <View style={listChatstyles.onlineIndicator} />}
        <Image source={{ uri: item.avatarUri }} style={listChatstyles.avatar} />
      </View>
      <View style={listChatstyles.messageContent}>
        <Text style={listChatstyles.sender}>{item.sender}</Text>
        {visibleIcons !== item.id ? (
          <>
            <Text style={listChatstyles.content} numberOfLines={1}>
              {item.content}
            </Text>
            <Text style={listChatstyles.time}>{item.time}</Text>
            {item.unreadCount > 0 && (
              <View style={listChatstyles.unreadBadge}>
                <Text style={listChatstyles.unreadText}>
                  {item.unreadCount}
                </Text>
              </View>
            )}
          </>
        ) : null}
      </View>
      {visibleIcons === item.id && (
        <Animated.View
          style={[
            listChatstyles.iconContainer,
            {
              transform: [{ translateX: translateXAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={listChatstyles.iconBell}
            onPress={() => handleToggleNotifications(item.id)}
          >
            <FontAwesome
              name={item.notificationsEnabled ? "bell" : "bell-slash"}
              size={20}
              color="white"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={listChatstyles.iconTrash}
            onPress={() => handleDeleteMessage(item.id)}
          >
            <FontAwesome name="trash-o" size={20} color="white" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </TouchableOpacity>
  );

  return (
    <BlurView style={listChatstyles.container} intensity={50} tint="dark">
      <LinearGradient
        colors={["#353F54", "#191E26"]}
        style={carouselStyles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {updatedMessages.length === 0 ? (
      <View style={listChatstyles.emptyContainer}>
        <Text style={listChatstyles.emptyText}>Chưa có tin nhắn...</Text>
      </View>
    ) : (
      <FlatList
        data={updatedMessages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    )}
    </BlurView>
  );
};

export default MessageList;
