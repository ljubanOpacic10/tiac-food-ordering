import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Button,
  Alert,
  TouchableOpacity,
} from 'react-native';
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

const AdminUsersScreen = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 🔹 Input Fields for New User
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [debt, setDebt] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // 🔹 Fetch Users
  const fetchUsers = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('type', 'user'); // 🔹 Fetch only users with type = 'user'

    if (error) {
      console.error('Supabase Error:', error);
    } else {
      setUsers(data as User[]);
      setFilteredUsers(data as User[]); // Initialize filtered list
    }

    setLoading(false);
  };


  useEffect(() => {
    fetchUsers();
  }, []);

  // 🔹 Handle Search Filtering
  useEffect(() => {
    const filtered = users.filter(user =>
      `${user.firstName} ${user.lastName} ${user.email}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchQuery, users]);

  // 🔹 Function to Add User
  const addUser = async () => {
    if (!firstName || !lastName || !email || !password || !debt) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    const debtValue = parseFloat(debt);
    if (isNaN(debtValue)) {
      Alert.alert('Error', 'Debt must be a valid number.');
      return;
    }

    // Step 1: Register User in Authentication
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      Alert.alert('Error', authError.message);
      return;
    }

    const userId = authData?.user?.id;
    if (!userId) {
      Alert.alert('Error', 'Failed to create user.');
      return;
    }

    // Step 2: Insert User into 'users' table
    const { error: insertError } = await supabase.from('users').insert([
      {
        id: userId,
        firstName,
        lastName,
        email,
        password,
        currentDebt: debtValue,
        type: 'user',
      },
    ]);

    if (insertError) {
      Alert.alert('Error', insertError.message);
      return;
    }

    // Refresh Users List
    fetchUsers();

    // Clear Input Fields
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setDebt('');

    Alert.alert('Success', 'User added successfully!');
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#B00020" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 🔹 Input Fields for New User */}
      <TextInput style={styles.input} placeholder="First Name" value={firstName} onChangeText={setFirstName} />
      <TextInput style={styles.input} placeholder="Last Name" value={lastName} onChangeText={setLastName} />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <TextInput style={styles.input} placeholder="Debt" value={debt} onChangeText={setDebt} keyboardType="numeric" />

      {/* 🔹 Add User Button */}
      <Button title="Add User" onPress={addUser} color="#B00020" />

      {/* 🔍 Search Bar Below Add User Button */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search users..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.userCard} onPress={() => setSelectedUser(item)}>
             <Text style={styles.userText}>
              {item.firstName} {item.lastName}
            </Text>
            <Text style={styles.emailText}>{item.email}</Text>
            <Text style={styles.debtText}>Debt: RSD {item.currentDebt.toFixed(2)}</Text>
          </TouchableOpacity>
        )}
      />

      {selectedUser && (
        <AdminUserModal
          visible={!!selectedUser}
          onClose={() => setSelectedUser(null)}
          user={selectedUser}
          refreshUsers={fetchUsers}
        />
      )}
    </View>
  );
};

export default AdminUsersScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F4F4F4',
  },
  input: {
    backgroundColor: '#FFF',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  searchBar: {
    backgroundColor: '#FFF',
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#AAA',
    marginTop: 15,
    marginBottom: 10,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userCard: {
    backgroundColor: '#FFF',
    padding: 12,
    marginVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  emailText: {
    fontSize: 14,
    color: '#666',
  },
  debtText: {
    fontSize: 14,
    color: '#B00020',
    marginTop: 4,
  },
});
