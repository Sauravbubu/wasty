import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getProductList } from '@/api/getproductlist';
import { BagHistoryItem, getUserBagHistory } from '@/api/userhistory';
import { mockPriceList } from '@/constants/mockdata';
import { schedulePickup } from '@/api/schedulePickup';
const pickupSlots = [
  '09 AM - 10 AM',
  '11 AM - 12 PM',
  '02 PM - 03 PM',
  '05 PM - 06 PM',
];
const recentPickups = [
  {
    id: '1',
    title: 'Mixed Metal Sorting',
    date: 'Completed • Oct 12, 14:30',
    value: '+12.5',
    unit: 'kg',
    badge: 'PREMIUM CREDIT',
    icon: 'tools',
    iconBg: '#dff7ef',
  },
  {
    id: '2',
    title: 'Organic Waste Depot',
    date: 'Completed • Oct 10, 09:15',
    value: '+4.2',
    unit: 'kg',
    badge: 'COMPOST BONUS',
    icon: 'leaf',
    iconBg: '#e8f8df',
  },
];

type WasteProduct = {
  id: number;
  name: string;
  description: string;
  image_url: string;
  price: string;
  is_active: boolean;
};

export default function HomeScreen() {
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [products, setProducts] = useState<WasteProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [bagHistory, setBagHistory] = useState<BagHistoryItem[]>([]);
  const [isLoadingBags, setIsLoadingBags] = useState(false);

    const [selectedSlot, setSelectedSlot] = useState<string | null>(pickupSlots[0]);
    const [isScheduling, setIsScheduling] = useState(false);
  
    const todayDate = new Date().toISOString().slice(0, 10);
const handleSchedulePickup = async () => {
    const latestBag = bagHistory[0];

    if (!latestBag) {
      Alert.alert('No Bag Found', 'Scan and assign a bag before scheduling a pickup.');
      return;
    }

    if (!selectedSlot) {
      Alert.alert('Select Time', 'Please choose a pickup time slot.');
      return;
    }

    setIsScheduling(true);

    try {
      const [token, userId] = await Promise.all([
        SecureStore.getItemAsync('userToken'),
        SecureStore.getItemAsync('userId'),
      ]);

      if (!token || !userId) {
        Alert.alert('Login Required', 'Please log in again to schedule a pickup.');
        return;
      }

      const slotStart = selectedSlot.split(' - ')[0];
      const hour = parseInt(slotStart.replace('AM', '').replace('PM', '').trim(), 10);
      const isPM = slotStart.includes('PM');
      let hourFormatted = isPM && hour !== 12 ? hour + 12 : hour;
      if (!isPM && hour === 12) hourFormatted = 0;

      const timeString = `${String(hourFormatted).padStart(2, '0')}:00:00`;
      const pickupDateTime = `${todayDate}T${timeString}.000Z`;

      await schedulePickup(token, {
        fulfilled: true,
        pickup_date: pickupDateTime,
        user_id: userId,
        bag_id: latestBag.id,
      });

      Alert.alert('Pickup Scheduled', `Pickup booked for ${todayDate} at ${selectedSlot}.`);
    } catch (error: any) {
      const message =
        error?.message || error?.detail || error?.error || 'Failed to schedule pickup.';
      Alert.alert('Schedule Failed', message);
    } finally {
      setIsScheduling(false);
    }
  };
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadSession = async () => {
        setIsCheckingSession(true);
        setIsLoadingProducts(true);
        setIsLoadingBags(true);

        try {
          const [storedProfile, storedName, storedToken, storedUserId] = await Promise.all([
            SecureStore.getItemAsync('userProfile'),
            SecureStore.getItemAsync('userName'),
            SecureStore.getItemAsync('userToken'),
            SecureStore.getItemAsync('userId'),
          ]);
          const productResponse = await getProductList().catch(() => []);
          const bagHistoryResponse =
            storedToken && storedUserId
              ? await getUserBagHistory(storedUserId, storedToken).catch(() => [])
              : [];

          if (!isActive) {
            return;
          }

          let resolvedName = storedName;
          if (!resolvedName && storedProfile) {
            try {
              const profile = JSON.parse(storedProfile);
              resolvedName =
                profile?.first_name ||
                profile?.firstName ||
                profile?.name ||
                profile?.user?.first_name ||
                null;
            } catch {
              resolvedName = null;
            }
          }

          setDisplayName(resolvedName);
          setProducts(
            Array.isArray(productResponse)
              ? productResponse.filter((product): product is WasteProduct => Boolean(product?.id))
              : []
          );
          setBagHistory(Array.isArray(bagHistoryResponse) ? bagHistoryResponse : []);
        } finally {
          if (isActive) {
            setIsCheckingSession(false);
            setIsLoadingProducts(false);
            setIsLoadingBags(false);
          }
        }
      };

      loadSession();

      const sub = DeviceEventEmitter.addListener('bagAssigned', () => {
        loadSession();
      });

      return () => {
        isActive = false;
        sub.remove();
      };
    }, [])
  );

  if (isCheckingSession) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#1f7a3f" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={styles.avatarDot} />
          <Text style={styles.brandText}>Wasty</Text>
          <Pressable style={styles.bellButton}>
            <MaterialCommunityIcons name="bell" size={18} color="#205c33" />
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <Text style={styles.heroLabel}>TOTAL PLASTIC DIVERTED</Text>
            <MaterialCommunityIcons name="recycle" size={28} color="#87d69f" />
          </View>
          <View style={styles.heroMetricRow}>
            <Text style={styles.heroMetric}>1.2k</Text>
            <Text style={styles.heroUnit}>kg</Text>
          </View>
          <Text style={styles.heroCaption}>
            You&apos;ve saved 4,200 marine species habitats this quarter.
          </Text>
        </View>
 <View style={styles.schedulerCard}>
          <View style={styles.schedulerHeader}>
            <View>
              <Text style={styles.schedulerLabel}>SCHEDULE PICKUP</Text>
              <Text style={styles.schedulerTitle}>Choose today&apos;s pickup slot</Text>
            </View>
            <MaterialCommunityIcons name="truck-delivery-outline" size={24} color="#2d9d57" />
          </View>

          <View style={styles.currentDatePill}>
            <MaterialCommunityIcons name="calendar-month-outline" size={16} color="#2f6b3d" />
            <Text style={styles.currentDateText}>
              {new Date(todayDate).toLocaleDateString('en-IN', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>

          <View style={styles.slotGrid}>
            {pickupSlots.map((slot) => {
              const selected = selectedSlot === slot;
              return (
                <Pressable
                  key={slot}
                  style={[styles.slotButton, selected && styles.slotButtonSelected]}
                  onPress={() => setSelectedSlot(slot)}>
                  <Text style={[styles.slotButtonText, selected && styles.slotButtonTextSelected]}>
                    {slot}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={[styles.scheduleButton, isScheduling && styles.scheduleButtonDisabled]}
            onPress={handleSchedulePickup}
            disabled={isScheduling}>
            <Text style={styles.scheduleButtonText}>
              {isScheduling ? 'Scheduling...' : 'Schedule Pickup'}
            </Text>
          </Pressable>
        </View>
        <View style={styles.goalCard}>
          <View style={styles.goalRing}>
            <View style={styles.goalRingInner}>
              <Text style={styles.goalPercent}>75%</Text>
            </View>
          </View>
          <Text style={styles.goalTitle}>Monthly Goal</Text>
          <Text style={styles.goalSubtitle}>12kg more to Reach Mint Tier</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Fleet Status</Text>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>4 Active Drones</Text>
          </View>
        </View>

        <View style={styles.mapCard}>
          <Image
            source={require('@/assets/images/banner2.png')}
            style={styles.mapImage}
            resizeMode="cover"
          />
          <View style={[styles.droneTag, styles.droneTagTop]}>
            <MaterialCommunityIcons name="drone" size={13} color="#31b35e" />
            <Text style={styles.droneTagText}>Drone-04</Text>
          </View>
          <View style={[styles.droneTag, styles.droneTagMid]}>
            <MaterialCommunityIcons name="drone" size={13} color="#31b35e" />
            <Text style={styles.droneTagText}>Drone-01</Text>
          </View>
          <View style={styles.locationChip}>
            <Text style={styles.locationChipLabel}>NEAREST POINT</Text>
            <Text style={styles.locationChipValue}>2.4km • Presidio Heights</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Waste Bag Price List</Text>
          <Pressable onPress={() => router.push('/scan')}>
            <Text style={styles.linkText}>Scan Bag</Text>
          </Pressable>
        </View>

        {isLoadingProducts ? (
          <View style={styles.productLoadingCard}>
            <ActivityIndicator size="small" color="#2f6b3d" />
            <Text style={styles.productLoadingText}>Loading waste bag prices...</Text>
          </View>
        ) : products.length > 0 ? (
          products.map((product) => (
            <View key={product.id} style={styles.productCard}>
              <Image
                source={{ uri: product.image_url }}
                style={styles.productImage}
                resizeMode="cover"
              />
              <View style={styles.productInfo}>
                <View style={styles.productHeaderRow}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <View style={styles.productPricePill}>
                    <Text style={styles.productPrice}>Rs {Number(product.price).toFixed(2)}</Text>
                  </View>
                </View>
                <Text style={styles.productDescription}>{product.description}</Text>
                <Text style={styles.productStatus}>
                  {product.is_active ? 'Available now' : 'Currently unavailable'}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.productLoadingCard}>
            <Text style={styles.productLoadingText}>No waste bag prices available right now.</Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Bags</Text>
          <Pressable onPress={() => router.push('/scan')}>
            <Text style={styles.linkText}>Add Bag</Text>
          </Pressable>
        </View>

        {isLoadingBags ? (
          <View style={styles.productLoadingCard}>
            <ActivityIndicator size="small" color="#2f6b3d" />
            <Text style={styles.productLoadingText}>Loading your bag history...</Text>
          </View>
        ) : bagHistory.length > 0 ? (
          bagHistory.map((bag) => (
            <View key={bag.id} style={styles.bagHistoryCard}>
              <View style={styles.bagHistoryIcon}>
                <MaterialCommunityIcons name="bag-personal-outline" size={22} color="#2d9d57" />
              </View>
              <View style={styles.bagHistoryInfo}>
                <Text style={styles.bagHistoryTitle}>Bag #{bag.id}</Text>
                <Text style={styles.bagHistoryQr}>{bag.bag_qr}</Text>
                <Text style={styles.bagHistoryMeta}>
                  Assigned on {new Date(bag.assign_on).toLocaleDateString('en-IN')}
                </Text>
              </View>
              <View style={styles.bagHistoryCountPill}>
                <Text style={styles.bagHistoryCountText}>{bag.products?.length ?? 0} items</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.productLoadingCard}>
            <Text style={styles.productLoadingText}>
              No bag assigned yet. Scan your first bag QR to see it here.
            </Text>
          </View>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Pickups</Text>
          <Pressable>
            <Text style={styles.linkText}>View History</Text>
          </Pressable>
        </View>

        {recentPickups.map((pickup) => (
          <View key={pickup.id} style={styles.pickupCard}>
            <View style={[styles.pickupIconWrap, { backgroundColor: pickup.iconBg }]}>
              <MaterialCommunityIcons name={pickup.icon as any} size={20} color="#2c7b45" />
            </View>
            <View style={styles.pickupInfo}>
              <Text style={styles.pickupTitle}>{pickup.title}</Text>
              <Text style={styles.pickupMeta}>{pickup.date}</Text>
            </View>
            <View style={styles.pickupValueWrap}>
              <Text style={styles.pickupValue}>
                {pickup.value}
                <Text style={styles.pickupUnit}> {pickup.unit}</Text>
              </Text>
              <Text style={styles.pickupBadge}>{pickup.badge}</Text>
            </View>
          </View>
        ))}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recycling Price List</Text>
          <Pressable onPress={() => router.push('/explore')}>
            <Text style={styles.linkText}>See More</Text>
          </Pressable>
        </View>

        {mockPriceList.map((item) => (
          <View key={item.id} style={styles.resellCard}>
            <Image source={item.icon} style={styles.resellIcon} resizeMode="cover" />
            <View style={styles.resellInfo}>
              <Text style={styles.resellName}>{item.name}</Text>
              <Text style={styles.resellCategory}>{item.category}</Text>
            </View>
            <View style={styles.resellPriceWrap}>
              <Text style={styles.resellPrice}>{item.price}</Text>
            </View>
          </View>
        ))}

        <View style={styles.tipCard}>
          <View style={styles.tipGlow} />
          <Text style={styles.tipTitle}>Smart Tip</Text>
          <Text style={styles.tipText}>
            Rinse plastic containers before disposal improves recycling efficiency by up to 40%.
          </Text>
          <MaterialCommunityIcons
            name="lightbulb-outline"
            size={22}
            color="#97a29c"
            style={styles.tipIcon}
          />
        </View>


        {/* <View style={styles.footerGreeting}>
          <Text style={styles.footerGreetingText}>
            {displayName ? `Welcome back, ${displayName}.` : 'Welcome back.'}
          </Text>
          <Pressable onPress={() => router.push('/explore')}>
            <Text style={styles.footerLink}>Open Explore</Text>
          </Pressable>
        </View> */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f6f1',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 150,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  avatarDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#f2d0b1',
  },
  brandText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2b6b3c',
    letterSpacing: -0.6,
  },
  bellButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    backgroundColor: '#1f7a32',
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 18,
    marginBottom: 14,
    shadowColor: '#174f27',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: {
    color: '#9ed4a7',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroMetricRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  heroMetric: {
    color: '#ffffff',
    fontSize: 52,
    lineHeight: 56,
    fontWeight: '900',
    letterSpacing: -2,
  },
  heroUnit: {
    color: '#d9f7dd',
    fontSize: 24,
    fontWeight: '700',
    marginLeft: 6,
    marginBottom: 6,
  },
  heroCaption: {
    color: '#d7efdb',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    maxWidth: '78%',
  },
  goalCard: {
    backgroundColor: '#fbfbf8',
    borderRadius: 28,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#d8ddd7',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  goalRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 6,
    borderColor: '#4fdc7e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  goalRingInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalPercent: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2d6c3d',
  },
  goalTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2d6c3d',
  },
  goalSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#7a857e',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2f6b3d',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e5faeb',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#53d977',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5dbd73',
  },
  mapCard: {
    backgroundColor: '#dde4dc',
    borderRadius: 28,
    padding: 14,
    marginBottom: 22,
    position: 'relative',
    overflow: 'hidden',
  },
  mapImage: {
    width: '100%',
    height: 180,
    borderRadius: 22,
    opacity: 0.78,
  },
  droneTag: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#90a492',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  droneTagTop: {
    top: 34,
    left: 70,
  },
  droneTagMid: {
    top: 82,
    right: 32,
  },
   schedulerCard: {
    backgroundColor: '#fbfbf8',
    borderRadius: 28,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#d7ddd7',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  schedulerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  schedulerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7ca587',
    letterSpacing: 1,
  },
  schedulerTitle: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: '800',
    color: '#2f6b3d',
  },
  currentDatePill: {
    marginTop: 16,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#e5faeb',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  currentDateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2f6b3d',
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  slotButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#eef2ed',
  },
  slotButtonSelected: {
    backgroundColor: '#0f6b4a',
  },
  slotButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#486051',
  },
  slotButtonTextSelected: {
    color: '#ffffff',
  },
  scheduleButton: {
    marginTop: 18,
    backgroundColor: '#0f6b4a',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  scheduleButtonDisabled: {
    opacity: 0.7,
  },
  scheduleButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  droneTagText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4b6050',
  },
  locationChip: {
    position: 'absolute',
    left: 94,
    bottom: 22,
    backgroundColor: '#496043',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  locationChipLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#bcc9bb',
    letterSpacing: 0.5,
  },
  locationChipValue: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  linkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6fb485',
  },
  productCard: {
    backgroundColor: '#fbfbf8',
    borderRadius: 24,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#d7ddd7',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  productImage: {
    width: 86,
    height: 86,
    borderRadius: 20,
    backgroundColor: '#e5ebdf',
    marginRight: 14,
  },
  productInfo: {
    flex: 1,
  },
  productHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  productName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: '#355d3a',
    textTransform: 'capitalize',
  },
  productPricePill: {
    backgroundColor: '#e5faeb',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2d9d57',
  },
  productDescription: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    color: '#7a857e',
  },
  productStatus: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '700',
    color: '#5dbd73',
  },
  productLoadingCard: {
    backgroundColor: '#fbfbf8',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 20,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#d7ddd7',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  productLoadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#6f7d73',
    textAlign: 'center',
  },
  bagHistoryCard: {
    backgroundColor: '#fbfbf8',
    borderRadius: 24,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#d7ddd7',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  bagHistoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e5faeb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bagHistoryInfo: {
    flex: 1,
    paddingRight: 10,
  },
  bagHistoryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#355d3a',
  },
  bagHistoryQr: {
    marginTop: 4,
    fontSize: 12,
    color: '#5e6e63',
  },
  bagHistoryMeta: {
    marginTop: 6,
    fontSize: 12,
    color: '#8a908c',
  },
  bagHistoryCountPill: {
    backgroundColor: '#eef8f0',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  bagHistoryCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2d9d57',
  },
  pickupCard: {
    backgroundColor: '#fbfbf8',
    borderRadius: 24,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#d7ddd7',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  pickupIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pickupInfo: {
    flex: 1,
    paddingRight: 10,
  },
  pickupTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#355d3a',
  },
  pickupMeta: {
    marginTop: 4,
    fontSize: 13,
    color: '#8a908c',
  },
  pickupValueWrap: {
    alignItems: 'flex-end',
  },
  pickupValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2d9d57',
    textAlign: 'right',
  },
  pickupUnit: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2d9d57',
  },
  pickupBadge: {
    marginTop: 4,
    fontSize: 10,
    fontWeight: '800',
    color: '#86a98a',
    textAlign: 'right',
  },
  resellCard: {
    backgroundColor: '#fbfbf8',
    borderRadius: 24,
    padding: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#d7ddd7',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  resellIcon: {
    width: 58,
    height: 58,
    borderRadius: 16,
    marginRight: 14,
    backgroundColor: '#e5ebdf',
  },
  resellInfo: {
    flex: 1,
  },
  resellName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#355d3a',
  },
  resellCategory: {
    marginTop: 4,
    fontSize: 13,
    color: '#7a857e',
  },
  resellPriceWrap: {
    backgroundColor: '#eef8f0',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  resellPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2d9d57',
  },
  tipCard: {
    backgroundColor: '#ebeeea',
    borderRadius: 24,
    padding: 18,
    marginTop: 6,
    overflow: 'hidden',
    minHeight: 124,
  },
  tipGlow: {
    position: 'absolute',
    right: -18,
    top: -10,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#bff5c9',
    opacity: 0.8,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2d6c3d',
  },
  tipText: {
    marginTop: 10,
    maxWidth: '72%',
    fontSize: 14,
    lineHeight: 20,
    color: '#78817d',
  },
  tipIcon: {
    position: 'absolute',
    right: 18,
    bottom: 16,
  },
  footerGreeting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingHorizontal: 2,
  },
  footerGreetingText: {
    fontSize: 14,
    color: '#6f7d73',
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2f6b3d',
  },
});
