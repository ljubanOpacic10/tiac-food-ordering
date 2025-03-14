import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Welcome: undefined;
  UserLoginScreen: undefined;
  AdminLoginScreen: undefined;
  AdminDashboard: undefined;
  AdminFoodTypesScreen: undefined;
  AdminOrdersScreen: undefined;
  AdminRestaurantsScreen: undefined;
  AdminUsersScreen: undefined;
  UserDashboardScreen: undefined;
  AdminMenuScreen: undefined;
  UserRestaurantMenuScreen: {
    restaurantId: string;
    restaurantName: string;
  };
  UserProfileScreen: undefined;
  UserOrdersScreen: undefined;
  UserNotificationsScreen: undefined;
  UserVoteOrderScreen: undefined;
};

export type NavigationProps = NativeStackNavigationProp<RootStackParamList>;
