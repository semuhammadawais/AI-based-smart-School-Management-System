import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';

const LiveBusMap = () => {
  const [busData, setBusData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('BusTracking')
      .onSnapshot(
        async snapshot => {
          try {
            if (snapshot.empty) {
              setLoading(false);
              return;
            }

            const trackingDoc = snapshot.docs[0];
            const trackingData = trackingDoc.data();
            const driverId = trackingDoc.id;

            const driverDoc = await firestore()
              .collection('Drivers')
              .doc(driverId)
              .get();

            const driverData = driverDoc.exists ? driverDoc.data() : {};

            setBusData({
              ...trackingData,
              ...driverData,
            });

            setLoading(false);
          } catch (error) {
            console.log('Tracking Error:', error);
            setLoading(false);
          }
        },
        error => {
          console.log(error);
          setLoading(false);
        },
      );

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#104E8B" />
        <Text style={styles.loadingText}>Connecting to Bus...</Text>
      </View>
    );
  }

  if (!busData) {
    return (
      <View style={styles.loader}>
        <Text style={styles.noData}>No Bus Tracking Data Found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#104E8B" barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Live Bus Tracking</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.busCard}>
          <Text style={styles.busIcon}>🚌</Text>

          <Text style={styles.driverName}>{busData.name || 'Driver'}</Text>

          <Text style={styles.route}>
            {busData.route || 'Route Not Assigned'}
          </Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.row}>
            <Text style={styles.label}>Bus Number</Text>
            <Text style={styles.value}>{busData.busNumber || 'N/A'}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Driver</Text>
            <Text style={styles.value}>{busData.name || 'N/A'}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Phone</Text>
            <Text style={styles.value}>{busData.phone || 'N/A'}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Route</Text>
            <Text style={styles.value}>{busData.route || 'N/A'}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Speed</Text>
            <Text style={styles.value}>{busData.speed || 0} km/h</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Latitude</Text>
            <Text style={styles.value}>
              {busData.latitude ? busData.latitude.toFixed(6) : 'N/A'}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Longitude</Text>
            <Text style={styles.value}>
              {busData.longitude ? busData.longitude.toFixed(6) : 'N/A'}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <Text
              style={[
                styles.value,
                {
                  color: busData.isTracking ? '#2E8B57' : '#DC143C',
                },
              ]}>
              {busData.isTracking ? 'On Trip' : 'Stopped'}
            </Text>
          </View>
        </View>

        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>Live Tracking Status</Text>

          <Text style={styles.noticeText}>
            {busData.isTracking
              ? 'Driver has started the trip and location is updating live.'
              : 'Driver has not started the trip yet.'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default LiveBusMap;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },

  header: {
    backgroundColor: '#104E8B',
    paddingTop: 45,
    paddingBottom: 15,
    paddingHorizontal: 16,
  },

  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },

  noData: {
    fontSize: 18,
    fontWeight: '600',
  },

  content: {
    padding: 15,
  },

  busCard: {
    backgroundColor: '#104E8B',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
  },

  busIcon: {
    fontSize: 60,
  },

  driverName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginTop: 10,
  },

  route: {
    color: '#fff',
    marginTop: 5,
    fontSize: 15,
  },

  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    elevation: 3,
    marginBottom: 15,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ddd',
  },

  label: {
    fontWeight: '600',
    color: '#555',
  },

  value: {
    color: '#111',
    fontWeight: '500',
    maxWidth: '55%',
    textAlign: 'right',
  },

  noticeCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    elevation: 3,
  },

  noticeTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
    color: '#104E8B',
  },

  noticeText: {
    color: '#444',
    lineHeight: 22,
  },
});
