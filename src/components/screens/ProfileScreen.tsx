import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Pressable,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { clearUser } from '../store/userSlice';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HELP_PHONE = '+917205319320';
const HELP_EMAIL = 'admin@gnufox.com';

const ProfileScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation<any>();
  const profile = useSelector((state: any) => state.user);
  const { setIsLoggedIn } = useAuth();
  const [helpVisible, setHelpVisible] = useState(false);

  // Logout: clear storage and trigger navigator re-render
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userId');
      dispatch(clearUser());

      // Update auth state to trigger navigator re-render
      // No navigation calls needed - the navigator will automatically switch to AuthStack
      setIsLoggedIn(false);
    } catch (err) {
      console.error('Logout error:', err);
      Alert.alert('Error', 'Failed to logout. Try again.');
    }
  };

const openDialer = async (phone: string) => {
  const url = `tel:${phone}`;
  try {
    await Linking.openURL(url);
  } catch (err) {
    console.error('openDialer error:', err);
    Alert.alert('Error', 'Could not open dialer.');
  }
};

const openEmail = async (email: string) => {
  const url = `mailto:${email}`;
  try {
    await Linking.openURL(url);
  } catch (err) {
    console.error('openEmail error:', err);
    Alert.alert('Error', 'Could not open mail client.');
  }
};


  // Show help & support modal
  const showHelp = () => setHelpVisible(true);

  if (!profile) return <Text>Loading...</Text>;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          <Image
            source={require('../assets/images/wasty_4x4.png')}
            style={styles.profileImage}
          />
          <Text style={styles.name}>
            {profile.firstName} {profile.lastName}
          </Text>
          <Text style={styles.email}>{profile.email}</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <MaterialIcons name="military-tech" size={24} color="#7A4EFF" />
            <Text style={styles.statValue}>{profile.wallet_balance ?? 0}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="bag-outline" size={24} color="#7A4EFF" />
            <Text style={styles.statValue}>{profile.total_waste ?? 0} Kg</Text>
            <Text style={styles.statLabel}>Volume</Text>
          </View>
        </View>

        {/* Menu Options */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.option} onPress={showHelp}>
            <View style={styles.optionIcon}>
              <Icon name="help-circle-outline" size={20} color="#7A4EFF" />
            </View>
            <Text style={styles.optionText}>Help & Support</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.option} onPress={handleLogout}>
            <View style={styles.optionIcon}>
              <Icon name="log-out-outline" size={20} color="#7A4EFF" />
            </View>
            <Text style={styles.optionText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Help Modal */}
      <Modal visible={helpVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Help & Support</Text>

            <Text style={styles.modalLabel}>Phone</Text>
            <Pressable onPress={() => openDialer(HELP_PHONE)} style={styles.contactRow}>
              <Text style={styles.contactText}>{HELP_PHONE}</Text>
            </Pressable>

            <Text style={[styles.modalLabel, { marginTop: 12 }]}>Email</Text>
            <Pressable onPress={() => openEmail(HELP_EMAIL)} style={styles.contactRow}>
              <Text style={styles.contactText}>{HELP_EMAIL}</Text>
            </Pressable>

            <View style={styles.modalButtons}>
              <Pressable style={styles.closeBtn} onPress={() => setHelpVisible(false)}>
                <Text style={styles.closeBtnText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 14,
    color: '#777',
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F6F5F8',
    padding: 15,
    borderRadius: 15,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  optionsContainer: {
    marginTop: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F5F8',
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
  },
  optionIcon: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 10,
    marginRight: 10,
  },
  optionText: {
    fontSize: 16,
  },

  /* modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '86%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 13,
    color: '#444',
    marginBottom: 6,
  },
  contactRow: {
    paddingVertical: 10,
  },
  contactText: {
    color: '#1E88E5',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtons: {
    marginTop: 18,
    alignItems: 'flex-end',
  },
  closeBtn: {
    backgroundColor: '#7A4EFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  closeBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
});
