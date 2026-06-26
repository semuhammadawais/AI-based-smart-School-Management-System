import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation, useRoute} from '@react-navigation/native';

const BottomNav = () => {
  const navigation = useNavigation();
  const route = useRoute();

  const [active, setActive] = useState(route.name);

  const goTo = screen => {
    setActive(screen);
    navigation.navigate(screen);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.bottomNav}>
        {/* HOME */}
        <TouchableOpacity style={styles.navItem} onPress={() => goTo('Home')}>
          <MaterialCommunityIcons
            name="home-outline"
            size={24}
            color={active === 'Home' ? '#104E8B' : '#999'}
          />
          <Text
            style={[styles.navText, active === 'Home' && styles.activeText]}>
            Home
          </Text>
        </TouchableOpacity>

        {/* REPORT */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => goTo('Marksheet')}>
          <MaterialCommunityIcons
            name="chart-box-outline"
            size={24}
            color={active === 'Marksheet' ? '#104E8B' : '#999'}
          />
          <Text
            style={[
              styles.navText,
              active === 'Marksheet' && styles.activeText,
            ]}>
            Report
          </Text>
        </TouchableOpacity>

        {/* PROFILE */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => goTo('Profile')}>
          <MaterialCommunityIcons
            name="account-outline"
            size={24}
            color={active === 'Profile' ? '#104E8B' : '#999'}
          />
          <Text
            style={[styles.navText, active === 'Profile' && styles.activeText]}>
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default BottomNav;

/* ───────── STYLES ───────── */
const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 15,
    left: 10,
    right: 10,
    alignItems: 'center',
  },

  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',

    backgroundColor: 'white',
    width: '100%',

    paddingVertical: 12,
    borderRadius: 18,

    // shadow (iOS)
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 5},

    // shadow (Android)
    elevation: 6,
  },

  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },

  navText: {
    marginTop: 4,
    fontSize: 11,
    color: '#999',
  },

  activeText: {
    color: '#104E8B',
    fontWeight: '700',
  },
});
