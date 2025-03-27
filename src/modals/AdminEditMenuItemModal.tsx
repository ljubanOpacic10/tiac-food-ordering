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
  Image,
} from 'react-native';
import { supabase } from '../../supabaseConfig';
import { ImageLibraryOptions, launchImageLibrary } from 'react-native-image-picker';

interface AdminEditMenuItemModalProps {
  visible: boolean;
  onClose: () => void;
  menuItem: {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url?: string;
    menu_item_type: string;
  };
  menuItemTypes: { id: string;
    name: string;}[];
  refreshMenu: () => void;
}

const AdminEditMenuItemModal: React.FC<AdminEditMenuItemModalProps> = ({
  visible,
  onClose,
  menuItem,
  menuItemTypes,
  refreshMenu,
}) => {
  const [name, setName] = useState(menuItem.name);
  const [description, setDescription] = useState(menuItem.description);
  const [price, setPrice] = useState(menuItem.price.toString());
  const [menuItemType, setMenuItemType] = useState(menuItem.menu_item_type);
  const [imageUri, setImageUri] = useState<string | null>(menuItem.image_url || null);
  const [loading, setLoading] = useState(false);

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
  const updateMenuItem = async () => {
    setLoading(true);
    let imageUrl = imageUri;

    if (imageUri && imageUri !== menuItem.image_url) {
      try {
        const fileName = `${Date.now()}-${name.replace(/\s/g, '-')}.jpg`;
        const response = await fetch(imageUri);
        const blob = await response.blob();

        const { error: uploadError } = await supabase.storage
          .from('menu_images')
          .upload(fileName, blob);

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from('menu_images')
          .getPublicUrl(fileName);

        imageUrl = publicUrlData.publicUrl;
      } catch (error) {
        setLoading(false);
        Alert.alert('Error', 'Failed to upload image.');
        console.error(error);
        return; 
      }
    }

    try {
      const { error: updateError } = await supabase
        .from('menu_items')
        .update({
          name,
          description,
          price: parseFloat(price),
          menu_item_type_id: menuItemType,
          image_url: imageUrl,
        })
        .eq('id', menuItem.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      Alert.alert('Success', 'Menu item updated successfully!');
      refreshMenu();
      onClose();
    } catch (error) {
      Alert.alert('Error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };


  const deleteMenuItem = async () => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this menu item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          const { error } = await supabase.from('menu_items').delete().eq('id', menuItem.id);
          setLoading(false);

          if (error) {
            Alert.alert('Error', error.message);
          } else {
            Alert.alert('Deleted', 'Menu item removed successfully.');
            refreshMenu();
            onClose();
          }
        },
      },
    ]);
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit Menu Item</Text>

          <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Description" value={description} onChangeText={setDescription} />
          <TextInput style={styles.input} placeholder="Price" value={price} onChangeText={setPrice} keyboardType="numeric" />

          <Text style={styles.label}>Select Type:</Text>
          {menuItemTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[styles.typeButton, menuItemType === type.id && styles.selectedType]}
              onPress={() => setMenuItemType(type.id)}>
              <Text style={[styles.typeButton, menuItemType === type.id && styles.selectedTypeText]}>
                {type.name}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
            <Text style={styles.imagePickerText}>{imageUri ? 'Change Image' : 'Pick an Image'}</Text>
          </TouchableOpacity>

          {imageUri && (
                        <View style={styles.imageContainer}>
                          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                          <TouchableOpacity style={styles.removeImageButton} onPress={() => setImageUri(null)}>
                            <Text style={styles.removeImageText}>✕</Text>
                          </TouchableOpacity>
                        </View>
                        )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.updateButton} onPress={updateMenuItem} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Save Changes</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteButton} onPress={deleteMenuItem} disabled={loading}>
              <Text style={styles.buttonText}>Delete</Text>
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

export default AdminEditMenuItemModal;

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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  typeButton: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 5,
    backgroundColor: '#DDD',
  },
  selectedType: {
    backgroundColor: '#B00020',
  },
  selectedTypeText: {
    color: '#FFF',
  },
  imagePicker: {
    backgroundColor: '#B00020',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  imagePickerText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  imageContainer: {
    position: 'relative',
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
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  updateButton: { backgroundColor: '#007BFF', padding: 10, borderRadius: 8, flex: 1, marginRight: 5 },
  deleteButton: { backgroundColor: '#B00020', padding: 10, borderRadius: 8, flex: 1, marginLeft: 5 },
  closeButton: { marginTop: 10, backgroundColor: '#555', padding: 10, borderRadius: 8, width: '100%', alignItems: 'center' },
  buttonText: { color: '#FFF', fontWeight: 'bold' },
});
