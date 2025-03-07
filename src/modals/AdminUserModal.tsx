import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
} from 'react-native';
import { supabase } from '../../supabaseConfig';

interface AdminUserModalProps {
  visible: boolean;
  onClose: () => void;
  user: { id: string; firstName: string; lastName: string; currentDebt: number };
  refreshUsers: () => void;
}

const AdminUserModal: React.FC<AdminUserModalProps> = ({
  visible,
  onClose,
  user,
  refreshUsers,
}) => {
  const [debt, setDebt] = useState(user?.currentDebt.toString());

  // 🔹 Update Debt in Supabase
  const updateDebt = async () => {
    const debtValue = parseFloat(debt);
    if (isNaN(debtValue)) {
      Alert.alert('Error', 'Debt must be a valid number.');
      return;
    }

    const { error } = await supabase
      .from('users')
      .update({ currentDebt: debtValue })
      .eq('id', user.id);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Debt updated successfully!');
      refreshUsers();
      onClose();
    }
  };

  // 🔹 Delete User from Supabase
  const deleteUser = async () => {
    const { error } = await supabase.from('users').delete().eq('id', user.id);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'User deleted successfully!');
      refreshUsers();
      onClose();
    }
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>User Info</Text>
          <Text style={styles.userInfo}>
            {user.firstName} {user.lastName}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Debt"
            keyboardType="numeric"
            value={debt}
            onChangeText={setDebt}
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.okButton} onPress={updateDebt}>
              <Text style={styles.buttonText}>OK</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteButton} onPress={deleteUser}>
              <Text style={styles.buttonText}>Delete User</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default AdminUserModal;

// 🔹 Styles
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  userInfo: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  okButton: {
    flex: 1,
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 5,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#B00020',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 5,
  },
  closeButton: {
    marginTop: 10,
    backgroundColor: '#555',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
