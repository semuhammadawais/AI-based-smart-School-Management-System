import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  Animated,
} from 'react-native';

import Geolocation from 'react-native-geolocation-service';

const {width} = Dimensions.get('window');

const PRAYER_ORDER = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

const ARABIC = {
  Fajr: 'الفجر',
  Dhuhr: 'الظهر',
  Asr: 'العصر',
  Maghrib: 'المغرب',
  Isha: 'العشاء',
};

const PrayerCard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [locationName, setLocationName] = useState('Loading...');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [prayerTimes, setPrayerTimes] = useState({});
  const [currentPrayer, setCurrentPrayer] = useState('');
  const [nextPrayer, setNextPrayer] = useState('');
  const [timeUntilNext, setTimeUntilNext] = useState('');
  const [islamicDate, setIslamicDate] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    requestLocationPermission();

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (Object.keys(prayerTimes).length > 0) {
      detectPrayer();
    }
  }, [currentTime, prayerTimes]);

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocation();
        } else {
          setError('Location permission denied');
          setLoading(false);
        }
      } else {
        getCurrentLocation();
      }
    } catch (e) {
      console.log(e);
      setError('Permission request failed');
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      async position => {
        const {latitude, longitude} = position.coords;

        fetchPrayerTimes(latitude, longitude);
        fetchLocation(latitude, longitude);
      },
      error => {
        console.log(error);

        setError('Unable to fetch location.\nPlease enable GPS and try again.');

        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      },
    );
  };

  const fetchLocation = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`,
      );

      const data = await response.json();

      setLocationName(
        data.address.city ||
          data.address.town ||
          data.address.village ||
          'Your Location',
      );
    } catch (e) {
      setLocationName('Your Location');
    }
  };

  const fetchPrayerTimes = async (lat, lon) => {
    try {
      const today = new Date();

      const date = `${today.getDate()}-${
        today.getMonth() + 1
      }-${today.getFullYear()}`;

      const response = await fetch(
        `https://api.aladhan.com/v1/timings/${date}?latitude=${lat}&longitude=${lon}&method=1`,
      );

      const json = await response.json();

      const timings = json.data.timings;

      setPrayerTimes({
        Fajr: timings.Fajr,
        Dhuhr: timings.Dhuhr,
        Asr: timings.Asr,
        Maghrib: timings.Maghrib,
        Isha: timings.Isha,
      });

      const hijri = json.data.date.hijri;

      setIslamicDate(`${hijri.day} ${hijri.month.en} ${hijri.year}`);

      setLoading(false);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (e) {
      console.log(e);

      setError('Failed to load prayer times');
      setLoading(false);
    }
  };

  const toMinutes = time => {
    const [h, m] = time.split(':').map(Number);

    return h * 60 + m;
  };

  const detectPrayer = () => {
    const now = currentTime.getHours() * 60 + currentTime.getMinutes();

    const prayerMinutes = PRAYER_ORDER.map(name =>
      toMinutes(prayerTimes[name]),
    );

    let currentIndex = 0;

    for (let i = 0; i < prayerMinutes.length; i++) {
      if (now >= prayerMinutes[i]) {
        currentIndex = i;
      }
    }

    const nextIndex = (currentIndex + 1) % PRAYER_ORDER.length;

    setCurrentPrayer(PRAYER_ORDER[currentIndex]);

    setNextPrayer(PRAYER_ORDER[nextIndex]);

    let diff = prayerMinutes[nextIndex] - now;

    if (diff < 0) {
      diff += 24 * 60;
    }

    const h = Math.floor(diff / 60);
    const m = diff % 60;

    setTimeUntilNext(`${h}h ${m}m`);
  };

  const handleRefresh = () => {
    setLoading(true);
    setError('');
    requestLocationPermission();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7BA428" />

        <Text style={styles.loadingText}>Loading Prayer Times...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>{error}</Text>

        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
        },
      ]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.location}>📍 {locationName}</Text>

          <Text style={styles.date}>{islamicDate}</Text>
        </View>

        <Text style={styles.clock}>
          {currentTime.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>

      <View style={styles.currentPrayerBox}>
        <Text style={styles.currentPrayerLabel}>Current Prayer</Text>

        <Text style={styles.currentPrayer}>{currentPrayer}</Text>

        <Text style={styles.arabic}>{ARABIC[currentPrayer]}</Text>

        <Text style={styles.nextPrayer}>
          Next: {nextPrayer} ({timeUntilNext})
        </Text>
      </View>

      <View style={styles.prayerRow}>
        {PRAYER_ORDER.map(prayer => {
          const active = prayer === currentPrayer;

          return (
            <View
              key={prayer}
              style={[styles.prayerBox, active && styles.activePrayerBox]}>
              <Text style={[styles.prayerName, active && styles.activeText]}>
                {prayer}
              </Text>

              <Text style={[styles.prayerTime, active && styles.activeText]}>
                {prayerTimes[prayer]}
              </Text>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
};

export default PrayerCard;

const styles = StyleSheet.create({
  container: {
    width: width - 20,
    backgroundColor: '#1D2B34',
    alignSelf: 'center',
    borderRadius: 18,
    padding: 16,
    marginTop: 20,
  },

  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },

  loadingText: {
    color: '#555',
    marginTop: 12,
  },

  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 15,
  },

  retryButton: {
    backgroundColor: '#7BA428',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },

  retryText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  location: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  date: {
    color: '#C5D0D8',
    marginTop: 4,
  },

  clock: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
  },

  currentPrayerBox: {
    backgroundColor: '#2D3F4A',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },

  currentPrayerLabel: {
    color: '#AAB7C0',
    marginBottom: 8,
  },

  currentPrayer: {
    color: '#9BCB1F',
    fontSize: 28,
    fontWeight: 'bold',
  },

  arabic: {
    color: '#fff',
    fontSize: 18,
    marginTop: 6,
  },

  nextPrayer: {
    color: '#C5D0D8',
    marginTop: 10,
  },

  prayerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  prayerBox: {
    flex: 1,
    backgroundColor: '#2D3F4A',
    marginHorizontal: 3,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },

  activePrayerBox: {
    backgroundColor: '#9BCB1F',
  },

  prayerName: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 5,
  },

  prayerTime: {
    color: '#fff',
    fontWeight: '700',
  },

  activeText: {
    color: '#1D2B34',
  },
});
