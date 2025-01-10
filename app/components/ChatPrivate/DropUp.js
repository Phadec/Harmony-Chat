import React from 'react';
import {View, Text} from 'react-native';
import Animated from 'react-native-reanimated';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {Button} from '@/components';
import {Colors} from '@/common';
import * as ImagePicker from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {ChatService} from '@/services';

function DropUp ({animation, opened, setOpen, onSendMedia}) {
    const handleUpload = async (type) => {
        console.log('handleUpload called with type:', type); // Add debug log
        try {
            let result;
            const options = {
                mediaType: 'mixed', // 'photo', 'video', or 'mixed'
                includeBase64: false,
            };

            if (type === 'camera') {
                result = await ImagePicker.launchCamera(options);
            } else if (type === 'photo' || type === 'video') {
                result = await ImagePicker.launchImageLibrary(options);
            } else if (type === 'file') {
                result = await DocumentPicker.pick({
                    type: [DocumentPicker.types.allFiles],
                });
            }

            if (result && result.assets && result.assets.length > 0) {
                const file = result.assets[0];
                const fileName = file.fileName || `attachment.${file.type.split('/')[1]}`;
                console.log('Selected file:', file);

                const userId = await AsyncStorage.getItem('userId');
                const recipientId = await AsyncStorage.getItem('recipientId');

                const formData = new FormData();
                formData.append('UserId', userId);
                formData.append('RecipientId', recipientId);
                formData.append('Message', '');
                formData.append('Attachment', {
                    uri: file.uri,
                    type: file.type,
                    name: fileName,
                });

                console.log('Sending message with formData:', formData); // Log the formData

                const chatService = new ChatService();
                try {
                    const response = await chatService.sendMessage(recipientId, '', formData);
                    console.log('Upload response:', response);

                    if (response) {
                        const newMessage = {
                            id: response.id,
                            userId: userId,
                            message: response.message,
                            date: new Date(new Date(response.date).setHours(new Date(response.date).getHours() - 7)),
                            me: true,
                            attachmentUrl: response.attachmentUrl,
                        };
                        setChats(prevChats => {
                            const updatedChats = [...prevChats];
                            const messageDate = new Date(newMessage.date).toDateString();
                            const existingSection = updatedChats.find(section => section.title === messageDate);
                            if (existingSection) {
                                existingSection.data.push(newMessage);
                            } else {
                                updatedChats.push({
                                    title: messageDate,
                                    data: [newMessage]
                                });
                            }
                            return updatedChats;
                        });
                    }
                } catch (error) {
                    if (error.response) {
                        console.error('Error response data:', error.response.data);
                        console.error('Error response status:', error.response.status);
                        console.error('Error response headers:', error.response.headers);
                    } else if (error.request) {
                        console.error('Error request:', error.request);
                    } else {
                        console.error('Error message:', error.message);
                    }
                    console.error('Send message failed:', error.config); // Log the error config
                }
            }
        } catch (err) {
            console.log('ImagePicker Error: ', err);
        }
    };

    return (
        <Animated.View
            className="absolute bottom-7 right-24 w-40 z-20"
            style={[animation, {zIndex: opened ? 20 : -1}]}>
            <View className="bg-white rounded-3xl py-3">
                <Button className="px-6 py-3" onPress={() => handleUpload('camera')}>
                    <Text className="font-rubik font-light text-sm text-black">Camera</Text>
                </Button>
                <Button className="px-6 py-3" onPress={() => handleUpload('photo')}>
                    <Text className="font-rubik font-light text-sm text-black">Photo and video</Text>
                </Button>
                <Button className="px-6 py-3" onPress={() => handleUpload('file')}>
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
};

export default DropUp;
