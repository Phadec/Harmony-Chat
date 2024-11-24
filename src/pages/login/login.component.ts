import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AuthService from '~/services/auth.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import SignalRService from '~/services/signalr.service';
export default function LoginComponent(account: string, pass: string) {
  const [username, setUsername] = useState<string>(account);
  const [password, setPassword] = useState<string>(pass);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const navigation = useNavigation();
  // const signalRService = new SignalRService();
  // const peerService = new PeerService();

  const onLogin = async () => {
    try {
      const response = await AuthService.login(username, password);

      // Save info to AsyncStorage
      await AsyncStorage.setItem('userId', response.id);
      await AsyncStorage.setItem('token', response.token);
      await AsyncStorage.setItem('userAvatar', response.avatar);
      await AsyncStorage.setItem('role', response.role);

      console.log('Login successful');
      console.log('User ID:', response.id);
      console.log('Token:', response.token);

      // Start SignalR connection after login
      // await signalRService.startConnection();

      // Navigate based on user role
      // if (response.role === 'Admin') {
      //   navigation.navigate('AdminScreen');
      // } else if (response.role === 'User') {
      //   navigation.navigate('ChatScreen');
      // } else {
      //   navigation.navigate('LoginScreen');
      // }
    } catch (error: any) {
      console.error('Login failed', error);
      setErrorMessage(error.message || 'Login failed. Please check your credentials and try again.');
      Alert.alert('Login Error', errorMessage || 'An error occurred');
    }
  };

  onLogin();

  // return (
  //   <View style={{ padding: 16 }}>
  //     <Text>Login</Text>
  //     <TextInput
  //       placeholder="Username"
  //       value={username}
  //       onChangeText={setUsername}
  //       style={{ borderBottomWidth: 1, marginBottom: 16 }}
  //     />
  //     <TextInput
  //       placeholder="Password"
  //       value={password}
  //       onChangeText={setPassword}
  //       secureTextEntry
  //       style={{ borderBottomWidth: 1, marginBottom: 16 }}
  //     />
  //     {errorMessage && <Text style={{ color: 'red' }}>{errorMessage}</Text>}
  //     <Button title="Login" onPress={onLogin} />
  //   </View>
  // );
  return (
    {}
  );
};
