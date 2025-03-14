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
import AdminMenuScreen from './src/screens/AdminMenuScreen';
import UserRestaurantMenuScreen from './src/screens/UserRestaurantMenuScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import UserOrdersScreen from './src/screens/UserOrdersScreen';
import UserNotificationsScreen from './src/screens/UserNotificationsScreen';
import UserVoteOrderScreen from './src/screens/UserVoteOrderScreen';

const Stack = createStackNavigator();

function App(): React.JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="UserLoginScreen" component={UserLoginScreen} />
        <Stack.Screen name="AdminLoginScreen" component={AdminLoginScreen} />
        <Stack.Screen
          name="AdminDashboard"
          component={AdminDashboard}
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
        <Stack.Screen
          name="AdminMenuScreen"
          component={AdminMenuScreen}
        />
        <Stack.Screen
          name = "UserRestaurantMenuScreen"
          component={UserRestaurantMenuScreen}
        />
        <Stack.Screen
          name = "UserProfileScreen"
          component={UserProfileScreen}
        />
        <Stack.Screen
        name = "UserOrdersScreen"
        component={UserOrdersScreen}
        />
        <Stack.Screen
        name = "UserNotificationsScreen"
        component={UserNotificationsScreen}
        />
        <Stack.Screen
        name = "UserVoteOrderScreen"
        component={UserVoteOrderScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
