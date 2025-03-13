import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../supabaseConfig';
import { NavigationProps } from '../navigation/types';

// ✅ User Interface
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  currentDebt: number;
  type: string;
}

const UserProfileScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ✅ Fetch User Details from Supabase
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        setLoading(false);
        Alert.alert('Error', 'Failed to fetch user details.');
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userError) {
        Alert.alert('Error', 'Could not retrieve user data.');
      } else {
        setUser(userData);
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  // ✅ Handle Password Update
  const updatePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    setLoading(false);

    if (error) {
      Alert.alert('Error', 'Failed to update password.');
    } else {
      Alert.alert('Success', 'Password updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  // ✅ Handle Logout
  const logout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);

    if (error) {
      Alert.alert('Error', 'Failed to log out.');
    } else {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
    }
  };

  const seeOrders = ()=>{
    navigation.navigate('UserOrdersScreen');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Profile</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#B00020" />
      ) : user ? (
        <>
          {/* 🔹 User Details */}
          <Text style={styles.label}>First Name:</Text>
          <Text style={styles.text}>{user.firstName}</Text>

          <Text style={styles.label}>Last Name:</Text>
          <Text style={styles.text}>{user.lastName}</Text>

          <Text style={styles.label}>Email:</Text>
          <Text style={styles.text}>{user.email}</Text>

          <Text style={styles.label}>Current Debt:</Text>
          <Text style={[styles.text, user.currentDebt > 0 && styles.debtText]}>
            {user.currentDebt} RSD
          </Text>

          <Text style={styles.label}>Account Type:</Text>
          <Text style={styles.text}>{user.type}</Text>

          {/* 🔹 Password Update */}
          <Text style={styles.sectionTitle}>Change Password</Text>
          <TextInput
            style={styles.input}
            placeholder="New Password"
            placeholderTextColor="#888"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="#888"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity style={styles.button} onPress={updatePassword}>
            <Text style={styles.buttonText}>Update Password</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={seeOrders}>
            <Text style={styles.buttonText}>See Orders</Text>
          </TouchableOpacity>

          {/* 🔹 Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.buttonText}>Log Out</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.text}>User data not available.</Text>
      )}
    </View>
  );
};

export default UserProfileScreen;

// 🔹 Styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 20, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#B00020', marginBottom: 15 },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 10, color: '#333' },
  text: { fontSize: 16, color: '#666', marginBottom: 5 },
  debtText: { color: '#B00020', fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 20 },
  input: {
    width: '100%',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
    width: '100%',
  },
  logoutButton: {
    backgroundColor: '#B00020',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
