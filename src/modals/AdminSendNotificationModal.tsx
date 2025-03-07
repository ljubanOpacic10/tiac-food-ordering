import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../supabaseConfig';

interface AdminSendNotificationModalProps {
  visible: boolean;
  onClose: () => void;
}

const AdminSendNotificationModal: React.FC<AdminSendNotificationModalProps> = ({
  visible,
  onClose,
}) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // 🔹 Admin User ID (Hardcoded for now)
  const adminId = '63954417-bae1-4a55-b095-a63f2591c98e';

  // 🔹 Function to send notification
  const sendNotification = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter a message.');
      return;
    }

    setLoading(true);

    // 🔹 Insert new notification into Supabase
    const { error } = await supabase.from('notifications').insert([
      {
        created_at: new Date().toISOString(),
        message,
        type: 'notification', // Could be 'message' or 'notification'
        sender_user_id: adminId,
      },
    ]);

    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Notification sent successfully!');
      setMessage('');
      onClose(); // Close modal after sending
    }
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Send Notification</Text>

          {/* 🔹 Input Field for Message */}
          <TextInput
            style={styles.input}
            placeholder="Enter your message..."
            multiline
            value={message}
            onChangeText={setMessage}
          />

          {/* 🔹 Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.sendButton} onPress={sendNotification} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Send</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AdminSendNotificationModal;

// 🔹 Styles
const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    height: 100,
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#F9F9F9',
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 15,
  },
  sendButton: {
    flex: 1,
    backgroundColor: '#007BFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 5,
  },
  closeButton: {
    flex: 1,
    backgroundColor: '#B00020',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 5,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
