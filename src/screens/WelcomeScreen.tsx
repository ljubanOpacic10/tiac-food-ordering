import React from 'react';
import {View, Text, TouchableOpacity, Image, StyleSheet} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NavigationProps} from '../navigation/types';

const WelcomeScreen = () => {
  const navigation = useNavigation<NavigationProps>();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tiac Food Ordering</Text>
      <Text style={styles.subtitle}>Choose how you want to login</Text>

      {/* User Login Option */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('UserLoginScreen')}>
        <View style={styles.userImages}>
          <Image
            source={require('../assets/male-user-icon.png')}
            style={styles.imageLeft}
          />
          <Image
            source={require('../assets/female-user-icon.png')}
            style={styles.imageRigth}
          />
        </View>

        <Text style={styles.cardText}>User</Text>
      </TouchableOpacity>

      {/* Admin Login Option */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('AdminLoginScreen')}>
        <Image
          source={require('../assets/female-admin-icon.png')}
          style={styles.image}
        />
        <Text style={styles.cardText}>Admin</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>Welcome</Text>
    </View>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#B00020',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 20,
  },
  card: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    padding: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  userImages: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  image: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  imageLeft: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 10,
    right: -10,
  },
  imageRigth: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    marginBottom: 10,
    left: -10,
    zIndex: 1,
  },
  cardText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B00020',
  },
  footer: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
  },
});
