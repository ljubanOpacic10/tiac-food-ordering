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
} from 'react-native';
import { supabase } from '../../supabaseConfig';

// ✅ Define Interfaces
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

  // 🔹 Fetch Restaurants from Supabase
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
    fetchRestaurants();
    fetchFoodTypes();
  }, []);

  // 🔹 Add New Restaurant
  const addRestaurant = async () => {
    if (!restaurantName || !restaurantAddress || !selectedFoodType) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setAdding(true);
    const { error } = await supabase.from('restaurants').insert([
      {
        name: restaurantName,
        address: restaurantAddress,
        food_type_id: selectedFoodType,
      },
    ]);

    setAdding(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Restaurant added!');
      setRestaurantName('');
      setRestaurantAddress('');
      setSelectedFoodType('');
      fetchRestaurants(); // Refresh the list
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Restaurants</Text>

      {/* 🔹 Input Fields for Adding a New Restaurant */}
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

      {/* 🔹 Food Type Selection */}
      <Text style={styles.label}>Select Food Type:</Text>
      <View style={styles.foodTypeList}>
        <FlatList
          data={foodTypes}
          horizontal
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
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
          )}
        />
      </View>

      {/* 🔹 Add Restaurant Button (Reduced Extra Space) */}
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

      {/* 🔹 Loading Indicator */}
      {loading ? (
        <ActivityIndicator size="large" color="#B00020" />
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.restaurantCard}>
              <Text style={styles.restaurantName}>{item.name}</Text>
              <Text style={styles.restaurantAddress}>{item.address}</Text>

              {/* 🔹 Manage Menu Button */}
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => navigation.navigate('AdminMenuScreen', {
                  restaurantId: item.id,
                  restaurantName: item.name, // Pass restaurant name
                })}>
                <Text style={styles.menuButtonText}>Manage Menu</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
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
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  restaurantAddress: {
    fontSize: 14,
    color: '#666',
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
});
