import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, Platform, Dimensions, TouchableOpacity } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Button } from 'react-native-elements';
import GoogleIcon from '../assets/images/svg/GoogleIcon';
import MailIcon from '../assets/images/svg/MailIcon';
import { AuthStackParamList } from '../routes/AuthStack';

const screenWidth = Dimensions.get('window').width;

type LoginScreenProp = StackNavigationProp<AuthStackParamList, 'login'>;

export default function LoginScreen() {
    const navigation = useNavigation<LoginScreenProp>();
    const [userInfo, setUserInfo] = useState(null);
    useEffect(() => {
        GoogleSignin.configure({
            webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com', // From Firebase Console
            offlineAccess: true,
        });
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.illustrationContainer}>
                <Text style={styles.welcome}>Welcome to Wasty</Text>
                <Image source={require('../assets/images/onboarding.jpeg')} style={styles.illustration} />
            </View>

            <View style={styles.contentContainer}>
                <Text style={styles.title}>Join. Recycle. Reward.</Text>

                <Button
                    title="Continue Sign up"
                    icon={<MailIcon width={20} height={20} fill="black" />}
                    iconContainerStyle={{ marginRight: 10 }}
                    buttonStyle={styles.button}
                    titleStyle={styles.buttonText}
                    onPress={() => navigation.navigate('signup')}
                />

                <TouchableOpacity onPress={() => navigation.navigate('loginEmail')}>
                    <Text style={styles.link}>
                        Already have an account? Log in
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
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
        height: 700,
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
        bottom: 20,
        // left: 40,
        width: screenWidth,
        padding: 20,
        backgroundColor: '#FFFFFF', // Solid color
        borderTopLeftRadius: 50,
        borderTopRightRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 300,
        shadowColor: '#000',
        zIndex: 5,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,

       fontFamily: 'Roboto-Regular',
        alignSelf: 'center',
    },
    description: {
        textAlign: 'left',
        fontSize: 16,
        color: '#777',
        marginBottom: 20,
    },
    button: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#ADB3BC',
        width: 370,
        marginBottom: 10,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
    },
    buttonText: {
        color: '#000',
        fontSize: 16,
    },
    link: {
        fontSize: 16,
        color: '#007BFF',
        marginTop: 10,
        textDecorationLine: 'underline',
    },
});
