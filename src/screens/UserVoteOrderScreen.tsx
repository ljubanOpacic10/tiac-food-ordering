import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, TextInput } from 'react-native';
import { supabase } from '../../supabaseConfig';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker'; // For dropdowns
import { NavigationProps } from '../navigation/types';
import MultiSelect from 'react-native-multiple-select';

// ✅ Define Interfaces
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

const UserVoteOrderScreen = () => {
  const [user, setUser] = useState<{id:string, firstName: string; lastName: string } | null>(null);
  const navigation = useNavigation<NavigationProps>();
  const [activeVotingSession, setActiveVotingSession] = useState<VotingSession | null>(null);
  const [activeOrderingSession, setActiveOrderingSession] = useState<OrderingSession | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant>();
  const [selectedMenuItems, setSelectedMenuItems] = useState<string[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editable, setEditable] = useState(false); // Prevent editing until "Edit Votes" is clicked
  const [orderDescription, setOrderDescription] = useState<string>('');
  // 🔹 State for Selected Votes
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
    // ✅ Subscribe to real-time changes
    const votingSubscription = supabase
      .channel('realtime-voting')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'voting_sessions' }, () => fetchVotingSessions())
      .subscribe();

    const orderingSubscription = supabase
      .channel('realtime-ordering')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ordering_sessions' }, () => fetchVotingSessions())
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
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
        //implement
      } else {
        setMenuItems(data);
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


    // 🔹 Fetch User Votes & Set Initial Picks
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

      // ✅ Set previous picks from Supabase
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

  // 🔹 Handle Vote Submission
  const submitVotes = async () => {
    if (!editable) {
      // ✅ Toggle Edit Mode
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
    //implement
  };

  return (
    <View style={styles.container}>
      {activeVotingSession ? (
        <>
          {/* 🔹 Header */}
          <Text style={styles.title}>Voting Session</Text>
          <Text style={styles.subtitle}>Ends in 30 min at 11:00</Text>

          {/* 🔹 First Pick */}
          <Text style={styles.label}>First Pick</Text>
          <Picker
            selectedValue={firstPick}
            onValueChange={(value) => changeFirstPick(value)}
            enabled={editable}
            style={[styles.picker, !editable && styles.disabledPicker]}>
            {/* ✅ Show 'Pick a restaurant' only if firstPick is null */}
            {!firstPick && <Picker.Item label="Pick a restaurant" value={null} enabled={false} />}
            {restaurants.map((restaurant) => (
              <Picker.Item key={restaurant.id} label={restaurant.name} value={restaurant.id} />
            ))}
          </Picker>

          {/* 🔹 Second Pick */}
          <Text style={styles.label}>Second Pick</Text>
          <Picker
            selectedValue={secondPick}
            onValueChange={(value) => changeSecondPick(value)}
            enabled={editable}
            style={[styles.picker, !editable && styles.disabledPicker]}>
            {/* ✅ Show 'Pick a restaurant' only if secondPick is null */}
            {!secondPick && <Picker.Item label="Pick a restaurant" value={null} enabled={false} />}
            {restaurants.map((restaurant) => (
              <Picker.Item key={restaurant.id} label={restaurant.name} value={restaurant.id} />
            ))}
          </Picker>

          {/* 🔹 Third Pick */}
          <Text style={styles.label}>Third Pick</Text>
          <Picker
            selectedValue={thirdPick}
            onValueChange={(value) => changeThirdPick(value)}
            enabled={editable}
            style={[styles.picker, !editable && styles.disabledPicker]}>
            {/* ✅ Show 'Pick a restaurant' only if thirdPick is null */}
            {!thirdPick && <Picker.Item label="Pick a restaurant" value={null} enabled={false} />}
            {restaurants.map((restaurant) => (
              <Picker.Item key={restaurant.id} label={restaurant.name} value={restaurant.id} />
            ))}
          </Picker>


          {/* 🔹 Submit/Edit Votes Button */}
          <TouchableOpacity style={styles.button} onPress={submitVotes}>
            <Text style={styles.buttonText}>{editable ? 'Submit Votes' : 'Edit Votes'}</Text>
          </TouchableOpacity>

          {/* 🔹 Display Results */}
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
          {/* 🔹 Ordering Session */}
          <Text style={styles.title}>Voting Session Ended</Text>
          <Text style={styles.subtitle}>Write your order</Text>

          {/* 🔹 Display Results */}
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

          {/* 🔹 Select Restaurant */}
          <Text style={styles.label}>Pick a Restaurant</Text>
          <Picker
            selectedValue={selectedRestaurant}
            onValueChange={(value) => {
              setSelectedRestaurant(value);
              fetchMenuItems(value);
            }}
            style={styles.picker}
          >
            <Picker.Item label="Select a restaurant" value={null} />
            {restaurants.filter((r) => r.votes > 0).slice(0,3).map((restaurant) => (
              <Picker.Item key={restaurant.id} label={restaurant.name} value={restaurant} />
            ))}
          </Picker>

          {/* 🔹 Select Menu Item */}
          <MultiSelect
          items={menuItems.map(item => ({ id: item.id, name: `${item.name} - ${item.price} RSD` }))}
          uniqueKey="id"
          onSelectedItemsChange={setSelectedMenuItems}
          selectedItems={selectedMenuItems}
          selectText="Pick Menu Items"
          searchInputPlaceholderText="Search Items..."
          tagRemoveIconColor="#B00020"
          tagBorderColor="#B00020"
          tagTextColor="#B00020"
          selectedItemTextColor="#B00020"
          selectedItemIconColor="#B00020"
          itemTextColor="#000"
          displayKey="name"
          searchInputStyle={{ color: '#000' }}
          submitButtonColor="#B00020"
          submitButtonText="Confirm Selection"
        />

          {/* 🔹 Order Description */}
          <Text style={styles.label}>Write Your Order</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Any additional instructions?"
            value={orderDescription}
            onChangeText={setOrderDescription}
          />

          {/* 🔹 Submit Order Button */}
          <TouchableOpacity style={styles.button} onPress={() => submitOrder()}>
            <Text style={styles.buttonText}>Submit Order</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={styles.title}>No active voting session</Text>
      )}
    </View>
  );
};

export default UserVoteOrderScreen;

// 🔹 Styles
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
  disabledPicker: { backgroundColor: '#DDD' }, // ✅ Disable selection when read-only
});
