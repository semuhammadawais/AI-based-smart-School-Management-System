import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const StudentSubjectsScreen = ({navigation}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchSubjects();
  }, []);

  const normalize = str =>
    str?.toString().toLowerCase().replace(/\s+/g, '').trim();

  const fetchSubjects = async () => {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        setLoading(false);
        return;
      }

      // 1. GET STUDENT BY EMAIL
      const studentSnap = await firestore()
        .collection('students')
        .where('email', '==', currentUser.email)
        .get();

      if (studentSnap.empty) {
        console.log('Student not found');
        setLoading(false);
        return;
      }

      const student = studentSnap.docs[0].data();
      const classNumber = student.admissionClass?.toString().trim();

      console.log('CLASS ID:', classNumber);

      // 2. GET CLASS DOC
      const classDocName = `Class ${classNumber}`;
      const classSnap = await firestore()
        .collection('Classes')
        .doc(classDocName)
        .get();

      if (!classSnap.exists) {
        console.log('Class not found:', classDocName);
        setLoading(false);
        return;
      }

      const subjects = classSnap.data()?.subjects || [];
      console.log('SUBJECTS:', subjects);

      // 3. GET TEACHERS
      const teacherSnap = await firestore().collection('Teachers').get();
      const teachers = teacherSnap.docs.map(doc => doc.data());

      // 4. MAP SUBJECT → TEACHER
      const result = subjects.map(subject => {
        const subjectNorm = normalize(subject);

        const teacher = teachers.find(t => {
          const assigned = t.assignedSubjects || [];
          return assigned.some(item => {
            const itemSubject = normalize(item.subject);
            const itemClasses = item.classes || [];
            const classMatch = itemClasses
              .map(c => c.toString().trim())
              .includes(classNumber);
            return itemSubject === subjectNorm && classMatch;
          });
        });

        return {
          subject,
          teacher: teacher?.name || 'Not Assigned',
        };
      });

      console.log('FINAL RESULT:', result);
      setData(result);
      setLoading(false);
    } catch (error) {
      console.log('ERROR:', error);
      setLoading(false);
    }
  };

  // Subject icon mapping
  const getSubjectIcon = subject => {
    const s = subject?.toLowerCase();
    if (s?.includes('math')) return 'calculator-variant';
    if (s?.includes('physics')) return 'atom';
    if (s?.includes('chem')) return 'flask';
    if (s?.includes('bio')) return 'leaf';
    if (s?.includes('english')) return 'book-alphabet';
    if (s?.includes('urdu')) return 'abjad-arabic';
    if (s?.includes('history') || s?.includes('pak')) return 'bank';
    if (s?.includes('geo')) return 'earth';
    if (s?.includes('computer') || s?.includes('ict')) return 'laptop';
    if (s?.includes('islamic') || s?.includes('quran')) return 'star-crescent';
    return 'book-open-variant';
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
          <Text style={styles.headerTitle}>My Subjects</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#104E8B" />
          <Text style={styles.loadingText}>Loading subjects...</Text>
        </View>
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>My Subjects</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}>
        {/* ── Subject Count Badge ── */}
        <View style={styles.countBadge}>
          <MaterialCommunityIcons
            name="book-multiple"
            size={18}
            color="#104E8B"
          />
          <Text style={styles.countText}>
            {data.length} Subject{data.length !== 1 ? 's' : ''} Enrolled
          </Text>
        </View>

        {/* ── Subject Cards ── */}
        {data.length === 0 ? (
          <View style={styles.center}>
            <MaterialCommunityIcons name="book-off" size={48} color="#ccc" />
            <Text style={styles.empty}>No Subjects Found</Text>
          </View>
        ) : (
          data.map((item, index) => (
            <View key={index} style={styles.card}>
              {/* Icon Circle */}
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons
                  name={getSubjectIcon(item.subject)}
                  size={24}
                  color="#104E8B"
                />
              </View>

              {/* Subject Info */}
              <View style={styles.cardContent}>
                <Text style={styles.subject}>{item.subject}</Text>
                <View style={styles.teacherRow}>
                  <MaterialCommunityIcons
                    name="account-tie"
                    size={14}
                    color="#888"
                  />
                  <Text style={styles.teacher}> {item.teacher}</Text>
                </View>
              </View>

              {/* Arrow */}
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color="#ccc"
              />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

export default StudentSubjectsScreen;

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
    padding: 20,
    paddingBottom: 40,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F0FB',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
    gap: 6,
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#104E8B',
  },

  // ── Cards ──
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 14,
    marginBottom: 12,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E8F0FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardContent: {
    flex: 1,
  },
  subject: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a2744',
  },
  teacherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  teacher: {
    fontSize: 13,
    color: '#666',
  },

  // ── Misc ──
  loadingText: {
    marginTop: 10,
    color: '#888',
    fontSize: 14,
  },
  empty: {
    textAlign: 'center',
    marginTop: 10,
    color: '#888',
    fontSize: 15,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
});
