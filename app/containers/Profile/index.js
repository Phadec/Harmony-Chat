import React, { useState } from 'react';
import { View, Image, Text, ScrollView, Platform, TextInput, TouchableOpacity, Modal } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import * as ImagePicker from 'react-native-image-picker';
import { ActionSheet } from '@/components';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';

// Components
import { Header, Button, SettingItem } from '@/components';

// Layout
import Layout from '@/Layout';

// Commons
import { Colors } from '@/common';

function ExpandablePersonalInfo({ isExpanded, onToggle, onSave }) {

    //thông tin cá nhân
    const [personalInfo, setPersonalInfo] = useState({
        fullName: 'Sarah Parker',
        email: 'sarah.parker@example.com',
        phone: '+1 234 567 890',
        location: 'New York, USA',
        birthday: '1995-06-15'
    });
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [tempDate, setTempDate] = useState(new Date(personalInfo.birthday));

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const handleDateChange = (event, selectedDate) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (selectedDate) {
            setTempDate(selectedDate);
            if (Platform.OS === 'android') {
                setPersonalInfo(prev => ({
                    ...prev,
                    birthday: selectedDate.toISOString().split('T')[0]
                }));
            }
        }
    };

    const handleConfirm = () => {
        setPersonalInfo(prev => ({
            ...prev,
            birthday: tempDate.toISOString().split('T')[0]
        }));
        setShowDatePicker(false);
    };

    if (!isExpanded) {
        return (
            <SettingItem
                title="Personal Information"
                value={personalInfo.fullName}
                onPress={onToggle}
            />
        );
    }

    return (
        <View className="bg-white p-4 rounded-2xl mb-3">
            <TouchableOpacity
                className="flex-row items-center justify-between mb-4"
                onPress={onToggle}
            >
                <Text className="font-rubik font-medium text-base">Personal Information</Text>
                <MaterialIcons name="keyboard-arrow-up" size={24} color={Colors.black} />
            </TouchableOpacity>

            {/* Form Fields */}
            <View className="space-y-4">
                <View>
                    <Text className="font-rubik text-sm text-black/40 mb-2">Full Name</Text>
                    <TextInput
                        value={personalInfo.fullName}
                        onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, fullName: text }))}
                        className="bg-light p-3 rounded-xl font-rubik"
                    />
                </View>

                <View>
                    <Text className="font-rubik text-sm text-black/40 mb-2">Email</Text>
                    <TextInput
                        value={personalInfo.email}
                        onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, email: text }))}
                        className="bg-light p-3 rounded-xl font-rubik"
                        keyboardType="email-address"
                    />
                </View>

                <View>
                    <Text className="font-rubik text-sm text-black/40 mb-2">Phone</Text>
                    <TextInput
                        value={personalInfo.phone}
                        onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, phone: text }))}
                        className="bg-light p-3 rounded-xl font-rubik"
                        keyboardType="phone-pad"
                    />
                </View>

                <View>
                    <Text className="font-rubik text-sm text-black/40 mb-2">Location</Text>
                    <TextInput
                        value={personalInfo.location}
                        onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, location: text }))}
                        className="bg-light p-3 rounded-xl font-rubik"
                    />
                </View>

                <View>
                    <Text className="font-rubik text-sm text-black/40 mb-2">Birthday</Text>
                    <TouchableOpacity 
                        onPress={() => setShowDatePicker(true)}
                        className="bg-light p-3 rounded-xl"
                    >
                        <Text className="font-rubik text-black">
                            {formatDate(personalInfo.birthday)}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Date Picker */}
                {Platform.OS === 'ios' ? (
                    <Modal
                        transparent={true}
                        visible={showDatePicker}
                        animationType="slide"
                    >
                        <View className="flex-1 justify-end bg-black/50">
                            <View className="bg-white p-4">
                                <DateTimePicker
                                    value={tempDate}
                                    mode="date"
                                    display="spinner"
                                    onChange={handleDateChange}
                                    maximumDate={new Date()}
                                    minimumDate={new Date('1900-01-01')}
                                />
                                <View className="flex-row justify-end space-x-4">
                                    <TouchableOpacity 
                                        onPress={() => setShowDatePicker(false)}
                                        className="px-4 py-2"
                                    >
                                        <Text className="text-red">Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        onPress={handleConfirm}
                                        className="px-4 py-2"
                                    >
                                        <Text className="text-purple">Confirm</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>
                ) : (
                    showDatePicker && (
                        <DateTimePicker
                            value={tempDate}
                            mode="date"
                            display="default"
                            onChange={handleDateChange}
                            maximumDate={new Date()}
                            minimumDate={new Date('1900-01-01')}
                        />
                    )
                )}

                {/* Save Button */}
                <TouchableOpacity
                    className="bg-purple py-3 rounded-xl mt-4"
                    onPress={() => onSave(personalInfo)}
                >
                    <Text className="font-rubik text-white text-center font-medium">
                        Save Changes
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

function ProfileContainer({ navigation }) {
    const [avatar, setAvatar] = useState(require('@/assets/images/person-1.webp'));
    const [showActionSheet, setShowActionSheet] = useState(false);
    const [isPersonalInfoExpanded, setIsPersonalInfoExpanded] = useState(false);

    const handleImagePicker = async (type) => {
        const options = {
            mediaType: 'photo',
            maxWidth: 512,
            maxHeight: 512,
            quality: 1,
            includeBase64: true,
        };

        try {
            if (type === 'camera') {
                const result = await ImagePicker.launchCamera(options);
                if (result.assets && result.assets[0]) {
                    setAvatar({ uri: result.assets[0].uri });
                }
            } else {
                const result = await ImagePicker.launchImageLibrary(options);
                if (result.assets && result.assets[0]) {
                    setAvatar({ uri: result.assets[0].uri });
                }
            }
        } catch (error) {
            console.log('ImagePicker Error: ', error);
        } finally {
            setShowActionSheet(false);
        }
    };

    const handleSavePersonalInfo = (info) => {
        console.log('Saving personal info:', info);
        // Implement save logic here
        Toast.show({
            type: 'success',
            text1: 'Personal information updated successfully',
            position: 'top',
            visibilityTime: 2000,
        });
        setIsPersonalInfoExpanded(false);
    };

    return (
        <Layout>
            <Header title="Profile" goBack navigation={navigation} />

            <ScrollView
                className="flex-1 mt-6"
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Header */}
                <View className="items-center">
                    <View className="relative">
                        <Image
                            source={avatar}
                            className="w-32 h-32 rounded-full"
                        />
                        <Button
                            className="absolute bottom-0 right-0 bg-purple w-10 h-10 rounded-full items-center justify-center"
                            onPress={() => setShowActionSheet(true)}
                        >
                            <Feather name="edit-2" size={20} color={Colors.white} />
                        </Button>
                    </View>

                    <Text className="font-rubik font-medium text-xl mt-4">
                        Sarah Parker
                    </Text>
                    <Text className="font-rubik text-sm text-black/40 mt-1">
                        Online
                    </Text>
                </View>

                {/* Stats */}
                <View className="flex-row justify-around mt-6 mb-4">
                    <View className="items-center">
                        <Text className="font-rubik font-medium text-xl">328</Text>
                        <Text className="font-rubik text-sm text-black/40">Friends</Text>
                    </View>
                </View>

                {/* Settings Section */}
                <View className="mt-4">
                    <ExpandablePersonalInfo
                        isExpanded={isPersonalInfoExpanded}
                        onToggle={() => setIsPersonalInfoExpanded(!isPersonalInfoExpanded)}
                        onSave={handleSavePersonalInfo}
                    />

                    <SettingItem
                        title="Notification"
                        toggler
                    />

                    <SettingItem
                        title="Change Password"
                        icon={<Ionicons name="key-outline" size={24} color={Colors.black} />}
                        onPress={() => navigation.navigate('ForgotPassword')}
                    />

                </View>

                {/* Additional Options */}
                <View className="mt-4">
                    <Button className="flex-row items-center bg-light rounded-[20px] p-4 mb-3">
                        <MaterialIcons name="help-outline" size={24} color={Colors.black} />
                        <Text className="font-rubik text-sm text-black ml-3">Help Center</Text>
                    </Button>
                </View>
                <ActionSheet
                    visible={showActionSheet}
                    onClose={() => setShowActionSheet(false)}
                    actions={[
                        {
                            title: 'Take Photo',
                            icon: <MaterialIcons name="camera-alt" size={24} color={Colors.black} />,
                            onPress: () => handleImagePicker('camera')
                        },
                        {
                            title: 'Choose from Gallery',
                            icon: <MaterialIcons name="photo-library" size={24} color={Colors.black} />,
                            onPress: () => handleImagePicker('gallery')
                        }
                    ]}
                />
            </ScrollView>
        </Layout>
    );
}

export default ProfileContainer; 