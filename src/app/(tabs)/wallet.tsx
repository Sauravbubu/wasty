import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getWallet, WalletTransaction } from '@/api/walletHistory';

export default function WalletScreen() {
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchWallet = async () => {
        setLoading(true);

        try {
          const [token, userId] = await Promise.all([
            SecureStore.getItemAsync('userToken'),
            SecureStore.getItemAsync('userId'),
          ]);

          if (!token || !userId) {
            if (isActive) {
              setBalance(0);
              setTransactions([]);
            }
            return;
          }

          const data = await getWallet(userId, token);

          if (!isActive) {
            return;
          }

          setBalance(data.balance ?? (data as any).wallet_balance ?? 0);
          setTransactions(data.transactions ?? (data as any).results ?? []);
        } catch (err) {
          console.warn('Failed to load wallet:', err);
          if (isActive) {
            setBalance(0);
            setTransactions([]);
          }
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      };

      fetchWallet();

      return () => {
        isActive = false;
      };
    }, [])
  );

  const handleSpendPoints = () => {
    Alert.alert(
      'Spend Points',
      'This can link to your product store or redemption flow next.'
    );
  };

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
              <Text style={styles.pageLabel}>WALLET OVERVIEW</Text>
              <Text style={styles.title}>Wallet</Text>
            </View>
            <View style={styles.headerIcon}>
              <MaterialCommunityIcons name="wallet-outline" size={24} color="#ffffff" />
            </View>
          </View>

          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Total available balance</Text>
            <Text style={styles.balanceAmount}>{balance !== null ? `Rs ${balance}` : '—'}</Text>
            <Text style={styles.balanceCaption}>
              Your earned recycling credits and redemption-ready balance.
            </Text>

            <Pressable
              style={[styles.spendButton, (balance === null || balance <= 0) && styles.spendButtonDisabled]}
              onPress={handleSpendPoints}
              disabled={balance === null || balance <= 0}>
              <Text style={styles.spendButtonText}>Spend Points & Buy Products</Text>
            </Pressable>

            <View style={styles.balanceGlow} />
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            <Text style={styles.sectionMeta}>{transactions.length} entries</Text>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="wallet-plus-outline" size={34} color="#1f7a3f" />
              <Text style={styles.emptyTitle}>No transactions found</Text>
              <Text style={styles.emptyText}>
                Credits, earnings, and debits will appear here after your recycling activity.
              </Text>
            </View>
          ) : (
            transactions.map((earning, index) => {
              const isDebit = earning.type === 'DEBIT';

              return (
                <View key={earning.id ?? index} style={styles.transactionCard}>
                  <View style={styles.transactionTopRow}>
                    <Text style={styles.txnId}>Txn ID: {earning.id ?? '—'}</Text>
                    <View style={[styles.typeTag, isDebit ? styles.debitTag : styles.creditTag]}>
                      <Text style={[styles.typeTagText, isDebit ? styles.debitText : styles.creditText]}>
                        {earning.type ?? 'CREDIT'}
                      </Text>
                    </View>
                    <View style={styles.amountPill}>
                      <Text style={styles.amountPillText}>
                        {earning.amount !== undefined && earning.amount !== null
                          ? `Rs ${earning.amount}`
                          : '—'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.transactionBottomRow}>
                    <Text style={styles.descriptionText}>
                      {earning.description ?? 'General Transaction'}
                    </Text>
                    <View style={styles.dateStack}>
                      <Text style={styles.dateText}>
                        {earning.created_on
                          ? new Date(earning.created_on).toLocaleDateString('en-IN')
                          : ''}
                      </Text>
                      <Text style={styles.timeText}>
                        {earning.created_on
                          ? new Date(earning.created_on).toLocaleTimeString('en-IN')
                          : ''}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
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
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0f6b4a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceCard: {
    backgroundColor: '#14532d',
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 22,
    marginBottom: 22,
    overflow: 'hidden',
    shadowColor: '#174f27',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  balanceLabel: {
    color: '#9ed4a7',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  balanceAmount: {
    marginTop: 8,
    color: '#ffffff',
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '900',
  },
  balanceCaption: {
    marginTop: 10,
    color: '#d7efdb',
    fontSize: 14,
    lineHeight: 20,
    maxWidth: '80%',
  },
  spendButton: {
    marginTop: 18,
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  spendButtonDisabled: {
    opacity: 0.55,
  },
  spendButtonText: {
    color: '#14532d',
    fontSize: 14,
    fontWeight: '800',
  },
  balanceGlow: {
    position: 'absolute',
    right: -28,
    top: -18,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.12)',
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
  sectionMeta: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7a857e',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 20,
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
  transactionCard: {
    backgroundColor: '#fbfbf8',
    borderRadius: 24,
    marginBottom: 14,
    padding: 16,
    shadowColor: '#d7ddd7',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  transactionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  txnId: {
    flex: 1,
    fontSize: 14,
    color: '#555',
  },
  typeTag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 8,
  },
  creditTag: {
    backgroundColor: '#d4edda',
  },
  debitTag: {
    backgroundColor: '#f8d7da',
  },
  typeTagText: {
    fontSize: 11,
    fontWeight: '800',
  },
  creditText: {
    color: '#2d9d57',
  },
  debitText: {
    color: '#c0392b',
  },
  amountPill: {
    marginLeft: 8,
    backgroundColor: '#eef8f0',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  amountPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#14532d',
  },
  transactionBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  descriptionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#55655a',
  },
  dateStack: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 12,
    color: '#8a908c',
  },
  timeText: {
    marginTop: 4,
    fontSize: 12,
    color: '#8a908c',
  },
});
