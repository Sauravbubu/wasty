import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store/store';
import { setQuantity, removeItem, clearCart, createOrUpdateCart, placeOrder } from '../store/cartSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CartScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const cart = useSelector((state: RootState) => state.cart);
  const total = cart.items.reduce((s, it) => s + (it.price || 0) * it.quantity, 0);

  const changeQty = async (id: number | string, qty: number) => {
    dispatch(setQuantity({ id, quantity: qty }));
    const token = await AsyncStorage.getItem('userToken');
    if (token) dispatch(createOrUpdateCart(token));
  };

  const onPlace = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) return Alert.alert('Error', 'Not authenticated');
      const res = await dispatch(placeOrder(token));
      // @ts-ignore
      if (res?.error) throw res.error;
      Alert.alert('Success', 'Order placed');
      dispatch(clearCart());
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to place order');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Cart</Text>
        <Text style={styles.subtitle}>Total: ₹{total}</Text>
      </View>

      <FlatList
        data={cart.items}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Image source={{ uri: item.image_url }} style={styles.img} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={{ fontWeight: '600' }}>{item.name}</Text>
              <Text>₹{item.price}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(item.id, Math.max(1, item.quantity - 1))}>
                <Text>-</Text>
              </TouchableOpacity>
              <Text style={{ marginHorizontal: 8 }}>{item.quantity}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(item.id, item.quantity + 1)}>
                <Text>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={() => <Text style={{ textAlign: 'center', marginTop: 20 }}>Cart is empty</Text>}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.placeBtn, { backgroundColor: '#28a745' }]} onPress={onPlace}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Place Order</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { color: '#666', marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderColor: '#f1f1f1' },
  img: { width: 56, height: 56, borderRadius: 8 },
  qtyBtn: { width: 34, height: 34, borderRadius: 6, backgroundColor: '#f1f1f1', justifyContent: 'center', alignItems: 'center' },
  footer: { padding: 16 },
  placeBtn: { padding: 12, borderRadius: 8, alignItems: 'center' },
});
