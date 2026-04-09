import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

export function AnimatedSplashOverlay() {
  return null;
}

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <View style={styles.background} />
      <Image
        source={require('@/assets/images/wasty_4x4.png')}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
  },
  background: {
    position: 'absolute',
    width: 128,
    height: 128,
    borderRadius: 40,
    backgroundColor: '#208AEF',
  },
  image: {
    width: 76,
    height: 71,
  },
});
