import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../supabaseConfig'; // Import Supabase config
import { NavigationProps } from '../navigation/types';

const AdminLoginScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(true);

    if (error) {
      Alert.alert('Login Failed', error.message);
      console.error('Login Error:', error);
      setLoading(false);
      return;
    }

    // 🚀 Debugging: Log User Data
    console.log('Logged in user:', data.user);

    if (!data.user) {
      Alert.alert('Error', 'No user returned from Supabase.');
      setLoading(false);
      return;
    }

    const userId = data.user.id;

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, type')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      Alert.alert('Unauthorized', 'No admin access.');
      setLoading(false);
      return;
    }

    if (userData.type === 'admin') {
      navigation.reset({
        index: 0,
        routes: [{ name: 'AdminDashboard' }],
      });
      setLoading(false);
    } else {
      Alert.alert('Unauthorized', 'You are not an admin.');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.title}>Tiac Food Ordering</Text>

      {/* Email Input */}
      <Text style={styles.description}>Enter your ADMIN email</Text>
      <TextInput
        style={styles.inputEmail}
        placeholder="Email"
        placeholderTextColor="#fff"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Password Input */}
      <Text style={styles.description}>Enter your ADMIN password</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.inputPassword}
          placeholder="Enter password"
          placeholderTextColor="#fff"
          secureTextEntry={!isPasswordVisible}
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
        />
        {/* Eye Icon */}
        <TouchableOpacity
          style={styles.iconContainer}
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
        >
          <Image
            source={
              isPasswordVisible
                ? require('../assets/eye-open.png')
                : require('../assets/eye-closed.png')
            }
            style={styles.icon}
          />
        </TouchableOpacity>
      </View>

      {/* Login Button */}
      <TouchableOpacity style={styles.buttonContainer} onPress={handleAdminLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#B00020" /> : <Text style={styles.buttonText}>LOGIN</Text>}
      </TouchableOpacity>

    </View>
  );
};

export default AdminLoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B00020',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 40,
    textAlign: 'center',
  },
  description: {
    marginRight: 'auto',
    color: '#fff',
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
  },
  inputPassword: {
    flex: 1,
    height: 50,
    padding: 10,
    color: '#fff',
  },
  iconContainer: {
    padding: 10,
  },
  icon: {
    width: 24,
    height: 24,
    tintColor: '#fff',
  },
  inputEmail: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 8,
    marginBottom: 15,
    padding: 10,
    color: '#fff',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonContainer: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B00020',
  },
});
