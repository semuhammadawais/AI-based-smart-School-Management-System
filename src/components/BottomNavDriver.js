import React from 'react';
import {View, TouchableOpacity, Text, StyleSheet} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const BottomNavDriver = ({active = 'Home', navigation}) => {
  return (
    <View style={styles.container}>
      {/* HOME */}
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate('DriverHome')}>
        <MaterialCommunityIcons
          name="home"
          size={22}
          color={active === 'Home' ? '#104E8B' : '#777'}
        />
        <Text style={[styles.label, active === 'Home' && styles.active]}>
          Home
        </Text>
      </TouchableOpacity>

      {/* TRACKING */}
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate('TrackingScreen')}>
        <MaterialCommunityIcons
          name="map-marker"
          size={22}
          color={active === 'Tracking' ? '#104E8B' : '#777'}
        />
        <Text style={[styles.label, active === 'Tracking' && styles.active]}>
          Tracking
        </Text>
      </TouchableOpacity>

      {/* PROFILE */}
      <TouchableOpacity
        style={styles.item}
        onPress={() => navigation.navigate('DriverProfile')}>
        <MaterialCommunityIcons
          name="account"
          size={22}
          color={active === 'Profile' ? '#104E8B' : '#777'}
        />
        <Text style={[styles.label, active === 'Profile' && styles.active]}>
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    justifyContent: 'space-around',
  },

  item: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  label: {
    fontSize: 11,
    color: '#777',
    marginTop: 3,
  },

  active: {
    color: '#104E8B',
    fontWeight: '600',
  },
});
export default BottomNavDriver;
