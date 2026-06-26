import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import Svg, {Circle, G} from 'react-native-svg';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

// ── Donut Chart Component ──
const DonutChart = ({percentage}) => {
  const size = 200;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (percentage / 100) * circumference;
  const color =
    percentage >= 75 ? '#2E7D32' : percentage >= 50 ? '#E65100' : '#C62828';

  return (
    <View style={donutStyles.wrapper}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E0E0E0"
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={progressOffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>
      <View style={donutStyles.centerText}>
        <Text style={[donutStyles.percentage, {color}]}>{percentage}%</Text>
        <Text style={donutStyles.label}>Attendance</Text>
      </View>
    </View>
  );
};

const donutStyles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerText: {
    position: 'absolute',
    alignItems: 'center',
  },
  percentage: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
});

// ── Main Screen ──
const StudentAttendanceScreen = ({navigation}) => {
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const [student, setStudent] = useState(null);
  const [error, setError] = useState(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    loadStudentAndAttendance();
  }, []);

  const loadStudentAndAttendance = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentUser = auth().currentUser;
      if (!currentUser) {
        setError('Not logged in');
        setLoading(false);
        return;
      }

      // ── STEP 1: GET STUDENT ──
      const snap = await firestore()
        .collection('students')
        .where('email', '==', currentUser.email)
        .get();

      if (snap.empty) {
        setError('Student record not found');
        setLoading(false);
        return;
      }

      const studentData = snap.docs[0].data();
      setStudent(studentData);

      const className = studentData.admissionClass;
      const rollNo = studentData.registrationNumber;

      console.log(
        'Student:',
        studentData.name,
        '| Class:',
        className,
        '| Roll:',
        rollNo,
      );

      // ── STEP 2: FETCH LAST 14 DAYS IN PARALLEL ──
      const today = new Date();
      const dateStrings = [];

      for (let i = 0; i < 14; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        dateStrings.push(d.toISOString().split('T')[0]);
      }

      const fetchPromises = dateStrings.map(dateStr =>
        firestore()
          .collection('Attendance')
          .doc(dateStr)
          .collection(className)
          .doc(rollNo)
          .get()
          .then(docSnap => {
            if (docSnap.exists) {
              const data = docSnap.data();
              return {
                date: dateStr,
                status: data.status || 'absent',
              };
            }
            return null;
          })
          .catch(() => null),
      );

      const allResults = await Promise.all(fetchPromises);
      const results = allResults.filter(item => item !== null);

      console.log('Total records found:', results.length);
      setAttendance(results);
      setLoading(false);
    } catch (err) {
      console.log('Error:', err);
      setError('Failed to load attendance');
      setLoading(false);
    }
  };

  // ───────── LOADING ─────────
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar backgroundColor="#104E8B" barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Attendance</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#104E8B" />
          <Text style={styles.loadingText}>Loading attendance...</Text>
        </View>
      </View>
    );
  }

  // ───────── ERROR ─────────
  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar backgroundColor="#104E8B" barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Attendance</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  // ───────── STATS ─────────
  const presentCount = attendance.filter(a => a.status === 'present').length;
  const absentCount = attendance.length - presentCount;
  const percentage =
    attendance.length > 0
      ? Math.round((presentCount / attendance.length) * 100)
      : 0;

  // ───────── UI ─────────
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#104E8B" barStyle="light-content" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Attendance</Text>
        <View style={styles.backBtn} />
      </View>

      {/* ── Body ── */}
      <View style={styles.body}>
        {/* Student info */}
        <Text style={styles.studentName}>{student?.name}</Text>
        <Text style={styles.studentSub}>Class {student?.admissionClass}</Text>

        {/* ── Donut Card ── */}
        <View style={styles.donutCard}>
          <DonutChart percentage={percentage} />
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.dot, {backgroundColor: '#2E7D32'}]} />
              <Text style={styles.statValue}>{presentCount}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.dot, {backgroundColor: '#C62828'}]} />
              <Text style={styles.statValue}>{absentCount}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.dot, {backgroundColor: '#104E8B'}]} />
              <Text style={styles.statValue}>{attendance.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>

        {/* ── Status Message ── */}
        <View
          style={[
            styles.statusMessage,
            {
              backgroundColor:
                percentage >= 75
                  ? '#E8F5E9'
                  : percentage >= 50
                  ? '#FFF3E0'
                  : '#FFEBEE',
            },
          ]}>
          <Text
            style={[
              styles.statusMessageText,
              {
                color:
                  percentage >= 75
                    ? '#2E7D32'
                    : percentage >= 50
                    ? '#E65100'
                    : '#C62828',
              },
            ]}>
            {percentage >= 75
              ? '✅ Good attendance! Keep it up.'
              : percentage >= 50
              ? '⚠️ Attendance is low. Try to improve.'
              : '❌ Critical! Attendance is very low.'}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },

  // ── Header ──
  header: {
    backgroundColor: '#104E8B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 14,
    elevation: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },

  // ── Body ──
  body: {
    flex: 1,
    padding: 20,
  },
  studentName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#104E8B',
    textAlign: 'center',
    marginTop: 10,
  },
  studentSub: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    marginTop: 3,
  },

  // ── Donut Card ──
  donutCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    elevation: 4,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    marginTop: 25,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statItem: {
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },

  // ── Status Message ──
  statusMessage: {
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  statusMessageText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // ── Misc ──
  loadingText: {
    marginTop: 10,
    color: '#888',
    fontSize: 14,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default StudentAttendanceScreen;
