import React from 'react';
import {View, Text, Alert} from 'react-native';
import Animated from 'react-native-reanimated';
import AntDesign from 'react-native-vector-icons/AntDesign';
import {Button} from '@/components';
import {Colors} from '@/common';
import * as ImagePicker from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

function DropUp({animation, opened, setOpen, onSendMedia, recipientId}) {
    const handleUpload = async (type) => {
        try {
            let result;
            
            switch (type) {
                case 'camera':
                    result = await ImagePicker.launchCamera({
                        mediaType: 'mixed',
                        quality: 0.8,
                        includeBase64: false,
                        saveToPhotos: true,
                    });
                    // Ensure fileName includes extension for camera uploads
                    if (result?.assets?.[0]) {
                        const asset = result.assets[0];
                        const uriParts = asset.uri?.split('.');
                        let fileExt = uriParts && uriParts.length > 1 ? uriParts.pop().toLowerCase() : '';
                        
                        // Check if the file is a video and set extension to 'mp4' if missing or incorrect
                        if (asset.type?.startsWith('video/') && (fileExt !== 'mp4')) {
                            fileExt = 'mp4';
                        } else if (!fileExt) {
                            fileExt = asset.type?.startsWith('image/') ? 'jpg' : 'txt';
                        }
                        
                        asset.fileName = `${type}_${Date.now()}.${fileExt}`;
                    }
                    break;
                    
                case 'photo':
                    result = await ImagePicker.launchImageLibrary({
                        mediaType: 'mixed',
                        quality: 0.8,
                        includeBase64: false,
                        selectionLimit: 1,
                    });
                    // Ensure fileName includes extension for photo uploads
                    if (result?.assets?.[0]) {
                        const asset = result.assets[0];
                        const uriParts = asset.uri?.split('.');
                        let fileExt = uriParts && uriParts.length > 1 ? uriParts.pop().toLowerCase() : '';
                        
                        // Check if the file is a video and set extension to 'mp4' if missing or incorrect
                        if (asset.type?.startsWith('video/') && (fileExt !== 'mp4')) {
                            fileExt = 'mp4';
                        } else if (!fileExt) {
                            fileExt = asset.type?.startsWith('image/') ? 'jpg' : 'txt';
                        }
                        
                        asset.fileName = `${type}_${Date.now()}.${fileExt}`;
                    }
                    break;
                    
                case 'file':
                    result = await DocumentPicker.pick({
                        type: [DocumentPicker.types.allFiles],
                        copyTo: 'cachesDirectory',
                    });
                    if (result && result[0]) {
                        const fileExt = result[0].name?.split('.').pop()?.toLowerCase() || 'txt';
                        result = {
                            assets: [{
                                uri: result[0].fileCopyUri || result[0].uri,
                                type: result[0].type || `application/${fileExt}`,
                                fileName: `${result[0].name || `file_${Date.now()}`}.${fileExt}`,
                                fileSize: result[0].size
                            }]
                        };
                    }
                    break;
            }

            if (result?.assets?.[0]) {
                const file = result.assets[0];
                
                const maxSize = 10 * 1024 * 1024;
                if (file.fileSize > maxSize) {
                    Alert.alert('Error', 'File size must be less than 10MB');
                    return;
                }

                const fileExt = file.fileName?.split('.').pop()?.toLowerCase() || '';
                let mimeType = file.type;

                // Determine MIME type based on file extension
                if (!mimeType) {
                    switch (fileExt) {
                        case 'mp4':
                            mimeType = 'video/mp4';
                            break;
                        case 'jpg':
                        case 'jpeg':
                            mimeType = 'image/jpeg';
                            break;
                        case 'png':
                            mimeType = 'image/png';
                            break;
                        case 'pdf':
                            mimeType = 'application/pdf';
                            break;
                        // ...add other MIME types as needed...
                        default:
                            mimeType = `application/${fileExt}`;
                    }
                    file.type = mimeType;
                }

                // Gửi file với message là chuỗi rỗng
                await onSendMedia({ ...file, extension: fileExt });
                setOpen(false);
            }
        } catch (err) {
            if (!DocumentPicker.isCancel(err)) {
                Alert.alert('Error', 'Failed to upload file');
            }
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
