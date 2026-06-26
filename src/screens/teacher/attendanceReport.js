import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

/* ───────── SAFE CLASS HANDLER ───────── */
const getTeacherClasses = teacher => {
  if (!teacher?.assignedSubjects) return [];

  let allClasses = [];

  teacher.assignedSubjects.forEach(item => {
    if (Array.isArray(item.classes)) {
      allClasses.push(...item.classes);
    }
  });

  return [...new Set(allClasses)];
};

/* ───────── DATE FILTER HELPER ───────── */
const isWithinRange = (dateStr, filter) => {
  const recordDate = new Date(dateStr);
  const now = new Date();

  if (filter === 'today') {
    return recordDate.toDateString() === now.toDateString();
  }

  if (filter === 'week') {
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);
    return recordDate >= weekAgo;
  }

  if (filter === 'month') {
    return (
      recordDate.getMonth() === now.getMonth() &&
      recordDate.getFullYear() === now.getFullYear()
    );
  }

  return true;
};

const AttendanceReportScreen = () => {
  const [teacher, setTeacher] = useState(null);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);

  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dateFilter, setDateFilter] = useState('today'); // today | week | month

  /* ───────── FETCH TEACHER ───────── */
  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const uid = auth().currentUser?.uid;
        if (!uid) return;

        const snap = await firestore()
          .collection('Teachers')
          .where('uid', '==', uid)
          .get();

        if (!snap.empty) {
          const data = snap.docs[0].data();

          setTeacher(data);

          const cls = getTeacherClasses(data);

          setClasses(cls);

          if (cls.length > 0) {
            setSelectedClass(cls[0]);
          }
        }
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacher();
  }, []);

  /* ───────── FETCH REPORT ───────── */
  const fetchReport = useCallback(async () => {
    if (!selectedClass) return;

    try {
      setLoading(true);

      const snapshot = await firestore()
        .collectionGroup(String(selectedClass))
        .get();

      const map = {};

      snapshot.forEach(doc => {
        const data = doc.data();

        // 📅 APPLY DATE FILTER
        if (!isWithinRange(data.date, dateFilter)) return;

        const id = data.studentId;
        if (!id) return;

        if (!map[id]) {
          map[id] = {
            studentId: id,
            name: data.name,
            rollNo: data.rollNo,
            present: 0,
            absent: 0,
          };
        }

        if (data.status === 'present') map[id].present++;
        else map[id].absent++;
      });

      const result = Object.values(map).map(s => {
        const total = s.present + s.absent;
        return {
          ...s,
          percentage: total ? Math.round((s.present / total) * 100) : 0,
        };
      });

      setReport(result);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  }, [selectedClass, dateFilter]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  /* ───────── RENDER ITEM ───────── */
  const renderItem = ({item}) => (
    <View style={styles.card}>
      <View style={styles.left}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.name?.charAt(0)?.toUpperCase()}
          </Text>
        </View>

        <View>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.roll}>Roll: {item.rollNo}</Text>
        </View>
      </View>

      <View style={styles.right}>
        <Text style={styles.present}>P: {item.present}</Text>
        <Text style={styles.absent}>A: {item.absent}</Text>

        <View
          style={
            item.percentage >= 75 ? styles.percentGood : styles.percentBad
          }>
          <Text style={styles.percentText}>{item.percentage}%</Text>
        </View>
      </View>
    </View>
  );

  if (loading && !teacher) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#104E8B" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Attendance Report</Text>

        {/* CLASS FILTER */}
        <View style={styles.classRow}>
          {classes.map((cls, i) => (
            <TouchableOpacity
              key={i}
              style={[
                styles.classChip,
                selectedClass === cls && styles.classActive,
              ]}
              onPress={() => setSelectedClass(cls)}>
              <Text style={styles.classText}>{cls}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* DATE FILTER */}
        <View style={styles.filterRow}>
          {['today', 'week', 'month'].map(f => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterBtn,
                dateFilter === f && styles.filterActive,
              ]}
              onPress={() => setDateFilter(f)}>
              <Text style={styles.filterText}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* LIST */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#104E8B" />
        </View>
      ) : (
        <FlatList
          data={report}
          keyExtractor={item => item.studentId}
          renderItem={renderItem}
          contentContainerStyle={{paddingBottom: 20}}
        />
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },

  header: {
    backgroundColor: '#104E8B',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },

  title: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },

  /* CLASS FILTER */
  classRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },

  classChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginRight: 6,
  },

  classActive: {
    backgroundColor: '#22A96E',
  },

  classText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },

  /* DATE FILTER */
  filterRow: {
    flexDirection: 'row',
    marginTop: 6,
  },

  filterBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },

  filterActive: {
    backgroundColor: '#fff',
  },

  filterText: {
    color: '#104E8B',
    fontWeight: '600',
    fontSize: 12,
  },

  /* CARD */
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    elevation: 3,
  },

  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22,
    backgroundColor: '#104E8B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  avatarText: {
    color: 'white',
    fontWeight: 'bold',
  },

  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },

  roll: {
    fontSize: 12,
    color: '#777',
  },

  right: {
    alignItems: 'flex-end',
  },

  present: {
    color: '#22A96E',
    fontWeight: 'bold',
  },

  absent: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },

  percentGood: {
    marginTop: 6,
    backgroundColor: '#22A96E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },

  percentBad: {
    marginTop: 6,
    backgroundColor: '#e74c3c',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },

  percentText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
export default AttendanceReportScreen;
