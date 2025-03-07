import React, { useState, useEffect } from 'react';
import { Modal, View, Text, ActivityIndicator, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { supabase } from '../../supabaseConfig';

interface OrderingSession {
  id: string;
  start_time: string | null; // ISO 8601 timestamp from Supabase
  end_time: string | null;   // Can be null if the session is still active
  status: string; // Example: 'active' or 'ended'
}

interface AdminStartEndOrderingSessionModalProps {
  visible: boolean;
  onClose: () => void;
}

const AdminStartEndOrderingSessionModal: React.FC<AdminStartEndOrderingSessionModalProps> = ({
  visible,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [activeSession, setActiveSession] = useState<OrderingSession | null>(null);

  useEffect(() => {
    fetchActiveSession();
  }, []);

  const fetchActiveSession = async () => {
    const { data, error } = await supabase
      .from('ordering_sessions')
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

    // 🔹 Check if an active session already exists
    const { data: existingSessions, error: fetchError } = await supabase
      .from('ordering_sessions')
      .select('*')
      .eq('status', 'active');

    if (fetchError) {
      setLoading(false);
      Alert.alert('Error', 'Failed to check active ordering sessions.');
      return;
    }

    if (existingSessions && existingSessions.length > 0) {
      setLoading(false);
      Alert.alert('Warning', 'An ordering session is already active. End it before starting a new one.');
      return;
    }

    // 🔹 Start a new ordering session if none is active
    const { data, error } = await supabase
      .from('ordering_sessions')
      .insert([{ start_time: new Date().toISOString(), status: 'active' }])
      .select('*');

    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else if (data && data.length > 0) {
      setActiveSession(data[0]);
      Alert.alert('Success', 'Ordering session started!');
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
      .from('ordering_sessions')
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
      Alert.alert('Success', 'Ordering session ended!');
    }
  };

  return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.title}>Manage Ordering Session</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#B00020" />
            ) : activeSession ? (
              <>
                <Text style={styles.statusText}>Ordering session is currently <Text style={styles.activeText}>ACTIVE</Text>.</Text>
                <TouchableOpacity style={styles.endButton} onPress={endSession}>
                  <Text style={styles.buttonText}>End Ordering Session</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.statusText}>No active Ordering session.</Text>
                <TouchableOpacity style={styles.startButton} onPress={startSession}>
                  <Text style={styles.buttonText}>Start Ordering Session</Text>
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
        backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent background
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
        elevation: 5, // Adds depth
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
        backgroundColor: '#2E7D32', // Green color for start
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 10,
        marginBottom: 10,
      },
      endButton: {
        backgroundColor: '#B00020', // Red color for end
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
export default AdminStartEndOrderingSessionModal;
