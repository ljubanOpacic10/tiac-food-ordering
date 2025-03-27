import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { supabase } from '../../supabaseConfig';

interface Order {
  id: string;
  user_id: string;
  restaurant_id: string;
  menu_item_ids: MenuItemIds; // JSON structure
  total_price: number;
  description: string;
  status: string;
}

interface MenuItemIds {
  menu_item_ids: string[]; // Array of menu item IDs
}


const AdminOrdersScreen = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [userNames, setUserNames] = useState<{ [key: string]: string }>({});
  const [restaurantNames, setRestaurantNames] = useState<{ [key: string]: string }>({});
  const [menuItems, setMenuItems] = useState<{ [key: string]: { name: string; price: number }[] }>({});

  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('orders').select('*');

    if (error) {
      Alert.alert('Error', 'Failed to fetch orders.');
      console.error('Supabase Error:', error);
    } else {
      setOrders(data);

      // Fetch Additional Data (Users, Restaurants, Menu Items)
      data.forEach(async (order) => {
        fetchUserById(order.user_id);
        fetchRestaurantById(order.restaurant_id);
        fetchMenuItemsById(order.menu_item_ids, order.id);
      });
    }
    setLoading(false);
  };


  useEffect(() => {
    fetchOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUserById = async (userId: string) => {
    if (userNames[userId]) {return;} // Skip if already fetched

    const { data, error } = await supabase
      .from('users')
      .select('firstName, lastName')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Failed to fetch user:', error);
    } else {
      setUserNames((prev) => ({ ...prev, [userId]: `${data.firstName} ${data.lastName}` }));
    }
  };

  const fetchRestaurantById = async (restaurantId: string) => {
    if (restaurantNames[restaurantId]) {return;} // Skip if already fetched

    const { data, error } = await supabase
      .from('restaurants')
      .select('name')
      .eq('id', restaurantId)
      .single();

    if (error) {
      console.error('Failed to fetch restaurant:', error);
    } else {
      setRestaurantNames((prev) => ({ ...prev, [restaurantId]: data.name }));
    }
  };

  const deleteOrder = async (orderId: string) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this order?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Delete',
        onPress: async () => {
          const { error } = await supabase.from('orders').delete().eq('id', orderId);

          if (error) {
            Alert.alert('Error', 'Failed to delete order.');
            console.error('Delete Order Error:', error);
          } else {
            Alert.alert('Success', 'Order deleted successfully!');
            setOrders((prevOrders) => prevOrders.filter((order) => order.id !== orderId));
          }
        },
      },
    ]);
  };


  const fetchMenuItemsById = async (menuItemIdsJson: any, orderId: string) => {
    if (menuItems[orderId]) {return;} // Skip if already fetched

    try {
      const parsed = typeof menuItemIdsJson === 'string' ? JSON.parse(menuItemIdsJson) : menuItemIdsJson;

      if (!parsed || !parsed.menu_item_ids || !Array.isArray(parsed.menu_item_ids)) {
        console.warn('Invalid JSON structure:', menuItemIdsJson);
        return;
      }

      const menuItemIds = parsed.menu_item_ids; // Extract menu item IDs

      if (menuItemIds.length === 0) {
        console.warn('No valid menu item IDs found:', menuItemIdsJson);
        return;
      }

      const { data, error } = await supabase
        .from('menu_items')
        .select('name, price')
        .in('id', menuItemIds);

      if (error) {
        console.error('Failed to fetch menu items:', error);
      } else if (data) {
        // Store an array of objects { name, price } instead of just names
        const formattedItems = data.map((item) => ({
          name: item.name,
          price: item.price,
        }));

        setMenuItems((prev) => ({ ...prev, [orderId]: formattedItems }));
      }
    } catch (error) {
      console.error('Error processing menu item IDs:', error);
    }
  };


  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      Alert.alert('Error', 'Failed to update order status.');
      console.error('Supabase Error:', error);
    } else {
      Alert.alert('Success', 'Order status updated!');
      fetchOrders(); // Refresh orders after update
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Orders</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#B00020" />
      ) : (
        <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <TouchableOpacity onPress={() => deleteOrder(item.id)} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>X</Text>
            </TouchableOpacity>

            <Text style={styles.orderId}>Order ID: {item.id}</Text>
            <Text style={styles.text}>User: {userNames[item.user_id] || 'Loading...'}</Text>
            <Text style={styles.text}>Restaurant: {restaurantNames[item.restaurant_id] || 'Loading...'}</Text>
            <Text style={styles.text}>Total: {item.total_price} RSD</Text>
            <Text style={styles.text}>Status: {item.status}</Text>
            <Text style={styles.text}>Description: {item.description}</Text>

            <Text style={styles.menuTitle}>Ordered Items:</Text>
            {menuItems[item.id] ? (
              menuItems[item.id].map((menuItem, index) => (
                <Text key={index} style={styles.menuItemText}>
                  • {menuItem.name} - {menuItem.price} RSD
                </Text>
              ))
            ) : (
              <Text style={styles.menuItemText}>Loading...</Text>
            )}

          <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.statusButton, item.status === 'pending' && styles.selectedStatus]}
            onPress={() => updateOrderStatus(item.id, 'pending')}>
            <Text style={styles.buttonText}>Pending</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statusButton, item.status === 'in_progress' && styles.selectedStatus]}
            onPress={() => updateOrderStatus(item.id, 'in_progress')}>
            <Text style={styles.buttonText}>In Progress</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statusButton, item.status === 'completed' && styles.selectedStatus]}
            onPress={() => updateOrderStatus(item.id, 'completed')}>
            <Text style={styles.buttonText}>Completed</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statusButton, item.status === 'canceled' && styles.selectedStatus]}
            onPress={() => updateOrderStatus(item.id, 'canceled')}>
            <Text style={styles.buttonText}>Canceled</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statusButton, item.status === 'paid' && styles.selectedStatus]}
            onPress={() => updateOrderStatus(item.id, 'paid')}>
            <Text style={styles.buttonText}>Canceled</Text>
          </TouchableOpacity>
          </View>
          </View>

        )}
      />

      )}
    </View>
  );
};

export default AdminOrdersScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#B00020',
  },
  orderCard: {
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
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  text: {
    fontSize: 14,
    color: '#666',
    marginVertical: 2,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
    color: '#333',
  },
  menuItemText: {
    fontSize: 14,
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  statusButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#DDD',
  },
  selectedStatus: {
    backgroundColor: '#B00020',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  deleteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#B00020',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  deleteButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});


