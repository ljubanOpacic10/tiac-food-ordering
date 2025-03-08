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
          {imageUri ? 'Image Selected' : 'Pick an image'}
        </Text>
      </TouchableOpacity>

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
    backgroundColor: '#FFF',
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  foodTypeText: {
    color: '#333',
    textAlign: 'center',
  },
});
