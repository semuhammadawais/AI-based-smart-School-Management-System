import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, SafeAreaView} from 'react-native';
import firestore from '@react-native-firebase/firestore';

import QRCode from 'react-native-qrcode-svg';

const GenerateAttendanceQR = () => {
  const [sessionData, setSessionData] = useState(null);

  useEffect(() => {
    generateQRSession();
  }, []);
  const generateQRSession = async () => {
    try {
      const sessionId = `ATT_${Date.now()}`;

      const qrData = {
        type: 'teacher_attendance',
        sessionId: sessionId,
        createdAt: Date.now(),
        active: true,
      };

      // SAVE TO FIRESTORE
      await firestore()
        .collection('attendanceSessions')
        .doc(sessionId)
        .set({
          ...qrData,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });

      setSessionData(qrData);
    } catch (error) {
      console.log('QR Session Error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Teacher Attendance QR</Text>

      <Text style={styles.subHeading}>
        Teachers can scan this QR to mark attendance
      </Text>

      <View style={styles.qrContainer}>
        {sessionData && (
          <QRCode value={JSON.stringify(sessionData)} size={250} />
        )}
      </View>

      {sessionData && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>Session ID:</Text>

          <Text style={styles.sessionId}>{sessionData.sessionId}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

export default GenerateAttendanceQR;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
    alignItems: 'center',
    paddingTop: 40,
  },

  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },

  subHeading: {
    marginTop: 10,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  qrContainer: {
    marginTop: 50,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 24,

    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },

  infoBox: {
    marginTop: 30,
    alignItems: 'center',
  },

  infoText: {
    fontSize: 14,
    color: '#6B7280',
  },

  sessionId: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
});
