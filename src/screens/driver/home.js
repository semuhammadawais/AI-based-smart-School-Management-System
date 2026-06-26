import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import BottomNavDriver from '../../components/BottomNavDriver';

const DriverHomeScreen = ({navigation}) => {
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#104E8B" barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Driver Home</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* DRIVER CARD */}
        <View style={styles.driverCard}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="bus" size={26} color="#104E8B" />
          </View>

          <View style={{flex: 1}}>
            <Text style={styles.name}>Driver Panel</Text>
            <Text style={styles.sub}>Manage your bus & route</Text>

            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>🟡 Not Started</Text>
            </View>
          </View>
        </View>

        {/* TODAY TRIP */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Today's Trip</Text>

          <Text style={styles.infoText}>
            Status: <Text style={styles.boldText}>Not Started</Text>
          </Text>

          <Text style={styles.infoText}>
            Bus Number: <Text style={styles.boldText}>BUS-01</Text>
          </Text>
        </View>

        {/* ROUTE */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Assigned Route</Text>

          <Text style={styles.infoText}>School → Main Bazaar → Jinnahabad</Text>
        </View>

        {/* QUICK STATS */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons
              name="map-marker-path"
              size={28}
              color="#104E8B"
            />
            <Text style={styles.statValue}>12 km</Text>
            <Text style={styles.statLabel}>Route</Text>
          </View>

          <View style={styles.statCard}>
            <MaterialCommunityIcons
              name="account-group"
              size={28}
              color="#22A96E"
            />
            <Text style={styles.statValue}>35</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
        </View>

        {/* START BUTTON */}
        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => navigation.navigate('TrackingScreen')}>
          <MaterialCommunityIcons name="play-circle" size={22} color="#fff" />
          <Text style={styles.startBtnText}>Start Trip</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNavDriver active="Home" navigation={navigation} />
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
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },

  driverCard: {
    backgroundColor: '#1A5FA8',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  avatar: {
    width: 55,
    height: 55,
    borderRadius: 14,
    backgroundColor: '#BFDBF7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  name: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },

  sub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
  },

  statusBadge: {
    marginTop: 8,
    backgroundColor: '#22A96E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },

  statusText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },

  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#104E8B',
    marginBottom: 10,
  },

  infoText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
  },

  boldText: {
    fontWeight: '700',
    color: '#111',
  },

  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 16,
  },

  statCard: {
    backgroundColor: '#fff',
    width: '48%',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },

  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
    color: '#111',
  },

  statLabel: {
    fontSize: 12,
    color: '#777',
    marginTop: 4,
  },

  startBtn: {
    backgroundColor: '#22A96E',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },

  startBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    marginLeft: 8,
  },
});

export default DriverHomeScreen;
