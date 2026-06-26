import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Switch,
  PermissionsAndroid,
  Platform,
} from 'react-native';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import BottomNavDriver from '../../components/BottomNavDriver';
import Geolocation from 'react-native-geolocation-service';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const TrackingScreen = ({navigation}) => {
  const [tracking, setTracking] = useState(false);
  const [location, setLocation] = useState(null);

  const watchId = useRef(null);

  // ─── PERMISSION ───
  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  };

  // ─── START TRACKING ───
  const startTracking = async () => {
    const permission = await requestLocationPermission();
    if (!permission) return;

    setTracking(true);

    watchId.current = Geolocation.watchPosition(
      async position => {
        const {latitude, longitude, speed} = position.coords;

        const data = {
          latitude,
          longitude,
          speed: speed || 0,
          isTracking: true,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        };

        setLocation(data);

        console.log('LIVE:', latitude, longitude);

        // ─── FIREBASE LIVE UPDATE ───
        const uid = auth().currentUser?.uid;

        if (uid) {
          await firestore()
            .collection('BusTracking')
            .doc(uid)
            .set(data, {merge: true});
        }
      },
      error => {
        console.log('GPS ERROR:', error);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10,
        interval: 5000,
        fastestInterval: 3000,
      },
    );
  };

  // ─── STOP TRACKING ───
  const stopTracking = async () => {
    setTracking(false);

    if (watchId.current !== null) {
      Geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }

    const uid = auth().currentUser?.uid;

    if (uid) {
      await firestore().collection('BusTracking').doc(uid).set(
        {
          isTracking: false,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        },
        {merge: true},
      );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#104E8B" barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Live Tracking</Text>
      </View>

      <View style={styles.content}>
        {/* STATUS CARD */}
        <View style={styles.card}>
          <MaterialCommunityIcons
            name={tracking ? 'bus-marker' : 'bus-stop'}
            size={40}
            color={tracking ? '#22A96E' : '#FF9800'}
          />

          <Text style={styles.status}>
            {tracking ? 'Trip Active' : 'Trip Not Started'}
          </Text>

          <Text style={styles.subText}>
            {tracking
              ? 'Location is being shared live'
              : 'Start trip to enable tracking'}
          </Text>
        </View>

        {/* LOCATION CARD */}
        <View style={styles.infoCard}>
          <Text style={styles.title}>Live Status</Text>

          <Text style={styles.info}>Bus: BUS-01</Text>

          {location ? (
            <>
              <Text style={styles.info}>Lat: {location.latitude}</Text>
              <Text style={styles.info}>Lng: {location.longitude}</Text>
              <Text style={styles.info}>
                Speed: {(location.speed * 3.6).toFixed(2)} km/h
              </Text>
            </>
          ) : (
            <Text style={styles.info}>No live data yet</Text>
          )}
        </View>

        {/* SWITCH */}
        <View style={styles.switchCard}>
          <Text style={styles.switchLabel}>
            {tracking ? 'Tracking Enabled' : 'Tracking Disabled'}
          </Text>

          <Switch
            value={tracking}
            onValueChange={value => {
              if (value) startTracking();
              else stopTracking();
            }}
          />
        </View>

        {/* BUTTON */}
        <TouchableOpacity
          style={[
            styles.button,
            {backgroundColor: tracking ? '#E53935' : '#22A96E'},
          ]}
          onPress={() => {
            if (tracking) stopTracking();
            else startTracking();
          }}>
          <Text style={styles.buttonText}>
            {tracking ? 'Stop Trip' : 'Start Trip'}
          </Text>
        </TouchableOpacity>
      </View>

      <BottomNavDriver active="Tracking" navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4F7',
  },

  header: {
    backgroundColor: '#104E8B',
    paddingTop: 44,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },

  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },

  content: {
    flex: 1,
    padding: 16,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
  },

  status: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 10,
    color: '#111',
  },

  subText: {
    marginTop: 6,
    color: '#666',
    textAlign: 'center',
  },

  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
  },

  title: {
    fontWeight: '700',
    fontSize: 15,
    color: '#104E8B',
    marginBottom: 10,
  },

  info: {
    color: '#555',
    marginBottom: 6,
  },

  switchCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },

  switchLabel: {
    fontWeight: '600',
    color: '#111',
  },

  button: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default TrackingScreen;
