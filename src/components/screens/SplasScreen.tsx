import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import { Text } from 'react-native-elements';

const SplashScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    // Navigate to the next screen after the animation finishes
    const timer = setTimeout(() => {
      navigation.navigate('home'); // Replace 'Home' with your target screen
    }, 3000); // Adjust the duration to match your animation length

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={[styles.container, { backgroundColor: 'white' }]}>
    <LottieView
      source={require('../assets/animations/splash_animation.json')}
      autoPlay
      loop={false}
      style={{ width: 500, height: 500, backgroundColor: 'white' }}
    />
  </View>
  
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff', // Set your desired background color
  },
});

export default SplashScreen;