import React, {useEffect, useState, useRef} from 'react';
import {SectionList, Image, Text, View} from 'react-native';
import {BlurView}from '@react-native-community/blur';
import Animated, {useSharedValue, useAnimatedStyle, withTiming}from 'react-native-reanimated';
import {useSafeAreaInsets}from 'react-native-safe-area-context';
import {useFocusEffect}from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Octicons from 'react-native-vector-icons/Octicons';
import Feather from 'react-native-vector-icons/Feather';
import Fontisto from 'react-native-vector-icons/Fontisto';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { useSelector } from 'react-redux';
import { ChatService } from '../../services/Chat';
import { SignalRService } from '../../services/signalR';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Components
import {Button, Input}from '@/components';

// Commons
import {Colors, Constants}from '@/common';

const messages = [
  // ...existing code...
];

function Header({navigation}) {
  const insets = useSafeAreaInsets();

  return (
    <View className="bg-main flex-row items-center p-6 rounded-b-3xl" style={{paddingTop: insets.top + 16}}>
      <Button onPress={() => navigation.goBack()}>
        <MaterialIcons name="arrow-back-ios" size={20} color={Colors.white} />
      </Button>

      <View className="flex-row items-center ml-2">
        <View className="w-12 h-12 relative">
          <Image source={require('@/assets/images/person-1.webp')} className="w-12 h-12 rounded-full" />
          <View className="w-4 h-4 rounded-full bg-green border-[3px] border-main absolute top-0 left-0" />
        </View>

        <View className="ml-3">
          <Text className="font-rubik font-medium text-sm text-white">Martijn Dragonj</Text>
          <Text className="mt-1 font-rubik text-xs text-white/40">Online</Text>
        </View>
      </View>

      <View className="flex-row items-center ml-auto">
        <Button>
          <Octicons name="search" size={16} color={Colors.white} />
        </Button>

        <Button className="mx-5">
          <Feather name="phone-call" size={16} color={Colors.white} />
        </Button>

        <Button>
          <Fontisto name="more-v-a" size={16} color={Colors.white} />
        </Button>
      </View>
    </View>
  );
}

function Chat({me, message, date}) {
  return (
    <View className={`${me ? 'flex-row-reverse ' : 'flex-row'} items-center mb-6`}>
      {me && (
        <View className="w-8 items-center">
          <Ionicons name="checkmark-done" size={16} color={Constants.HexToRgba(Colors.black, 0.5)} />
        </View>
      )}

      <View className={`p-3 rounded-2xl max-w-[85%] ${me ? 'bg-main' : 'bg-light'}`}>
        <Text className={`font-rubik font-light text-sm ${me ? 'text-white text-right' : 'text-black'}`}>{message}</Text>
      </View>

      <Text className={`${me ? 'mr-3' : 'ml-3'} font-rubik text-2xs text-black/30`}>{new Date(date).toLocaleTimeString()}</Text>
    </View>
  );
}

function formatChatsByDate(messages, userId) {
  const sortedMessages = messages.sort((a, b) => new Date(a.date) - new Date(b.date));
  const groupedChats = sortedMessages.reduce((acc, message) => {
    const date = new Date(message.date).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push({ ...message, me: message.userId === userId });
    return acc;
  }, {});

  return Object.keys(groupedChats).map(date => ({
    title: date,
    data: groupedChats[date]
  })).sort((a, b) => new Date(a.title) - new Date(b.title));
}

function ChatContainer({ navigation, route }) {
  const { recipientId } = route.params;
  const [opened, setOpen] = useState(false);
  const [chats, setChats] = useState([]);
  const [userId, setUserId] = useState(null);
  const [message, setMessage] = useState('');
  const signalRService = SignalRService.getInstance();
  const sectionListRef = useRef(null);

  const opacity = useSharedValue(0);
  const transform = useSharedValue(30);

  const animation = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{translateY: transform.value}],
    };
  });

  useEffect(() => {
    if (opened) {
      opacity.value = withTiming(1);
      transform.value = withTiming(0);
    } else {
      opacity.value = 0;
      transform.value = 30;
    }
  }, [opened]);

  useEffect(() => {
    async function getUserId() {
      const id = await AsyncStorage.getItem('userId');
      setUserId(id);
    }
    getUserId();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      async function fetchChats() {
        const chatService = new ChatService();
        const response = await chatService.getChats(recipientId, 1, 20);
        console.log(response);
        if (response && response.messages && Array.isArray(response.messages.$values)) {
          const formattedChats = formatChatsByDate(response.messages.$values, userId);
          setChats(formattedChats);
        }
      }
      if (recipientId && userId) {
        fetchChats();
      }
    }, [recipientId, userId])
  );

  useEffect(() => {
    const subscription = signalRService.messageReceived$.subscribe((message) => {
      console.log('Message received:', message);
      if (message && message.id) {
        setChats(prevChats => {
          const updatedChats = [...prevChats];
          const today = new Date().toDateString();
          const todaySection = updatedChats.find(section => section.title === today);
          if (todaySection) {
            todaySection.data.push(message);
          } else {
            updatedChats.push({
              title: today,
              data: [message]
            });
          }
          return updatedChats;
        });
      }
    });

  }, [signalRService]);

  async function handleSendMessage() {
    if (message.trim()) {
      const chatService = new ChatService();
      const response = await chatService.sendMessage(recipientId, message);
      if (response) {
        const newMessage = {
          id: response.id,
          userId: userId,
          message: response.message,
          date: response.date,
          me: true,
        };
        setChats(prevChats => {
          const updatedChats = [...prevChats];
          const today = new Date().toDateString();
          const todaySection = updatedChats.find(section => section.title === today);
          if (todaySection) {
            todaySection.data.push(newMessage);
          } else {
            updatedChats.push({
              title: today,
              data: [newMessage]
            });
          }
          return updatedChats;
        });
        setMessage('');
      }
    }
  }

  function Dropup() {
    return (
      <Animated.View className="absolute bottom-7 right-24 w-40 z-20" style={[animation, {zIndex: opened ? 20 : -1}]}>
        <View className="bg-white rounded-3xl py-3">
          <Button className="px-6 py-3">
            <Text className="font-rubik font-light text-sm text-black">Camera</Text>
          </Button>

          <Button className="px-6 py-3">
            <Text className="font-rubik font-light text-sm text-black">Photo and video</Text>
          </Button>

          <Button className="px-6 py-3">
            <Text className="font-rubik font-light text-sm text-black">File</Text>
          </Button>

          <Button className="px-6 py-3">
            <Text className="font-rubik font-light text-sm text-black">Location</Text>
          </Button>

          <Button className="px-6 py-3">
            <Text className="font-rubik font-light text-sm text-black">Person</Text>
          </Button>
        </View>

        <Button className="p-4 ml-auto" onPress={() => setOpen(false)}>
          <AntDesign name="close" size={20} color={Colors.white} />
        </Button>
      </Animated.View>
    );
  }

  return (
    <View className="flex-1 bg-white relative">
      {opened && <BlurView style={{position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, flex: 1, zIndex: 10}} blurType="dark" blurAmount={8} reducedTransparencyFallbackColor="black" />}

      <Header navigation={navigation} />

      <View className="px-6 flex-1">
        <SectionList
          ref={sectionListRef}
          sections={chats}
          keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())} // Ensure unique key for each item
          renderItem={({item}) => <Chat {...item} />}
          renderSectionHeader={({section: {title}}) => (
            <View className="bg-main rounded-full py-2 px-4 mx-auto z-50 my-4">
              <Text className="font-rubik text-2xs text-white">{title}</Text>
            </View>
          )}
          showsVerticalScrollIndicator={false}
          className="-mr-6"
        />

        <View className="flex-row items-start h-20 bg-white pt-1">
          <View className="bg-light rounded-3xl py-[14px] px-4 flex-row items-center flex-1">
            <Button>
              <MaterialIcons name="emoji-emotions" size={20} color={Colors.main} />
            </Button>

            <Input
              placeholder="Write a message"
              placeholderTextColor={Constants.HexToRgba(Colors.black, 0.5)}
              className="font-rubik font-light text-sm text-black mx-2 flex-1"
              value={message}
              onChangeText={setMessage}
            />

            <Button onPress={() => setOpen(true)}>
              <AntDesign name="menuunfold" size={14} color={Colors.main} />
            </Button>
          </View>

          <Button className="w-12 h-12 rounded-full bg-main items-center justify-center ml-6" onPress={handleSendMessage}>
            <Feather name="send" size={20} color={Colors.white} />
          </Button>
        </View>
      </View>

      <Dropup />
    </View>
  );
}

export default ChatContainer;