import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, FlatList, TouchableOpacity} from 'react-native';
import firestore from '@react-native-firebase/firestore';

const AttendanceReportScreen = () => {
  const [mode, setMode] = useState('daily'); // daily | monthly
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0],
  );

  const [summary, setSummary] = useState({
    present: 0,
    late: 0,
    absent: 0,
    total: 0,
    percent: 0,
  });

  const [data, setData] = useState([]);

  useEffect(() => {
    loadReport();
  }, [selectedDate, mode]);

  // ===============================
  // MAIN REPORT LOADER
  // ===============================
  const loadReport = async () => {
    const teacherSnap = await firestore().collection('Teachers').get();

    const teachers = [];
    teacherSnap.forEach(doc => {
      teachers.push({id: doc.id, ...doc.data()});
    });

    let attQuery = firestore().collection('teacherAttendance');

    // DAILY MODE
    if (mode === 'daily') {
      attQuery = attQuery.where('date', '==', selectedDate);
    }

    const attSnap = await attQuery.get();

    const attMap = {};
    attSnap.forEach(doc => {
      const d = doc.data();
      attMap[d.teacherId] = d;
    });

    let present = 0;
    let late = 0;

    const merged = teachers.map(t => {
      const att = attMap[t.id];

      let status = 'Absent';

      if (att?.status === 'Present') {
        status = 'Present';
        present++;
      } else if (att?.status === 'Late') {
        status = 'Late';
        late++;
      }

      return {
        id: t.id,
        name: t.name,
        status,
        time: att?.scannedAt || null,
      };
    });

    const total = teachers.length;
    const absent = total - (present + late);
    const percent = total ? ((present + late) / total) * 100 : 0;

    setData(merged);

    setSummary({
      present,
      late,
      absent,
      total,
      percent: percent.toFixed(1),
    });
  };

  // ===============================
  // UI BADGE
  // ===============================
  const StatusBadge = ({status}) => {
    let bg = '#ef4444';

    if (status === 'Present') bg = '#22c55e';
    if (status === 'Late') bg = '#f59e0b';

    return (
      <View style={[styles.badge, {backgroundColor: bg}]}>
        <Text style={styles.badgeText}>{status}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <Text style={styles.title}>📊 Attendance Report</Text>

      <Text style={styles.subtitle}>
        {mode === 'daily' ? `Daily Report: ${selectedDate}` : 'Monthly Report'}
      </Text>

      {/* MODE SWITCH */}
      <View style={styles.switchRow}>
        <TouchableOpacity
          onPress={() => setMode('daily')}
          style={[styles.switchBtn, mode === 'daily' && styles.activeBtn]}>
          <Text style={styles.switchText}>Daily</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setMode('monthly')}
          style={[styles.switchBtn, mode === 'monthly' && styles.activeBtn]}>
          <Text style={styles.switchText}>Monthly</Text>
        </TouchableOpacity>
      </View>

      {/* SUMMARY CARDS */}
      <View style={styles.cardRow}>
        <View style={styles.card}>
          <Text style={styles.label}>Present</Text>
          <Text style={[styles.value, {color: '#22c55e'}]}>
            {summary.present}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Late</Text>
          <Text style={[styles.value, {color: '#f59e0b'}]}>{summary.late}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Absent</Text>
          <Text style={[styles.value, {color: '#ef4444'}]}>
            {summary.absent}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>%</Text>
          <Text style={styles.value}>{summary.percent}%</Text>
        </View>
      </View>

      {/* LIST */}
      <FlatList
        data={data}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={styles.row}>
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.sub}>
                {item.time ? 'Marked' : 'Not Marked'}
              </Text>
            </View>

            <StatusBadge status={item.status} />
          </View>
        )}
      />
    </View>
  );
};

export default AttendanceReportScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1220',
    padding: 16,
  },

  title: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
  },

  subtitle: {
    color: '#94a3b8',
    marginBottom: 10,
  },

  switchRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },

  switchBtn: {
    flex: 1,
    padding: 10,
    marginRight: 8,
    backgroundColor: '#111827',
    borderRadius: 10,
    alignItems: 'center',
  },

  activeBtn: {
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#22c55e',
  },

  switchText: {
    color: '#fff',
    fontWeight: '600',
  },

  cardRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },

  card: {
    width: '48%',
    backgroundColor: '#111827',
    padding: 15,
    borderRadius: 14,
    marginBottom: 10,
    alignItems: 'center',
  },

  label: {
    color: '#94a3b8',
    fontSize: 12,
  },

  value: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 5,
  },

  row: {
    backgroundColor: '#111827',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  sub: {
    color: '#94a3b8',
    fontSize: 12,
  },

  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
