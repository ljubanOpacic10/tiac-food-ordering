import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { supabase } from '../../supabaseConfig';

interface RouteParams {
  restaurantId: string;
  restaurantName: string;
}

interface MenuItemType {
  id: string;
  name: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  menu_item_type_id: string;
}

const UserRestaurantMenuScreen = () => {
  const route = useRoute();
  const { restaurantId, restaurantName } = route.params as RouteParams;

  const [menuItemTypes, setMenuItemTypes] = useState<MenuItemType[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [filteredMenuItems, setFilteredMenuItems] = useState<MenuItem[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMenuItemTypes = async (restaurantId: string) => {
    try {
      const { data: menuItems, error: menuItemsError } = await supabase
        .from('menu_items')
        .select('menu_item_type_id')
        .eq('restaurant_id', restaurantId);

      if (menuItemsError) {
        console.error('Error fetching menu items:', menuItemsError);
        return;
      }

      const uniqueTypeIds = [...new Set(menuItems.map(item => item.menu_item_type_id))];

      if (uniqueTypeIds.length === 0) {
        console.log('No menu item types found for this restaurant.');
        setMenuItemTypes([]);
        return;
      }

      const { data: types, error: typesError } = await supabase
        .from('menu_item_types')
        .select('*')
        .in('id', uniqueTypeIds);

      if (typesError) {
        console.error('Error fetching menu item types:', typesError);
      } else {
        setMenuItemTypes(types);
      }
    } catch (error) {
      console.error('Unexpected error fetching menu item types:', error);
    }
  };


  const fetchMenuItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', restaurantId);

    if (error) {
      console.error('Error fetching menu items:', error);
    } else {
      setMenuItems(data);
      setFilteredMenuItems(data); // Initially, all menu items are shown
    }
    setLoading(false);
  };

  useEffect(() => {
    if (restaurantId) {
        fetchMenuItemTypes(restaurantId);
      }
    fetchMenuItems();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  const filterMenuItems = (typeId: string) => {
    if (selectedType === typeId) {
      setSelectedType(null);
      setFilteredMenuItems(menuItems);
    } else {
      setSelectedType(typeId);
      setFilteredMenuItems(menuItems.filter((item) => item.menu_item_type_id === typeId));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.restaurantTitle}>{restaurantName} Menu</Text>
      <View>
      <Text style={styles.sectionTitle}>Categories</Text>
      <FlatList
        data={menuItemTypes}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.foodTypeList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.foodTypeCard,
              selectedType === item.id && styles.selectedFoodTypeCard,
            ]}
            onPress={() => filterMenuItems(item.id)}>
            <Text
              style={[
                styles.foodTypeText,
                selectedType === item.id && styles.selectedFoodTypeText,
              ]}>
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />

      <Text style={styles.sectionTitle}>Menu</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#B00020" />
      ) : (
        <FlatList
          data={filteredMenuItems}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.menuItemCard}>
              {item.image_url && <Image source={{ uri: item.image_url }} style={styles.menuItemImage} />}
              <View style={styles.menuItemInfo}>
                <Text style={styles.menuItemName}>{item.name}</Text>
                <Text style={styles.menuItemDescription}>{item.description}</Text>
                <Text style={styles.menuItemPrice}>{item.price} RSD</Text>
              </View>
            </View>
          )}
        />
      )}
      </View>
    </View>
  );
};

export default UserRestaurantMenuScreen;

const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: '#F5F5F5',
    },
    restaurantTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 10,
      color: '#B00020',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 5,
      color: '#333',
    },
    foodTypeList: {
      paddingBottom: 5,
    },
    foodTypeCard: {
      height: 40,
      backgroundColor: '#DDD',
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderRadius: 20,
      marginRight: 10,
    },
    selectedFoodTypeCard: {
      backgroundColor: '#B00020',
    },
    foodTypeText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#333',
    },
    selectedFoodTypeText: {
      color: '#FFF',
    },
    menuItemCard: {
      flexDirection: 'row',
      backgroundColor: '#FFF',
      padding: 10,
      marginVertical: 5,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#DDD',
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    menuItemImage: {
      width: 80,
      height: 80,
      borderRadius: 10,
      marginRight: 10,
    },
    menuItemInfo: {
      flex: 1,
    },
    menuItemName: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#333',
    },
    menuItemDescription: {
      fontSize: 14,
      color: '#666',
      marginVertical: 2,
    },
    menuItemPrice: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#B00020',
    },
  });
