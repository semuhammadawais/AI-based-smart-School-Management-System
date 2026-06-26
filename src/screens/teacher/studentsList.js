import React, {useEffect, useState, useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';

import firestore from '@react-native-firebase/firestore';
import {AuthContext} from '../../context/authContext';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Spinner from '../../components/Spinner';

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

const StudentsList = ({navigation}) => {
  const {user} = useContext(AuthContext);

  const [loading, setLoading] = useState(false); // ✅ FIXED: was true
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');

  /* ───────── FETCH TEACHER ───────── */
  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        if (!user?.uid) return;
        const snap = await firestore()
          .collection('Teachers')
          .where('uid', '==', user.uid)
          .get();

        if (!snap.empty) {
          const data = snap.docs[0].data();

          const cls = getTeacherClasses(data);

          setClasses(cls);

          if (cls.length > 0) {
            setSelectedClass(cls[0]);
          }
        }
      } catch (e) {
        console.log(e);
      }
    };

    fetchTeacher();
  }, [user?.uid]);

  /* ───────── FETCH STUDENTS ───────── */
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        if (!selectedClass) return;

        setLoading(true);

        const snap = await firestore()
          .collection('students')
          .where('admissionClass', '==', selectedClass)
          .get();

        const list = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));

        setStudents(list);
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedClass]);

  /* ───────── STUDENT CARD ───────── */
  const renderItem = ({item}) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.8}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name?.charAt(0)?.toUpperCase() || 'S'}
        </Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            Roll: {item.registrationNumber || '—'}
          </Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.meta}>Class {item.admissionClass}</Text>
        </View>
      </View>

      <MaterialCommunityIcons name="chevron-right" size={22} color="#999" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#104E8B" barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Students</Text>
        <Text style={styles.headerSub}>Manage attendance easily</Text>
      </View>

      {/* CLASS FILTER */}
      {classes.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.classFilter}
          contentContainerStyle={{alignItems: 'center'}}>
          {classes.map((cls, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.classChip,
                selectedClass === cls && styles.classChipActive,
              ]}
              onPress={() => setSelectedClass(cls)}>
              <Text
                style={[
                  styles.classChipText,
                  selectedClass === cls && styles.classChipTextActive,
                ]}>
                Class {cls}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* CLASS INFO */}
      <View style={styles.classInfo}>
        <Text style={styles.classInfoText}>
          Showing students of Class {selectedClass || '—'}
        </Text>
      </View>

      {/* LIST */}
      {loading ? (
        <Spinner />
      ) : (
        <FlatList
          data={students}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{paddingBottom: 120}}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No students found</Text>
          }
        />
      )}

      {/* FLOATING ATTENDANCE BUTTON */}
      <TouchableOpacity
        style={styles.floatingBtn}
        onPress={() =>
          navigation.navigate('Attendance', {
            teacherClass: selectedClass,
          })
        }>
        <MaterialCommunityIcons name="clipboard-check" size={22} color="#fff" />
        <Text style={styles.floatingText}>Attendance</Text>
      </TouchableOpacity>
    </View>
  );
};

export default StudentsList;

/* ───────── STYLES ───────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
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
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 4,
  },

  classFilter: {
    marginTop: 15,
    paddingLeft: 15,
    flexGrow: 0, // ✅ prevents it from stretching vertically
    maxHeight: 45,
  },

  classChip: {
    backgroundColor: '#E8EEF7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    marginRight: 10,
  },

  classChipActive: {
    backgroundColor: '#104E8B',
  },

  classChipText: {
    fontSize: 13,
    color: '#333',
  },

  classChipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },

  classInfo: {
    paddingHorizontal: 20,
    marginTop: 15,
  },

  classInfoText: {
    fontSize: 13,
    color: '#6B7280',
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 10,
    padding: 14,
    borderRadius: 16,
    elevation: 3,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#104E8B',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  info: {
    flex: 1,
    marginLeft: 14,
  },

  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },

  metaRow: {
    flexDirection: 'row',
    marginTop: 4,
  },

  meta: {
    fontSize: 12,
    color: '#6B7280',
  },

  dot: {
    marginHorizontal: 6,
    color: '#9CA3AF',
  },

  floatingBtn: {
    position: 'absolute',
    bottom: 25,
    right: 20,
    backgroundColor: '#104E8B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    elevation: 6,
  },

  floatingText: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: '600',
  },

  emptyText: {
    textAlign: 'center',
    marginTop: 60,
    color: '#9CA3AF',
  },
});
