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
import {ImageLibraryOptions, launchImageLibrary} from 'react-native-image-picker';
import { supabase } from '../../supabaseConfig';

// ✅ Define Food Type Interface
interface FoodType {
  id: string;
  food_type: string;
  image_url?: string;
}

const AdminFoodTypesScreen = () => {
  const [foodTypes, setFoodTypes] = useState<FoodType[]>([]);
  const [loading, setLoading] = useState(true);
  const [foodTypeName, setFoodTypeName] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // 🔹 Fetch Food Types from Supabase
  const fetchFoodTypes = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('food_types').select('*');

    if (error) {
      Alert.alert('Error', 'Failed to fetch food types.');
      console.error('Supabase Error:', error);
    } else {
      setFoodTypes(data);
    }
    setLoading(false);
  };

  const deleteFoodType = async (foodTypeId: string) => {
    Alert.alert(
      'Delete Food Type',
      'Are you sure you want to delete this food type?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // ✅ Delete from Supabase
            const { error } = await supabase
              .from('food_types')
              .delete()
              .eq('id', foodTypeId);

            if (error) {
              Alert.alert('Error', 'Failed to delete food type.');
              console.error(error);
              return;
            }

            // ✅ Refresh List after Deletion
            setFoodTypes((prevFoodTypes) => prevFoodTypes.filter((food) => food.id !== foodTypeId));
            Alert.alert('Success', 'Food type deleted!');
          },
        },
      ]
    );
  };


  useEffect(() => {
    fetchFoodTypes();
  }, []);

  // 🔹 Select an Image from the Gallery
  // 🔹 Function to Pick Image from Gallery
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


  // 🔹 Add New Food Type to Supabase
  const addFoodType = async () => {
    if (!foodTypeName) {
      Alert.alert('Error', 'Please enter a food type name.');
      return;
    }

    setUploading(true);
    let imageUrl = null;

    // ✅ Upload Image if Selected
    if (imageUri) {
        const fileName = `${Date.now()}-${foodTypeName.replace(/\s/g, '-')}.jpg`;
        const response = await fetch(imageUri);
        const blob = await response.blob();

        const { error } = await supabase.storage
          .from('food_type_images')
          .upload(fileName, blob);

        if (error) {throw error;}

        // Get Public Image URL
        const { data: publicUrlData } = supabase.storage
          .from('food_type_images')
          .getPublicUrl(fileName);
        imageUrl = publicUrlData.publicUrl;
    }

    // ✅ Insert Data into Supabase Table
    const { error } = await supabase.from('food_types').insert([
      { food_type: foodTypeName, image_url: imageUrl },
    ]);

    setUploading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Food type added!');
      setFoodTypeName('');
      setImageUri(null);
      fetchFoodTypes(); // Refresh list
    }
  };

  return (
    <View style={styles.container}>
      {/* 🔹 Input Fields for New Food Type */}
      <TextInput
        style={styles.input}
        placeholder="Enter food type name"
        value={foodTypeName}
        onChangeText={setFoodTypeName}
      />

      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        <Text style={styles.imagePickerText}>
          {imageUri ? 'Change image' : 'Pick an image'}
        </Text>
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


      <TouchableOpacity style={styles.addButton} onPress={addFoodType} disabled={uploading}>
        {uploading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.addButtonText}>Add food type</Text>}
      </TouchableOpacity>

      {/* 🔹 Loading Indicator */}
      {loading ? (
        <ActivityIndicator size="large" color="#B00020" />
      ) : (
        <FlatList
          data={foodTypes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.foodTypeCard}>
              <Text style={styles.foodTypeText}>{item.food_type}</Text>
              {/* 🔹 Trash Icon for Deleting */}
              <TouchableOpacity onPress={() => deleteFoodType(item.id)}>
                <Image source={require('../assets/trashcan.png')} style={styles.trashIcon} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

    </View>
  );
};

export default AdminFoodTypesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  input: {
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    marginBottom: 10,
  },
  imagePicker: {
    backgroundColor: '#B00020',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  imagePickerText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#B00020',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  foodTypeCard: {
    flexDirection: 'row', // ✅ Align text and icon in the same row
    justifyContent: 'space-between', // ✅ Pushes text and icon apart
    alignItems: 'center',
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
  foodTypeText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  trashIcon: {
    width: 24,
    height: 24,
    tintColor: '#B00020', // ✅ Same red theme color
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
});
