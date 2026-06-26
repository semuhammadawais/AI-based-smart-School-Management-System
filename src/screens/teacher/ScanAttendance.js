import React, {useRef, useState} from 'react';
import {View, Text, StyleSheet, Alert, ActivityIndicator} from 'react-native';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

import {CameraScreen} from 'react-native-camera-kit';

const ScanAttendance = () => {
  const [loading, setLoading] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(true);

  // HARD LOCK
  const scannedRef = useRef(false);

  const resetScanner = () => {
    scannedRef.current = false;

    setLoading(false);

    setTimeout(() => {
      setScannerVisible(true);
    }, 1000);
  };

  const onQRCodeScan = async event => {
    // PREVENT MULTIPLE SCANS
    if (scannedRef.current) {
      return;
    }

    // LOCK SCANNER
    scannedRef.current = true;

    // HIDE CAMERA
    setScannerVisible(false);

    setLoading(true);

    console.log('STARTING ATTENDANCE PROCESS');

    try {
      const rawValue = event?.nativeEvent?.codeStringValue;

      if (!rawValue) {
        throw new Error('QR data not found');
      }

      // PARSE QR JSON
      const qrData = JSON.parse(rawValue);

      console.log('QR DATA:', qrData);

      const sessionId = qrData?.sessionId;

      if (!sessionId) {
        throw new Error('Invalid session ID');
      }

      // =========================
      // CHECK SESSION
      // =========================

      console.log('CHECKING SESSION...');

      const sessionDoc = await firestore()
        .collection('attendanceSessions')
        .doc(sessionId)
        .get();

      console.log('SESSION CHECK COMPLETE');

      if (!sessionDoc.exists) {
        Alert.alert('Invalid Session', 'QR session not found');

        resetScanner();
        return;
      }

      const sessionData = sessionDoc.data();

      console.log('SESSION DATA:', sessionData);

      // CHECK ACTIVE SESSION
      if (!sessionData?.active) {
        Alert.alert('Session Expired', 'Attendance session closed');

        resetScanner();
        return;
      }

      // =========================
      // GET LOGGED-IN TEACHER
      // =========================

      console.log('GETTING CURRENT USER...');

      const currentUser = auth().currentUser;

      if (!currentUser) {
        throw new Error('Teacher not logged in');
      }

      const teacherId = currentUser.uid;

      console.log('TEACHER UID:', teacherId);

      // GET TEACHER DATA
      const teacherDoc = await firestore()
        .collection('Teachers')
        .doc(teacherId)
        .get();

      if (!teacherDoc.exists) {
        throw new Error('Teacher profile not found');
      }

      const teacherData = teacherDoc.data();

      console.log('TEACHER DATA:', teacherData);

      const teacherName = teacherData?.name || 'Unknown Teacher';

      // =========================
      // DATE
      // =========================

      const today = new Date().toISOString().split('T')[0];

      // UNIQUE ATTENDANCE ID
      const attendanceId = `${teacherId}_${today}`;

      // =========================
      // CHECK DUPLICATE
      // =========================

      console.log('CHECKING DUPLICATE...');

      const attendanceDoc = await firestore()
        .collection('teacherAttendance')
        .doc(attendanceId)
        .get();

      console.log('DUPLICATE CHECK COMPLETE');

      if (attendanceDoc.exists === true) {
        console.log('ATTENDANCE ALREADY EXISTS');

        Alert.alert('Already Marked', 'Attendance already submitted today');

        resetScanner();
        return;
      }

      console.log('NO DUPLICATE FOUND');

      // =========================
      // SAVE ATTENDANCE
      // =========================

      console.log('SAVING ATTENDANCE...');

      await firestore().collection('teacherAttendance').doc(attendanceId).set({
        teacherId,
        teacherName,

        sessionId,

        status: 'Present',

        date: today,

        scannedAt: firestore.FieldValue.serverTimestamp(),

        device: 'mobile',
      });

      console.log('ATTENDANCE SAVED SUCCESSFULLY');

      Alert.alert('Success', 'Attendance marked successfully');

      // RESET SCANNER AFTER SUCCESS
      setLoading(false);

      setTimeout(() => {
        scannedRef.current = false;
        setScannerVisible(true);
      }, 1500);
    } catch (error) {
      console.log('FULL ERROR:', JSON.stringify(error));

      console.log('ERROR MESSAGE:', error?.message);

      Alert.alert('Error', error?.message || 'Something went wrong');

      resetScanner();
    }
  };

  return (
    <View style={styles.container}>
      {scannerVisible && (
        <CameraScreen
          style={StyleSheet.absoluteFill}
          scanBarcode={true}
          onReadCode={onQRCodeScan}
          showFrame={true}
          laserColor="#00FF99"
          frameColor="#00FF99"
        />
      )}

      <View style={styles.overlay}>
        <Text style={styles.text}>Scan Attendance QR</Text>

        <Text style={styles.subText}>Point camera toward admin QR code</Text>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00FF99" />

          <Text style={styles.loadingText}>Processing Attendance...</Text>
        </View>
      )}
    </View>
  );
};

export default ScanAttendance;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  overlay: {
    position: 'absolute',
    top: 70,
    width: '100%',
    alignItems: 'center',
  },

  text: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },

  subText: {
    marginTop: 8,
    color: '#D1D5DB',
    fontSize: 14,
  },

  loadingContainer: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderRadius: 18,
  },

  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
  },
});
