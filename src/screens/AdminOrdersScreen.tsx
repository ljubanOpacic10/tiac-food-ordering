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

// ✅ Define Order Interface
interface Order {
  id: string;
  user_id: string;
  restaurant_id: string;
  menu_item_ids: { menu_item_ids: string[] };
  total_price: number;
  description: string;
  status: string;
}


const AdminOrdersScreen = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [userNames, setUserNames] = useState<{ [key: string]: string }>({});
  const [restaurantNames, setRestaurantNames] = useState<{ [key: string]: string }>({});
  const [menuItems, setMenuItems] = useState<{ [key: string]: string[] }>({});
  const [menuItemIds, setMenuItemIds] = useState<String[]>([]);

  // 🔹 Fetch Orders from Supabase
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
        fetchMenuItemsById(order.menu_items.items, order.id);
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🔹 Fetch User Name by ID
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

  // 🔹 Fetch Restaurant Name by ID
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

  // 🔹 Fetch Menu Item Names by ID
  const parseJsonToArray = (menuItemIdsJson: string) => {
    try {
      const parsedIds = JSON.parse(menuItemIdsJson);
      if (Array.isArray(parsedIds)) {
        setMenuItemIds(parsedIds);
      }
    } catch (error) {
      console.error('Error parsing menu item IDs:', error);
    }
  };

  // 🔹 Fetch Menu Items Individually
  const fetchMenuItemsById = async (menuItemIdsJson: string, orderId: string) => {
    if (menuItems[orderId]) {return;} // Skip if already fetched

   parseJsonToArray(menuItemIdsJson); // ✅ Get array of IDs

    if (menuItemIds.length === 0) {
      console.warn('No valid menu item IDs found:', menuItemIdsJson);
      return;
    }

    // 🔹 Fetch each menu item one by one
    for (const menuItemId of menuItemIds) {
      const { data, error } = await supabase
        .from('menu_items')
        .select('name')
        .eq('id', menuItemId)
        .single();

      if (error) {
        console.error(`Failed to fetch menu item ${menuItemId}:`, error);
      } else if (data) {
        setMenuItems((prev) => ({
          ...prev,
          [orderId]: data.name,
        }));
      }
    }
  };

  // 🔹 Update Order Status
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
              <Text style={styles.orderId}>Order ID: {item.id}</Text>
              <Text style={styles.text}>User: {userNames[item.user_id] || 'Loading...'}</Text>
              <Text style={styles.text}>Restaurant: {restaurantNames[item.restaurant_id] || 'Loading...'}</Text>
              <Text style={styles.text}>Total: {item.total_price} RSD</Text>
              <Text style={styles.text}>Status: {item.status}</Text>

              {/* 🔹 Menu Items List */}
              <Text style={styles.menuTitle}>Ordered Items: {'Loading...'}</Text>

              {/* 🔹 Status Update Buttons */}
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
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default AdminOrdersScreen;

// 🔹 Styles
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
});
