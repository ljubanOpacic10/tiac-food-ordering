import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  FlatList,
} from 'react-native';
import AdminProfileModal from '../modals/AdminProfileModal';
import {useNavigation} from '@react-navigation/native';
import {NavigationProps} from '../navigation/types';
import AdminStartEndVotingSessionModal from '../modals/AdminStartEndVotingSession';
import AdminStartEndOrderingSessionModal from '../modals/AdminStartEndOrderingSession';
import AdminSendNotificationModal from '../modals/AdminSendNotificationModal';
import { supabase } from '../../supabaseConfig';
import AdminUserModal from '../modals/AdminUserModal';
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  currentDebt: number;
  type: string;
}

interface Restaurant {
  id: string;
  name: string;
  address: string;
  food_type_id: string;
  image_url: string;
}

const AdminDashboard = () => {
  const navigation = useNavigation<NavigationProps>();
  const [modalVisible, setModalVisible] = useState(false);
  const [email, setEmail] = useState('admin@tiacgroup.com');
  const [password, setPassword] = useState('admin123');
  const [votingModalVisible, setVotingModalVisible] = useState(false);
  const [orderingModalVisible, setOrderingModalVisible] = useState(false);
  const [sendNotificationModalVisible, setSendNotificationsModalVisible] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>();
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);


  const adminOptions = [
    {
      title: 'Users',
      image: require('../assets/users-icon.png')},
    {
      title: 'Restaurants',
      image: require('../assets/restaurants-icon.png')},
    {
      title: 'Start/End voting session',
      image: require('../assets/voting-icon.png'),
    },
    {
      title: 'Start/End ordering session',
      image: require('../assets/ordering-icon.png'),
    },
    {
      title: 'Send notification',
      image: require('../assets/notification-icon.png'),
    },
    {title: 'Orders', image: require('../assets/orders-icon.png')},
    {title: 'Food types', image: require('../assets/food-types-icon.png')},
  ];

  useEffect(() => {
    fetchUsers();
    fetchRestaurants();
  }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('type', 'user');

    if (error) {
      console.error('Supabase Error:', error);
    } else {
      setUsers(data as User[]);
      setFilteredUsers(data as User[]);
    }
  };

  const fetchRestaurants = async () => {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*');
    if (error) {
      console.error('Supabase Error:', error);
    } else {
      setRestaurants(data as Restaurant[]);
      setFilteredRestaurants(data as Restaurant[]);
    }
  };

  useEffect(() => {
    const filteredUser = users.filter(user =>
      `${user.firstName} ${user.lastName} ${user.email}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );

    const filteredRests = restaurants.filter(restaurant =>
      restaurant.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    setFilteredUsers(filteredUser);
    setFilteredRestaurants(filteredRests);
  }, [searchQuery, users, restaurants]);

  function handleClickOnCard(title: string) {
    switch (title) {
      case 'Users':
        navigation.navigate('AdminUsersScreen');
        break;
      case 'Restaurants':
        navigation.navigate('AdminRestaurantsScreen');
        break;
      case 'Orders':
        navigation.navigate('AdminOrdersScreen');
        break;
      case 'Food types':
        navigation.navigate('AdminFoodTypesScreen');
        break;
      case 'Start/End voting session':
        setVotingModalVisible(true);
        break;
      case 'Start/End ordering session':
        setOrderingModalVisible(true);
        break;
      case 'Send notification':
        setSendNotificationsModalVisible(true);
        break;
      default:
        console.log('No screen found for:', title);
    }
  }

  return (
    <View style={styles.container}>
        <View style={styles.searchWrapper}>
          <View style={styles.header}>
            <View style={styles.searchContainer}>
              <Image
                source={require('../assets/search-icon.png')}
                style={styles.searchIcon}
              />
              <TextInput
                placeholder="Search restaurants and users"
                placeholderTextColor="#888"
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <TouchableOpacity onPress={() => setModalVisible(true)}>
              <Image
                source={require('../assets/female-admin-icon.png')}
                style={styles.profileIcon}
              />
            </TouchableOpacity>
          </View>

          {searchQuery.length > 0 && (
            <View style={styles.searchDropdown}>
              <Text style={styles.dropdownSectionTitle}>Users</Text>
              {filteredUsers.length === 0 ? (
                <Text style={styles.dropdownEmptyText}>No users found</Text>
              ) : (
                <FlatList
                  data={filteredUsers}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => setSelectedUser(item)}
                        activeOpacity={0.7}
                      >
                      <Text style={styles.dropdownItem}>
                        {item.firstName} {item.lastName} ({item.email})
                      </Text>
                    </TouchableOpacity>
                  )}
                  scrollEnabled
                  nestedScrollEnabled
                  style={styles.dropdownList}
                />
              )}

              <Text style={styles.dropdownSectionTitle}>Restaurants</Text>
              {filteredRestaurants.length === 0 ? (
                <Text style={styles.dropdownEmptyText}>No restaurants found</Text>
              ) : (
                <FlatList
                  data={filteredRestaurants}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => {
                        navigation.navigate('UserRestaurantMenuScreen', {
                          restaurantId: item.id,
                          restaurantName: item.name,
                        });
                      }}
                      activeOpacity={0.7}>
                      <Text style={styles.dropdownItem}>{item.name}</Text>
                    </TouchableOpacity>
                  )}
                  scrollEnabled
                  nestedScrollEnabled
                  style={styles.dropdownList}
                />
              )}
            </View>
          )}

        {selectedUser && (
          <AdminUserModal
            visible={!!selectedUser}
            onClose={() => setSelectedUser(null)}
            user={selectedUser}
            refreshUsers={fetchUsers}
          />
        )}
        </View>

      <FlatList
        data={adminOptions}
        numColumns={2}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({item}) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => handleClickOnCard(item.title)}
          activeOpacity={0.7}
          >
          <Image source={item.image} style={styles.cardImage} />
          <Text style={styles.cardText}>{item.title}</Text>
        </TouchableOpacity>

        )}
        contentContainerStyle={styles.gridContainer}
      />

      <AdminProfileModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
      />

      <AdminStartEndVotingSessionModal
        visible={votingModalVisible}
        onClose={() => setVotingModalVisible(false)}
      />

      <AdminStartEndOrderingSessionModal
        visible={orderingModalVisible}
        onClose={() => setOrderingModalVisible(false)}
      />

      <AdminSendNotificationModal
        visible={sendNotificationModalVisible}
        onClose={() => setSendNotificationsModalVisible(false)}
      />

    </View>
  );
};

export default AdminDashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B00020',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  searchWrapper: {
    position: 'relative',
    zIndex: 100,
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
  searchDropdown: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    maxHeight: 160,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 100,
  },
  dropdownList: {
    maxHeight: 70,
  },
  dropdownItem: {
    paddingVertical: 5,
    fontSize: 14,
    color: '#333',
  },
  dropdownEmptyText: {
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 5,
  },
  dropdownSectionTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 3,
    marginTop: 5,
    color: '#B00020',
  },
  profileIcon: {
    width: 40,
    height: 40,
    marginLeft: 10,
  },
  gridContainer: {
    marginTop: 20,
    paddingBottom: 20,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,  // Slightly reduced padding for compact look
    margin: 10,
    borderRadius: 15,  // Increased for a softer look
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,  // More elevation for a 3D effect
    minHeight: 120, // Ensures equal height for all cards
  },
  cardImage: {
    width: 50,
    height: 50,
    marginBottom: 10,
  },
  cardText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
});
