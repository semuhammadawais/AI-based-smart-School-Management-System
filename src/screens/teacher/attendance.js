import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';

const AttendanceScreen = ({route}) => {
  const teacherClass = route?.params?.teacherClass?.trim();

  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);

  /* ───────── FETCH STUDENTS ───────── */
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        if (!teacherClass) return;

        const snapshot = await firestore()
          .collection('students')
          .where('admissionClass', '==', teacherClass)
          .get();

        const list = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: (data.name || '').trim(),
            registrationNumber: data.registrationNumber || 'N/A',
          };
        });

        setStudents(list);

        const defaultState = {};
        list.forEach(s => {
          defaultState[s.id] = 'present';
        });

        setAttendance(defaultState);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [teacherClass]);

  /* ───────── MARK STATUS ───────── */
  const markStatus = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status,
    }));
  };

  /* ───────── SUBMIT ───────── */
  const submitAttendance = async () => {
    try {
      if (!students.length) return;

      const now = new Date();
      const date = now.toISOString().split('T')[0];
      const time = now.toLocaleTimeString();

      const batch = firestore().batch();

      students.forEach(student => {
        const ref = firestore()
          .collection('Attendance')
          .doc(date)
          .collection(String(teacherClass))
          .doc(student.id);

        batch.set(ref, {
          studentId: student.id,
          name: student.name,
          rollNo: student.registrationNumber,
          class: teacherClass,
          status: attendance[student.id] || 'present',
          date,
          time,
        });
      });

      await batch.commit();

      Alert.alert('Success', 'Attendance Saved Successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save attendance');
    }
  };

  /* ───────── CARD UI ───────── */
  const renderItem = ({item}) => {
    const status = attendance[item.id];

    return (
      <View style={styles.card}>
        {/* LEFT */}
        <View style={styles.left}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.name?.charAt(0)?.toUpperCase() || 'S'}
            </Text>
          </View>

          <View>
            <Text style={styles.name}>{item.name || 'No Name'}</Text>
            <Text style={styles.roll}>
              Roll: {item.registrationNumber}
            </Text>
          </View>
        </View>

        {/* RIGHT BUTTONS */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[
              styles.btn,
              status === 'present' && styles.presentBtn,
            ]}
            onPress={() => markStatus(item.id, 'present')}>
            <Text
              style={[
                styles.btnText,
                status === 'present' && styles.activeText,
              ]}>
              P
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.btn,
              status === 'absent' && styles.absentBtn,
            ]}
            onPress={() => markStatus(item.id, 'absent')}>
            <Text
              style={[
                styles.btnText,
                status === 'absent' && styles.activeText,
              ]}>
              A
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#104E8B" barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance</Text>
        <Text style={styles.headerSub}>Class {teacherClass}</Text>
      </View>

      {/* BODY */}
      {loading ? (
        <Text style={styles.emptyText}>Loading...</Text>
      ) : students.length === 0 ? (
        <Text style={styles.emptyText}>No students found</Text>
      ) : (
        <FlatList
          data={students}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{paddingBottom: 100}}
        />
      )}

      {/* FOOTER */}
      {!loading && students.length > 0 && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.submitBtn} onPress={submitAttendance}>
            <Text style={styles.submitText}>Submit Attendance</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default AttendanceScreen;

/* ───────── STYLES ───────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4F7',
  },

  header: {
    backgroundColor: '#104E8B',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },

  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },

  headerSub: {
    color: '#D0E2FF',
    marginTop: 4,
    fontSize: 14,
  },

  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    elevation: 4,
  },

  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#104E8B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
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

  buttons: {
    flexDirection: 'row',
  },

  btn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  presentBtn: {
    backgroundColor: '#22C55E',
  },

  absentBtn: {
    backgroundColor: '#EF4444',
  },

  btnText: {
    fontWeight: '700',
    color: '#555',
  },

  activeText: {
    color: '#fff',
  },

  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 16,
    backgroundColor: '#F2F4F7',
  },

  submitBtn: {
    backgroundColor: '#104E8B',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },

  submitText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: '#888',
  },
});