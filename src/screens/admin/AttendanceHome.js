import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const AttendanceHome = ({navigation}) => {
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#104E8B" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerText}>Attendance</Text>

        <View style={{width: 24}} />
      </View>

      {/* CARDS */}
      <View style={styles.cardContainer}>
        {/* GENERATE QR */}
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('GenerateAttendanceQR')}>
          <View style={styles.iconBox}>
            <MaterialCommunityIcons name="qrcode" size={34} color="#fff" />
          </View>

          <Text style={styles.cardTitle}>Generate QR</Text>

          <Text style={styles.cardDesc}>
            Create live QR for teacher attendance
          </Text>
        </TouchableOpacity>

        {/* LIVE ATTENDANCE */}
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('LiveAttendanceScreen')}>
          <View style={[styles.iconBox, {backgroundColor: '#0EA5E9'}]}>
            <MaterialCommunityIcons
              name="account-check-outline"
              size={34}
              color="#fff"
            />
          </View>

          <Text style={styles.cardTitle}>Live Attendance</Text>

          <Text style={styles.cardDesc}>
            Monitor present and absent teachers
          </Text>
        </TouchableOpacity>

        {/* REPORTS */}
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('AttendanceReportScreen')}>
          <View style={[styles.iconBox, {backgroundColor: '#F59E0B'}]}>
            <MaterialCommunityIcons
              name="file-chart-outline"
              size={34}
              color="#fff"
            />
          </View>

          <Text style={styles.cardTitle}>Reports</Text>

          <Text style={styles.cardDesc}>
            View attendance reports and history
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AttendanceHome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2F7',
  },

  header: {
    height: 80,
    backgroundColor: '#104E8B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 30,
    elevation: 5,
  },

  headerText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },

  cardContainer: {
    padding: 16,
    paddingTop: 20,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,

    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },

  iconBox: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },

  cardTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  cardDesc: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    color: '#6B7280',
  },
});
