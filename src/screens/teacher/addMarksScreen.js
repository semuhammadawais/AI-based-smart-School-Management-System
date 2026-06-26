import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const AddMarksScreen = ({navigation}) => {
  const user = auth().currentUser;

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [assignedSubjects, setAssignedSubjects] = useState([]);
  const [selectedSubjectIndex, setSelectedSubjectIndex] = useState(0);
  const [subject, setSubject] = useState('');
  const [className, setClassName] = useState('');
  const [term, setTerm] = useState('term_1');
  const [marksData, setMarksData] = useState({});

  // ───────── FETCH TEACHER ─────────
  const fetchTeacher = async () => {
    try {
      const teacherSnap = await firestore()
        .collection('Teachers')
        .doc(user.uid)
        .get();

      if (!teacherSnap.exists) {
        setLoading(false);
        return;
      }

      const data = teacherSnap.data();
      const subjects = data?.assignedSubjects || [];
      setAssignedSubjects(subjects);

      if (subjects.length === 0) {
        setLoading(false);
        return;
      }

      const first = subjects[0];
      setSelectedSubjectIndex(0);
      setSubject(first.subject || '');
      setClassName(first.classes?.[0] || '');
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacher();
  }, []);

  // ───────── FETCH STUDENTS ─────────
  useEffect(() => {
    if (!className) return;

    const unsubscribe = firestore()
      .collection('students')
      .where('admissionClass', '==', String(className))
      .onSnapshot(snapshot => {
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setStudents(list);
        setLoading(false);
      });

    return () => unsubscribe();
  }, [className]);

  // ───────── MARKS ─────────
  const handleMarksChange = (studentId, value) => {
    if (/^\d*$/.test(value)) {
      setMarksData(prev => ({...prev, [studentId]: value}));
    }
  };

  // ───────── SAVE MARKS ─────────
  const saveMarks = async () => {
    try {
      if (!subject || !className || !term) {
        Alert.alert('Missing Info', 'Please select subject, class and term.');
        return;
      }

      setSaving(true);
      const batch = firestore().batch();
      let count = 0;

      students.forEach(student => {
        const marks = marksData[student.id];
        if (!marks) return;
        count++;

        const ref = firestore()
          .collection('results')
          .doc(`class_${className}`)
          .collection('sessions')
          .doc('2026')
          .collection(term)
          .doc(subject)
          .collection('students')
          .doc(student.id);

        batch.set(ref, {
          studentId: student.id,
          marks: Number(marks),
          total: 100,
          subject,
          class: className,
          term,
          teacherId: user.uid,
          updatedAt: firestore.FieldValue.serverTimestamp(),
        });
      });

      await batch.commit();
      Alert.alert('Success', `Marks saved for ${count} student(s).`);
      setMarksData({});
    } catch (error) {
      Alert.alert('Error', 'Failed to save marks. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ───────── RENDER STUDENT ─────────
  const renderStudent = ({item}) => {
    const hasMarks = !!marksData[item.id];
    return (
      <View style={styles.card}>
        <View style={styles.studentLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          </View>
          <View>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.roll}>Roll No: {item.registrationNumber}</Text>
          </View>
        </View>

        <View style={styles.marksContainer}>
          <TextInput
            placeholder="—"
            placeholderTextColor="#bbb"
            keyboardType="numeric"
            style={[styles.input, hasMarks && styles.inputFilled]}
            value={marksData[item.id] || ''}
            onChangeText={value => handleMarksChange(item.id, value)}
            maxLength={3}
          />
          <Text style={styles.outOf}>/100</Text>
        </View>
      </View>
    );
  };

  // ───────── LOADING ─────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#104E8B" />
          <Text style={styles.loadingText}>Loading data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const termLabels = {
    term_1: 'Term 1',
    term_2: 'Term 2',
    term_3: 'Term 3',
    final_term: 'Final',
  };

  const filledCount = Object.values(marksData).filter(v => v !== '').length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#104E8B" />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation?.goBack()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Add Marks</Text>
          {subject ? (
            <Text style={styles.headerSub}>
              {subject} · Class {className}
            </Text>
          ) : null}
        </View>
        <View style={{width: 36}} />
      </View>

      <View style={styles.container}>
        {/* ── SUBJECT ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Subject</Text>
          <View style={styles.pillRow}>
            {assignedSubjects.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.pill,
                  selectedSubjectIndex === index && styles.pillActive,
                ]}
                onPress={() => {
                  setSelectedSubjectIndex(index);
                  setSubject(item.subject);
                  setClassName(item.classes?.[0] || '');
                  setMarksData({});
                }}>
                <Text
                  style={[
                    styles.pillText,
                    selectedSubjectIndex === index && styles.pillTextActive,
                  ]}>
                  {item.subject}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── CLASS ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Class</Text>
          <View style={styles.pillRow}>
            {assignedSubjects[selectedSubjectIndex]?.classes?.map((cls, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.pill, className === cls && styles.pillActive]}
                onPress={() => {
                  setClassName(cls);
                  setMarksData({});
                }}>
                <Text
                  style={[
                    styles.pillText,
                    className === cls && styles.pillTextActive,
                  ]}>
                  {cls}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── TERM ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Term</Text>
          <View style={styles.pillRow}>
            {Object.entries(termLabels).map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={[styles.pill, term === key && styles.pillActive]}
                onPress={() => setTerm(key)}>
                <Text
                  style={[
                    styles.pillText,
                    term === key && styles.pillTextActive,
                  ]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── STUDENTS ── */}
        <View style={styles.listHeader}>
          <Text style={styles.sectionLabel}>
            Students <Text style={styles.countBadge}>{students.length}</Text>
          </Text>
          {filledCount > 0 && (
            <Text style={styles.filledHint}>{filledCount} filled</Text>
          )}
        </View>

        {students.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🎓</Text>
            <Text style={styles.emptyTitle}>No Students Found</Text>
            <Text style={styles.emptyText}>
              No students enrolled in class {className}.
            </Text>
          </View>
        ) : (
          <FlatList
            data={students}
            keyExtractor={item => item.id}
            renderItem={renderStudent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{paddingBottom: 20}}
          />
        )}
      </View>

      {/* ── FOOTER ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={saveMarks}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveText}>💾 Save Marks</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default AddMarksScreen;

const BLUE = '#104E8B';
const LIGHT_BLUE = '#e8f0fe';
const BG = '#f5f7fa';

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: BLUE},

  // HEADER
  header: {
    backgroundColor: BLUE,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {fontSize: 20, color: '#fff', lineHeight: 22},
  headerCenter: {flex: 1, alignItems: 'center'},
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  headerSub: {fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2},

  // BODY
  container: {
    flex: 1,
    backgroundColor: BG,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  // SECTIONS
  section: {marginBottom: 14},
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },

  // PILLS
  pillRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
  },
  pillActive: {backgroundColor: BLUE, borderColor: BLUE},
  pillText: {fontSize: 13, color: '#555', fontWeight: '500'},
  pillTextActive: {color: '#fff', fontWeight: '700'},

  // DIVIDER
  divider: {height: 1, backgroundColor: '#e8e8e8', marginVertical: 6},

  // LIST HEADER
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  countBadge: {color: BLUE, fontWeight: '700'},
  filledHint: {fontSize: 12, color: '#4caf50', fontWeight: '600'},

  // STUDENT CARD
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
    elevation: 2,
  },
  studentLeft: {flexDirection: 'row', alignItems: 'center', gap: 12},
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: LIGHT_BLUE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {fontSize: 16, fontWeight: '700', color: BLUE},
  name: {fontSize: 15, fontWeight: '600', color: '#222'},
  roll: {fontSize: 12, color: '#999', marginTop: 2},

  marksContainer: {flexDirection: 'row', alignItems: 'center', gap: 4},
  input: {
    width: 52,
    height: 38,
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    backgroundColor: '#fafafa',
  },
  inputFilled: {
    borderColor: BLUE,
    backgroundColor: LIGHT_BLUE,
    color: BLUE,
  },
  outOf: {fontSize: 12, color: '#aaa', fontWeight: '500'},

  // EMPTY STATE
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {fontSize: 48, marginBottom: 12},
  emptyTitle: {fontSize: 16, fontWeight: '700', color: '#444', marginBottom: 6},
  emptyText: {fontSize: 13, color: '#999', textAlign: 'center'},

  // LOADING
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: BG,
  },
  loadingText: {marginTop: 12, color: '#777', fontSize: 14},

  // FOOTER
  footer: {
    backgroundColor: BG,
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e8e8e8',
  },
  saveBtn: {
    backgroundColor: BLUE,
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: BLUE,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
    elevation: 5,
  },
  saveBtnDisabled: {opacity: 0.6},
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
