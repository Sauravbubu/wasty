import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  DeviceEventEmitter,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BagHistoryItem, getUserBagHistory } from '@/api/userhistory';

function formatAssignedDate(value: string) {
  const date = new Date(value);
  return `${date.toLocaleDateString('en-IN')} • ${date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

function shortenQr(value: string) {
  if (value.length <= 18) {
    return value;
  }

  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

export default function HistoryScreen() {
  const [bagHistory, setBagHistory] = useState<BagHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadBagHistory = async () => {
        setIsLoading(true);

        try {
          const [token, userId] = await Promise.all([
            SecureStore.getItemAsync('userToken'),
            SecureStore.getItemAsync('userId'),
          ]);

          if (!token || !userId) {
            if (isActive) {
              setBagHistory([]);
            }
            return;
          }

          const response = await getUserBagHistory(userId, token).catch(() => []);

          if (isActive) {
            setBagHistory(Array.isArray(response) ? response : []);
          }
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      };

      loadBagHistory();

      const sub = DeviceEventEmitter.addListener('bagAssigned', () => {
        loadBagHistory();
      });

      return () => {
        isActive = false;
        sub.remove();
      };
    }, [])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.pageLabel}>BAG ACTIVITY</Text>
            <Text style={styles.title}>History</Text>
          </View>
          <Pressable style={styles.scanButton} onPress={() => router.push('/scan')}>
            <MaterialCommunityIcons name="qrcode-scan" size={18} color="#ffffff" />
            <Text style={styles.scanButtonText}>Scan Bag</Text>
          </Pressable>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>TOTAL ASSIGNED BAGS</Text>
          <Text style={styles.summaryValue}>{bagHistory.length}</Text>
          <Text style={styles.summaryCaption}>
            Every scanned bag assigned to your account appears here.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Assigned Bags</Text>
        </View>

        {isLoading ? (
          <View style={styles.emptyCard}>
            <ActivityIndicator size="small" color="#1f7a3f" />
            <Text style={styles.emptyText}>Loading bag history...</Text>
          </View>
        ) : bagHistory.length > 0 ? (
          bagHistory.map((bag, index) => (
            <View key={bag.id} style={styles.historyCard}>
              <View style={styles.timelineWrap}>
                <View style={styles.timelineDot} />
                {index !== bagHistory.length - 1 && <View style={styles.timelineLine} />}
              </View>

              <View style={styles.historyContent}>
                <View style={styles.historyTopRow}>
                  <Text style={styles.historyTitle}>Bag #{bag.id}</Text>
                  <View style={styles.countPill}>
                    <Text style={styles.countText}>{bag.products?.length ?? 0} items</Text>
                  </View>
                </View>

                <Text style={styles.historyQr}>{shortenQr(bag.bag_qr)}</Text>
                <Text style={styles.historyDate}>{formatAssignedDate(bag.assign_on)}</Text>

                <View style={styles.historyMetaRow}>
                  <MaterialCommunityIcons
                    name="bag-personal-outline"
                    size={16}
                    color="#2d9d57"
                  />
                  <Text style={styles.historyMetaText}>Assigned to your profile</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="history" size={36} color="#1f7a3f" />
            <Text style={styles.emptyTitle}>No bag history yet</Text>
            <Text style={styles.emptyText}>
              Scan your first waste bag QR code and it will show up here.
            </Text>
            <Pressable style={styles.emptyAction} onPress={() => router.push('/scan')}>
              <Text style={styles.emptyActionText}>Open Scanner</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f6f1',
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
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0f6b4a',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
  },
  scanButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  summaryCard: {
    backgroundColor: '#1f7a32',
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 18,
    shadowColor: '#174f27',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  summaryLabel: {
    color: '#9ed4a7',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  summaryValue: {
    marginTop: 8,
    color: '#ffffff',
    fontSize: 46,
    lineHeight: 50,
    fontWeight: '900',
  },
  summaryCaption: {
    marginTop: 8,
    color: '#d7efdb',
    fontSize: 14,
    lineHeight: 20,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2f6b3d',
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 14,
  },
  timelineWrap: {
    width: 28,
    alignItems: 'center',
    marginRight: 4,
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4fdc7e',
    marginTop: 18,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: '#cfe8d5',
    marginTop: 6,
    marginBottom: -14,
  },
  historyContent: {
    flex: 1,
    backgroundColor: '#fbfbf8',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#d7ddd7',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  historyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#355d3a',
  },
  countPill: {
    backgroundColor: '#eef8f0',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  countText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#2d9d57',
  },
  historyQr: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '700',
    color: '#4f6254',
  },
  historyDate: {
    marginTop: 6,
    fontSize: 12,
    color: '#8a908c',
  },
  historyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  historyMetaText: {
    fontSize: 12,
    color: '#5c7161',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    minHeight: 220,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 22,
    fontWeight: '800',
    color: '#245d34',
  },
  emptyText: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    color: '#78907f',
  },
  emptyAction: {
    marginTop: 18,
    backgroundColor: '#0f6b4a',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  emptyActionText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
