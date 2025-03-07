import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import WelcomeScreen from './src/screens/WelcomeScreen';
import UserLoginScreen from './src/screens/UserLoginScreen';
import AdminDashboard from './src/screens/AdminDashboard';
import AdminLoginScreen from './src/screens/AdminLoginScreen';
import AdminFoodTypesScreen from './src/screens/AdminFoodTypesScreen';
import AdminOrdersScreen from './src/screens/AdminOrdersScreen';
import AdminRestaurantsScreen from './src/screens/AdminRestaurantsScreen';
import AdminUsersScreen from './src/screens/AdminUsersScreen';
import UserDashboardScreen from './src/screens/UserDashboardScreen';

const Stack = createStackNavigator();

function App(): React.JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {backgroundColor: '#B00020'},
          headerTintColor: '#fff',
          headerTitle: '',
          headerShadowVisible: false,
        }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="UserLoginScreen" component={UserLoginScreen} />
        <Stack.Screen name="AdminLoginScreen" component={AdminLoginScreen} />
        <Stack.Screen
          name="AdminDashboard"
          component={AdminDashboard}
          options={{headerShown: false}} // ✅ Hides the header for AdminDashboard
        />
        <Stack.Screen name="AdminUsersScreen" component={AdminUsersScreen} />
        <Stack.Screen
          name="AdminRestaurantsScreen"
          component={AdminRestaurantsScreen}
        />
        <Stack.Screen name="AdminOrdersScreen" component={AdminOrdersScreen} />
        <Stack.Screen
          name="AdminFoodTypesScreen"
          component={AdminFoodTypesScreen}
        />
        <Stack.Screen
          name="UserDashboardScreen"
          component={UserDashboardScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
