import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { useDispatch } from 'react-redux';
import Button from '../components/ui/Button';
import { signup } from '../services/api/user';
import { setUser } from '../store/userSlice';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Icon, Image } from 'react-native-elements';
import { AuthStackParamList } from '../routes/AuthStack';

const screenWidth = Dimensions.get('window').width;

type SignUpScreenProp = StackNavigationProp<AuthStackParamList, 'signup'>;

export default function SignUpScreen() {
  const dispatch = useDispatch();
  const navigation = useNavigation<SignUpScreenProp>();
  const { setIsLoggedIn } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 👁 state

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPassword = (password: string) => password.length >= 6;

  const isFormValid =
    form.firstName.trim() !== '' &&
    form.lastName.trim() !== '' &&
    isValidEmail(form.email) &&
    isValidPassword(form.password) &&
    form.phoneNumber.trim() !== '';

  const handleInputChange = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const handleSignUp = async () => {
    setLoading(true);
    try {
      const response = await signup({
        email: form.email,
        password: form.password,
        first_name: form.firstName,
        last_name: form.lastName,
        phone_number: form.phoneNumber,
      });

      // Store token (from signup response if available)
      if (response.token) {
        await AsyncStorage.setItem('userToken', response.token);
      }

      dispatch(
        setUser({
          firstName: response.first_name,
          lastName: response.last_name,
          email: response.email,
          phoneNumber: response.phone_number,
          token: response.token || '',
          id: response.id || ''
        })
      );

      Alert.alert('Signup Successful', `Welcome, ${response.first_name}!`);
      // Update auth state to trigger navigator re-render
      setIsLoggedIn(true);
    } catch (error: any) {
      Alert.alert('Signup Failed', error || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const [password, setPassword] = useState('');
  const [secureEntry, setSecureEntry] = useState(true);
  const scrollRef = useRef<ScrollView | null>(null);

  const toggleSecureEntry = () => setSecureEntry(prev => !prev);

  const passwordHint = 'At least 8 characters, include a letter and a symbol';

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.illustrationContainer}>
          {/* <Text style={styles.welcome}>Welcome To Wasty</Text> */}
          <Image
            source={require('../assets/images/signupBg.jpeg')}
            style={styles.illustration}
          />
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.title}>Create Account</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              placeholder="First name"
              style={styles.input}
              value={form.firstName}
              onChangeText={(value) => handleInputChange('firstName', value)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Last Name</Text>
            <TextInput
              placeholder="Last name"
              style={styles.input}
              value={form.lastName}
              onChangeText={(value) => handleInputChange('lastName', value)}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              placeholder="Email"
              style={styles.input}
              value={form.email}
              onChangeText={(value) => handleInputChange('email', value)}
            />
            {!isValidEmail(form.email) && form.email.trim() !== '' && (
              <Text style={styles.errorText}>
                Please enter a valid email address.
              </Text>
            )}
          </View>

          {/* 🔐 Password input with eye toggle */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                placeholder="Password"
                style={styles.passwordInput}
                secureTextEntry={!showPassword}
                value={form.password}
                onChangeText={(value) => handleInputChange('password', value)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
               <Icon
                                  name={showPassword ? 'eye-off' : 'eye'}
                                  size={22}
                                  color="#555"
                                />
              </TouchableOpacity>
            </View>
            {!isValidPassword(form.password) && form.password.trim() !== '' && (
              <Text style={styles.errorText}>
                Password must be at least 6 characters long.
              </Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              placeholder="Phone number"
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

          <Button
            title={loading ? 'Signing Up...' : 'Sign Up'}
            onPress={handleSignUp}
            iconName="check"
            iconPosition="left"
            disabled={loading || !isFormValid}
          />

          <View style={styles.signinContainer}>
            <Text style={styles.signinText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('login')}>
              <Text style={styles.signinCta}>Log in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
    backgroundColor: '#fff',
  },
  field: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    color: '#222',
    marginBottom: 8,
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#DDD',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    height: 48,
    color: '#000', // ensure password text is black
    fontSize: 16,
  },
  eyeButton: {
    paddingLeft: 12,
    paddingVertical: 8,
  },
  hint: {
    marginTop: 8,
    color: '#666',
    fontSize: 12,
  },
  illustrationContainer: { alignItems: 'center', width: screenWidth, height: 500, justifyContent: 'flex-end' },
  illustration: { width: 150, height: 800, resizeMode: 'center' },
  welcome: {
    fontSize: 24, fontWeight: 'bold', textAlign: 'center',
    position: 'absolute', top: 50,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
    letterSpacing: 2, zIndex: 4,
  },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 30 },
  inputGroup: { width: '90%', marginBottom: 15 },
  input: {
    width: '100%', height: 50,
    borderColor: '#ccc', borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 10,
    color: '#000'
  },
  passwordContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderColor: '#ccc', borderWidth: 1,
    borderRadius: 10, paddingHorizontal: 10,
    height: 50,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#fff',
    justifyContent: 'flex-start',
    paddingBottom: 40, // adds breathing room under keyboard
  },
  contentContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: { color: 'red', fontSize: 12, marginTop: 5 },
  signinContainer: { flexDirection: 'row', marginTop: 10 },
  signinText: { fontSize: 16, color: 'black' },
  signinCta: { fontSize: 16, color: '#7334DA', fontWeight: 'bold' },
});
