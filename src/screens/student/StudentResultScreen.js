import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const StudentResultScreen = ({navigation}) => {
  const user = auth().currentUser;

  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [studentData, setStudentData] = useState(null);

  // ───────── FETCH RESULTS ─────────
  const fetchResults = async () => {
    try {
      console.log('📡 Fetching student profile...');
      console.log('👤 Current Auth UID:', user?.uid);

      const studentSnap = await firestore()
        .collection('students')
        .where('uid', '==', user.uid)
        .get();

      if (studentSnap.empty) {
        console.log('❌ No student found with this UID');

        const emailSnap = await firestore()
          .collection('students')
          .where('email', '==', user.email)
          .get();

        if (emailSnap.empty) {
          console.log('❌ No student found with email either');
          setLoading(false);
          return;
        }

        const student = {
          id: emailSnap.docs[0].id,
          ...emailSnap.docs[0].data(),
        };

        console.log('✅ Student found using EMAIL:', student);
        await fetchStudentResults(student);
        return;
      }

      const student = {
        id: studentSnap.docs[0].id,
        ...studentSnap.docs[0].data(),
      };

      console.log('✅ Student Profile:', student);
      await fetchStudentResults(student);
    } catch (error) {
      console.log('❌ Fetch Error:', error);
      setLoading(false);
    }
  };

  // ───────── FETCH STUDENT RESULTS ─────────
  const fetchStudentResults = async student => {
    try {
      setStudentData(student);

      const studentClass = student.admissionClass;

      console.log('🏫 Student Class:', studentClass);
      console.log('🆔 Student Doc ID:', student.id);

      const allResults = [];
      const terms = ['term_1', 'term_2', 'term_3', 'final_term'];
      const subjects = ['Math', 'Physics'];

      for (let term of terms) {
        for (let subject of subjects) {
          console.log(
            `📚 Checking ${subject} → ${term} → class ${studentClass}`,
          );

          const snap = await firestore()
            .collection('results')
            .doc(`class_${studentClass}`)
            .collection('sessions')
            .doc('2026')
            .collection(term)
            .doc(subject)
            .collection('students')
            .where('studentId', '==', student.id)
            .get();

          console.log(`📊 ${subject} ${term} results:`, snap.size);

          snap.forEach(doc => {
            allResults.push(doc.data());
          });
        }
      }

      console.log('✅ TOTAL RESULTS:', allResults.length);
      setResults(allResults);
      setLoading(false);
    } catch (error) {
      console.log('❌ Results Fetch Error:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  // ───────── HEADER ─────────
  const Header = () => (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backBtn}
        activeOpacity={0.7}>
        <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>Student Results</Text>

      {/* Spacer to keep title centered */}
      <View style={styles.headerSpacer} />
    </View>
  );

  // ───────── LOADING ─────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="#104E8B" barStyle="light-content" />
        <Header />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#104E8B" />
          <Text style={{marginTop: 10, color: '#555'}}>Loading Results...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ───────── EMPTY RESULTS ─────────
  if (results.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="#104E8B" barStyle="light-content" />
        <Header />
        <View style={styles.center}>
          <MaterialCommunityIcons
            name="file-search-outline"
            size={60}
            color="#ccc"
          />
          <Text style={styles.emptyTitle}>No Results Found</Text>
          <Text style={styles.emptyText}>
            • Teacher has not uploaded marks yet
          </Text>
          <Text style={styles.emptyText}>• studentId mismatch</Text>
          <Text style={styles.emptyText}>• Wrong subject names</Text>
          <Text style={styles.emptyText}>• Wrong Firestore path</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ───────── TOTALS ─────────
  const totalMarks = results.reduce(
    (sum, item) => sum + Number(item.marks || 0),
    0,
  );
  const totalSubjects = results.length * 100;
  const percentage =
    totalSubjects > 0 ? ((totalMarks / totalSubjects) * 100).toFixed(2) : 0;

  // ───────── UI ─────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#104E8B" barStyle="light-content" />
      <Header />

      <View style={styles.container}>
        {/* STUDENT INFO */}
        <View style={styles.studentCard}>
          <Text style={styles.studentName}>{studentData?.name}</Text>
          <Text style={styles.studentInfo}>
            Class: {studentData?.admissionClass}
          </Text>
          <Text style={styles.studentInfo}>
            Total: {totalMarks} / {totalSubjects}
          </Text>
          <Text style={styles.percentage}>Percentage: {percentage}%</Text>
        </View>

        {/* RESULTS */}
        <FlatList
          data={results}
          keyExtractor={(item, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{paddingBottom: 20}}
          renderItem={({item}) => (
            <View style={styles.card}>
              <View>
                <Text style={styles.subject}>{item.subject}</Text>
                <Text style={styles.term}>{item.term.replace(/_/g, ' ')}</Text>
              </View>

              <View style={styles.marksBox}>
                <Text style={styles.marks}>{item.marks}</Text>
                <Text style={styles.total}>/ 100</Text>
              </View>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

export default StudentResultScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#104E8B',
  },

  // ── HEADER ──
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },

  headerSpacer: {
    width: 32, // matches backBtn icon width to keep title centered
  },

  // ── BODY ──
  container: {
    flex: 1,
    backgroundColor: '#f8f9fb',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 15,
    paddingTop: 20,
  },

  center: {
    flex: 1,
    backgroundColor: '#f8f9fb',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  // ── STUDENT CARD ──
  studentCard: {
    backgroundColor: '#104E8B',
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
  },

  studentName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },

  studentInfo: {
    color: '#fff',
    marginTop: 4,
    fontSize: 14,
  },

  percentage: {
    marginTop: 10,
    color: '#5BB8F5',
    fontWeight: 'bold',
    fontSize: 18,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },

  subject: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
  },

  term: {
    marginTop: 5,
    color: '#666',
    textTransform: 'capitalize',
  },

  marksBox: {
    alignItems: 'center',
  },

  marks: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#104E8B',
  },

  total: {
    color: '#777',
  },

  // ── EMPTY STATE ──
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#111',
  },

  emptyText: {
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
});
