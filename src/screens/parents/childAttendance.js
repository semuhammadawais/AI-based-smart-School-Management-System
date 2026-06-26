import React, {useEffect, useState, useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import Svg, {Circle} from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import {AuthContext} from '../../context/authContext';

const DONUT_SIZE = 110;
const STROKE_WIDTH = 12;
const RADIUS = (DONUT_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// ── Donut Chart ──────────────────────────────────────────
const DonutChart = ({present, absent, total}) => {
  const presentRatio = total > 0 ? present / total : 0;
  const absentRatio = total > 0 ? absent / total : 0;

  const presentArc = CIRCUMFERENCE * presentRatio;
  const absentArc = CIRCUMFERENCE * absentRatio;
  const gapArc = CIRCUMFERENCE - presentArc - absentArc;

  const presentOffset = CIRCUMFERENCE * 0.25;
  const absentOffset = presentOffset - presentArc;
  const gapOffset = absentOffset - absentArc;

  const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

  return (
    <View style={styles.donutWrapper}>
      <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
        <Circle
          cx={DONUT_SIZE / 2}
          cy={DONUT_SIZE / 2}
          r={RADIUS}
          stroke="rgba(255,255,255,0.18)"
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        {gapArc > 0 && (
          <Circle
            cx={DONUT_SIZE / 2}
            cy={DONUT_SIZE / 2}
            r={RADIUS}
            stroke="rgba(255,255,255,0.35)"
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={`${gapArc} ${CIRCUMFERENCE - gapArc}`}
            strokeDashoffset={gapOffset}
            strokeLinecap="round"
          />
        )}
        {absentArc > 0 && (
          <Circle
            cx={DONUT_SIZE / 2}
            cy={DONUT_SIZE / 2}
            r={RADIUS}
            stroke="#EF4444"
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={`${absentArc} ${CIRCUMFERENCE - absentArc}`}
            strokeDashoffset={absentOffset}
            strokeLinecap="round"
          />
        )}
        {presentArc > 0 && (
          <Circle
            cx={DONUT_SIZE / 2}
            cy={DONUT_SIZE / 2}
            r={RADIUS}
            stroke="#22C55E"
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={`${presentArc} ${CIRCUMFERENCE - presentArc}`}
            strokeDashoffset={presentOffset}
            strokeLinecap="round"
          />
        )}
      </Svg>
      <View style={styles.donutCenter}>
        <Text style={styles.donutPct}>{percentage}%</Text>
        <Text style={styles.donutLabel}>present</Text>
      </View>
    </View>
  );
};

// ── Legend Row ───────────────────────────────────────────
const LegendRow = ({color, label, count}) => (
  <View style={styles.legendRow}>
    <View style={[styles.legendDot, {backgroundColor: color}]} />
    <Text style={styles.legendText}>{label}</Text>
    <Text style={styles.legendCount}>{count} days</Text>
  </View>
);

// ── Top Bar ──────────────────────────────────────────────
const TopBar = ({navigation}) => (
  <View style={styles.topBar}>
    <TouchableOpacity
      style={styles.backBtn}
      onPress={() => navigation.goBack()}>
      <Icon name="arrow-left" size={24} color="#fff" />
    </TouchableOpacity>
    <Text style={styles.topBarTitle}>Child Attendance</Text>
    <View style={styles.backBtn} />
  </View>
);

// ── Main Screen ──────────────────────────────────────────
const ChildAttendance = ({navigation}) => {
  const {user} = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const [student, setStudent] = useState(null);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);

      const mappingSnap = await firestore()
        .collection('ParentStudentMapping')
        .where('parentId', '==', user.uid)
        .get();

      if (mappingSnap.empty) {
        setLoading(false);
        return;
      }

      const studentId = mappingSnap.docs[0].data().studentId;

      const studentSnap = await firestore()
        .collection('students')
        .doc(studentId)
        .get();

      const studentData = studentSnap.data();
      setStudent(studentData);

      const className = studentData.admissionClass;
      const rollNo = studentData.registrationNumber;

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
              return {
                id: docSnap.id,
                date: dateStr,
                status: docSnap.data().status || 'absent',
              };
            }
            return {id: dateStr, date: dateStr, status: null};
          }),
      );

      const results = await Promise.all(fetchPromises);
      setAttendance(results);
    } catch (error) {
      console.log('Attendance Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const presentCount = attendance.filter(
    a => a.status === 'present' || a.status === 'Present',
  ).length;
  const absentCount = attendance.filter(
    a => a.status === 'absent' || a.status === 'Absent',
  ).length;
  const totalDays = 14;

  const renderHeader = () => (
    <View style={styles.infoCard}>
      <Text style={styles.studentName}>{student?.name}</Text>
      <Text style={styles.studentSub}>
        Class: {student?.admissionClass || 'N/A'}
      </Text>
      <View style={styles.donutRow}>
        <DonutChart
          present={presentCount}
          absent={absentCount}
          total={totalDays}
        />
        <View style={styles.legendBox}>
          <LegendRow color="#22C55E" label="Present" count={presentCount} />
          <LegendRow color="#EF4444" label="Absent" count={absentCount} />
          <LegendRow
            color="rgba(255,255,255,0.35)"
            label="No record"
            count={totalDays - presentCount - absentCount}
          />
        </View>
      </View>
    </View>
  );

  const renderItem = ({item}) => {
    if (!item.status) return null;
    const isPresent = item.status === 'present' || item.status === 'Present';

    return (
      <View style={styles.card}>
        <View>
          <Text style={styles.date}>{item.date}</Text>
          <Text style={styles.classText}>
            Class: {student?.admissionClass || 'N/A'}
          </Text>
        </View>
        <View
          style={[
            styles.badge,
            {backgroundColor: isPresent ? '#22C55E' : '#EF4444'},
          ]}>
          <Text style={styles.badgeText}>{item.status}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.topSafeArea} />
        <StatusBar backgroundColor="#104E8B" barStyle="light-content" />
        <TopBar navigation={navigation} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#104E8B" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.topSafeArea} />
      <StatusBar backgroundColor="#104E8B" barStyle="light-content" />

      <TopBar navigation={navigation} />

      <FlatList
        data={attendance.filter(a => a.status !== null)}
        keyExtractor={(item, index) => item?.date + index}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListHeaderComponentStyle={styles.listHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.empty}>No attendance records found</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // ── Root & Safe Area ──
  root: {
    flex: 1,
    backgroundColor: '#F2F4F7',
  },
  topSafeArea: {
    backgroundColor: '#104E8B',
  },

  // ── Top Bar ──
  topBar: {
    backgroundColor: '#104E8B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  topBarTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },

  // ── Body ──
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  listHeader: {
    marginBottom: 4,
  },

  // ── Info Card ──
  infoCard: {
    backgroundColor: '#104E8B',
    padding: 20,
    borderRadius: 18,
    marginTop: 16,
    marginBottom: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  studentName: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  studentSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 3,
  },

  // ── Donut ──
  donutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    gap: 20,
  },
  donutWrapper: {
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutPct: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 26,
  },
  donutLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    marginTop: 1,
  },

  // ── Legend ──
  legendBox: {
    flex: 1,
    gap: 10,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    flex: 1,
  },
  legendCount: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Attendance Card ──
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  date: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
  },
  classText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },

  // ── Badge ──
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  // ── Empty ──
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: '#777',
    fontSize: 14,
  },
});

export default ChildAttendance;
