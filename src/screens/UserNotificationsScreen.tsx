import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { supabase } from '../../supabaseConfig';


interface UserNotification {
  id: string;
  user_id: string;
  notification_id: string;
  read: boolean;
  created_at: string;
  message: string;
  type: string;
  sender_user_id: string;
  status: string;
}

const UserNotificationsScreen = () => {
  const [userNotifications, setUserNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showRead, setShowRead] = useState(false);

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

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) {return;}
    setLoading(true);
    const { data: userNotificationsData, error: userNotificationsError } = await supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', user.id);
    if (userNotificationsError) {
      setLoading(false);
      Alert.alert('Error', 'Failed to fetch notifications.');
      console.error('Supabase Error:', userNotificationsError);
      return;
    }
    if (!userNotificationsData || userNotificationsData.length === 0) {
      setUserNotifications([]);
      setLoading(false);
      return;
    }
    const notificationIds = userNotificationsData.map((notif) => notif.notification_id);
    const { data: notificationsData, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .in('id', notificationIds);
    if (notificationsError) {
      console.error('Failed to fetch notification details:', notificationsError);
      setLoading(false);
      return;
    }
    const mergedNotifications = userNotificationsData.map((userNotif) => {
      const notification = notificationsData.find((notif) => notif.id === userNotif.notification_id);
      return {
        id: userNotif.id, // Use ID from `user_notifications`
        notification_id: userNotif.notification_id,
        user_id: userNotif.user_id,
        created_at: notification?.created_at || '',
        message: notification?.message || 'No message',
        type: notification?.type || 'unknown',
        sender_user_id: notification?.sender_user_id || '',
        status: notification?.status || 'unknown',
        read: userNotif.read, // Comes from `user_notifications`
      };
    });
    setUserNotifications(mergedNotifications);
    setLoading(false);
  };

  const markAsRead = async (userNotificationId: string) => {
    const { error } = await supabase
      .from('user_notifications')
      .update({ read: true })
      .eq('id', userNotificationId);

    if (error) {
      Alert.alert('Error', 'Failed to mark as read.');
    } else {
      fetchNotifications();
    }
  };

  const deleteNotification = async (userNotificationId: string) => {
    const { error } = await supabase
      .from('user_notifications')
      .delete()
      .eq('id', userNotificationId);

    if (error) {
      Alert.alert('Error', 'Failed to delete notification.');
    } else {
      fetchNotifications();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>

      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, !showRead && styles.selectedToggle]}
          onPress={() => setShowRead(false)}>
          <Text style={styles.toggleText}>Unread</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toggleButton, showRead && styles.selectedToggle]}
          onPress={() => setShowRead(true)}>
          <Text style={styles.toggleText}>Read</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#B00020" />
      ) : (
        <FlatList
          data={userNotifications.filter((notif) => notif.read === showRead)}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.notificationCard}>
              <Text style={styles.notificationMessage}>{item.message}</Text>
              <Text style={styles.notificationDate}>
                {new Date(item.created_at).toLocaleString()}
              </Text>

              <View style={styles.actionContainer}>
                {!item.read ? (
                  <TouchableOpacity
                    style={styles.markReadButton}
                    onPress={() => markAsRead(item.id)}>
                    <Text style={styles.buttonText}>Mark as Read</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteNotification(item.id)}>
                    <Image
                      source={require('../assets/trashcan.png')}
                      style={styles.trashIcon}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default UserNotificationsScreen;

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
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  toggleButton: {
    padding: 10,
    marginHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#DDD',
  },
  selectedToggle: {
    backgroundColor: '#B00020',
  },
  toggleText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  notificationCard: {
    backgroundColor: '#FFF',
    padding: 15,
    marginVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  notificationMessage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  notificationDate: {
    fontSize: 12,
    color: '#666',
    marginVertical: 5,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  markReadButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#B00020',
    padding: 8,
    borderRadius: 8,
  },
  trashIcon: {
    width: 20,
    height: 20,
    tintColor: '#FFF',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});
