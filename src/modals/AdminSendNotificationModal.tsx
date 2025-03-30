import React, { useEffect, useState } from 'react';
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

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  currentDebt: number;
  type: string;
}

const AdminSendNotificationModal: React.FC<AdminSendNotificationModalProps> = ({
  visible,
  onClose,
}) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);
  const sendNotification = async () => {
    if (!message.trim()) {
      Alert.alert('Error', 'Please enter a message.');
      return;
    }

    setLoading(true);

    const { data: admin, error: userError } = await supabase.auth.getUser();

    if (userError || !admin) {
      Alert.alert('Error', 'Failed to fetch admin user ID.');
      setLoading(false);
      return;
    }

    const adminId = admin.user.id;

    const { data: notificationData, error: notificationError } = await supabase
      .from('notifications')
      .insert([
        {
          created_at: new Date().toISOString(),
          message,
          type: 'notification',
          sender_user_id: adminId,
          status: 'sending', // optional
        },
      ])
      .select()
      .single();

    if (notificationError || !notificationData) {
      setLoading(false);
      Alert.alert('Error', 'Failed to send notification.');
      console.error('Notification insert error:', notificationError);
      return;
    }

    const notificationId = notificationData.id;

    await sendNotificaionToEveryUser(notificationId);

    setLoading(false);
  };


  const fetchUsers = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('type', 'user');

    if (error) {
      console.error('Supabase Error:', error);
    } else {
      setUsers(data as User[]);
    }

    setLoading(false);
  };

  const sendNotificaionToEveryUser = async (notificationId: any) => {
    await fetchUsers();
    users.forEach(async (user)=>{
      const { error: linkError } = await supabase
      .from('user_notifications')
      .insert([
        {
          user_id: user.id,
          notification_id: notificationId,
          read: false,
        },
      ]);
      if (linkError) {
        Alert.alert('Error', 'Notification created but failed to link to users.');
        console.error('Linking error:', linkError);
      } else {
        Alert.alert('Success', 'Notification sent to all users!');
        setMessage('');
        onClose();
      }
    });
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Send Notification</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your message..."
            multiline
            value={message}
            onChangeText={setMessage}
          />

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
