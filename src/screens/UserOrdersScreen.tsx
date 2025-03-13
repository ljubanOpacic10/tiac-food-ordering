import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { supabase } from '../../supabaseConfig';

// ✅ Define Interfaces
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  currentDebt: number;
  type: string;
}

interface Order {
  id: string;
  user_id: string;
  restaurant_id: string;
  menu_item_ids: { menu_item_ids: string[] };
  total_price: number;
  description: string;
  status: string;
}

const UserOrdersScreen = () => {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantNames, setRestaurantNames] = useState<{ [key: string]: string }>({});
  const [menuItems, setMenuItems] = useState<{ [key: string]: { name: string; price: number }[] }>({});

  // ✅ Fetch User Details from Supabase Auth
  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        setLoading(false);
        Alert.alert('Error', 'Failed to fetch user details.');
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (userError) {
        Alert.alert('Error', 'Could not retrieve user data.');
      } else {
        setUser(userData);
      }
      setLoading(false);
    };

    fetchUser();
  }, []);

  // ✅ Fetch User Orders
  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // ✅ Runs only when user is loaded

  const fetchOrders = async () => {
    if (!user?.id) {return;} // ✅ Ensure user is loaded before fetching orders
    setLoading(true);

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id); // ✅ Fetch only orders of the logged-in user

    if (error) {
      Alert.alert('Error', 'Failed to fetch orders.');
      console.error('Supabase Error:', error);
    } else {
      setOrders(data);

      // Fetch Additional Data (Restaurants, Menu Items)
      data.forEach(async (order) => {
        fetchRestaurantById(order.restaurant_id);
        fetchMenuItemsById(order.menu_item_ids, order.id);
      });
    }
    setLoading(false);
  };

  // ✅ Fetch Restaurant Name
  const fetchRestaurantById = async (restaurantId: string) => {
    if (restaurantNames[restaurantId]) return; // ✅ Skip if already fetched

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

  // ✅ Fetch Menu Items
  const fetchMenuItemsById = async (menuItemIdsJson: any, orderId: string) => {
    if (menuItems[orderId]) return; // ✅ Skip if already fetched

    try {
      const parsed = typeof menuItemIdsJson === 'string' ? JSON.parse(menuItemIdsJson) : menuItemIdsJson;

      if (!parsed || !parsed.menu_item_ids || !Array.isArray(parsed.menu_item_ids)) {
        console.warn('Invalid JSON structure:', menuItemIdsJson);
        return;
      }

      const menuItemIds = parsed.menu_item_ids;

      if (menuItemIds.length === 0) {
        console.warn('No valid menu item IDs found:', menuItemIdsJson);
        return;
      }

      // ✅ Fetch multiple menu items in one query
      const { data, error } = await supabase
        .from('menu_items')
        .select('name, price')
        .in('id', menuItemIds);

      if (error) {
        console.error('Failed to fetch menu items:', error);
      } else if (data) {
        setMenuItems((prev) => ({ ...prev, [orderId]: data }));
      }
    } catch (error) {
      console.error('Error processing menu item IDs:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Orders</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#B00020" />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.orderCard}>
              <Text style={styles.orderId}>Order ID: {item.id}</Text>
              <Text style={styles.text}>Restaurant: {restaurantNames[item.restaurant_id] || 'Loading...'}</Text>
              <Text style={styles.text}>Total: {item.total_price} RSD</Text>
              <Text style={styles.text}>Status: {item.status}</Text>
              <Text style={styles.text}>Description: {item.description}</Text>

              {/* 🔹 Menu Items List */}
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
            </View>
          )}
        />
      )}
    </View>
  );
};

export default UserOrdersScreen;

// 🔹 Styles
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F5F5F5' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, color: '#B00020' },
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
  orderId: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  text: { fontSize: 14, color: '#666', marginVertical: 2 },
  menuTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 5, color: '#333' },
  menuItemText: { fontSize: 14, color: '#666' },
});
