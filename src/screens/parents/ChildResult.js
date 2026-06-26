import React, {useEffect, useState, useContext} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';

import firestore from '@react-native-firebase/firestore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import {AuthContext} from '../../context/authContext';

const ChildResultScreen = ({navigation}) => {
  const {user} = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [studentData, setStudentData] = useState(null);

  useEffect(() => {
    fetchChildResults();
  }, []);

  // ───────────────── FETCH RESULTS ─────────────────
  const fetchChildResults = async () => {
    try {
      setLoading(true);

      // ───── FETCH PARENT-STUDENT MAPPING ─────
      const mappingSnap = await firestore()
        .collection('ParentStudentMapping')
        .where('parentId', '==', user.uid)
        .get();

      if (mappingSnap.empty) {
        console.log('❌ No mapping found');
        setLoading(false);
        return;
      }

      const studentId = mappingSnap.docs[0].data().studentId;

      console.log('🆔 Student ID:', studentId);

      // ───── FETCH STUDENT ─────
      const studentSnap = await firestore()
        .collection('students')
        .doc(studentId)
        .get();

      if (!studentSnap.exists) {
        console.log('❌ Student not found');
        setLoading(false);
        return;
      }

      const student = {
        id: studentSnap.id,
        ...studentSnap.data(),
      };

      console.log('✅ Student:', student);

      setStudentData(student);

      const studentClass = student.admissionClass;

      console.log('🏫 Class:', studentClass);

      // ───── FETCH SUBJECTS ─────
      const classDoc = await firestore()
        .collection('Classes')
        .doc(`Class ${studentClass}`)
        .get();

      let subjects = [];

      if (classDoc.exists) {
        subjects = classDoc.data().subjects || [];
      }

      console.log('📚 Subjects:', subjects);

      const terms = ['term_1', 'term_2', 'term_3', 'final_term'];

      const formattedResults = [];

      // ───── CREATE RESULT TABLE ─────
      for (let subject of subjects) {
        const row = {
          subject,
          term_1: 'Not Assigned',
          term_2: 'Not Assigned',
          term_3: 'Not Assigned',
          final_term: 'Not Assigned',
        };

        for (let term of terms) {
          const resultSnap = await firestore()
            .collection('results')
            .doc(`class_${studentClass}`)
            .collection('sessions')
            .doc('2026')
            .collection(term)
            .doc(subject)
            .collection('students')
            .where('studentId', '==', studentId)
            .get();

          if (!resultSnap.empty) {
            const marks = resultSnap.docs[0].data().marks;

            row[term] = marks.toString();
          }
        }

        formattedResults.push(row);
      }

      console.log('✅ FINAL RESULTS:', formattedResults);

      setResults(formattedResults);
    } catch (error) {
      console.log('❌ Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ───────────────── HEADER ─────────────────
  const Header = () => (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backBtn}>
        <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>Child Results</Text>

      <View style={styles.headerSpacer} />
    </View>
  );

  // ───────────────── LOADING ─────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="#104E8B" barStyle="light-content" />

        <Header />

        <View style={styles.center}>
          <ActivityIndicator size="large" color="#104E8B" />

          <Text style={styles.loadingText}>
            Loading Results...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ───────────────── EMPTY ─────────────────
  if (results.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="#104E8B" barStyle="light-content" />

        <Header />

        <View style={styles.center}>
          <MaterialCommunityIcons
            name="file-document-outline"
            size={70}
            color="#cbd5e1"
          />

          <Text style={styles.emptyTitle}>
            No Results Found
          </Text>

          <Text style={styles.emptyText}>
            Teacher has not uploaded marks yet
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ───────────────── CALCULATIONS ─────────────────
  let obtainedMarks = 0;
  let totalMarks = 0;

  results.forEach(item => {
    ['term_1', 'term_2', 'term_3', 'final_term'].forEach(term => {
      if (item[term] !== 'Not Assigned') {
        obtainedMarks += Number(item[term]);
        totalMarks += 100;
      }
    });
  });

  const percentage =
    totalMarks > 0
      ? ((obtainedMarks / totalMarks) * 100).toFixed(1)
      : 0;

  // ───────────────── UI ─────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#104E8B" barStyle="light-content" />

      <Header />

      <View style={styles.container}>
        {/* ───── STUDENT CARD ───── */}
        <View style={styles.studentCard}>
          <View>
            <Text style={styles.studentName}>
              {studentData?.name}
            </Text>

            <Text style={styles.studentClass}>
              Class {studentData?.admissionClass}
            </Text>
          </View>

          <View style={styles.percentageBox}>
            <Text style={styles.percentageText}>
              {percentage}%
            </Text>

            <Text style={styles.percentageLabel}>
              Overall
            </Text>
          </View>
        </View>

        {/* ───── RESULT LIST ───── */}
        <FlatList
          data={results}
          keyExtractor={(item, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingBottom: 30}}
          renderItem={({item}) => (
            <View style={styles.resultCard}>
              {/* SUBJECT */}
              <View style={styles.subjectHeader}>
                <MaterialCommunityIcons
                  name="book-education-outline"
                  size={20}
                  color="#104E8B"
                />

                <Text style={styles.subjectName}>
                  {item.subject}
                </Text>
              </View>

              {/* TERMS */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}>
                <View style={styles.termRow}>
                  <View style={styles.termBox}>
                    <Text style={styles.termTitle}>Term 1</Text>

                    <Text
                      style={[
                        styles.termMarks,
                        item.term_1 === 'Not Assigned' &&
                          styles.notAssigned,
                      ]}>
                      {item.term_1}
                    </Text>
                  </View>

                  <View style={styles.termBox}>
                    <Text style={styles.termTitle}>Term 2</Text>

                    <Text
                      style={[
                        styles.termMarks,
                        item.term_2 === 'Not Assigned' &&
                          styles.notAssigned,
                      ]}>
                      {item.term_2}
                    </Text>
                  </View>

                  <View style={styles.termBox}>
                    <Text style={styles.termTitle}>Term 3</Text>

                    <Text
                      style={[
                        styles.termMarks,
                        item.term_3 === 'Not Assigned' &&
                          styles.notAssigned,
                      ]}>
                      {item.term_3}
                    </Text>
                  </View>

                  <View style={styles.termBox}>
                    <Text style={styles.termTitle}>Final</Text>

                    <Text
                      style={[
                        styles.termMarks,
                        item.final_term === 'Not Assigned' &&
                          styles.notAssigned,
                      ]}>
                      {item.final_term}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

export default ChildResultScreen;

// ───────────────── STYLES ─────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#104E8B',
  },

  // HEADER
  header: {
    backgroundColor: '#104E8B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },

  backBtn: {
    padding: 4,
  },

  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },

  headerSpacer: {
    width: 32,
  },

  // BODY
  container: {
    flex: 1,
    backgroundColor: '#F3F6FA',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 16,
    paddingTop: 20,
  },

  center: {
    flex: 1,
    backgroundColor: '#F3F6FA',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  loadingText: {
    marginTop: 12,
    color: '#555',
    fontSize: 15,
  },

  // STUDENT CARD
  studentCard: {
    backgroundColor: '#104E8B',
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  studentName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },

  studentClass: {
    marginTop: 5,
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },

  percentageBox: {
    alignItems: 'center',
  },

  percentageText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#5EEAD4',
  },

  percentageLabel: {
    color: '#fff',
    marginTop: 4,
    fontSize: 12,
  },

  // RESULT CARD
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    elevation: 2,
  },

  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  subjectName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 10,
  },

  // TERMS
  termRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  termBox: {
    width: 95,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginRight: 10,
    alignItems: 'center',
  },

  termTitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
    fontWeight: '600',
  },

  termMarks: {
    fontSize: 20,
    fontWeight: '700',
    color: '#104E8B',
  },

  notAssigned: {
    fontSize: 13,
    color: '#94A3B8',
  },

  // EMPTY
  emptyTitle: {
    marginTop: 18,
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },

  emptyText: {
    marginTop: 10,
    color: '#64748B',
    fontSize: 15,
    textAlign: 'center',
  },
});