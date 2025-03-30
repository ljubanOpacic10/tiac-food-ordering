import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Modal,
  SafeAreaView,
  Platform,
  PermissionsAndroid,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../supabaseConfig';
import { NavigationProps } from '../navigation/types';
import QRCode from 'react-native-qrcode-svg';
import RNFetchBlob from 'rn-fetch-blob';
import Share from 'react-native-share';

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
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [QRvalue, setQRValue] = useState('');
  const [QRImage] = useState('');

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

  const logout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);

    if (error) {
      Alert.alert('Error', 'Failed to log out.');
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
    }
  };

  const handleSave = async () => {
    if (Platform.OS === 'android') {
      const isReadGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );
      if (isReadGranted !== PermissionsAndroid.RESULTS.GRANTED) {return;}
    }
    const dirs = RNFetchBlob.fs.dirs;
    const qrcode_data = QRImage.split('data:image/png;base64,');
    const filePath = `${dirs.DownloadDir}/QRCode_${Date.now()}.png`;
    RNFetchBlob.fs.writeFile(filePath, qrcode_data[1], 'base64')
      .then(() => console.log('Saved successfully'))
      .catch(err => console.log(err));
  };

  const handleShare = async () => {
    const options = {
      title: 'Share your QR code',
      url: QRImage,
    };
    try {
      await Share.open(options);
    } catch (err) {
      console.log(err);
    }
  };

  const seeOrders = () => navigation.navigate('UserOrdersScreen');
  const handlePayDebt = () => setQrModalVisible(true);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Modal animationType="slide" transparent visible={qrModalVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Scan Me</Text>
            <SafeAreaView>
              <Text style={styles.sectionTitleQrMdal}>Generate QR Code</Text>
              <TextInput
                placeholder="Enter value of payment"
                style={styles.textInput}
                autoCapitalize="none"
                value={QRvalue}
                onChangeText={setQRValue}
              />
              <QRCode
                size={300}
                value={QRvalue || 'NA'}
                logoSize={60}
                logoBackgroundColor="transparent"
              />
            </SafeAreaView>
            <View style={styles.row}>
                <TouchableOpacity style={styles.Button} onPress={handleShare}>
                  <Text style={styles.buttonText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.Button} onPress={handleSave}>
                  <Text style={styles.buttonText}>Save</Text>
                </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={() => setQrModalVisible(false)}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Text style={styles.title}>User Profile</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#B00020" />
      ) : user ? (
        <>
          <Text style={styles.label}>First Name:</Text>
          <Text style={styles.text}>{user.firstName}</Text>

          <Text style={styles.label}>Last Name:</Text>
          <Text style={styles.text}>{user.lastName}</Text>

          <Text style={styles.label}>Email:</Text>
          <Text style={styles.text}>{user.email}</Text>

          <Text style={styles.label}>Current Debt:</Text>
          <View style={styles.debtContainer}>
            <Text style={[styles.text, user.currentDebt > 0 && styles.debtText]}>
              {user.currentDebt} RSD
            </Text>
            <TouchableOpacity style={styles.payDebtButton} onPress={handlePayDebt}>
              <Text style={styles.payDebtButtonText}>Pay</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Account Type:</Text>
          <Text style={styles.text}>{user.type}</Text>

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

          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.buttonText}>Log Out</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.text}>User data not available.</Text>
      )}
    </ScrollView>
  );
};

export default UserProfileScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F5F5F5',
    flexGrow: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#B00020',
    textAlign: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
    marginTop: 12,
  },
  text: {
    fontSize: 15,
    color: '#333',
    marginTop: 2,
  },
  debtText: {
    color: '#B00020',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 25,
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#F0F0F0',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CCC',
    fontSize: 14,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007BFF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  logoutButton: {
    backgroundColor: '#B00020',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  debtContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
    backgroundColor: '#F9F9F9',
    padding: 10,
    borderRadius: 8,
  },
  payDebtButton: {
    backgroundColor: '#28A745',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  payDebtButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 15,
    width: '90%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#B00020',
  },
  sectionTitleQrMdal: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 15,
  },
  textInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#DDD',
    fontSize: 14,
    textAlign: 'center',
  },
  Button: {
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  closeButton: {
    backgroundColor: '#B00020',
    padding: 10,
    borderRadius: 8,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
});
