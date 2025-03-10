import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { supabase } from '../../supabaseConfig'; // Import Supabase config

interface Restaurant {
id: string;
name: string;
address: string;
food_type_id: string;
image_url: string;
}

interface FoodType {
id: string;
food_type: string;
image_url?: string;
}

const UserDashboardScreen = ({ navigation }: any)  => {
  const [searchText, setSearchText] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [foodTypes, setFoodTypes] = useState<FoodType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant[]>();
  const [selectedFoodType, setSelectedFoodType] = useState<FoodType>();

  // 🔹 Fetch Food Types from Supabase
  const fetchFoodTypes = async () => {
    const { data, error } = await supabase.from('food_types').select('*');
    if (error) {
      console.error('Error fetching food types:', error);
    } else {
      setFoodTypes(data);
    }
  };

  // 🔹 Fetch Restaurants from Supabase
  const fetchRestaurants = async () => {
    const { data, error } = await supabase.from('restaurants').select('*');
    if (error) {
      console.error('Error fetching restaurants:', error);
    } else {
      setRestaurants(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFoodTypes();
    fetchRestaurants();
  }, []);

  return (
    <View style={styles.container}>
      {/* 🔹 Search Bar */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search for food or restaurants..."
        placeholderTextColor="#888"
        value={searchText}
        onChangeText={setSearchText}
      />

      {/* 🔹 Food Types (Glovo Style) */}
      <Text style={styles.sectionTitle}>Categories</Text>
      <FlatList
        data={foodTypes}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.foodTypeList}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.foodTypeCard}>
            <Image source={{ uri: item.image_url }} style={styles.foodTypeImage} />
            <Text style={styles.foodTypeText}>{item.food_type}</Text>
          </TouchableOpacity>
        )}
      />

      {/* 🔹 Restaurants List */}
      <Text style={styles.sectionTitle}>Restaurants</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#B00020" />
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.restaurantCard}
              onPress={() =>
                navigation.navigate('RestaurantMenuScreen', { restaurantId: item.id, restaurantName: item.name })
              }>
              <Image source={{ uri: item.image_url }} style={styles.restaurantImage} />
              <Text style={styles.restaurantName}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

export default UserDashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
  },
  searchBar: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 10,
    marginVertical: 15,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#B00020',
  },
  foodTypeList: {
    paddingBottom: 10,
  },
  foodTypeCard: {
    alignItems: 'center',
    marginRight: 15,
  },
  foodTypeImage: {
    width: 80,
    height: 80,
    borderRadius: 50,
    marginBottom: 5,
  },
  foodTypeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  restaurantCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 10,
    marginVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDD',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  restaurantImage: {
    width: '100%',
    height: 120,
    borderRadius: 10,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#333',
  },
});
