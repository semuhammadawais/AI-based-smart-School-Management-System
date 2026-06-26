import React, {useEffect, useState, useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import {AuthContext} from '../../context/authContext';
import {generateStudentInsight} from '../../services/StudentAIService';

const StudentAIScreen = () => {
  const navigation = useNavigation();
  const {user} = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ai, setAi] = useState(null);
  const [studentName, setStudentName] = useState('');

  useEffect(() => {
    if (user?.uid) {
      loadAI();
    }
  }, [user]);

  const loadAI = async () => {
    try {
      setLoading(true);

      if (!user || !user.uid) {
        console.log('❌ User not ready yet');
        setLoading(false);
        return;
      }

      console.log('👤 uid:', user.uid);

      // 1. Get student doc by uid field
      const studentSnap = await firestore()
        .collection('students')
        .where('uid', '==', user.uid)
        .get();

      if (studentSnap.empty) {
        console.log('❌ Student not found');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const student = studentSnap.docs[0].data();
      setStudentName(student.name || 'Student');

      const className = student.admissionClass;
      const rollNo = student.registrationNumber;
      const today = new Date();

      console.log('✅ Student:', student.name, '| Class:', className, '| Roll:', rollNo);

      // 2. Fetch last 60 days attendance
      let presentCount = 0;
      let absentCount = 0;
      let totalCount = 0;

      for (let i = 0; i < 60; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        const attDoc = await firestore()
          .collection('Attendance')
          .doc(dateStr)
          .collection(className)
          .doc(rollNo)
          .get();

        if (attDoc.exists) {
          totalCount++;
          const status = attDoc.data().status?.toLowerCase();
          if (status === 'present') presentCount++;
          else absentCount++;
        }
      }

      const attendancePercentage =
        totalCount === 0 ? 0 : Math.round((presentCount / totalCount) * 100);

      console.log('📅 Attendance:', presentCount, 'present,', absentCount, 'absent, total:', totalCount);

      // 3. Fetch subjects and results
      const classDoc = await firestore()
        .collection('Classes')
        .doc(`Class ${className}`)
        .get();

      const subjects = classDoc.data()?.subjects || [];
      console.log('📚 Subjects:', subjects);

      const results = [];

      for (const subject of subjects) {
        const resultSnap = await firestore()
          .collection('results')
          .doc(`class_${className}`)
          .collection('sessions')
          .doc('2026')
          .collection('term_1')
          .doc(subject)
          .collection('students')
          .where('studentId', '==', rollNo) // ✅ rollNo matches studentId in Firestore
          .get();

        console.log(`📘 ${subject}: ${resultSnap.size} result(s)`);

        if (!resultSnap.empty) {
          results.push({
            subject,
            marks: resultSnap.docs[0].data().marks,
            total: resultSnap.docs[0].data().total,
          });
        }
      }

      const avgMarks =
        results.length > 0
          ? Math.round(
              results.reduce((sum, r) => sum + r.marks, 0) / results.length,
            )
          : 0;

      // 4. Build real studentData
      const studentData = {
        studentName: student.name,
        class: className,
        attendance: {
          presentDays: presentCount,
          absentDays: absentCount,
          percentage: attendancePercentage,
        },
        academic: {
          averageMarks: avgMarks,
          subjects: results,
        },
      };

      console.log('📦 Sending to Groq:', JSON.stringify(studentData));

      const result = await generateStudentInsight(studentData);
      console.log('🤖 AI Result:', JSON.stringify(result));
      setAi(result);
    } catch (e) {
      console.log('AI Error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAI();
  };

  // ── LOADING ──
  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <StatusBar backgroundColor="#104E8B" barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Mentor</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.loaderBody}>
          <View style={styles.loaderIconWrap}>
            <MaterialCommunityIcons name="brain" size={38} color="#104E8B" />
          </View>
          <ActivityIndicator
            size="large"
            color="#104E8B"
            style={{marginTop: 20}}
          />
          <Text style={styles.loaderTitle}>Analysing Your Performance</Text>
          <Text style={styles.loaderSub}>
            AI is generating personalized insights…
          </Text>
        </View>
      </View>
    );
  }

  // ── EMPTY ──
  if (!ai) {
    return (
      <View style={styles.loaderContainer}>
        <StatusBar backgroundColor="#104E8B" barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Mentor</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.loaderBody}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={52}
            color="#CBD5E1"
          />
          <Text style={styles.loaderTitle}>No Insights Available</Text>
          <Text style={styles.loaderSub}>
            Could not generate AI insights at this time.
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadAI}>
            <MaterialCommunityIcons name="refresh" size={16} color="#fff" />
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── MAIN ──
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#104E8B" barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Mentor</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#104E8B']}
          />
        }>

        {/* GREETING BANNER */}
        <View style={styles.banner}>
          <View style={styles.bannerLeft}>
            <Text style={styles.bannerHello}>Hello, {studentName} 👋</Text>
            <Text style={styles.bannerSub}>
              Here are your personalized insights for today
            </Text>
          </View>
          <View style={styles.bannerIconWrap}>
            <MaterialCommunityIcons name="robot-happy" size={36} color="#fff" />
          </View>
        </View>

        {/* CARDS */}
        <InsightCard
          icon="lightbulb-on-outline"
          title="Daily Motivation"
          text={ai?.motivation}
          color="#F59E0B"
          bg="#FFFBEB"
        />
        <InsightCard
          icon="bullseye-arrow"
          title="Today's Focus"
          text={ai?.todayFocus}
          color="#3B82F6"
          bg="#EFF6FF"
        />
        <InsightCard
          icon="alert-circle-outline"
          title="Weak Area"
          text={ai?.weakArea}
          color="#EF4444"
          bg="#FEF2F2"
        />
        <InsightCard
          icon="brain"
          title="Study Tip"
          text={ai?.tip}
          color="#10B981"
          bg="#ECFDF5"
        />
        <InsightCard
          icon="calendar-check-outline"
          title="Study Plan"
          text={ai?.studyPlan}
          color="#8B5CF6"
          bg="#F5F3FF"
        />

        <Text style={styles.footerText}>
          Powered by Groq AI · Pull down to refresh
        </Text>
      </ScrollView>
    </View>
  );
};

/* ── INSIGHT CARD ── */
const InsightCard = ({icon, title, text, color, bg}) => (
  <View style={[styles.card, {borderLeftColor: color}]}>
    <View style={styles.cardHeader}>
      <View style={[styles.cardIconWrap, {backgroundColor: bg}]}>
        <MaterialCommunityIcons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    <Text style={styles.cardText}>{text}</Text>
  </View>
);

export default StudentAIScreen;

/* ── STYLES ── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
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
  loaderContainer: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },
  loaderBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loaderIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EBF2FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E3A5F',
    marginTop: 16,
  },
  loaderSub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 6,
    textAlign: 'center',
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    backgroundColor: '#104E8B',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 36,
  },
  banner: {
    backgroundColor: '#104E8B',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 3,
  },
  bannerLeft: {
    flex: 1,
    paddingRight: 10,
  },
  bannerHello: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  bannerSub: {
    fontSize: 13,
    color: '#B8D4F0',
    lineHeight: 18,
  },
  bannerIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  cardIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  cardText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
  },
});