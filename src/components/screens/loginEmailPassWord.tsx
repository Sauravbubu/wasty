import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  Platform,
  TouchableOpacity,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { login } from '../../api/login';
import Button from '../components/ui/Button';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { getProfile } from '../../api/profile';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setUser } from '../store/userSlice';
import { useAuth } from '../context/AuthContext';
import { AuthStackParamList } from '../routes/AuthStack';
import Icon from 'react-native-vector-icons/Ionicons';

const screenWidth = Dimensions.get('window').width;

type SignInScreenProp = StackNavigationProp<AuthStackParamList, 'loginEmail'>;

export default function SignInScreen() {
  const navigation = useNavigation<SignInScreenProp>();
  const dispatch = useDispatch();
  const { setIsLoggedIn } = useAuth();
  const [form, setForm] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const validateForm = (): boolean => {
    if (!form.email.trim()) {
      Alert.alert('Validation Error', 'Please enter your email');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      Alert.alert('Validation Error', 'Please enter a valid email');
      return false;
    }
    if (!form.password.trim()) {
      Alert.alert('Validation Error', 'Please enter your password');
      return false;
    }
    if (form.password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleSignIn = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const email = form.email.trim();
      const password = form.password.trim();

      const loginResponse = await login({
        email,
        password,
      });

      const token = loginResponse.access;
      const user_id = loginResponse?.user?.id;

      if (!token || !user_id) {
        throw new Error('Invalid response: Missing token or user ID');
      }

      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userId', String(user_id));

      const profileResponse = await getProfile(token);

      dispatch(
        setUser({
          firstName: profileResponse.first_name,
          lastName: profileResponse.last_name,
          email: profileResponse.email,
          phoneNumber: profileResponse.phone_number,
          id: user_id,
          token: token,
        })
      );

      setIsLoggedIn(true);
    } catch (error: any) {
      console.error('Login Error:', error);

      let errorTitle = 'Login Failed';
      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (error.message === 'Network Error: Unable to reach server. Check your internet connection.') {
        errorTitle = 'Network Error';
        errorMessage = 'Unable to connect to the server. Please check your internet connection.';
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.detail || error?.non_field_errors?.[0]) {
        errorTitle = 'Invalid Credentials';
        errorMessage = error.detail || error.non_field_errors[0];
      } else if (error?.message) {
        errorMessage = error.message;
      }

      Alert.alert(errorTitle, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          <View style={styles.illustrationContainer}>
            {/* <Text style={styles.welcome}>Welcome to{'\n'}Wasty</Text> */}
            <Image
              source={require('../assets/images/loginBg.jpeg')}
              style={styles.illustration}
            />
          </View>

          <View style={styles.contentContainer}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email ID</Text>
              <TextInput
                placeholder="Email ID"
                style={styles.input}
                value={form.email}
                onChangeText={(value) => handleInputChange('email', value)}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#888"
                  style={[styles.input, { flex: 1, color: '#000' }]}
                  secureTextEntry={!showPassword}
                  value={form.password}
                  onChangeText={(value) => handleInputChange('password', value)}
                  autoCapitalize="none"
                  selectionColor="#000"
                  textContentType="password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Icon
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={22}
                    color="#555"
                  />
                </TouchableOpacity>
              </View>
            </View>

            <Button
              title={loading ? 'Signing In...' : 'Sign In'}
              onPress={handleSignIn}
              disabled={loading}
            />

            <View style={styles.signinContainer}>
              <Text style={styles.signinText}>Do not have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('signup')}>
                <Text style={styles.signinCta}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    width: screenWidth,
  },
  illustrationContainer: {
    alignItems: 'center',
    width: screenWidth,
    height: 500,
    justifyContent: 'flex-end',
  },
  illustration: {
    width: screenWidth,
    height: '100%',
    resizeMode: 'contain',
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    position: 'absolute',
    top: 50,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica' : 'sans-serif',
    letterSpacing: 2,
    zIndex: 4,
  },
  contentContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  inputGroup: {
    width: '90%',
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
  input: {
    width: '100%',
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    color: '#000', // ensure typed text is black by default
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeIcon: {
    marginLeft: -35,
    padding: 8,
  },
  signinContainer: {
    flexDirection: 'row',
    marginTop: 20,
  },
  signinText: {
    fontSize: 16,
    color: 'black',
  },
  signinCta: {
    fontSize: 16,
    color: '#7334DA',
    fontWeight: 'bold',
  },
});
