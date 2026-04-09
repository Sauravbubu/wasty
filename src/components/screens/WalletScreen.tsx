import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert, // Added for simple demonstration
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getWallet, WalletTransaction } from '../services/api/walletHistory';
import { useSelector } from 'react-redux';

const WalletScreen = ({ navigation }: { navigation: any }) => { // Added navigation prop
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const reduxUserId = useSelector((state: any) => state.user?.id);
  const reduxToken = useSelector((state: any) => state.user?.token);

  useEffect(() => {
    const fetchWallet = async () => {
      setLoading(true);
      try {
        const token = reduxToken || (await AsyncStorage.getItem('userToken'));
        // Corrected: The original code was getting userId from AsyncStorage but not assigning it back to a variable
        const asyncUserId = await AsyncStorage.getItem('userId'); 
        
        // Use Redux ID first, then AsyncStorage ID
        const userId = reduxUserId || asyncUserId;

        if (!userId) throw new Error('No userId available');
        if (!token) throw new Error('No auth token available');

        const data = await getWallet(userId, token);
        // adapt to API shape
        setBalance(data.balance ?? (data as any).wallet_balance ?? 0);
        setTransactions(data.transactions ?? (data as any).results ?? []);
      } catch (err) {
        console.warn('Failed to load wallet:', err);
        setBalance(0);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWallet();
  }, [reduxToken, reduxUserId]);

  // --- NEW FUNCTION: Handles navigation to the spending/product screen ---
  const handleSpendPoints = () => {
    // In a real application, you would navigate to your product store/redemption screen.
    // Example: navigation.navigate('ProductStoreScreen');
    
    // Placeholder instruction:
    Alert.alert(
      'Spend Points',
      'You will now be taken to the product store to purchase dustbin bags or other items using your current balance.'
    );
  };
  // ------------------------------------------------------------------------

  // --- MODIFIED FUNCTION: Back button handler ---
  const handleGoBack = () => {
    // In a real application, you would use navigation.goBack() or similar
    // Placeholder instruction:
    // Alert.alert('Go Back', 'Navigate back to the previous screen.');
    navigation.goBack();
  };
  // ---------------------------------------------


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <MaterialIcons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={styles.totalEarningsCard}>
            <Text style={styles.totalEarningsText}>Total available balance</Text>
            <Text style={styles.totalEarningsAmount}>
              {balance !== null ? `₹${balance}` : '—'}
            </Text>
            
            {/* --- NEW INTERACTIVE ELEMENT: Spend Points Button --- */}
            <TouchableOpacity 
              style={styles.spendButton} 
              onPress={handleSpendPoints}
              disabled={balance === null || balance <= 0} // Disable if balance is zero/null
            >
              <Text style={styles.spendButtonText}>
                🛒 Spend Points & Buy Products
              </Text>
            </TouchableOpacity>
            {/* ------------------------------------------------------- */}

            <View style={styles.abstractBackground} />
          </View>

          <Text style={styles.pastEarningsTitle}>Transaction History</Text>

          {transactions.length === 0 ? (
            <View style={{ padding: 20 }}>
              <Text style={{ textAlign: 'center', color: '#666' }}>No transactions found.</Text>
            </View>
          ) : (
            transactions.map((earning, index) => (
              <View key={earning.id ?? index} style={styles.earningItem}>
                <View style={styles.earningDetailsRow}>
                  <Text style={styles.bagId}>Txn ID: {earning.id}</Text>
                  <View style={[
                    styles.typeTag, 
                    earning.type === 'DEBIT' ? styles.debitTag : styles.creditTag // Adapt styles based on transaction type
                  ]}>
                    <Text style={[
                       styles.typeTagText, 
                       earning.type === 'DEBIT' ? styles.debitText : styles.creditText
                    ]}>{earning.type ?? 'CREDIT'}</Text>
                  </View>
                  <View style={styles.statusTag}>
                    <Text style={styles.statusTagText}>
                      {earning.amount ? `₹${earning.amount}` : '—'}
                    </Text>
                  </View>
                </View>
                <View style={styles.earningDetailsRow}>
                  <Text style={styles.weight}>{earning.description ?? 'General Transaction'}</Text>
                  <Text style={styles.dateTime}>
                    {earning.created_on ? new Date(earning.created_on).toLocaleDateString() : ''}
                  </Text>
                  <Text style={styles.dateTime}>
                    {earning.created_on ? new Date(earning.created_on).toLocaleTimeString() : ''}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default WalletScreen;

// --- MODIFIED STYLES (Added styles for the new button and transaction tags) ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 15,
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
  },
  scrollView: {
    flex: 1,
  },
  totalEarningsCard: {
    backgroundColor: '#E6E6FA',
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 20,
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
    // Increased height to accommodate the new button
    height: 150, 
    justifyContent: 'flex-start',
  },
  abstractBackground: {
    position: 'absolute',
    right: -50,
    top: -30,
    width: 200,
    height: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ rotate: '45deg' }],
    borderRadius: 30,
  },
  totalEarningsText: {
    fontSize: 16,
    color: '#6A5ACD',
  },
  totalEarningsAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#483D8B',
    marginTop: 5,
    marginBottom: 10, // Added margin below amount
  },
  // --- NEW STYLES FOR SPEND BUTTON ---
  spendButton: {
    backgroundColor: '#4CAF50', // Green color for spending/buying
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 5,
    alignSelf: 'flex-start', // Keeps the button width to content
  },
  spendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // ----------------------------------
  pastEarningsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 25,
    marginBottom: 15,
    marginHorizontal: 16,
  },
  earningItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  earningDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  bagId: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    marginLeft: 10,
  },
  // --- NEW STYLES FOR TRANSACTION TYPES ---
  creditTag: { // For earnings (default behavior of original code)
    backgroundColor: '#D4EDDA', // Light Green
  },
  debitTag: { // For spending
    backgroundColor: '#F8D7DA', // Light Red
  },
  typeTagText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  creditText: {
    color: '#28a745', // Dark Green
  },
  debitText: {
    color: '#721C24', // Dark Red
  },
  // --------------------------------------
  statusTag: {
    backgroundColor: '#FFE0B2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    marginLeft: 10,
  },
  statusTagText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FB8C00',
  },
  weight: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 'auto',
  },
  dateTime: {
    fontSize: 13,
    color: '#777',
    marginLeft: 10,
  },
  // Kept old/unused tags for reference but updated the mapping logic above
  householdTag: {
    backgroundColor: '#D4EDDA',
  },
  otherTag: {
    backgroundColor: '#FFECB3',
  },
});