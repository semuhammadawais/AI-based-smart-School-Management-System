import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';

import {AuthContext} from '../../context/authContext';

import {generateStudentReport} from '../../services/GroqService';

const AIOverviewScreen = () => {
  const navigation = useNavigation();
  const {user} = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [aiReport, setAiReport] = useState(null);

  useEffect(() => {
    loadAIReport();
  }, []);

  const loadAIReport = async () => {
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

      const studentDoc = await firestore()
        .collection('students')
        .doc(studentId)
        .get();

      const student = studentDoc.data();
      const className = student.admissionClass;
      const rollNo = student.registrationNumber;
      const today = new Date();

      let presentCount = 0;
      let absentCount = 0;
      let totalCount = 0;

      for (let i = 0; i < 14; i++) {
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

      const classDoc = await firestore()
        .collection('Classes')
        .doc(`Class ${className}`)
        .get();

      const subjects = classDoc.data()?.subjects || [];
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
          .where('studentId', '==', studentId)
          .get();

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

      const aiData = {
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

      const report = await generateStudentReport(aiData);
      console.log('REPORT =>', report);

      setAiReport(report);
    } catch (error) {
      console.log('AI Overview Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = level => {
    if (level === 'Low') return '#22C55E';
    if (level === 'Medium') return '#F59E0B';
    return '#EF4444';
  };

  const getRiskBg = level => {
    if (level === 'Low') return '#ECFDF5';
    if (level === 'Medium') return '#FFFBEB';
    return '#FEF2F2';
  };

  const getScoreColor = score => {
    if (score >= 75) return '#22C55E';
    if (score >= 50) return '#F59E0B';
    return '#EF4444';
  };

  const getScoreTrackColor = score => {
    if (score >= 75) return '#DCFCE7';
    if (score >= 50) return '#FEF9C3';
    return '#FEE2E2';
  };

  // Loading State
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
          <Text style={styles.headerTitle}>AI Overview</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.loaderBody}>
          <View style={styles.loaderIconWrap}>
            <MaterialCommunityIcons
              name="robot-outline"
              size={40}
              color="#104E8B"
            />
          </View>
          <ActivityIndicator
            size="large"
            color="#104E8B"
            style={{marginTop: 20}}
          />
          <Text style={styles.loaderTitle}>Analysing Student Data</Text>
          <Text style={styles.loaderSub}>
            Groq AI is generating the report…
          </Text>
        </View>
      </View>
    );
  }

  // Empty State
  if (!aiReport) {
    return (
      <View style={styles.loaderContainer}>
        <StatusBar backgroundColor="#104E8B" barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Overview</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.loaderBody}>
          <MaterialCommunityIcons
            name="file-alert-outline"
            size={48}
            color="#CBD5E1"
          />
          <Text style={styles.loaderTitle}>No Report Available</Text>
          <Text style={styles.loaderSub}>
            Could not generate AI analysis at this time.
          </Text>
        </View>
      </View>
    );
  }
  const scoreColor = getScoreColor(aiReport?.healthScore || 0);
  const scoreTrack = getScoreTrackColor(aiReport?.healthScore || 0);

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
        <Text style={styles.headerTitle}>AI Overview</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* ── HERO CARD ── */}
        <View style={styles.heroCard}>
          {/* Top row: score + ring */}
          <View style={styles.heroRow}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroLabel}>HEALTH SCORE</Text>
              <Text style={[styles.heroScore, {color: scoreColor}]}>
                {aiReport.healthScore}
                <Text style={styles.heroScoreMax}> /100</Text>
              </Text>
              <View
                style={[
                  styles.riskPill,
                  {backgroundColor: getRiskBg(aiReport.riskLevel)},
                ]}>
                <View
                  style={[
                    styles.riskDot,
                    {backgroundColor: getRiskColor(aiReport.riskLevel)},
                  ]}
                />
                <Text
                  style={[
                    styles.riskText,
                    {color: getRiskColor(aiReport.riskLevel)},
                  ]}>
                  {aiReport.riskLevel} Risk
                </Text>
              </View>
            </View>

            {/* Score Ring */}
            <View style={[styles.ring, {borderColor: scoreTrack}]}>
              <View style={[styles.ringFill, {borderColor: scoreColor}]}>
                <Text style={[styles.ringPercent, {color: scoreColor}]}>
                  {aiReport.healthScore}%
                </Text>
                <Text style={styles.ringLabel}>score</Text>
              </View>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${aiReport.healthScore}%`,
                  backgroundColor: scoreColor,
                },
              ]}
            />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabelText}>0</Text>
            <Text style={styles.progressLabelText}>50</Text>
            <Text style={styles.progressLabelText}>100</Text>
          </View>
        </View>

        {/* ── ACADEMIC SUMMARY ── */}
        <SectionCard icon="file-document-outline" title="Academic Summary">
          <Text style={styles.bodyText}>{aiReport.academicSummary}</Text>
        </SectionCard>

        {/* ── STRENGTHS ── */}
        <SectionCard icon="arm-flex-outline" title="Strengths">
          {aiReport.strengths?.map((s, i) => (
            <View key={i} style={styles.listRow}>
              <View style={[styles.listBullet, {backgroundColor: '#ECFDF5'}]}>
                <MaterialCommunityIcons
                  name="check"
                  size={13}
                  color="#22C55E"
                />
              </View>
              <Text style={styles.listText}>{s}</Text>
            </View>
          ))}
        </SectionCard>

        {/* ── WEAKNESSES ── */}
        <SectionCard icon="alert-circle-outline" title="Areas for Improvement">
          {aiReport.weaknesses?.map((w, i) => (
            <View key={i} style={styles.listRow}>
              <View style={[styles.listBullet, {backgroundColor: '#FFFBEB'}]}>
                <MaterialCommunityIcons
                  name="alert"
                  size={13}
                  color="#F59E0B"
                />
              </View>
              <Text style={styles.listText}>{w}</Text>
            </View>
          ))}
        </SectionCard>

        {/* ── RECOMMENDATIONS ── */}
        <SectionCard icon="bullseye-arrow" title="Recommendations">
          {aiReport.recommendations?.map((r, i) => (
            <View key={i} style={styles.listRow}>
              <View style={[styles.listBullet, {backgroundColor: '#EFF6FF'}]}>
                <Text style={styles.stepNum}>{i + 1}</Text>
              </View>
              <Text style={styles.listText}>{r}</Text>
            </View>
          ))}
        </SectionCard>

        {/* ── FUTURE PREDICTION ── */}
        <View style={[styles.card, styles.predictionCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconWrap}>
              <MaterialCommunityIcons
                name="trending-up"
                size={18}
                color="#104E8B"
              />
            </View>
            <Text style={styles.cardTitle}>Future Prediction</Text>
          </View>
          <Text style={styles.predictionText}>{aiReport.futurePrediction}</Text>
        </View>

        <Text style={styles.footerText}>
          Powered by Groq AI · Updated just now
        </Text>
      </ScrollView>
    </View>
  );
};

// Reusable section card component
const SectionCard = ({icon, title, children}) => (
  <View style={styles.card}>
    <View style={styles.cardHeader}>
      <View style={styles.cardIconWrap}>
        <MaterialCommunityIcons name={icon} size={18} color="#104E8B" />
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

export default AIOverviewScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8',
  },

  // HEADER
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

  // LOADER / EMPTY
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

  // SCROLL
  scrollContent: {
    padding: 14,
    paddingBottom: 36,
  },

  // HERO CARD
  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    elevation: 3,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  heroLeft: {
    flex: 1,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroScore: {
    fontSize: 52,
    fontWeight: '800',
    lineHeight: 60,
    marginBottom: 12,
  },
  heroScoreMax: {
    fontSize: 18,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  riskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  riskDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  riskText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Ring
  ring: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  ringFill: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPercent: {
    fontSize: 15,
    fontWeight: '800',
  },
  ringLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 1,
  },

  // Progress bar
  progressTrack: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressLabelText: {
    fontSize: 10,
    color: '#CBD5E1',
  },

  // GENERIC CARD
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  cardIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#EBF2FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  bodyText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },

  // LIST ROWS
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  listBullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  stepNum: {
    fontSize: 12,
    fontWeight: '700',
    color: '#104E8B',
  },

  // PREDICTION
  predictionCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#104E8B',
    marginBottom: 12,
  },
  predictionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    fontStyle: 'italic',
  },

  // FOOTER
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 6,
  },
});
