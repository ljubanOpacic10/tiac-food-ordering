import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Image,
} from 'react-native';
import { supabase } from '../../supabaseConfig';
import { ImageLibraryOptions, launchImageLibrary } from 'react-native-image-picker';
import { useRoute } from '@react-navigation/native';
import AdminEditMenuItemModal from '../modals/AdminEditMenuItemModal';
import AdminAddMenuItemTypeModal from '../modals/AdminAddMenuItemTypeModal';

// ✅ Define Menu Item Interface
interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  menu_item_type: string;
}

// ✅ Define Menu Item Type Interface
interface MenuItemType {
  id: string;
  name: string;
}

const AdminMenuScreen = () => {
  const route = useRoute();
  const { restaurantId, restaurantName } = route.params as { restaurantId: string; restaurantName: string };

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuItemTypes, setMenuItemTypes] = useState<MenuItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [addMenuItemTypeModalVisible, setAddMenuItemTypeModalVisible] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [menuItemName, setMenuItemName] = useState('');
  const [menuItemDescription, setMenuItemDescription] = useState('');
  const [menuItemPrice, setMenuItemPrice] = useState('');
  const [selectedMenuItemType, setSelectedMenuItemType] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);

  // 🔹 Fetch Menu Items
  const fetchMenuItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurantId);

    if (error) {
      Alert.alert('Error', 'Failed to fetch menu items.');
      console.error('Supabase Error:', error);
    } else {
      setMenuItems(data);
    }
    setLoading(false);
  };

  // 🔹 Fetch Menu Item Types
  const fetchMenuItemTypes = async () => {
    const { data, error } = await supabase.from('menu_item_types').select('*');

    if (error) {
      Alert.alert('Error', 'Failed to fetch menu item types.');
      console.error('Supabase Error:', error);
    } else {
      setMenuItemTypes(data);
    }
  };

  useEffect(() => {
    fetchMenuItems();
    fetchMenuItemTypes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🔹 Select an Image from the Gallery
  const pickImage = () => {
      const options: ImageLibraryOptions = {
        mediaType: 'photo' as const, // ✅ Ensure correct mediaType type
        quality: 1,
      };
      launchImageLibrary(options, (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorMessage) {
          console.error('Image Picker Error:', response.errorMessage);
        } else if (response.assets && response.assets.length > 0) {
          const selectedUri = response.assets[0].uri ?? null; // ✅ Ensure a valid string or null
          setImageUri(selectedUri);
        }
      });
    };

  // 🔹 Add New Menu Item to Supabase
  const addMenuItem = async () => {
    if (!menuItemName.trim() || !menuItemDescription.trim() || !menuItemPrice.trim() || !selectedMenuItemType) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setAdding(true);
    let imageUrl = null;

    // ✅ Upload Image if Selected
    if (imageUri) {
      try {
        const fileName = `${Date.now()}-${menuItemName.replace(/\s/g, '-')}.jpg`;
        const response = await fetch(imageUri);
        const blob = await response.blob();

        const { error } = await supabase.storage
          .from('menu_item_images')
          .upload(fileName, blob);

        if (error) {throw error;}

        // ✅ Get Public Image URL
        const { data: publicUrlData } = supabase.storage
          .from('menu_item_images')
          .getPublicUrl(fileName);

        imageUrl = publicUrlData.publicUrl;
      } catch (error) {
        console.error('Image Upload Error:', error);
        Alert.alert('Error', 'Failed to upload image.');
        setAdding(false);
        return;
      }
    }

    try {
      // ✅ Insert Data into Supabase Table
      const { error } = await supabase.from('menu_items').insert([
        {
          name: menuItemName.trim(),
          description: menuItemDescription.trim(),
          price: parseFloat(menuItemPrice),
          image_url: imageUrl,
          restaurant_id: restaurantId,
          menu_item_type_id: selectedMenuItemType,
        },
      ]);

      if (error) {throw error;}

      Alert.alert('Success', 'Menu item added successfully!');
      setMenuItemName('');
      setMenuItemDescription('');
      setMenuItemPrice('');
      setSelectedMenuItemType(null);
      setImageUri(null);
      fetchMenuItems(); // Refresh the menu list
    } catch (error) {
      console.error('Supabase Insert Error:', error);
      Alert.alert('Error', 'Failed to add menu item.');
    } finally {
      setAdding(false);
    }
  };

  const addMenuItemType = () => {
    setAddMenuItemTypeModalVisible(true);
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>{restaurantName} Menu</Text>

      {/* 🔹 Input Fields for Adding a New Menu Item */}
      <TextInput style={styles.input} placeholder="Menu Item Name" value={menuItemName} onChangeText={setMenuItemName} />
      <TextInput style={styles.input} placeholder="Description" value={menuItemDescription} onChangeText={setMenuItemDescription} />
      <TextInput style={styles.input} placeholder="Price" value={menuItemPrice} onChangeText={setMenuItemPrice} keyboardType="numeric" />

      <Text style={styles.label}>Select Menu Item Type:</Text>
      <View style={styles.sectionContainer}>
        <FlatList
          data={[...menuItemTypes, { id: 'add_button', name: 'add' }]} // ✅ Add a fake item for "+"
          horizontal
          keyExtractor={(item) => item.id}
          renderItem={({ item }) =>
            item.id !== 'add_button' ? (
              <TouchableOpacity
                style={[
                  styles.itemTypeButton,
                  selectedMenuItemType === item.id && styles.selectedItemType,
                ]}
                onPress={() => setSelectedMenuItemType(item.id)}>
                <Text
                  style={[
                    styles.itemTypeText,
                    selectedMenuItemType === item.id && styles.selectedItemTypeText,
                  ]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ) : (
              // ✅ "+" Button for Adding a New Menu Item Type
              <TouchableOpacity style={styles.addFoodTypeButton} onPress={addMenuItemType}>
                <Text style={styles.plusText}>+</Text>
              </TouchableOpacity>
            )
          }
        />
      </View>


      {/* 🔹 Image Picker */}
      <View style={styles.sectionContainer}>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          <Text style={styles.imagePickerText}>{imageUri ? 'Change image' : 'Pick an Image'}</Text>
        </TouchableOpacity>
      </View>

      {imageUri && (
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        {/* 🔹 Remove Image Button (X) */}
        <TouchableOpacity style={styles.removeImageButton} onPress={() => setImageUri(null)}>
          <Text style={styles.removeImageText}>✕</Text>
        </TouchableOpacity>
      </View>
      )}

      {/* 🔹 Add Menu Item Button */}
      <TouchableOpacity style={styles.addButton} onPress={addMenuItem} disabled={adding}>
        {adding ? <ActivityIndicator color="#FFF" /> : <Text style={styles.addButtonText}>Add Menu Item</Text>}
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator size="large" color="#B00020" />
      ) : (
        <FlatList
          data={menuItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.menuItemCard}
              onPress={() => setSelectedMenuItem(item)}
            >
              <Text style={styles.menuItemName}>{item.name}</Text>
              <Text style={styles.menuItemDescription}>{item.description}</Text>
              <Text style={styles.menuItemPrice}>{item.price} RSD</Text>
            </TouchableOpacity>
          )}
        />
      )}

        {selectedMenuItem && (
        <AdminEditMenuItemModal
          visible={!!selectedMenuItem}
          onClose={() => {
            setSelectedMenuItem(null);
            fetchMenuItems(); // ✅ Refresh Menu Items After Edit/Delete
          }}
          menuItem={selectedMenuItem}
          menuItemTypes={menuItemTypes}
          refreshMenu={fetchMenuItems}
        />

      )}

      <AdminAddMenuItemTypeModal
        visible={addMenuItemTypeModalVisible}
        onClose={() => setAddMenuItemTypeModalVisible(false)}
        fetchMenuItemTypes = {fetchMenuItemTypes}
      />
    </View>
  );
};

export default AdminMenuScreen;

const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: '#F5F5F5',
    },
    title: {
      fontSize: 26,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 15,
      color: '#B00020',
    },
    input: {
      backgroundColor: '#FFF',
      padding: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#DDD',
      marginBottom: 10,
      fontSize: 16,
      color: '#333',
    },
    label: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
    },
    sectionContainer: {
      marginBottom: 15, // ✅ Adds consistent spacing between sections
    },
    imagePicker: {
      backgroundColor: '#B00020',
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    imagePickerText: {
      color: '#FFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    addButton: {
      backgroundColor: '#B00020',
      padding: 14,
      borderRadius: 10,
      alignItems: 'center',
      marginBottom: 20,
    },
    addButtonText: {
      color: '#FFF',
      fontSize: 18,
      fontWeight: 'bold',
    },
    menuItemCard: {
      backgroundColor: '#FFF',
      padding: 15,
      marginVertical: 6,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#DDD',
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    menuItemName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
    },
    menuItemDescription: {
      fontSize: 14,
      color: '#666',
      marginVertical: 4,
    },
    menuItemPrice: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#B00020',
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
    itemTypeButton: {
      backgroundColor: '#DDD',
      height: 40,
      paddingVertical: 8,
      paddingHorizontal: 15,
      borderRadius: 20,
      marginRight: 8,
    },
    selectedItemType: {
      backgroundColor: '#B00020',
    },
    itemTypeText: {
      color: '#333',
    },
    selectedItemTypeText: {
      color: '#FFF',
    },
    addFoodTypeButton: {
      width: 25,
      height: 25,
      marginTop: 7,
      borderRadius: 20, // Circular shape
      backgroundColor: '#B00020',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 10, // Space from last item
    },
    plusText: {
      fontSize: 15,
      color: '#FFF',
      fontWeight: 'bold',
    },
  });

