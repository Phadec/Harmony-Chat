import React from 'react';
import {View, Text} from 'react-native';
import Animated from 'react-native-reanimated';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {Button} from '@/components';
import {Colors} from '@/common';
import * as ImagePicker from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

function DropUp ({animation, opened, setOpen, onSendMedia, recipientId}) {
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
                console.log('Selected file:', file);
                console.log('Recipient ID:', recipientId); // Use passed-in prop

                if (!recipientId) {
                    throw new Error('Recipient ID is missing');
                }

                // Ensure the file has a valid extension
                if (!file.fileName || !file.fileName.includes('.')) {
                    const extension = file.type.split('/').pop();
                    file.fileName = `${file.fileName || 'file'}.${extension}`;
                }

                // Pass the file to parent for sending
                if (onSendMedia) {
                    try {
                        await onSendMedia(file);
                    } catch (error) {
                        console.error('onSendMedia error:', error);
                    }
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
