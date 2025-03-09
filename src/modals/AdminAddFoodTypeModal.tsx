import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { launchImageLibrary, ImageLibraryOptions } from 'react-native-image-picker';
import { supabase } from '../../supabaseConfig';

// 🔹 Define Props Interface
interface AdminAddFoodTypeModalProps {
  visible: boolean;
  onClose: () => void;
  fetchFoodTypes: () => void; // Refresh food types after adding
}

const AdminAddFoodTypeModal: React.FC<AdminAddFoodTypeModalProps> = ({ visible, onClose, fetchFoodTypes }) => {
  const [foodTypeName, setFoodTypeName] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo' as const,
      quality: 1,
    };
    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        console.error('Image Picker Error:', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const selectedUri = response.assets[0].uri ?? null;
        setImageUri(selectedUri);
      }
    });
  };

  // 🔹 Add New Food Type to Supabase
  const addFoodType = async () => {
    if (!foodTypeName.trim()) {
      Alert.alert('Error', 'Please enter a food type name.');
      return;
    }

    setUploading(true);
    let imageUrl = null;

    // ✅ Upload Image if Selected
    if (imageUri) {
      try {
        const fileName = `${Date.now()}-${foodTypeName.replace(/\s/g, '-')}.jpg`;
        const response = await fetch(imageUri);
        const blob = await response.blob();

        const { error } = await supabase.storage
          .from('food_type_images')
          .upload(fileName, blob);

        if (error) {throw error;}

        // ✅ Get Public Image URL
        const { data: publicUrlData } = supabase.storage
          .from('food_type_images')
          .getPublicUrl(fileName);

        imageUrl = publicUrlData.publicUrl;
      } catch (error) {
        console.error('Image Upload Error:', error);
        Alert.alert('Error', 'Failed to upload image.');
        setUploading(false);
        return;
      }
    }

    try {
      // ✅ Insert Data into Supabase Table
      const { error } = await supabase.from('food_types').insert([
        { food_type: foodTypeName.trim(), image_url: imageUrl },
      ]);

      if (error) {throw error;}

      Alert.alert('Success', 'Food type added successfully!');
      setFoodTypeName('');
      setImageUri(null);
      fetchFoodTypes(); // Refresh food types list
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
          <Text style={styles.modalTitle}>Add Food Type</Text>

          {/* 🔹 Input Field */}
          <TextInput
            style={styles.input}
            placeholder="Enter food type name"
            value={foodTypeName}
            onChangeText={setFoodTypeName}
          />

          {/* 🔹 Image Picker */}
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            <Text style={styles.imagePickerText}>{imageUri ? 'Change Image' : 'Pick an Image'}</Text>
          </TouchableOpacity>

         {imageUri && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            {/* 🔹 Remove Image Button (X) */}
            <TouchableOpacity style={styles.removeImageButton} onPress={() => setImageUri(null)}>
              <Text style={styles.removeImageText}>✕</Text>
            </TouchableOpacity>
          </View>
          )}

          {/* 🔹 Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.addButton} onPress={addFoodType} disabled={uploading}>
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

export default AdminAddFoodTypeModal;

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
    imagePicker: {
      backgroundColor: '#B00020',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 15,
      width: '100%',
    },
    imagePickerText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    imageContainer: {
      position: 'relative', // ✅ Allows positioning of "X" button
      alignSelf: 'center',
      marginBottom: 15,
    },
    imagePreview: {
      width: 100,
      height: 100,
      borderRadius: 10,
    },
    removeImageButton: {
      position: 'absolute',
      top: -8,
      right: -8,
      backgroundColor: '#B00020',
      width: 22,
      height: 22,
      borderRadius: 11, // ✅ Perfect circle
      alignItems: 'center',
      justifyContent: 'center',
    },
    removeImageText: {
      color: '#FFF',
      fontSize: 14,
      fontWeight: 'bold',
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
