import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { signup } from '@/api/user';

type SignupForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber: string;
};

export default function SignupScreen() {
  const scrollRef = useRef<ScrollView | null>(null);
  const [form, setForm] = useState<SignupForm>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (field: keyof SignupForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPassword = (password: string) => password.trim().length >= 6;
  const passwordsMatch =
    form.confirmPassword.trim() !== '' && form.password === form.confirmPassword;

  const isFormValid = useMemo(
    () =>
      form.firstName.trim() !== '' &&
      form.lastName.trim() !== '' &&
      isValidEmail(form.email) &&
      isValidPassword(form.password) &&
      passwordsMatch &&
      form.phoneNumber.trim().length === 10,
    [form, passwordsMatch]
  );

const handleSignUp = async () => {
  if (!isFormValid) {
    Alert.alert('Invalid details', 'Please complete all fields correctly.');
    return;
  }

  setLoading(true);
  try {
    const response = await signup({
      email: form.email.trim(),
      password: form.password.trim(),
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      phone_number: form.phoneNumber.trim(),
    });

    // 2. Store the token securely
    // Check if your API returns the token as 'token', 'access', or 'jwt'
    const token = response.token || response.access;

    if (token) {
      await SecureStore.setItemAsync('userToken', token);
      
      // Optional: Store the user's name for a personalized greeting elsewhere
      await SecureStore.setItemAsync('userName', response.first_name || form.firstName);
    }

    Alert.alert(
      'Account Created!',
      'Welcome to Wasty. Your journey to zero-waste starts now.',
      [
        {
          text: 'Get Started',
          onPress: () => router.replace('/'), // 3. Navigate to your main app layout
        },
      ]
    );
  } catch (error: any) {
    const message =
      error?.detail ||
      error?.message ||
      'Unable to sign up. Please try again.';
    Alert.alert('Signup Failed', String(message));
  } finally {
    setLoading(false);
  }
};

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 20}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.illustrationContainer}>
          <Image
            source={require('@/assets/images/signupBg.jpeg')}
            style={styles.illustration}
          />
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.title}>Create Account</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              placeholder="First name"
              placeholderTextColor="#888"
              style={styles.input}
              value={form.firstName}
              onChangeText={(value) => handleInputChange('firstName', value)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              placeholder="Last name"
              placeholderTextColor="#888"
              style={styles.input}
              value={form.lastName}
              onChangeText={(value) => handleInputChange('lastName', value)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              placeholder="Email"
              placeholderTextColor="#888"
              style={styles.input}
              value={form.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {!isValidEmail(form.email) && form.email.trim() !== '' && (
              <Text style={styles.errorText}>Please enter a valid email address.</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="Password"
                placeholderTextColor="#888"
                style={styles.passwordInput}
                secureTextEntry={!showPassword}
                value={form.password}
                onChangeText={(value) => handleInputChange('password', value)}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)}>
                <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="#555" />
              </TouchableOpacity>
            </View>
            {!isValidPassword(form.password) && form.password.trim() !== '' && (
              <Text style={styles.errorText}>
                Password must be at least 6 characters long.
              </Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="Retype password"
                placeholderTextColor="#888"
                style={styles.passwordInput}
                secureTextEntry={!showConfirmPassword}
                value={form.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword((prev) => !prev)}>
                <Ionicons name={showConfirmPassword ? 'eye-off' : 'eye'} size={22} color="#555" />
              </TouchableOpacity>
            </View>
            {form.confirmPassword.trim() !== '' && !passwordsMatch && (
              <Text style={styles.errorText}>Passwords do not match.</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              placeholder="Phone number"
              placeholderTextColor="#888"
              style={styles.input}
              value={form.phoneNumber}
              onChangeText={(value) => {
                const numericValue = value.replace(/[^0-9]/g, '');
                handleInputChange('phoneNumber', numericValue);
              }}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>

          <Pressable
            style={[styles.signUpButton, (loading || !isFormValid) && styles.signUpButtonDisabled]}
            onPress={handleSignUp}
            disabled={loading || !isFormValid}>
            <Ionicons name="checkmark" size={20} color="#fff" />
            <Text style={styles.signUpButtonText}>{loading ? 'Signing Up...' : 'Sign Up'}</Text>
          </Pressable>

          <View style={styles.signinContainer}>
            <Text style={styles.signinText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={styles.signinCta}>Log in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
  },
  illustrationContainer: {
    alignItems: 'center',
    width: '100%',
    height: 320,
    justifyContent: 'flex-end',
  },
  illustration: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  contentContainer: {
    marginTop: -24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 72,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#163f31',
    marginBottom: 22,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 15,
    color: '#1f2f26',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    height: 50,
    borderColor: '#d8ddd9',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    color: '#000',
    backgroundColor: '#f8faf8',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#d8ddd9',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    backgroundColor: '#f8faf8',
  },
  passwordInput: {
    flex: 1,
    color: '#000',
    fontSize: 16,
  },
  errorText: {
    marginTop: 6,
    color: '#c0392b',
    fontSize: 12,
  },
  signUpButton: {
    marginTop: 10,
    height: 54,
    borderRadius: 14,
    backgroundColor: '#0a5a3d',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  signUpButtonDisabled: {
    opacity: 0.6,
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  signinContainer: {
    marginTop: 22,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signinText: {
    color: '#526158',
    fontSize: 16,
  },
  signinCta: {
    color: '#0b4f34',
    fontSize: 16,
    fontWeight: '700',
  },
});
