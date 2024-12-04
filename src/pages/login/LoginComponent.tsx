import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../AppNavigator';
import AuthService from '~/services/auth.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define navigation type
type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

type LoginComponentProps = {
  username?: string;
  password?: string;
  onLoginSuccess?: () => void;
};

const LoginComponent: React.FC<LoginComponentProps> = ({ username, password, onLoginSuccess }) => {
  const navigation = useNavigation<LoginScreenNavigationProp>();

  const [userInputUsername, setUsername] = useState<string>(username || '');
  const [userInputPassword, setPassword] = useState<string>(password || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const onLogin = async (user: string, pass: string) => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await AuthService.login(user, pass);

      // Store user data in AsyncStorage
      await AsyncStorage.setItem('userId', response.id);
      await AsyncStorage.setItem('token', response.token);
      await AsyncStorage.setItem('userAvatar', response.avatar);
      await AsyncStorage.setItem('role', response.role);

      console.log('Login successful');
      console.log('User ID:', response.id);
      console.log('Token:', response.token);

      // Redirect based on role
      if (response.role === 'User') {
        navigation.navigate('MessageListScreen');
      } else {
        navigation.navigate('Login');
      }

      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (error: any) {
      console.error('Login failed', error);
      setErrorMessage(error.message || 'Login failed. Please check your credentials and try again.');
      Alert.alert('Login Error', errorMessage || 'An error occurred');
      navigation.navigate('Login');
    } finally {
      setLoading(false);
    }
  };

  return (
      <View style={styles.container}>
        <Text style={styles.title}>Login</Text>
        <TextInput
            placeholder="Username"
            value={userInputUsername}
            onChangeText={setUsername}
            style={styles.input}
        />
        <TextInput
            placeholder="Password"
            value={userInputPassword}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
        />
        {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

        {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
        ) : (
            <Button title="Login" onPress={() => onLogin(userInputUsername, userInputPassword)} />
        )}
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 16,
    paddingLeft: 8,
    borderRadius: 4,
  },
  error: {
    color: 'red',
    marginBottom: 16,
    textAlign: 'center',
  },
});

export default LoginComponent;
