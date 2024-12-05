import React, { useEffect, useRef, useState } from "react";
import { ChatService } from "~/services/chat.service"; // Ensure the correct import path
import { FontAwesome } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Alert, Animated, FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { carouselStyles, listChatstyles } from "~/common/Styles";
import { Message } from "~/common/model";
import AppConfigService from "~/services/app-config.service"; // Ensure Message structure is correct
import { format } from 'date-fns';
import { formatInTimeZone } from "date-fns-tz"; // Import date-fns-tz for timezone formatting
const MessageList: React.FC = () => {
  const [visibleIcons, setVisibleIcons] = useState<string | null>(null);  // Changed from `number` to `string`
  const [updatedMessages, setUpdatedMessages] = useState<Message[]>([]);
  const [relationships, setRelationships] = useState<Message[]>([]); // Use Message[] for relationships
  const translateXAnim = useRef(new Animated.Value(100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchRelationships = async () => {
      try {
        const data = await ChatService().getRelationships();
        console.log('Dữ liệu từ API:', data);

        // Kiểm tra xem data có chứa $values và nó có phải là mảng không
        if (data && data.$values && Array.isArray(data.$values)) {
          setRelationships(data.$values); // Gán giá trị từ data.$values vào state relationships
          setUpdatedMessages(data.$values); // Gán giá trị từ data.$values vào state updatedMessages
        } else {
          console.error('Dữ liệu không hợp lệ hoặc không chứa $values', data);
        }
      } catch (error) {
        console.error("Error fetching relationships", error);
      }
    };

    fetchRelationships();
  }, []); // Fetch khi component được mount
  const getAvatarUrl = (avatar: string): string => {
    const baseUrl = AppConfigService.getBaseUrl(); // Hoặc lấy từ cấu hình AppConfigService
    return `${baseUrl}/${avatar}`;
  };
  // Handle long press on a message
  const handleLongPressMessage = (chatId: string) => {
    if (visibleIcons === chatId) {
      setVisibleIcons(null);
      translateXAnim.setValue(100);
      opacityAnim.setValue(0);
    } else {
      setVisibleIcons(chatId);
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

  // Handle message deletion
  const handleDeleteMessage = (chatId: string) => {
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
              console.log(`Tin nhắn với chatId ${chatId} đã được xóa`);
              setUpdatedMessages((prevMessages) =>
                  prevMessages.filter((msg) => msg.chatId !== chatId)
              );
              setVisibleIcons(null);
            },
          },
        ],
        { cancelable: true }
    );
  };

  // Toggle notifications for a chat
  const handleToggleNotifications = (chatId: string) => {
    setUpdatedMessages((prevMessages) =>
        prevMessages.map((msg) =>
            msg.chatId === chatId
                ? { ...msg, notificationsEnabled: !msg.notificationsEnabled }
                : msg
        )
    );
  };

  const formatChatDate = (chatDate: string) => {
    // Định dạng thời gian theo múi giờ Việt Nam (UTC+7)
    const timeZone = 'Asia/Ho_Chi_Minh'; // Múi giờ Việt Nam
    return formatInTimeZone(new Date(chatDate), timeZone, "dd/MM/yyyy HH:mm"); // Định dạng theo "dd/MM/yyyy HH:mm"
  };

  const renderItem = ({ item }: { item: Message }) => {
    const formattedDate = item.chatDate ? formatChatDate(item.chatDate) : ""; // Format chatDate

    return (
        <TouchableOpacity
            style={listChatstyles.messageItem}
            onLongPress={() => handleLongPressMessage(item.chatId)}
        >
          <View>
            {item.status === "online" && <View style={listChatstyles.onlineIndicator} />}
            <Image source={{ uri: getAvatarUrl(item.avatar) }} style={listChatstyles.avatar} />
          </View>
          <View style={listChatstyles.messageContent}>
            <Text style={listChatstyles.sender}>{item.contactFullName}</Text>
            {visibleIcons !== item.chatId ? (
                <>
                  <Text style={listChatstyles.content} numberOfLines={1}>
                    {item.lastMessage}
                  </Text>
                  <Text style={listChatstyles.time}>{formattedDate}</Text> {/* Display formatted date */}
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
          {visibleIcons === item.chatId && (
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
                    onPress={() => handleToggleNotifications(item.chatId)}
                >
                  <FontAwesome
                      name={item.notificationsEnabled ? "bell" : "bell-slash"}
                      size={20}
                      color="white"
                  />
                </TouchableOpacity>
                <TouchableOpacity
                    style={listChatstyles.iconTrash}
                    onPress={() => handleDeleteMessage(item.chatId)}
                >
                  <FontAwesome name="trash-o" size={20} color="white" />
                </TouchableOpacity>
              </Animated.View>
          )}
        </TouchableOpacity>
    );
  };

  return (
      <BlurView style={listChatstyles.container} intensity={50} tint="dark">
        <LinearGradient
            colors={["#353F54", "#191E26"]}
            style={carouselStyles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        />
        {relationships.length === 0 ? (
            <View style={listChatstyles.emptyContainer}>
              <Text style={listChatstyles.emptyText}>Chưa có tin nhắn...</Text>
            </View>
        ) : (
            <FlatList
                data={relationships}
                keyExtractor={(item) => item.chatId}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
            />
        )}
      </BlurView>
  );
};

export default MessageList;