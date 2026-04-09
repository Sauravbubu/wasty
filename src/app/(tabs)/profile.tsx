import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getProfile } from '@/api/profile';

const HELP_PHONE = '+917205319320';
const HELP_EMAIL = 'admin@gnufox.com';

type ProfileResponse = {
  first_name?: string;
  last_name?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  wallet_balance?: number;
  total_waste?: number;
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [helpVisible, setHelpVisible] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchProfile = async () => {
        setLoading(true);

        try {
          const token = await SecureStore.getItemAsync('userToken');

          if (!token) {
            if (isActive) {
              setProfile(null);
            }
            return;
          }

          const data = await getProfile(token);

          if (!isActive) {
            return;
          }

          setProfile(data);
          await SecureStore.setItemAsync('userProfile', JSON.stringify(data));
          const displayName =
            data?.first_name || data?.firstName || data?.name || '';
          if (displayName) {
            await SecureStore.setItemAsync('userName', displayName);
          }
        } catch (error: any) {
          console.error('Profile load error:', error);
          if (isActive) {
            setProfile(null);
          }
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      };

      fetchProfile();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const handleLogout = async () => {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync('userToken'),
        SecureStore.deleteItemAsync('userId'),
        SecureStore.deleteItemAsync('userProfile'),
        SecureStore.deleteItemAsync('userName'),
        SecureStore.deleteItemAsync('googleAccessToken'),
        SecureStore.deleteItemAsync('authProvider'),
      ]);
      router.replace('/login');
    } catch (err) {
      console.error('Logout error:', err);
      Alert.alert('Error', 'Failed to logout. Try again.');
    }
  };

  const openDialer = async (phone: string) => {
    try {
      await Linking.openURL(`tel:${phone}`);
    } catch (err) {
      console.error('openDialer error:', err);
      Alert.alert('Error', 'Could not open dialer.');
    }
  };

  const openEmail = async (email: string) => {
    try {
      await Linking.openURL(`mailto:${email}`);
    } catch (err) {
      console.error('openEmail error:', err);
      Alert.alert('Error', 'Could not open mail client.');
    }
  };

  const firstName = profile?.first_name || profile?.firstName || '';
  const lastName = profile?.last_name || profile?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || profile?.name || 'Wasty User';
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.trim() || fullName.charAt(0);

  return (
    <SafeAreaView style={styles.safeArea}>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#1f7a3f" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.pageLabel}>ACCOUNT</Text>
              <Text style={styles.title}>Profile</Text>
            </View>
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarBadgeText}>{initials.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.profileHero}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>{initials.toUpperCase()}</Text>
            </View>
            <Text style={styles.name}>{fullName}</Text>
            <Text style={styles.email}>{profile?.email || 'No email available'}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="wallet-outline" size={22} color="#2d9d57" />
              <Text style={styles.statValue}>Rs {profile?.wallet_balance ?? 0}</Text>
              <Text style={styles.statLabel}>Available Balance</Text>
            </View>

            <View style={styles.statCard}>
              <Ionicons name="bag-handle-outline" size={22} color="#2d9d57" />
              <Text style={styles.statValue}>{profile?.total_waste ?? 0} Kg</Text>
              <Text style={styles.statLabel}>Waste Recycled</Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Account Details</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Name</Text>
              <Text style={styles.detailValue}>{fullName}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{profile?.email || '—'}</Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>

            <Pressable style={styles.actionRow} onPress={() => setHelpVisible(true)}>
              <View style={styles.actionIconWrap}>
                <Ionicons name="help-circle-outline" size={20} color="#2d9d57" />
              </View>
              <Text style={styles.actionText}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={18} color="#94a39a" />
            </Pressable>

            <Pressable style={styles.actionRow} onPress={handleLogout}>
              <View style={styles.actionIconWrap}>
                <Ionicons name="log-out-outline" size={20} color="#c0392b" />
              </View>
              <Text style={styles.actionText}>Logout</Text>
              <Ionicons name="chevron-forward" size={18} color="#94a39a" />
            </Pressable>
          </View>
        </ScrollView>
      )}

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
    paddingTop: 10,
    paddingBottom: 140,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pageLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7ca587',
    letterSpacing: 1,
  },
  title: {
    marginTop: 4,
    fontSize: 30,
    fontWeight: '900',
    color: '#245d34',
  },
  avatarBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0f6b4a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBadgeText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  profileHero: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    paddingVertical: 24,
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#d7ddd7',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  profileAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#14532d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    color: '#ffffff',
    fontSize: 30,
    fontWeight: '900',
  },
  name: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: '900',
    color: '#245d34',
    textAlign: 'center',
  },
  email: {
    marginTop: 8,
    fontSize: 15,
    color: '#78907f',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fbfbf8',
    borderRadius: 24,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#d7ddd7',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  statValue: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '900',
    color: '#245d34',
    textAlign: 'center',
  },
  statLabel: {
    marginTop: 6,
    fontSize: 12,
    color: '#78907f',
    textAlign: 'center',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#d7ddd7',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#245d34',
    marginBottom: 12,
  },
  detailRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eef2ed',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8a908c',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 15,
    color: '#355d3a',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  actionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#eef8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#355d3a',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '86%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#245d34',
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
    backgroundColor: '#0f6b4a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  closeBtnText: {
    color: '#fff',
    fontWeight: '700',
  },
});
