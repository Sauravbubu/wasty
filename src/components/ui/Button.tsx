import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { Icon } from 'react-native-elements';
import { useTheme } from '../../hooks/ThemeProvider';


type ButtonProps = {
  title: string;
  onPress: () => void;
  iconName?: string; // Optional icon name
  iconType?: string; // Optional icon type (e.g., 'font-awesome')
  iconPosition?: 'left' | 'right'; // Icon position
  loading?: boolean; // Optional loading state
  disabled?: boolean; // Optional disabled state
  buttonStyle?: StyleProp<ViewStyle>; // Custom button style
  textStyle?: StyleProp<TextStyle>; // Custom text style
};

export default function Button({
  title,
  onPress,
  iconName,
  iconType = 'font-awesome',
  iconPosition = 'left',
  loading = false,
  disabled = false,
  buttonStyle,
  textStyle,
}: ButtonProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: colors.buttonBackground },
        disabled && styles.disabledButton,
        buttonStyle, // Apply custom button styles from props
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.buttonText} />
      ) : (
        <View style={styles.content}>
          {iconName && iconPosition === 'left' && (
            <Icon name={iconName} type={iconType} color={colors.buttonText} size={20} style={styles.icon} />
          )}
          <Text style={[styles.buttonText, { color: colors.buttonText }, textStyle]}>{title}</Text>
          {iconName && iconPosition === 'right' && (
            <Icon name={iconName} type={iconType} color={colors.buttonText} size={20} style={styles.icon} />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderColor: '#ccc',
    width: '90%',
    marginBottom: 10,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    flexDirection: 'row',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  icon: {
    marginHorizontal: 5,
  },
});