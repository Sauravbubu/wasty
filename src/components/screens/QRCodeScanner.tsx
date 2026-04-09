import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Alert,
  PermissionsAndroid,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  DeviceEventEmitter,
} from 'react-native';
import { Camera } from 'react-native-camera-kit';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import { addQRCodeToBag } from '../services/api/qrcodebag';
import { useNavigation } from '@react-navigation/native';
  
type QRCodeScannerProps = {
  onReadCode: (code: string) => void;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FRAME_SIZE = Math.min(SCREEN_WIDTH * 0.8, 360);

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onReadCode }) => {
  const navigation = useNavigation();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const tokenFromStore = useSelector((state: any) => state.user?.token);
  const scanningRef = useRef(false);

  useEffect(() => {
    // open camera automatically on mount
    requestCameraPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs camera access to scan QR codes',
            buttonPositive: 'OK',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setVisible(true);
        } else {
          Alert.alert('Permission Denied', 'Camera permission is required to scan QR codes.');
        }
      } catch (err) {
        Alert.alert('Permission error', String(err));
      }
    } else {
      // iOS: Info.plist must include camera usage description
      setVisible(true);
    }
  };

  const handleQRCodeRead = async (event: { nativeEvent: { codeStringValue: string } }) => {
    const code = event?.nativeEvent?.codeStringValue;
    if (!code) return;

    // debounce duplicate reads
    if (scanningRef.current) return;
    scanningRef.current = true;
    setVisible(false);

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Authentication required', 'No auth token found.');
        scanningRef.current = false;
        return;
      }

      const result = await addQRCodeToBag(token, code);
      Alert.alert('Success', result?.message || 'QR code assigned to bag.');
      DeviceEventEmitter.emit('bagAssigned'); // or call onReadCode
      onReadCode && onReadCode(code);
    } catch (error: any) {
      const msg = typeof error === 'string' ? error : (error?.message || error?.error || 'Failed to assign QR code');
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
      // allow rescanning after short delay if user re-opens scanner
      setTimeout(() => {
        scanningRef.current = false;
      }, 1200);
    }
  };
  const handleClose = () => {
     
    setVisible(false);
    navigation.goBack();
  }

  return (
    <View style={styles.container}>
      {/* Camera opens automatically, no button */}
      <Modal visible={visible} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <Camera
            style={styles.camera}
            scanBarcode={true}
            onReadCode={handleQRCodeRead}
            laserColor="transparent"
            frameColor="transparent"
          />

          {/* Scanning frame overlay */}
          <View style={styles.overlay}>
            <View style={styles.frameContainer} pointerEvents="none">
              <View style={styles.frame} />
              {/* corner decorations */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>

            <Text style={styles.hintText}>Align QR code inside the frame</Text>
          </View>

          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close-circle" size={40} color="#fff" />
          </TouchableOpacity>

          {loading && (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
        </View>
      </Modal>

      {/* If camera couldn't open, show a lightweight fallback UI to re-request permission */}
      {/* {!visible && (
        <View style={styles.fallback}>
          <Text style={styles.fallbackText}>Camera is closed</Text>
          <TouchableOpacity style={styles.retryButton} onPress={requestCameraPermission}>
            <Text style={styles.retryText}>Open Scanner</Text>
          </TouchableOpacity>
        </View>
      )} */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  modalContainer: { flex: 1, backgroundColor: 'black' },
  camera: { flex: 1 },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frameContainer: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#00FFDB',
    borderWidth: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
  topLeft: { top: -1, left: -1, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: -1, right: -1, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: -1, left: -1, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: -1, right: -1, borderLeftWidth: 0, borderTopWidth: 0 },
  hintText: {
    color: '#fff',
    marginTop: 18,
    fontSize: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    overflow: 'hidden',
  },
  closeButton: { position: 'absolute', top: 44, right: 20 },
  loadingWrap: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fallback: { padding: 16, alignItems: 'center', justifyContent: 'center' },
  fallbackText: { color: '#333', marginBottom: 8 },
  retryButton: {
    backgroundColor: '#7334DA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryText: { color: '#fff' },
});

export default QRCodeScanner;
