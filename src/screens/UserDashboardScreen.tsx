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
  Modal,
} from 'react-native';
import { supabase } from '../../supabaseConfig'; // Import Supabase config
import { NavigationProps } from '../navigation/types';
import { useNavigation } from '@react-navigation/native';

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

const UserDashboardScreen = ()  => {
  const navigation = useNavigation<NavigationProps>();
  const [user, setUser] = useState<{ firstName: string; lastName: string } | null>(null);
  const [searchText, setSearchText] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [foodTypes, setFoodTypes] = useState<FoodType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFoodType, setSelectedFoodType] = useState<string | null>(null);
  const [isSidebarVisible, setSidebarVisible] = useState<boolean>(false);

  const fetchFoodTypes = async () => {
    const { data, error } = await supabase.from('food_types').select('*');
    if (error) {
      console.error('Error fetching food types:', error);
    } else {
      setFoodTypes(data);
    }
  };

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
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {return;}
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('firstName, lastName')
        .eq('id', data.user.id)
        .single();

      if (userError) {
        console.error('Error fetching user details:', userError);
      } else {
        setUser(userData);
      }
    };
    fetchUser();
  }, []);

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

  const openUserProfile = () => {
    navigation.navigate('UserProfileScreen');
  };


  return (
    <View style={styles.container}>

      <Modal visible={isSidebarVisible} animationType="slide" transparent={true}>
        <View style={styles.sidebarContainer}>
          <View style={styles.sidebarContent}>
            {/* Close Button */}
            <TouchableOpacity style={styles.closeButton} onPress={() => setSidebarVisible(false)}>
              <Text style={styles.closeButtonText}>X</Text>
            </TouchableOpacity>

            {/* User Info */}
            <Text style={styles.sidebarUser}>
              {user ? `${user.firstName} ${user.lastName}` : 'Loading...'}
            </Text>

            {/* Sidebar Options */}
            {[
              { name: 'Home', imgSrc: require('../assets/home.png') },
              { name: 'Vote/Order', imgSrc: require('../assets/voting-icon.png') },
              { name: 'Profile', imgSrc: require('../assets/user.png') },
              { name: 'Orders', imgSrc: require('../assets/orders-icon.png') },
              { name: 'Notifications', imgSrc: require('../assets/notification-icon.png') },
            ].map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.sidebarOption}
                onPress={() => {
                  setSidebarVisible(false);
                  if(item.name === 'Home')
                  {
                    navigation.navigate('UserDashboardScreen');
                  } else if(item.name === 'Notifications')
                  {
                    navigation.navigate('UserNotificationsScreen');
                  } else if(item.name === 'Orders')
                  {
                    navigation.navigate('UserOrdersScreen');
                  } else if(item.name === 'Profile')
                  {
                    navigation.navigate('UserProfileScreen');
                  }else
                  {
                    navigation.navigate('UserVoteOrderScreen');
                  }
                }}>
                <Image
                  source={item.imgSrc}
                  style={styles.sidebarOptionIcons}
                />
                <Text style={styles.sidebarOptionText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidebarVisible(true)}>
          <Image
            source={require('../assets/direction.png')}
            style={styles.sidebarIcon}
          />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
            <Image
              source={require('../assets/search-icon.png')}
              style={styles.searchIcon}
            />
            <TextInput
              placeholder="Search for food or restaurants..."
              placeholderTextColor="#888"
              value={searchText}
              onChangeText={setSearchText}
            />
        </View>
        <TouchableOpacity onPress={() => openUserProfile()}>
          <Image
            source={require('../assets/male-user-icon.png')}
            style={styles.profileIcon}
          />
        </TouchableOpacity>
      </View>
    <View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    marginBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#000',
  },
  profileIcon: {
    width: 40,
    height: 40,
    marginLeft: 10,
  },
  sidebarIcon: {
    width: 40,
    height: 40,
    marginRight: 10,
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
  sidebarContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sidebarContent: {
    width: '75%',
    height: '100%',
    backgroundColor: '#fff',
    padding: 20 },
    closeButton: {
    alignSelf: 'flex-end',
  },
  closeButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#B00020',
  },
  sidebarUser: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sidebarOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  iconPlaceholder: {
    width: 24,
    height: 24,
    marginRight: 10,
    backgroundColor: '#DDD',
    borderRadius: 5,
  },
  sidebarOptionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  sidebarOptionIcons: {
    width: 30,
    height: 30,
    marginRight: 15,
  },
});
