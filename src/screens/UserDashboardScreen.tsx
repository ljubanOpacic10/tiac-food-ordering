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
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [foodTypes, setFoodTypes] = useState<FoodType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFoodType, setSelectedFoodType] = useState<string | null>(null);

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
      setFilteredRestaurants(data);
    }
    setLoading(false);
  };

  // 🔹 Filter Menu Items by Selected Type
  const filterRestaurants = (foodTypeId: string) => {
    if (selectedFoodType === foodTypeId) {
      setSelectedFoodType(null);
      setFilteredRestaurants(restaurants);
    } else {
      setSelectedFoodType(foodTypeId);
      setFilteredRestaurants(restaurants.filter((item) => item.food_type_id === foodTypeId));
    }
  };

  useEffect(() => {
    fetchFoodTypes();
    fetchRestaurants();
  }, []);

  useEffect(() => {
    const filtered = restaurants.filter(restaurant =>
      `${restaurant.name}`
        .toLowerCase()
        .includes(searchText.toLowerCase())
    );
    setFilteredRestaurants(filtered);
  }, [searchText, restaurants]);

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
      <View>
{/* 🔹 Food Types (Categories) */}
<Text style={styles.sectionTitle}>Categories</Text>
      <FlatList
        data={foodTypes}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.categoriesContainer}
        renderItem={({ item }) => {
          const isSelected = selectedFoodType === item.id;
          return (
            <TouchableOpacity
              style={[styles.foodTypeCard, isSelected && styles.selectedFoodTypeCard]}
              onPress={() => {
                filterRestaurants(item.id);
              }}
              >
              <Image source={{ uri: item.image_url }} style={styles.foodTypeImage} />
              <Text style={[styles.foodTypeText, isSelected && styles.selectedFoodTypeText]}>
                {item.food_type}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* 🔹 Restaurants List */}
      <Text style={styles.sectionTitle}>Restaurants</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#B00020" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredRestaurants}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.restaurantsContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.restaurantCard}
              onPress={() => {
                navigation.navigate('UserRestaurantMenuScreen', {
                  restaurantId: item.id,
                  restaurantName: item.name,
                });
              }}
              >
              <Image source={{ uri: item.image_url }} style={styles.restaurantImage} />
              <Text style={styles.restaurantName}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      )}
      </View>
    </View>
  );
};

export default UserDashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
    paddingTop: 20,
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
    color: '#B00020',
    marginBottom: 10, // Consistent margin for both sections
  },
  categoriesContainer: {
    paddingBottom: 15, // Adds space between Categories and Restaurants
  },
  foodTypeCard: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 80, // Smaller height for categories
    width: 80, // Smaller width for categories
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
  },
  selectedFoodTypeCard: {
    backgroundColor: '#B00020',
    borderColor: '#B00020',
  },
  selectedFoodTypeText: {
    color: '#FFF',
  },
  foodTypeImage: {
    width: 50, // Smaller image size
    height: 50, // Smaller image size
    marginBottom: 5, // Reduced margin
  },
  foodTypeText: {
    fontSize: 12, // Smaller font size
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  restaurantsContainer: {
    paddingBottom: 20, // Adds space at the bottom of the list
  },
  restaurantCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 10,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  restaurantImage: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  loader: {
    marginTop: 20,
  },
});
