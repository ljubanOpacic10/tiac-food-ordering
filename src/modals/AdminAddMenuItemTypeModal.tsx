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

// 🔹 Define Props Interface
interface AdminAddMenuItemTypeModalProps {
  visible: boolean;
  onClose: () => void;
  restaurant_id: string;
  fetchMenuItemTypes: (restaurant_id: string) => void; // Refresh food types after adding
}

const AdminAddMenuItemTypeModal: React.FC<AdminAddMenuItemTypeModalProps> = ({ visible, onClose, restaurant_id,fetchMenuItemTypes }) => {
  const [menuItemTypeName, setMenuItemTypeName] = useState('');
  const [uploading, setUploading] = useState(false);

  // 🔹 Add New Food Type to Supabase
  const addMenuItemType = async () => {
    if (!menuItemTypeName.trim()) {
      Alert.alert('Error', 'Please enter a menu item name.');
      return;
    }

    setUploading(true);

    try {
      // ✅ Insert Data into Supabase Table
      const { error } = await supabase.from('menu_item_types').insert([
        { name: menuItemTypeName.trim()},
      ]);

      if (error) {throw error;}

      Alert.alert('Success', 'Food type added successfully!');
      setMenuItemTypeName('');
      fetchMenuItemTypes(restaurant_id); // Refresh food types list
      onClose(); // Close modal
    } catch (error) {
      console.error('Supabase Insert Error:', error);
      Alert.alert('Error', 'Failed to add food type.');
    } finally {
      setUploading(false);
    }
  };


  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add Menu Item Type</Text>

          {/* 🔹 Input Field */}
          <TextInput
            style={styles.input}
            placeholder="Enter food type name"
            value={menuItemTypeName}
            onChangeText={setMenuItemTypeName}
          />


          {/* 🔹 Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.addButton} onPress={addMenuItemType} disabled={uploading}>
              {uploading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Add</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AdminAddMenuItemTypeModal;

const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
      width: '90%',
      backgroundColor: '#fff',
      padding: 20,
      borderRadius: 10,
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: 'bold',
      color: '#B00020',
      marginBottom: 15,
    },
    input: {
      width: '100%',
      backgroundColor: '#F9F9F9',
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#DDD',
      marginBottom: 10,
      fontSize: 16,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
    },
    addButton: {
      flex: 1,
      backgroundColor: '#007BFF',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginRight: 5,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: '#B00020',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginLeft: 5,
    },
    buttonText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });
