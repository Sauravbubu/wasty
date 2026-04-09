import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { addQRCodeToBag } from '@/api/qrcodebag';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [scannedValue, setScannedValue] = useState<string | null>(null);

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (!data || isProcessing) {
      return;
    }

    setIsProcessing(true);
    setScannedValue(data);

    try {
      const token = await SecureStore.getItemAsync('userToken');

      if (!token) {
        Alert.alert('Authentication required', 'Please log in again to assign this bag.', [
          {
            text: 'OK',
            onPress: () => {
              setIsProcessing(false);
              router.replace('/login');
            },
          },
        ]);
        return;
      }

      const result = await addQRCodeToBag(token, data);
      DeviceEventEmitter.emit('bagAssigned', data);

      Alert.alert('Bag Added', result?.message || 'The scanned bag was added to your profile.', [
        {
          text: 'Scan Again',
          onPress: () => {
            setScannedValue(null);
            setIsProcessing(false);
          },
        },
        {
          text: 'Done',
          onPress: () => router.replace('/history'),
        },
      ]);
    } catch (error: any) {
      const message =
        typeof error === 'string'
          ? error
          : error?.message || error?.error || 'Failed to add the scanned bag.';

      Alert.alert('Scan Failed', message, [
        {
          text: 'Try Again',
          onPress: () => {
            setScannedValue(null);
            setIsProcessing(false);
          },
        },
      ]);
    }
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#1f7a3f" />
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionScreen}>
        <View style={styles.permissionCard}>
          <Ionicons name="camera-outline" size={44} color="#1f7a3f" />
          <Text style={styles.permissionTitle}>Camera access is needed</Text>
          <Text style={styles.permissionText}>
            Allow camera permission to scan the QR code printed on the bag.
          </Text>
          <Pressable style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Allow Camera</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => router.replace('/')}>
            <Text style={styles.secondaryButtonText}>Back to Home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={isProcessing ? undefined : handleBarcodeScanned}
      />

      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable style={styles.closeButton} onPress={() => router.replace('/')}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </Pressable>
          <Text style={styles.overlayTitle}>Scan Bag QR</Text>
          <View style={styles.topSpacer} />
        </View>

        <View style={styles.centerWrap}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>
          <Text style={styles.hintText}>Align the QR code inside the frame</Text>
        </View>

        <View style={styles.bottomCard}>
          <Text style={styles.bottomTitle}>Scanned Data</Text>
          <Text style={styles.bottomValue}>
            {scannedValue ?? 'No QR scanned yet. Point the camera at the bag QR code.'}
          </Text>
          {isProcessing && (
            <Pressable style={styles.rescanButton} onPress={() => setIsProcessing(false)}>
              <Text style={styles.rescanButtonText}>Scan Again</Text>
            </Pressable>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#f4f6f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionScreen: {
    flex: 1,
    backgroundColor: '#f4f6f1',
    padding: 16,
  },
  permissionCard: {
    flex: 1,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permissionTitle: {
    marginTop: 16,
    fontSize: 24,
    fontWeight: '800',
    color: '#245d34',
  },
  permissionText: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    color: '#78907f',
  },
  permissionButton: {
    marginTop: 20,
    backgroundColor: '#0f6b4a',
    borderRadius: 16,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  permissionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#0f6b4a',
    fontSize: 15,
    fontWeight: '700',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  topSpacer: {
    width: 42,
  },
  centerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  corner: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderColor: '#76ff98',
    borderWidth: 4,
  },
  cornerTopLeft: {
    left: -2,
    top: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 24,
  },
  cornerTopRight: {
    right: -2,
    top: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 24,
  },
  cornerBottomLeft: {
    left: -2,
    bottom: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 24,
  },
  cornerBottomRight: {
    right: -2,
    bottom: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 24,
  },
  hintText: {
    marginTop: 18,
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  bottomCard: {
    borderRadius: 24,
    backgroundColor: 'rgba(9, 26, 13, 0.72)',
    padding: 18,
  },
  bottomTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#9ce7ae',
    letterSpacing: 0.8,
  },
  bottomValue: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: '#ffffff',
  },
  rescanButton: {
    marginTop: 14,
    alignSelf: 'flex-start',
    backgroundColor: '#0f6b4a',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  rescanButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
});
