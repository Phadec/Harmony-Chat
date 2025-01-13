import React, { useState, useEffect } from 'react';
import { View, Image, Text, ScrollView, Platform, TextInput, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ActionSheet } from '@/components';
import { launchImageLibrary } from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { UserService } from '@/services/Users';
import { baseURL } from "../../services/axiosInstance";
import { ToastAndroid } from 'react-native';

// Components
import { Header, Button, SettingItem } from '@/components';

// Layout
import Layout from '@/Layout';

// Commons
import { Colors } from '@/common';


//ExpandablePersonalInfo
function ExpandablePersonalInfo({ isExpanded, onToggle, onSave, data }) {
    const [personalInfo, setPersonalInfo] = useState(data);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [tempDate, setTempDate] = useState(new Date());

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
            setPersonalInfo(prev => ({
                ...prev,
                birthday: selectedDate.toISOString().split('T')[0]
            }));
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
                    <Text className="font-rubik text-sm text-black/40 mb-2">First Name</Text>
                    <TextInput
                        value={personalInfo.firstName}
                        onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, firstName: text }))}
                        className="bg-light p-3 rounded-xl font-rubik"
                    />
                </View>

                <View>
                    <Text className="font-rubik text-sm text-black/40 mb-2">Last Name</Text>
                    <TextInput
                        value={personalInfo.lastName}
                        onChangeText={(text) => setPersonalInfo(prev => ({ ...prev, lastName: text }))}
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

//ProfileContainer
function ProfileContainer({ navigation }) {
    const [avatar, setAvatar] = useState(null);
    const [showActionSheet, setShowActionSheet] = useState(false);
    const [isPersonalInfoExpanded, setIsPersonalInfoExpanded] = useState(false);
    const [personalInfo, setPersonalInfo] = useState({});
    const [loading, setLoading] = useState(true);
    const userService = new UserService();

    const updatePersonalInfo = (data) => {
        setPersonalInfo(prev => ({
            ...prev,
            ...data
        }));
    };

    const fetchUserInfo = async () => {
        try {
            const data = await userService.getUserInfo();
            updatePersonalInfo({
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                birthday: data.birthday.split('T')[0]
            });

            setAvatar(`${baseURL}/${data.avatar}`);
        } catch (error) {
            console.error('Error fetching user info:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSavePersonalInfo = async (info) => {
        try {
            // Kiểm tra các trường bắt buộc
            if (!info.firstName || !info.lastName || !info.email) {
                ToastAndroid.show('First name, last name, and email are required', ToastAndroid.SHORT);
                throw new Error('First name, last name, and email are required.');
            }

            // Kiểm tra định dạng email
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(info.email)) {
                ToastAndroid.show('Please enter a valid email address.', ToastAndroid.SHORT);
                throw new Error('Please enter a valid email address.');
            }

            // Gọi hàm updateUserInfo để lưu thông tin người dùng
            await userService.updateUserInfo({
                firstName: info.firstName,
                lastName: info.lastName,
                birthday: info.birthday,
                email: info.email,
                avatar: avatar // Gửi avatar nếu có
            });

            // Cập nhật thông tin cá nhân
            updatePersonalInfo({
                firstName: info.firstName,
                lastName: info.lastName,
                email: info.email,
                birthday: info.birthday
            });

            ToastAndroid.show('Personal information updated successfully', ToastAndroid.SHORT);
            setIsPersonalInfoExpanded(false);
        } catch (error) {
            console.error('Error updating user info:', error);
        }
    };

    const handleImagePicker = async () => {
        const options = {
            mediaType: 'photo',
            quality: 1,
        };
        try {
            const result = await launchImageLibrary(options);
            if (result.didCancel) {
                console.log('User cancelled image picker');
            } else if (result.error) {
                console.log('ImagePicker Error: ', result.error);
            } else {
                const selectedAvatar = result.assets[0].uri;
                setAvatar(selectedAvatar);

                // Gọi hàm để lưu ảnh đại diện lên server
                await userService.updateUserInfo({
                    firstName: personalInfo.firstName,
                    lastName: personalInfo.lastName,
                    email: personalInfo.email,
                    birthday: personalInfo.birthday,
                    avatar: selectedAvatar
                });
                ToastAndroid.show('Avatar updated successfully', ToastAndroid.SHORT);
            }
        } catch (error) {
            console.log('ImagePicker Error: ', error);
        } finally {
            setShowActionSheet(false);
        }
    };


    useEffect(() => {
        fetchUserInfo();
    }, []);

    if (loading) {
        return (
            <Layout>
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text className="font-rubik mt-4">Loading...</Text>
                </View>
            </Layout>
        );
    }

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
                            source={{ uri: avatar }}
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
                        {`${personalInfo.firstName} ${personalInfo.lastName}`}
                    </Text>
                </View>

                {/* Settings Section */}
                <View className="mt-4">
                    <ExpandablePersonalInfo
                        isExpanded={isPersonalInfoExpanded}
                        onToggle={() => setIsPersonalInfoExpanded(!isPersonalInfoExpanded)}
                        onSave={handleSavePersonalInfo}
                        data={personalInfo}
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