import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, TextInput } from 'react-native';
import { supabase } from '../../supabaseConfig';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker'; // For dropdowns
import { NavigationProps } from '../navigation/types';
import MultiSelectDropdown from '../components/MultiSelectDropdown';
interface Restaurant {
  id: string;
  name: string;
  votes: number;
  ordering_available: boolean;
}

interface VotingSession {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
}

interface OrderingSession {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  menu_item_type_id: string;
}

interface Order {
  id: string;
  user_id: string;
  restaurant_id: string;
  menu_item_ids: { menu_item_ids: string[] };
  total_price: number;
  description: string;
  status: string;
  created_at: string;
}

const UserVoteOrderScreen = () => {
  const [user, setUser] = useState<{id:string, firstName: string; lastName: string } | null>(null);
  const navigation = useNavigation<NavigationProps>();
  const [activeVotingSession, setActiveVotingSession] = useState<VotingSession | null>(null);
  const [activeOrderingSession, setActiveOrderingSession] = useState<OrderingSession | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>();
  const [todaysOrder, setTodaysOrder] = useState<Order | null>();
  const [selectedMenuItems, setSelectedMenuItems] = useState<MenuItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editable, setEditable] = useState(false);
  const [orderSubmited, setOrderSubmited] = useState(false);
  const [orderDescription, setOrderDescription] = useState<string>('');
  const [totalPrice, setTotalPrice] = useState<number>();
  const [firstPick, setFirstPick] = useState<string | null>(null);
  const [secondPick, setSecondPick] = useState<string | null>(null);
  const [thirdPick, setThirdPick] = useState<string | null>(null);

  const [firstPickEdited, setFirstPickEdited] = useState<string | null>(null);
  const [secondPickEdited, setSecondPickEdited] = useState<string | null>(null);
  const [thirdPickEdited, setThirdPickEdited] = useState<string | null>(null);


  useEffect(() => {
    fetchUser();
    fetchVotingSessions();
    fetchOrderingSessions();
    fetchRestaurants();
    const votingSubscription = supabase
      .channel('realtime-voting')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'voting_sessions' }, () => fetchVotingSessions())
      .subscribe();

    const orderingSubscription = supabase
      .channel('realtime-ordering')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ordering_sessions' }, () => fetchOrderingSessions())
      .subscribe();

    const restaurantSubscription = supabase
      .channel('realtime-restaurants')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants' }, () => fetchRestaurants())
      .subscribe();

    return () => {
      supabase.removeChannel(votingSubscription);
      supabase.removeChannel(restaurantSubscription);
      supabase.removeChannel(orderingSubscription);
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserVotes();
      fetchTodaysOrder();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchTodaysOrder = async () => {
    if (!user) {return;}

    setLoading(true);

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching today’s order:', error);
      setTodaysOrder(null);
    } else {
      const todayOrder = data.find((order) => order.created_at.split('T')[0] === today);
      fetchRestaurantById(todayOrder.restaurant_id);
      fetchMenuItemsById(todayOrder.menu_item_ids);
      setOrderDescription(todayOrder.description);
      setTodaysOrder(todayOrder);
    }

    setLoading(false);
  };

  const fetchMenuItemsById = async (menuItemIdsJson: any) => {
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

      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .in('id', menuItemIds);

      if (error) {
        console.error('Failed to fetch menu items:', error);
      } else if (data) {
        setSelectedMenuItems(data);
      }
    } catch (error) {
      console.error('Error processing menu item IDs:', error);
    }
  };

  const fetchRestaurantById = async (restaurantId: string) => {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single();

    if (error) {
      console.error('Failed to fetch restaurant:', error);
    } else {
      setSelectedRestaurant(data);
      setOrderSubmited(true);
    }
  };


  const fetchUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {return;}

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, firstName, lastName')
      .eq('id', data.user.id)
      .single();

    if (!userError) {
      setUser(userData);
    }
  };

  const fetchMenuItems = async (restaurant: Restaurant | null) => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurant?.id);

      if (error) {
        Alert.alert('Error:', error.message);
      } else {
        setMenuItems(data);
        setSelectedMenuItems([]);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    }

    setLoading(false);
  };


  const fetchVotingSessions = async () => {
    const { data: votingSessions } = await supabase
      .from('voting_sessions')
      .select('*')
      .eq('status', 'active')
      .single();

      setActiveVotingSession(votingSessions);
  };

  const fetchOrderingSessions = async () => {
    const { data: orderingSessions } = await supabase
      .from('ordering_sessions')
      .select('*')
      .eq('status', 'active')
      .single();

    setActiveOrderingSession(orderingSessions);
  };


  const fetchUserVotes = async () => {
    if (!user) {return;}

    setLoading(true);
    const { data, error } = await supabase
      .from('user_votes')
      .select('*')
      .eq('user_id', user.id);

    if (!error && data.length > 0) {
      setEditable(false);
      setEditable(false);

      const first = data.find((vote) => vote.pick === 'first');
      const second = data.find((vote) => vote.pick === 'second');
      const third = data.find((vote) => vote.pick === 'third');

      setFirstPick(first?.restaurant_id || null);
      setSecondPick(second?.restaurant_id || null);
      setThirdPick(third?.restaurant_id || null);
    } else{
      setEditable(true);
    }
    setLoading(false);
  };


  const fetchRestaurants = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('restaurants')
      .select('id, name, votes, ordering_available')
      .eq('ordering_available', true)
      .order('votes', { ascending: false });

    if (!error) {
      setRestaurants(data);
    }
    setLoading(false);
  };

  const submitVotes = async () => {
    if (!editable) {
      setEditable(true);
      return;
    }
    if(firstPick || secondPick || thirdPick)
    {
      if(firstPick){
        if(firstPick !== firstPickEdited){
          await supabase
          .from('restaurants')
          .update({ votes: restaurants.find((r) => r.id === firstPick)?.votes! + 3 })
          .eq('id', firstPick);
          await supabase
          .from('restaurants')
          .update({ votes: restaurants.find((r) => r.id === firstPickEdited)?.votes! - 3 })
          .eq('id', firstPickEdited);
          setFirstPickEdited(firstPick);
        }
      }
      if(secondPick){
        if(secondPick !== secondPickEdited){
          await supabase
          .from('restaurants')
          .update({ votes: restaurants.find((r) => r.id === secondPick)?.votes! + 2 })
          .eq('id', secondPick);
          await supabase
          .from('restaurants')
          .update({ votes: restaurants.find((r) => r.id === secondPickEdited)?.votes! - 2 })
          .eq('id', secondPickEdited);
        }
      }
      if(thirdPick){
        if(thirdPick !== thirdPickEdited){
          await supabase
          .from('restaurants')
          .update({ votes: restaurants.find((r) => r.id === thirdPick)?.votes! + 1 })
          .eq('id', thirdPick);
          await supabase
          .from('restaurants')
          .update({ votes: restaurants.find((r) => r.id === thirdPickEdited)?.votes! - 1 })
          .eq('id', thirdPickEdited);
        }
      }

      await supabase.from('user_votes').delete().neq('id', '');

      await supabase.from('user_votes').insert([
        { user_id: user?.id, restaurant_id: firstPick, pick: 'first' },
        { user_id: user?.id, restaurant_id: secondPick, pick: 'second' },
        { user_id: user?.id, restaurant_id: thirdPick, pick: 'third' },
      ]);
      setEditable(false);
      Alert.alert('Success', 'Your votes have been submitted!');
    } else{
      Alert.alert('Please select one restaurant.');
      return;
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#B00020" />;
  }

  const changeFirstPick = (value: string | null) => {
    setFirstPickEdited(firstPick);
    setFirstPick(value);
  };

  const changeSecondPick = (value: string | null) => {
    setSecondPickEdited(secondPick);
    setSecondPick(value);
  };

  const changeThirdPick = (value: string | null) => {
    setThirdPickEdited(thirdPick);
    setThirdPick(value);
  };

  const submitOrder = async () => {
    if(orderSubmited){
      setOrderSubmited(false);
      return;
    }
    if(todaysOrder){
      await editOrder();
      return;
    }
    if (!user || !selectedRestaurant || selectedMenuItems.length === 0) {
      Alert.alert('Error', 'Please select a restaurant and at least one menu item.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('orders').insert([
     {
      user_id: user.id,
      restaurant_id: selectedRestaurant.id,
      total_price: totalPrice,
      description: orderDescription,
      status: 'pending',
      menu_item_ids: JSON.stringify({ menu_item_ids: selectedMenuItems.map((item) => item.id) }), // Convert to JSON format
      created_at: new Date().toISOString(),
    },
    ]);

    setLoading(false);

    if (error) {
      Alert.alert('Error', 'Failed to submit order.');
      console.error( error);
    } else {
      Alert.alert('Success', 'Your order has been placed successfully!');
      setOrderSubmited(true);
    }
  };

  const editOrder = async () => {
    if (!user || !selectedRestaurant || selectedMenuItems.length === 0) {
      Alert.alert('Error', 'Please select a restaurant and at least one menu item.');
      return;
    }

    setLoading(true);

    const { error } = await supabase
    .from('orders')
    .update({
      user_id: user.id,
      restaurant_id: selectedRestaurant.id,
      total_price: totalPrice,
      description: orderDescription,
      status: 'pending',
      menu_item_ids: JSON.stringify({
        menu_item_ids: selectedMenuItems.map((item) => item.id),
      }),
      created_at: new Date().toISOString(),
    })
    .eq('id', todaysOrder?.id);

    setLoading(false);

    if (error) {
      Alert.alert('Error', 'Failed to submit order.');
      console.error( error);
    } else {
      Alert.alert('Success', 'Your order has been placed successfully!');
      setOrderSubmited(true);
    }
  };


  function onChange(selectedValues: MenuItem[]): void {
    setSelectedMenuItems(selectedValues);
    setTotalPrice(0);
    let sum = 0;
    selectedMenuItems.forEach((item) => {
      sum += item.price;
    });
    selectedValues.forEach((item) => {
      sum += item.price;
    });
    setTotalPrice(sum);
  }

  return (
    <View style={styles.container}>
      {activeVotingSession ? (
        <>
          <Text style={styles.title}>Voting Session</Text>
          <Text style={styles.subtitle}>Ends in 30 min at 11:00</Text>

          <Text style={styles.label}>First Pick</Text>
          <Picker
            selectedValue={firstPick}
            onValueChange={(value) => changeFirstPick(value)}
            enabled={editable}
            style={[styles.picker, !editable && styles.disabledPicker]}>
            {!firstPick && <Picker.Item label="Pick a restaurant" value={null} enabled={false} />}
            {restaurants.map((restaurant) => (
              <Picker.Item key={restaurant.id} label={restaurant.name} value={restaurant.id} />
            ))}
          </Picker>

          <Text style={styles.label}>Second Pick</Text>
          <Picker
            selectedValue={secondPick}
            onValueChange={(value) => changeSecondPick(value)}
            enabled={editable}
            style={[styles.picker, !editable && styles.disabledPicker]}>
            {!secondPick && <Picker.Item label="Pick a restaurant" value={null} enabled={false} />}
            {restaurants.map((restaurant) => (
              <Picker.Item key={restaurant.id} label={restaurant.name} value={restaurant.id} />
            ))}
          </Picker>

          <Text style={styles.label}>Third Pick</Text>
          <Picker
            selectedValue={thirdPick}
            onValueChange={(value) => changeThirdPick(value)}
            enabled={editable}
            style={[styles.picker, !editable && styles.disabledPicker]}>
            {!thirdPick && <Picker.Item label="Pick a restaurant" value={null} enabled={false} />}
            {restaurants.map((restaurant) => (
              <Picker.Item key={restaurant.id} label={restaurant.name} value={restaurant.id} />
            ))}
          </Picker>


          <TouchableOpacity style={styles.button} onPress={submitVotes}>
            <Text style={styles.buttonText}>{editable ? 'Submit Votes' : 'Edit Votes'}</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Colleagues Picked</Text>
          <FlatList
            data={restaurants.filter((r) => r.votes > 0)}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <View style={[styles.restaurantCard, index === 0 && styles.firstPlace, index === 1 && styles.secondPlace, index === 2 && styles.thirdPlace]}>
                <TouchableOpacity onPress={() => {
                  navigation.navigate('UserRestaurantMenuScreen', {
                  restaurantId: item.id,
                  restaurantName: item.name,
                });
                }}>
                <Text style={styles.restaurantName}>{item.name}</Text>
                <Text style={styles.voteCount}>{item.votes} points</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </>
      ) : activeOrderingSession ? (
        <>
          <Text style={styles.title}>Voting Session Ended</Text>
          <Text style={styles.subtitle}>Write your order</Text>

          <Text style={styles.sectionTitle}>Colleagues Picked</Text>
          <FlatList
            data={restaurants.filter((r) => r.votes > 0).slice(0,3)}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <View
                style={[
                  styles.restaurantCard,
                  index === 0 && styles.firstPlace,
                  index === 1 && styles.secondPlace,
                  index === 2 && styles.thirdPlace,
                ]}
                >
                <TouchableOpacity onPress={() => {
                  navigation.navigate('UserRestaurantMenuScreen', {
                  restaurantId: item.id,
                  restaurantName: item.name,
                });
                }}>
                <Text style={styles.restaurantName}>{item.name}</Text>
                <Text style={styles.voteCount}>votes: {item.votes}</Text>
                </TouchableOpacity>
              </View>
            )}
          />

          <Text style={styles.label}>Pick a Restaurant</Text>
          <Picker
            enabled={!orderSubmited}
            selectedValue={selectedRestaurant}
            onValueChange={(value) => {
              setSelectedRestaurant(value);
              fetchMenuItems(value);
            }}
            style={styles.picker}
          >
            <Picker.Item label = {
              selectedRestaurant
              ? `Selected: ${selectedRestaurant.name}`
              : 'Select a restaurant'
            } value={null} />
            {restaurants.filter((r) => r.votes > 0).slice(0,3).map((restaurant) => (
              <Picker.Item key={restaurant.id} label={restaurant.name} value={restaurant} />
            ))}
          </Picker>

          {selectedRestaurant && (
          <MultiSelectDropdown<MenuItem>
            label={`Choose what you want to eat from ${selectedRestaurant.name}`}
            options={menuItems}
            value={selectedMenuItems}
            onChange={onChange}
            labelKey="name"
            valueKey="id"
            labelDescription="price"
            enabled={!orderSubmited}
          />
        )}

          <Text style={styles.label}>Write Your Order</Text>
          <TextInput
            style={styles.textInput}
            editable = {!orderSubmited}
            placeholder="Any additional instructions?"
            value={orderDescription}
            onChangeText={setOrderDescription}
          />

          <TouchableOpacity style={styles.button} onPress={() => submitOrder()}>
            <Text style={styles.buttonText}>{orderSubmited ? 'Edit order' : 'Submit order'}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.title}>No active voting session</Text>
      )}
    </View>
  );
};

export default UserVoteOrderScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F5F5F5' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 10, color: '#B00020' },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 15, color: '#666' },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  picker: { backgroundColor: '#FFF', marginBottom: 10, borderRadius: 8 },
  button: { backgroundColor: '#B00020', padding: 12, borderRadius: 8, alignItems: 'center', marginVertical: 10 },
  buttonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, color: '#333' },
  restaurantCard: { backgroundColor: '#FFF', padding: 10, marginVertical: 6, borderRadius: 10 },
  firstPlace: { backgroundColor: '#FFD700' },
  secondPlace: { backgroundColor: '#C0C0C0' },
  thirdPlace: { backgroundColor: '#CD7F32' },
  restaurantName: { fontSize: 16, fontWeight: 'bold' },
  voteCount: { fontSize: 14, color: '#666' },
  textInput: { backgroundColor: '#FFF', padding: 10, borderRadius: 8, marginTop: 10 },
  disabledPicker: { backgroundColor: '#DDD' },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
});
