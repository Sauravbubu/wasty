import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ImageBackground,
  Linking,
  Alert,
  TextInput,
  Modal,
  Share,
  Platform,
  DeviceEventEmitter,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { RouteProp, useNavigation, useRoute, NavigationProp } from '@react-navigation/native';
import { mockPriceList } from '../constants/mockdata';
import { getProfile } from '../services/api/profile';
import { RootState, AppDispatch } from '../store/store';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'react-native-elements';
import { getProductList } from '../services/api/getproductlist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createUserAddress } from '../services/api/addAddress.ts'; // add this import if not present
import { useDispatch, useSelector } from 'react-redux';
import { addItem, createOrUpdateCart } from '../store/cartSlice';
import { schedulePickup } from '../services/api/schedulePickup';
import { AppStackParamList } from '../routes/AppStack';
import { useAuth } from '../context/AuthContext';
import { clearUser } from '../store/userSlice.ts';
import { getUserBagHistory } from '../services/api/userhistory.ts';
import { getPickupList } from '../services/api/getPickupList';

// types.ts
export type RootStackParamList = {
  Home: { selectedLocation?: string };
  MapScreen: undefined;
  // add other screens here
};
type KycModalProps = {
  kycVisible: boolean;
  kycData: any;
  setKycData: (data: any) => void;
  setKycVisible: (visible: boolean) => void;
  handleKycSubmit: () => void;
};


function HomeScreen() {
  const navigation = useNavigation<NavigationProp<AppStackParamList>>();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isCalendarVisible, setCalendarVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('Home');
  const [availableDates] = useState(['2025-04-15', '2025-04-18', '2025-04-21']);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  const [bagId, setBagId] = useState<number>(0); // Always use bag ID 0
  const [bagHistory, setBagHistory] = useState<any[]>([]);
  const [hasBag, setHasBag] = useState(false);
  const [pickupList, setPickupList] = useState<any[]>([]);
  const [hasActivePickup, setHasActivePickup] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const cart = useSelector((state: RootState) => state.cart);

  const user = useSelector((state: RootState) => state.user);
  const token = user.token;
  const userId = user.id;
  const [kycVisible, setKycVisible] = useState(false);
  const { setIsLoggedIn } = useAuth();
  const [kycData, setKycData] = useState({
    address: '',
    adharNumber: '',
    ddn: '',
    upiPhone: '',
    upiId: '',
    laneNumber: '',
    houseNumber: '',
    pinCode: '',
  });

  const fetchPickupList = async () => {
    if (!token || !userId) {
      console.warn('Token or userId missing');
      return;
    }

    try {
      const pickups = await getPickupList(userId, token);
      setPickupList(pickups);

      // Check if there's an active (not fulfilled) pickup
      const activePickup = pickups.find((p) => !p.fulfilled);
      setHasActivePickup(!!activePickup);

      console.log('Pickup list fetched:', pickups);
    } catch (error: any) {
      console.error('Failed to fetch pickup list:', error);
      setHasActivePickup(false);
    }
  };

  useEffect(() => {
    if (!user) {
      console.warn('User not found in Home screen');
      return;
    }

    const logout = async () => {
      try {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userId');
        dispatch(clearUser());
        setIsLoggedIn(false);
      } catch (err) {
        console.error('Logout error:', err);
        Alert.alert('Error', 'Failed to logout. Try again.');
      }
    };

    const fetchProfile = async () => {
      if (!token) {
        Alert.alert('Error', 'No authentication token found. Please log in again.',);
        Alert.alert(token);
        await logout();
        setLoading(false);
        return;
      }

      try {
        const data = await getProfile(token);
        setProfile(data);
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to fetch profile.');
      } finally {
        setLoading(false);
      }
    };

    const fetchBagHistory = async () => {
      if (!token || !userId) {
        console.warn('Token or userId missing');
        return;
      }

      try {
        const history = await getUserBagHistory(userId, token);
        setBagHistory(history);
        setHasBag(history && history.length > 0);
        console.log('Bag history fetched:', history);
      } catch (error: any) {
        console.error('Failed to fetch bag history:', error);
        setHasBag(false);
      }
    };

    fetchProfile();
    fetchBagHistory();
    fetchPickupList();

    const sub = DeviceEventEmitter.addListener('bagAssigned', () => {
      fetchBagHistory();
      fetchPickupList();
    });
    return () => sub.remove();
  }, [token, userId, fetchPickupList]);

  const handleSchedulePickup = async () => {
    if (!hasBag) {
      Alert.alert('No Bag Assigned', 'There is no bag assigned. Please scan your bag.');
      return;
    }

    if (hasActivePickup) {
      Alert.alert(
        'Active Pickup',
        'A pickup request is already raised. Please ask admin to close/complete the pickup.'
      );
      return;
    }

    Alert.alert(
      'Pickup Info',
      `User ID: ${userId}\nName: ${user.firstName}\nDate: ${selectedDate || ''}\nSlot: ${selectedSlot || ''}`
    );

    if (!selectedSlot || !selectedDate) {
      Alert.alert('Error', 'Please select both a date and time slot');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'User ID not found. Please log in again.');
      return;
    }

    try {
      const slotStart = selectedSlot.split(' - ')[0];
      const hour = parseInt(slotStart.replace('AM', '').replace('PM', ''));
      const isPM = slotStart.includes('PM');
      let hourFormatted = isPM && hour !== 12 ? hour + 12 : hour;
      if (!isPM && hour === 12) hourFormatted = 0;

      const timeString = String(hourFormatted).padStart(2, '0') + ':00:00';
      const pickupDateTime = `${selectedDate}T${timeString}.000Z`;

      console.log('Scheduling pickup:', {
        fulfilled: true,
        pickup_date: pickupDateTime,
        user_id: userId,
        bag_id: 0,
      });

      await schedulePickup(token, {
        fulfilled: true,
        pickup_date: pickupDateTime,
        user_id: userId,
        bag_id: 0,
      });

      Alert.alert('Success', 'Pickup scheduled successfully.');
      setSelectedSlot(null);
      setSelectedDate(null);
      // Refresh pickup list
      fetchPickupList();
    } catch (error: any) {
      console.error('Pickup error:', error);
      Alert.alert('Error', error.message || 'Failed to schedule pickup.');
    }
  };

  // Note: Since Home is part of BottomTabs, route params are not directly available
  // selectedLocation would need to be passed through Redux or other state management
  // For now, we'll remove this useEffect as it's causing TypeScript errors
  // useEffect(() => {
  //   if (route?.params?.selectedLocation) {
  //     setLocation(route.params.selectedLocation);
  //   }
  // }, [route?.params?.selectedLocation]);

  const handleEditAddress = () => {
    navigation.navigate('MapScreen');
  };

  const handleInviteFriends = async () => {
    try {
      await Share.share({
        message: '🌍 Join Wasty - The Waste Management App!\n\nEarn money while managing waste responsibly. Complete KYC, earn rewards, and make a difference!\n\nDownload now: [Your App Link]',
        title: 'Invite Friends to Wasty',
        url: 'https://play.google.com/store/apps/details?id=com.wasty.app', // Update with your actual app link
      });
    } catch (error: any) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Unable to share. Please try again.');
    }
  };

  const handleCalendarConfirm = (date: any) => {
    const formatted = date.toISOString().split('T')[0];
    setSelectedDate(formatted);
    setCalendarVisible(false);
  };

  const insertTodayDate = () => {
    const today = new Date();
    const dateFormatted = today.toISOString().split('T')[0];
    setSelectedDate(dateFormatted);
  };


  const handleKycSubmit = async () => {
    // Updated validation for new fields
    if (
      !kycData.address ||
      !kycData.adharNumber ||
      !kycData.ddn ||
      !kycData.upiPhone ||
      !kycData.upiId ||
      !kycData.laneNumber ||
      !kycData.houseNumber ||
      !kycData.pinCode
    ) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'No authentication token found. Please log in again.');
        return;
      }
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'User ID not found. Please log in again.');
        return;
      }
      console.log('Submitting user with data:', userId);
      const payload = {
        profile: userId , // adjust if you have a dynamic profile ID
        address: kycData.address,
        adhar_number: kycData.adharNumber,
        ddn: kycData.ddn,
        upi_phone: kycData.upiPhone,
        upi_id: kycData.upiId,
        lane_number: kycData.laneNumber,
        house_number: kycData.houseNumber,
        pin_code: kycData.pinCode,
      };

      const result = await createUserAddress(token, payload);
      Alert.alert('Success', result?.message || 'KYC submitted successfully');
      setKycVisible(false);
    } catch (error: any) {
      const msg = typeof error === 'string' ? error : (error?.message || error?.error || 'Failed to submit KYC');
      Alert.alert('Error', msg);
    }
  };


  const promoCards = [
    {
      id: '1',
      title: 'Start your waste management journey and earn money in your wallet',
      buttonText: 'Complete KYC →',
      onPress: () => {
        console.log('KYC button pressed');
        setKycVisible(true);
      },
      imageSource: require('../assets/images/banner2.png'),
    },
    {
      id: '2',
      title: 'Earn 10% Bonus',
      imageSource: require('../assets/images/banner1.png'),
      buttonText: 'Claim Now',
      onPress: () => navigation.navigate('Wallet' as any),
    },
    {
      id: '3',
      title: 'Refer & Get ₹50',
      imageSource: require('../assets/images/banner1.png'),
      buttonText: 'Invite Friends',
      onPress: handleInviteFriends,
    },


    // ... more cards
  ];



  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Promo Slider */}
        <View style={styles.sliderWrapper}>
          <FlatList
            data={promoCards}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const cardWidth = 280;
              const index = Math.round(e.nativeEvent.contentOffset.x / cardWidth);
              setActiveIndex(index);
            }}
            renderItem={({ item }) => (
              <View style={styles.cardSlider}>
                <ImageBackground
                  source={item.imageSource}
                  resizeMode="cover"
                  imageStyle={{ borderRadius: 12 }}
                  style={styles.cardBackground}
                >
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <TouchableOpacity
                      style={styles.bottomButton}
                      onPress={item.onPress}
                    >
                      <Text style={styles.buttonText}>{item.buttonText}</Text>
                    </TouchableOpacity>
                  </View>
                </ImageBackground>
              </View>
            )}
          />
          <View style={styles.pagination}>
            {promoCards.map((_, i) => (
              <View key={i} style={[styles.dot, activeIndex === i && styles.activeDot]} />
            ))}
          </View>
        </View>

        {/* Calendar */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Schedule Pick up</Text>
          <Text style={styles.pickupSubtitle}>Choose a pickup date and time slot</Text>

          {/* Show message if no bag assigned */}
          {!hasBag ? (
            <View style={styles.noBagContainer}>
              <Icon name="alert-circle-outline" size={24} color="#ff3b30" />
              <Text style={styles.noBagText}>
                There is no bag assigned. Please scan your bag.
              </Text>
            </View>
          ) : hasActivePickup ? (
            <View style={styles.noBagContainer}>
              <Icon name="alert-circle-outline" size={24} color="#ff3b30" />
              <Text style={styles.noBagText}>
                A pickup request is already raised. Please ask admin to close/complete the pickup.
              </Text>
            </View>
          ) : null}

          {/* Date Input */}
          <View style={styles.dateInputContainer}>
            <TextInput
              style={styles.dateInput}
              placeholder="Select date (YYYY-MM-DD)"
              placeholderTextColor="#999"
              value={selectedDate || ''}
              onChangeText={(text) => setSelectedDate(text || null)}
              editable={hasBag && !hasActivePickup}
            />
            <TouchableOpacity 
              style={[styles.dateButton, (!hasBag || hasActivePickup) && styles.disabledButton]}
              onPress={insertTodayDate}
              disabled={!hasBag || hasActivePickup}
            >
              <Icon name="calendar-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.slotContainer}>
            {['6AM - 10AM', '10AM - 4PM', '4PM - 6PM'].map(slot => (
              <TouchableOpacity
                key={slot}
                style={[
                  styles.slotButton,
                  selectedSlot === slot && styles.slotButtonSelected,
                  (!hasBag || hasActivePickup) && styles.disabledSlot,
                ]}
                onPress={() => (hasBag && !hasActivePickup) && setSelectedSlot(slot)}
                disabled={!hasBag || hasActivePickup}
              >
                <Text
                  style={[
                    styles.slotText,
                    selectedSlot === slot && styles.slotTextSelected,
                  ]}
                >
                  {slot}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedSlot && selectedDate && (
            <Text style={styles.selectedText}>Selected: {selectedDate} - {selectedSlot}</Text>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              { opacity: selectedSlot && selectedDate && hasBag && !hasActivePickup ? 1 : 0.5 },
            ]}
            disabled={!selectedSlot || !selectedDate || !hasBag || hasActivePickup}
            onPress={handleSchedulePickup}
          >
            <Text style={styles.buttonText}>Confirm Pickup</Text>
          </TouchableOpacity>
        </View>

        {/* Price List */}
        <View>
          <Text style={styles.sectionTitle}>Recycling Price list</Text>
          {mockPriceList.map((item) => (
            <PriceItem
              key={item.id}
              name={item.name}
              category={item.category}
              price={item.price}
              icon={item.icon}
            />
          ))}
        </View>
      </ScrollView>

      {kycVisible && <KycModal
        kycVisible={kycVisible}
        setKycData={setKycData}
        handleKycSubmit={handleKycSubmit}
        setKycVisible={setKycVisible}
        kycData={kycData}
      />}
    </SafeAreaView>
  );
}

 function KycModal({
  kycVisible,
  setKycVisible,
  kycData,
  setKycData,
  handleKycSubmit,
}: KycModalProps) {
  console.log('KycModal rendering, visible:', kycVisible);
  // --- LIVE VALIDATION (runs every render automatically)
  const errors = useMemo(() => {
    return {
      address:
        !kycData.address || kycData.address.trim().length < 5
          ? "Address must be at least 5 characters"
          : "",

      ddn: !kycData.ddn ? "DDN is required" : "",

      houseNumber: !kycData.houseNumber ? "House number is required" : "",

      laneNumber: !kycData.laneNumber ? "Lane number is required" : "",

      pinCode: /^\d{6}$/.test(kycData.pinCode || "")
        ? ""
        : "Enter valid 6-digit PIN",

      upiPhone: /^\d{10}$/.test(kycData.upiPhone || "")
        ? ""
        : "Enter valid 10-digit phone",

      adharNumber: /^\d{12}$/.test(kycData.adharNumber || "")
        ? ""
        : "Aadhaar must be 12 digits",

      upiId: /^[\w.-]+@[\w.-]+$/.test(kycData.upiId || "")
        ? ""
        : "Enter valid UPI ID ex: example@bank",
    };
  }, [kycData]);

  const isFormValid = Object.values(errors).every((e) => !e);

  return (
    <Modal
      visible={kycVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setKycVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Complete KYC</Text>
          <Text style={styles.modalSubtitle}>
            Please fill in your details to continue
          </Text>

          {/* ADDRESS */}
          <TextInput
            style={styles.inputField}
            placeholder="Address"
            placeholderTextColor="#888"
            multiline
            value={kycData.address}
            onChangeText={(text) =>
              setKycData({ ...kycData, address: text })
            }
          />
          {!!errors.address && (
            <Text style={styles.errorText}>{errors.address}</Text>
          )}

          {/* DDN */}
          <TextInput
            style={styles.inputField}
            placeholder="Digital Door Number (DDN)"
            placeholderTextColor="#888"
            value={kycData.ddn}
            onChangeText={(text) => setKycData({ ...kycData, ddn: text })}
          />
          {!!errors.ddn && (
            <Text style={styles.errorText}>{errors.ddn}</Text>
          )}

          {/* HOUSE NUMBER */}
          <TextInput
            style={styles.inputField}
            placeholder="House Number"
            placeholderTextColor="#888"
            value={kycData.houseNumber}
            onChangeText={(text) =>
              setKycData({ ...kycData, houseNumber: text })
            }
          />
          {!!errors.houseNumber && (
            <Text style={styles.errorText}>{errors.houseNumber}</Text>
          )}

          {/* LANE NUMBER */}
          <TextInput
            style={styles.inputField}
            placeholder="Lane Number"
            placeholderTextColor="#888"
            value={kycData.laneNumber}
            onChangeText={(text) =>
              setKycData({ ...kycData, laneNumber: text })
            }
          />
          {!!errors.laneNumber && (
            <Text style={styles.errorText}>{errors.laneNumber}</Text>
          )}

          {/* PIN */}
          <TextInput
            style={styles.inputField}
            placeholder="PIN Code"
            placeholderTextColor="#888"
            keyboardType="number-pad"
            maxLength={6}
            value={kycData.pinCode}
            onChangeText={(text) =>
              setKycData({ ...kycData, pinCode: text })
            }
          />
          {!!errors.pinCode && (
            <Text style={styles.errorText}>{errors.pinCode}</Text>
          )}

          {/* UPI ID */}
          <TextInput
            style={styles.inputField}
            placeholder="UPI ID"
            placeholderTextColor="#888"
            value={kycData.upiId}
            autoCapitalize="none"
            onChangeText={(text) =>
              setKycData({ ...kycData, upiId: text })
            }
          />
          {!!errors.upiId && (
            <Text style={styles.errorText}>{errors.upiId}</Text>
          )}

          {/* PHONE */}
          <TextInput
            style={styles.inputField}
            placeholder="UPI Linked Phone"
            placeholderTextColor="#888"
            keyboardType="phone-pad"
            maxLength={10}
            value={kycData.upiPhone}
            onChangeText={(text) =>
              setKycData({ ...kycData, upiPhone: text })
            }
          />
          {!!errors.upiPhone && (
            <Text style={styles.errorText}>{errors.upiPhone}</Text>
          )}

          {/* AADHAAR */}
          <TextInput
            style={styles.inputField}
            placeholder="Aadhaar Number"
            placeholderTextColor="#888"
            keyboardType="number-pad"
            maxLength={12}
            value={kycData.adharNumber}
            onChangeText={(text) =>
              setKycData({ ...kycData, adharNumber: text })
            }
          />
          {!!errors.adharNumber && (
            <Text style={styles.errorText}>{errors.adharNumber}</Text>
          )}

          {/* ACTIONS */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              disabled={!isFormValid}
              style={[
                styles.actionButton,
                { backgroundColor: isFormValid ? "#6A0DAD" : "#aaa" },
              ]}
              onPress={handleKycSubmit}
            >
              <Text style={styles.actionText}>Submit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: "#eee" }]}
              onPress={() => setKycVisible(false)}
            >
              <Text style={[styles.actionText, { color: "#333" }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}


function PriceItem({ name, category, price, icon }: { name: string; category: string; price: string; icon: any }) {
  return (
    <View style={styles.priceItem}>
      <View style={styles.iconWrapper}>
        <Image source={icon} style={styles.iconImage} />
      </View>
      <View style={styles.priceLeft}>
        <Text style={styles.priceTitle}>{name}</Text>
        <Text style={styles.priceTag}>{category}</Text>
        <Text style={styles.priceValue}>{price}</Text>
      </View>
    </View>
  );
}


export default HomeScreen;

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  subHeader: {
    color: 'gray',
    marginBottom: 16,
  },
  sliderWrapper: {
    marginBottom: 24,
  },
  cardSlider: {
    width: 280,
    height: 150,
    marginRight: 12,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardBackground: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 12,
    paddingBottom: 10,
  },
  floatingCallText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 6,
  },
  // cardBackground: {
  //   flex: 1,
  //   padding: 16,
  //   justifyContent: 'space-between',
  // },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 8,
    color: '#ffffffff',
  },
  bottomButton: {
    backgroundColor: '#6A0DAD',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 'auto',
  },
  button: {
    backgroundColor: '#6A0DAD',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  errorText: {
  color: 'red',
  fontSize: 12,
  marginTop: -8,
  marginBottom: 8,
},

  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#6A0DAD',
    width: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 14,
    color: '#1a1a1a',
  },
  categories: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  categoryItem: {
    backgroundColor: '#eee',
    padding: 12,
    borderRadius: 8,
    width: '30%',
    alignItems: 'center',
  },
  categoryText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  priceItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F5F5F5',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  priceLeft: {
    marginBottom: 8,
  },
  priceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  priceTag: {
    fontSize: 12,
    color: 'gray',
    marginVertical: 4,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  breakdown: {
    fontSize: 12,
    color: 'gray',
  },
  slotContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 18,
    gap: 10,
  },

  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#6A0DAD',
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
  },

  datePickerText: {
    fontSize: 16,
    color: '#6A0DAD',
    fontWeight: '600',
    marginLeft: 10,
    flex: 1,
  },


  pickupSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 16,
    color: '#888',
  },

  dateInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    gap: 10,
  },

  dateButton: {
    backgroundColor: '#6A0DAD',
    paddingHorizontal: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
    aspectRatio: 1,
  },
    dateInput: {
    flex: 1,
    height: 48,
    borderColor: '#E0E0E0',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    color: '#000',
    fontSize: 15,
    backgroundColor: '#FAFAFA',
  },


  slotButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },

  slotButtonSelected: {
    backgroundColor: '#6A0DAD',
    borderColor: '#6A0DAD',
  },

  slotText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 12,
  },

  slotTextSelected: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },

  selectedText: {
    marginTop: 12,
    marginBottom: 16,
    fontWeight: '600',
    color: '#6A0DAD',
    fontSize: 14,
  },

  card: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 14,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  profileContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconImage: {
    width: 32,
    height: 32,
    resizeMode: 'contain',
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    elevation: 1,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  productDesc: {
    fontSize: 13,
    color: 'gray',
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  productButton: {
    backgroundColor: '#6A0DAD',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  productButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },


  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  inputField: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 14,
    backgroundColor: '#f9f9f9',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  actionText: {
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 16,
  },

  cartButton: {
    position: 'absolute',
    right: 16,
    bottom: 30,
    backgroundColor: '#6A0DAD',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
  cartCount: {
    position: 'absolute',
    right: -6,
    top: -6,
    backgroundColor: '#ff3b30',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#f1f1f1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseX: {
    position: 'absolute',
    right: 18,
    top: 12,
    zIndex: 10,
    padding: 6,
  },

  noBagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe5e5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ff3b30',
  },
  noBagText: {
    color: '#ff3b30',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 10,
    flex: 1,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledSlot: {
    opacity: 0.5,
  },
});
