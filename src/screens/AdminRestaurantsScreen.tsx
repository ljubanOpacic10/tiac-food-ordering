import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Image,
} from 'react-native';
import { supabase } from '../../supabaseConfig';
import AdminAddFoodTypeModal from '../modals/AdminAddFoodTypeModal';
import { ImageLibraryOptions, launchImageLibrary } from 'react-native-image-picker';

interface Restaurant {
  id: string;
  name: string;
  address: string;
  food_type_id: string;
}

interface FoodType {
  id: string;
  food_type: string;
  image_url?: string;
}

const AdminRestaurantsScreen = ({ navigation }: any) => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [foodTypes, setFoodTypes] = useState<FoodType[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantAddress, setRestaurantAddress] = useState('');
  const [selectedFoodType, setSelectedFoodType] = useState('');
  const [adding, setAdding] = useState(false);
  const [addFoodTypeModalVisible, setAddFoodTypeModalVisible] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);

  const fetchRestaurants = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('restaurants').select('*');

    if (error) {
      Alert.alert('Error', 'Failed to fetch restaurants.');
      console.error('Supabase Error:', error);
    } else {
      setRestaurants(data);
    }
    setLoading(false);
  };

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
    fetchRestaurants();
    fetchFoodTypes();
  }, []);

  const addFoodType = async () => {
    setAddFoodTypeModalVisible(true);
  };

  const deleteRestaurant = async (restaurantId: string) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this restaurant?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('restaurants')
                .delete()
                .eq('id', restaurantId);

              if (error) {
                throw error;
              }

              setRestaurants((prev) =>
                prev.filter((restaurant) => restaurant.id !== restaurantId)
              );

              Alert.alert('Success', 'Restaurant deleted successfully!');
            } catch (error) {
              console.error('Delete Error:', error);
              Alert.alert('Error', 'Failed to delete restaurant.');
            }
          },
        },
      ]
    );
  };


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

  const addRestaurant = async () => {
    if (!restaurantName.trim()) {
      Alert.alert('Error', 'Please fill in the restaurant name field.');
      return;
    }

    setAdding(true);
    let imageUrl = null;

    if (imageUri) {
      try {
        const fileName = `${Date.now()}-${restaurantName.replace(/\s/g, '-')}.jpg`;
        const response = await fetch(imageUri);

        if (!response.ok) {
          throw new Error('Failed to fetch image from URI.');
        }

        const blob = await response.blob();

        const uploadResult = await supabase.storage
          .from('restaurants_images')
          .upload(fileName, blob, { contentType: 'image/jpeg' });

        if (uploadResult.error) {
          throw new Error(uploadResult.error.message);
        }

        const { data: publicUrlData } = supabase.storage
          .from('restaurants_images')
          .getPublicUrl(fileName);
        imageUrl = publicUrlData.publicUrl || null;
      } catch (uploadError) {
        Alert.alert('Error', 'Failed to upload image.');
        console.error('Image Upload Error:', uploadError);
        setAdding(false);
        return;
      }
    }

    try {
      const { error } = await supabase.from('restaurants').insert([
        {
          name: restaurantName,
          address: restaurantAddress || null, // Allow optional address
          image_url: imageUrl,
          food_type_id: selectedFoodType || null, // Allow optional selection
        },
      ]);

      if (error) {throw error;}

      Alert.alert('Success', 'Restaurant added successfully!');
      setRestaurantName('');
      setRestaurantAddress('');
      setSelectedFoodType('');
      setImageUri(null);
      fetchRestaurants(); // Refresh the list
    } catch (dbError) {
      Alert.alert('Error');
      console.error('Database Insert Error:', dbError);
    } finally {
      setAdding(false);
    }
  };


  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Restaurants</Text>

      <TextInput
        style={styles.input}
        placeholder="Restaurant Name"
        value={restaurantName}
        onChangeText={setRestaurantName}
      />
      <TextInput
        style={styles.input}
        placeholder="Address"
        value={restaurantAddress}
        onChangeText={setRestaurantAddress}
      />

      <Text style={styles.label}>Select Food Type:</Text>
      <View style={styles.foodTypeList}>
        <FlatList
          data={[...foodTypes, { id: 'add_button', food_type: 'add' }]} // Add a fake item for "+"
          horizontal
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) =>
            item.id !== 'add_button' ? (
              <TouchableOpacity
                style={[
                  styles.foodTypeButton,
                  selectedFoodType === item.id && styles.selectedFoodType,
                ]}
                onPress={() => setSelectedFoodType(item.id)}>
                <Text
                  style={[
                    styles.foodTypeText,
                    selectedFoodType === item.id && styles.selectedFoodTypeText,
                  ]}>
                  {item.food_type}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.addFoodTypeButton} onPress={addFoodType}>
                <Text style={styles.plusText}>+</Text>
              </TouchableOpacity>
            )
          }
        />
      </View>

      <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
        <Text style={styles.imagePickerText}>{imageUri ? 'Change Image' : 'Pick Restaurant Image'}</Text>
      </TouchableOpacity>

      {imageUri && (
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        <TouchableOpacity style={styles.removeImageButton} onPress={() => setImageUri(null)}>
          <Text style={styles.removeImageText}>✕</Text>
        </TouchableOpacity>
      </View>
      )}

      <TouchableOpacity
        style={styles.addButton}
        onPress={addRestaurant}
        disabled={adding}>
        {adding ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.addButtonText}>Add Restaurant</Text>
        )}
      </TouchableOpacity>

      {loading ? (
      <ActivityIndicator size="large" color="#B00020" />
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.restaurantCard}>
              <View style={styles.restaurantInfoContainer}>
                <View>
                  <Text style={styles.restaurantName}>{item.name}</Text>
                  <Text style={styles.restaurantAddress}>{item.address}</Text>
                </View>

                <TouchableOpacity onPress={() => deleteRestaurant(item.id)}>
                  <Image source={require('../assets/trashcan.png')} style={styles.trashIcon} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.menuButton}
                onPress={() =>
                  navigation.navigate('AdminMenuScreen', {
                    restaurantId: item.id,
                    restaurantName: item.name, // Pass restaurant name
                  })
                }>
                <Text style={styles.menuButtonText}>Manage Menu</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}


      <AdminAddFoodTypeModal
        visible={addFoodTypeModalVisible}
        onClose={() => setAddFoodTypeModalVisible(false)}
        fetchFoodTypes={fetchFoodTypes}
      />
    </View>
  );
};

export default AdminRestaurantsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
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
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  foodTypeList: {
    marginBottom: 10, // Reduced spacing
    height: 50, // Set a height to prevent excessive blank space
  },
  foodTypeButton: {
    backgroundColor: '#DDD',
    height: 40,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 8, // Adjusted margin
  },
  selectedFoodType: {
    backgroundColor: '#B00020',
  },
  foodTypeText: {
    color: '#333',
  },
  selectedFoodTypeText: {
    color: '#FFF',
  },
  addButton: {
    backgroundColor: '#B00020',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 5, // Reduced margin to move it closer
    marginBottom: 15, // Adjusted margin
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  restaurantCard: {
    backgroundColor: '#FFF',
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  restaurantInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  restaurantAddress: {
    fontSize: 14,
    color: '#666',
  },
  trashIcon: {
    width: 24,
    height: 24,
    tintColor: '#B00020',
  },
  menuButton: {
    marginTop: 10,
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  menuButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addFoodTypeButton: {
    width: 25,
    height: 25,
    marginTop: 7,
    borderRadius: 20, // Makes it circular
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
});
