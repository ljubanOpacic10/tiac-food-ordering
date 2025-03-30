import React, { useState, useEffect } from 'react';
import { Modal, View, Text, ActivityIndicator, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '../../supabaseConfig';

interface VotingSession {
  id: string;
  start_time: string | null;
  end_time: string | null;
  status: string;
}

interface AdminStartEndVotingSessionModal {
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


const AdminStartEndVotingSessionModal: React.FC<AdminStartEndVotingSessionModal> = ({
    visible,
    onClose,
  }) => {
  const [loading, setLoading] = useState(false);
  const [activeSession, setActiveSession] = useState<VotingSession | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  useEffect(() => {
    fetchActiveSession();
    fetchUsers();
  }, []);

  const sendNotification = async (message: string) => {
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
      }
    });
  };


  const fetchActiveSession = async () => {
    const { data, error } = await supabase
      .from('voting_sessions')
      .select('*')
      .eq('status', 'active')
      .single();

    if (error) {
      console.log('Error fetching active session:', error);
    } else {
      setActiveSession(data);
    }
  };

  const startSession = async () => {
    setLoading(true);

    const { data: existingSessions, error: fetchError } = await supabase
      .from('voting_sessions')
      .select('*')
      .eq('status', 'active');

    if (fetchError) {
      setLoading(false);
      Alert.alert('Error', 'Failed to check active sessions.');
      return;
    }

    if (existingSessions && existingSessions.length > 0) {
      setLoading(false);
      Alert.alert('Warning', 'A voting session is already active. End it before starting a new one.');
      return;
    }
    const { data, error } = await supabase
      .from('voting_sessions')
      .insert([{ start_time: new Date().toISOString(), status: 'active' }])
      .select('*');
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else if (data && data.length > 0) {
      setActiveSession(data[0]);
      sendNotification('Voting session started');
    } else {
      Alert.alert('Error', 'Failed to start session.');
    }
  };

  const endSession = async () => {
    if (!activeSession) {
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from('voting_sessions')
      .update({
        end_time: new Date().toISOString(),
        status: 'inactive',
      })
      .eq('id', activeSession.id);
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setActiveSession(null);
      sendNotification('Voting session ended');
    }
  };
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Manage Voting Session</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#B00020" />
          ) : activeSession ? (
            <>
              <Text style={styles.statusText}>Voting session is currently <Text style={styles.activeText}>ACTIVE</Text>.</Text>
              <TouchableOpacity style={styles.endButton} onPress={endSession}>
                <Text style={styles.buttonText}>End Voting Session</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.statusText}>No active session.</Text>
              <TouchableOpacity style={styles.startButton} onPress={startSession}>
                <Text style={styles.buttonText}>Start Voting Session</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
    modalBackground: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContainer: {
      width: 320,
      padding: 20,
      backgroundColor: '#fff',
      borderRadius: 15,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.2,
      shadowRadius: 5,
      elevation: 5,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 15,
      textAlign: 'center',
    },
    statusText: {
      fontSize: 16,
      color: '#555',
      marginBottom: 15,
      textAlign: 'center',
    },
    activeText: {
      color: '#B00020',
      fontWeight: 'bold',
    },
    startButton: {
      backgroundColor: '#2E7D32',
      paddingVertical: 12,
      paddingHorizontal: 25,
      borderRadius: 10,
      marginBottom: 10,
    },
    endButton: {
      backgroundColor: '#B00020',
      paddingVertical: 12,
      paddingHorizontal: 25,
      borderRadius: 10,
      marginBottom: 10,
    },
    closeButton: {
      backgroundColor: '#555', // Neutral color for close
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 10,
      marginTop: 10,
    },
    buttonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center',
    },
  });

export default AdminStartEndVotingSessionModal;
