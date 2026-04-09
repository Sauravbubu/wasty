import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator, Alert } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserBagHistory, BagHistoryItem } from '../services/api/userhistory';
import { useSelector } from 'react-redux';

const PickupsScreen = () => {
  const [pickupItems, setPickupItems] = useState<BagHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const userId = useSelector((state: any) => state.user?.id); // adjust if your slice stores id
  const tokenFromStore = useSelector((state: any) => state.user?.token);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem('userToken');

        if (!token) {
          Alert.alert('Authentication required', 'No auth token found.');
          return;
        }
        const id = await AsyncStorage.getItem('userId');
        if (!id) {
          Alert.alert('Authentication required', 'No user ID found.');
          return;
        }
        const data = await getUserBagHistory(id, token);
        setPickupItems(data);
      } catch (err) {
        console.warn('Failed to load bag history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [tokenFromStore, userId]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Pending':
        return styles.pendingStatus;
      case 'Picked up':
        return styles.pickedUpStatus;
      default:
        return {};
    }
  };

  const getStatusTextStyle = (status: string) => {
    switch (status) {
      case 'Pending':
        return styles.pendingStatusText;
      case 'Picked up':
        return styles.pickedUpStatusText;
      default:
        return {};
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Pickups</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {pickupItems.length === 0 ? (
            <View style={{ padding: 20 }}>
              <Text style={{ textAlign: 'center', color: '#666' }}>No pickups found.</Text>
            </View>
          ) : (
            pickupItems.map((item) => (
              <View key={item.id} style={styles.pickupItemCard}>
                <View style={styles.row}>
                  <Text style={styles.bagId}>Bag ID: {item.bag_qr}</Text>
                  <View style={styles.typeTag}>
                    <Text style={styles.typeTagText}>{item.products && item.products.length ? 'Contains items' : 'Empty'}</Text>
                  </View>
                </View>

                <View style={styles.row}>
                  <Text style={styles.weight}>Products: {item.products?.length ?? 0}</Text>
                  <Text style={styles.dateTime}>{new Date(item.assign_on).toLocaleDateString()}</Text>
                  <Text style={styles.dateTime}>{new Date(item.assign_on).toLocaleTimeString()}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f8f8', // Light grey background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 15, // Adjust padding for Android status bar
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    // Aligning title to center the whole header element
    flex: 1, // Take up available space
    textAlign: 'center', // Center the text within that space
    marginRight: 24, // Counteract the back button's width to truly center
  },
  scrollView: {
    flex: 1,
    paddingTop: 10, // Small padding at the top of the scroll view
  },
  pickupItemCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2, // For Android shadow
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  bagId: {
    fontSize: 14,
    color: '#555',
    flex: 1, // Allows it to take up available space
  },
  typeTag: {
    backgroundColor: '#D4EDDA', // Light green for household, similar to success alerts
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    marginLeft: 10,
  },
  typeTagText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#28a745', // Darker green for household text
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    marginLeft: 10,
  },
  pendingStatus: {
    backgroundColor: '#FFE0B2', // Light orange for pending
  },
  pendingStatusText: {
    color: '#FB8C00', // Darker orange for pending text
    fontWeight: 'bold',
  },
  pickedUpStatus: {
    backgroundColor: '#E0F2F1', // Light teal/green for picked up
  },
  pickedUpStatusText: {
    color: '#00796B', // Darker teal/green for picked up text
    fontWeight: 'bold',
  },
  weight: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 'auto', // Pushes date and time to the right
  },
  dateTime: {
    fontSize: 13,
    color: '#777',
    marginLeft: 10,
  },
});

export default PickupsScreen;