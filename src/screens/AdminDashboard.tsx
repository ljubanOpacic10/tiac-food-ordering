import React, {useState} from 'react';
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

const AdminDashboard = () => {
  const navigation = useNavigation<NavigationProps>();
  const [modalVisible, setModalVisible] = useState(false);
  const [email, setEmail] = useState('admin@tiacgroup.com');
  const [password, setPassword] = useState('admin123');
  const [votingModalVisible, setVotingModalVisible] = useState(false);
  const [orderingModalVisible, setOrderingModalVisible] = useState(false);
  const [sendNotificationModalVisible, setSendNotificationsModalVisible] = useState(false);

  const adminOptions = [
    {title: 'Users', image: require('../assets/users-icon.png')},
    {title: 'Restaurants', image: require('../assets/restaurants-icon.png')},
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
    {title: "Today's orders", image: require('../assets/orders-icon.png')},
    {title: 'Food types', image: require('../assets/food-types-icon.png')},
  ];

  function handleClickOnCard(title: string) {
    switch (title) {
      case 'Users':
        navigation.navigate('AdminUsersScreen');
        break;
      case 'Restaurants':
        navigation.navigate('AdminRestaurantsScreen');
        break;
      case "Today's orders":
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
      {/* Header with Search Bar and Profile Icon */}
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
          />
        </View>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Image
            source={require('../assets/female-admin-icon.png')}
            style={styles.profileIcon}
          />
        </TouchableOpacity>
      </View>

      {/* Grid Layout for Buttons */}
      <FlatList
        data={adminOptions}
        numColumns={2}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({item}) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => handleClickOnCard(item.title)}
          activeOpacity={0.7}  // Adds smooth click effect
          >
          <Image source={item.image} style={styles.cardImage} />
          <Text style={styles.cardText}>{item.title}</Text>
        </TouchableOpacity>

        )}
        contentContainerStyle={styles.gridContainer}
      />

      {/* Include AdminProfileModal */}
      <AdminProfileModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
      />

      {/* Modals for Voting and Ordering Sessions */}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    marginBottom: 10, // Creates better separation
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
