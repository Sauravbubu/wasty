import React, { useState, useRef, useEffect } from 'react';
import { View, Button, StyleSheet, PermissionsAndroid, Platform, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { useNavigation } from '@react-navigation/native';
const predefinedPlaces = [
    {
        description: 'Kalyani Nagar, Pune',
        geometry: {
            location: {
                lat: 18.5362,
                lng: 73.8987,
                latitude: 18.5362,
                longitude: 73.8987,
            },
        },
    },
    {
        description: 'MG Road, Pune',
        geometry: {
            location: {
                lat: 18.516726,
                lng: 73.856255,
                latitude: 18.516726,
                longitude: 73.856255,
            },
        },
    },
];


export default function MapScreen() {
    const [marker, setMarker] = useState({ latitude: 18.5204, longitude: 73.8567 });
    const navigation = useNavigation<any>();
    const mapRef = useRef<MapView>(null);

    useEffect(() => {
        requestLocationPermission();
    }, []);

    const requestLocationPermission = async () => {
        try {
            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                );
                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    getCurrentLocation();
                } else {
                    Alert.alert('Permission Denied', 'Location permission is required.');
                }
            } else {
                getCurrentLocation(); // iOS permission handled via Info.plist
            }
        } catch (err) {
            console.warn(err);
        }
    };

    const getCurrentLocation = () => {
        Geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const coords = { latitude, longitude };
                setMarker(coords);
                mapRef.current?.animateToRegion({
                    ...coords,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                });
            },
            (error) => {
                console.log(error.code, error.message);
                Alert.alert('Error', 'Failed to get current location.');
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
    };

    const confirmLocation = () => {
        navigation.navigate('Main', {
            screen: 'Home',
            params: { selectedLocation: 'Kalyani Nagar, Pune' }, // Replace with dynamic address if needed
        });
    };

    return (
        <View style={{ flex: 1 }}>
            <GooglePlacesAutocomplete
                predefinedPlaces={predefinedPlaces}
                placeholder="Search for a location"
                fetchDetails={true}
                onPress={(data, details = null) => {
                    const lat = details?.geometry?.location?.lat;
                    const lng = details?.geometry?.location?.lng;
                    if (typeof lat === 'number' && typeof lng === 'number') {
                        const coords = { latitude: lat, longitude: lng };
                        setMarker(coords);
                        mapRef.current?.animateToRegion({
                            ...coords,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                        });
                    }
                }}
                query={{
                    key: 'YOUR_GOOGLE_API_KEY',
                    language: 'en',
                }}
                textInputProps={{
                    onFocus: () => {
                        mapRef.current?.animateToRegion({
                            ...marker,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                        });
                    }
                }}
                styles={{
                    container: {
                        position: 'absolute',
                        width: '100%',
                        zIndex: 1,
                    },
                    listView: { backgroundColor: 'white' },
                }}
            />

            <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFillObject}
                initialRegion={{
                    latitude: marker.latitude,
                    longitude: marker.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }}
                onPress={(e) => setMarker(e.nativeEvent.coordinate)}
            >
                <Marker coordinate={marker} />
            </MapView>

            <View style={{ position: 'absolute', bottom: 40, left: 20, right: 20 }}>
                <Button title="Confirm Location" onPress={confirmLocation} />
            </View>
        </View>
    );
}
