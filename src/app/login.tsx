import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { login } from '@/api/login';
import { getProfile } from '@/api/profile';
import GoogleIcon from '@/assets/images/svg/GoogleIcon';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    Alert.alert(
      'Google Sign-In Temporarily Disabled',
      'Finish reinstalling the Expo SDK 54 dependencies, then re-enable Google sign-in.'
    );
    setIsGoogleLoading(false);
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const emailValue = email.trim();
      const passwordValue = password.trim();

      // 1. API Login
      const loginResponse = await login({
        email: emailValue,
        password: passwordValue,
      });

      const token = loginResponse.access;
      const user_id = loginResponse?.user?.id;

      if (!token || !user_id) {
        throw new Error('Invalid response: Missing token or user ID');
      }

      // 2. Store Securely in Expo
      await SecureStore.setItemAsync('userToken', token);
      await SecureStore.setItemAsync('userId', String(user_id));

      // 3. Optional: Fetch and store profile details as a stringified object 
      // if you need names/emails later without Redux
      const profileResponse = await getProfile(token);
      await SecureStore.setItemAsync('userProfile', JSON.stringify(profileResponse));

      // 4. Navigate to the main app
      // replace ensures the user can't swipe back to the login screen
      router.replace('/'); 

    } catch (error: any) {
      console.error('Login Error:', error);
      
      let errorTitle = 'Login Failed';
      let errorMessage = 'An unexpected error occurred.';

      if (error?.detail || error?.non_field_errors?.[0]) {
        errorTitle = 'Invalid Credentials';
        errorMessage = error.detail || error.non_field_errors[0];
      } else if (error?.message) {
        errorMessage = error.message;
      }

      Alert.alert(errorTitle, errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 20}
        style={styles.keyboardAvoidingView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.logoWrap}>
            <Image
              source={require('@/assets/images/wasty_4x4.png')}
              style={styles.logoBox}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.heading}>Wasty</Text>
          <Text style={styles.subHeading}>Your zero-waste journey starts here.</Text>

          <View style={styles.card}>
            <Pressable
              style={[styles.googleBtn, isGoogleLoading && styles.googleBtnDisabled]}
              onPress={handleGoogleSignIn}
              disabled={isGoogleLoading}>
              <GoogleIcon width={20} height={20} />
              <Text style={styles.googleText}>
                {isGoogleLoading ? 'Connecting Google...' : 'Continue with Google'}
              </Text>
            </Pressable>

            <View style={styles.separatorRow}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>OR EMAIL</Text>
              <View style={styles.separatorLine} />
            </View>

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="wasty@example.com"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />

            <View style={styles.passwordHeader}>
              <Text style={styles.label}>Password</Text>
              <Pressable onPress={() => Alert.alert('Reset Password', 'Forgot password flow coming next.')}>
                <Text style={styles.forgot}>Forgot?</Text>
              </Pressable>
            </View>

            <View style={styles.passwordWrap}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                secureTextEntry={!showPassword}
                style={styles.passwordInput}
              />
              <Pressable onPress={() => setShowPassword((prev) => !prev)} style={styles.eyeButton}>
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="#667063" />
              </Pressable>
            </View>

            <Pressable style={[styles.signInBtn, isLoading && styles.signInBtnDisabled]} onPress={handleSignIn} disabled={isLoading}>
              <Text style={styles.signInText}>{isLoading ? 'Signing In...' : 'Sign In'}</Text>
            </Pressable>
          </View>

          <View style={styles.footerAuth}>
            <Text style={styles.footerText}>Don&apos;t have an account?</Text>
            <Pressable onPress={() => router.push('/signup')}>
              <Text style={styles.footerLink}>Sign up</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#edf4ef',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 72,
  },
  logoWrap: {
    alignItems: 'center',
    marginTop: 10,
  },
  logoBox: {
    width: 92,
    height: 92,
    // borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',

  },
  heading: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 52,
    fontWeight: '800',
    color: '#0c4a34',
  },
  subHeading: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 20,
    lineHeight: 28,
    color: '#32443b',
    marginBottom: 30,
  },
  card: {
    backgroundColor: '#f7f8f7',
    borderRadius: 34,
    padding: 22,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  googleBtn: {
    height: 58,
    borderRadius: 14,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#d6dbd7',
  },
  googleBtnDisabled: {
    opacity: 0.7,
  },
  googleText: {
    fontSize: 18,
    color: '#1e2b24',
    fontWeight: '600',
  },
  separatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#d6dbd7',
  },
  separatorText: {
    fontSize: 14,
    color: '#6d786f',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  label: {
    fontSize: 18,
    color: '#1f2f26',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    height: 56,
    borderRadius: 14,
    backgroundColor: '#e7e8e7',
    paddingHorizontal: 14,
    fontSize: 18,
    color: '#1d2a22',
    marginBottom: 16,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgot: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0b4f34',
  },
  passwordWrap: {
    height: 56,
    borderRadius: 14,
    backgroundColor: '#e7e8e7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 22,
  },
  passwordInput: {
    flex: 1,
    fontSize: 20,
    color: '#1d2a22',
  },
  eyeButton: {
    paddingLeft: 8,
  },
  signInBtn: {
    height: 58,
    borderRadius: 14,
    backgroundColor: '#0a5a3d',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0a5a3d',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  signInBtnDisabled: {
    opacity: 0.65,
  },
  signInText: {
    color: '#f8fff9',
    fontSize: 24,
    fontWeight: '700',
  },
  footerAuth: {
    marginTop: 26,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 18,
    color: '#2f3f35',
  },
  footerLink: {
    fontSize: 18,
    color: '#084b34',
    fontWeight: '700',
  },
});
