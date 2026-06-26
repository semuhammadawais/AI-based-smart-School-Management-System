import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {
  analyzeClassPerformance,
  analyzeAttentionStudents,
  generateTeachingRecommendations,
} from '../../services/TeacherAIService';

// ─── Markdown Renderer ────────────────────────────────────────────────────────
const renderInline = text => {
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<Text key={lastIndex}>{text.slice(lastIndex, match.index)}</Text>);
    }
    const raw = match[0];
    if (raw.startsWith('**')) {
      parts.push(<Text key={match.index} style={mdStyles.bold}>{raw.slice(2, -2)}</Text>);
    } else {
      parts.push(<Text key={match.index} style={mdStyles.italic}>{raw.slice(1, -1)}</Text>);
    }
    lastIndex = match.index + raw.length;
  }

  if (lastIndex < text.length) {
    parts.push(<Text key={lastIndex}>{text.slice(lastIndex)}</Text>);
  }

  return parts.length > 0 ? parts : text;
};

const renderMarkdown = text => {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];

  lines.forEach((line, lineIndex) => {
    if (!line.trim()) {
      elements.push(<View key={`space-${lineIndex}`} style={{height: 6}} />);
      return;
    }
    if (line.startsWith('# ')) {
      elements.push(<Text key={lineIndex} style={mdStyles.h1}>{line.replace(/^# /, '')}</Text>);
      return;
    }
    if (line.startsWith('## ')) {
      elements.push(<Text key={lineIndex} style={mdStyles.h2}>{line.replace(/^## /, '')}</Text>);
      return;
    }
    if (line.startsWith('### ')) {
      elements.push(<Text key={lineIndex} style={mdStyles.h3}>{line.replace(/^### /, '')}</Text>);
      return;
    }
    if (/^[-*] /.test(line)) {
      elements.push(
        <View key={lineIndex} style={mdStyles.bulletRow}>
          <Text style={mdStyles.bulletDot}>•</Text>
          <Text style={mdStyles.bulletText}>{renderInline(line.replace(/^[-*] /, ''))}</Text>
        </View>,
      );
      return;
    }
    if (/^\d+\. /.test(line)) {
      const num = line.match(/^(\d+)\. /)[1];
      elements.push(
        <View key={lineIndex} style={mdStyles.bulletRow}>
          <Text style={mdStyles.bulletNum}>{num}.</Text>
          <Text style={mdStyles.bulletText}>{renderInline(line.replace(/^\d+\. /, ''))}</Text>
        </View>,
      );
      return;
    }
    if (/^---+$/.test(line.trim())) {
      elements.push(<View key={lineIndex} style={mdStyles.divider} />);
      return;
    }
    elements.push(
      <Text key={lineIndex} style={mdStyles.paragraph}>{renderInline(line)}</Text>,
    );
  });

  return elements;
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const TeacherAIHubScreen = () => {
  const [selectedTool, setSelectedTool] = useState(null);
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [classData, setClassData] = useState([]);

  // Multi-class support
  const [availableClasses, setAvailableClasses] = useState([]); // e.g. ["1", "5", "10"]
  const [selectedClass, setSelectedClass] = useState(null);

  const currentTeacherId = auth().currentUser?.uid;
  const currentYear = new Date().getFullYear().toString();
  const currentTerm = 'term_1';

  const features = [
    {id: 'class', title: 'Analyze Class', icon: '📊', description: 'Analyze overall class performance and trends.'},
    {id: 'attention', title: 'Need Attention', icon: '⚠️', description: 'Identify students requiring support.'},
    {id: 'recommendations', title: 'Teaching Tips', icon: '💡', description: 'Get practical teaching recommendations.'},
  ];

  // ─── Fetch teacher's assigned classes ──────────────────────────────────────
  useEffect(() => {
    const fetchTeacherClasses = async () => {
      try {
        const teacherDoc = await firestore()
          .collection('Teachers')
          .doc(currentTeacherId)
          .get();

        if (!teacherDoc.exists) {
          setDataLoading(false);
          return;
        }

        const assignedSubjects = teacherDoc.data()?.assignedSubjects || [];

        // Collect all unique classes across all subjects
        const allClasses = assignedSubjects.flatMap(s => s.classes || []);
        const uniqueClasses = [...new Set(allClasses)].sort();

        setAvailableClasses(uniqueClasses);

        // Auto-select if only one class
        if (uniqueClasses.length === 1) {
          setSelectedClass(uniqueClasses[0]);
        } else {
          setDataLoading(false); // wait for user to pick
        }
      } catch (err) {
        console.log('fetchTeacherClasses error:', err);
        setDataLoading(false);
      }
    };

    if (currentTeacherId) fetchTeacherClasses();
  }, [currentTeacherId]);

  // ─── Load class data whenever selectedClass changes ────────────────────────
  useEffect(() => {
    if (!selectedClass) return;
    loadClassData(selectedClass);
  }, [selectedClass]);

  const fetchStudents = async className => {
    const snap = await firestore()
      .collection('students')
      .where('admissionClass', '==', className)
      .get();
    return snap.docs.map(doc => ({...doc.data(), studentDocId: doc.id}));
  };

  const fetchMarksForStudent = async (studentId, className) => {
    try {
      const subjects = {};
      const teacherDoc = await firestore()
        .collection('Teachers')
        .doc(currentTeacherId)
        .get();
      const assignedSubjects = teacherDoc.data()?.assignedSubjects || [];

      // Only fetch subjects assigned to THIS class
      const subjectsForClass = assignedSubjects
        .filter(s => s.classes?.includes(className))
        .map(s => s.subject);

      await Promise.all(
        subjectsForClass.map(async subjectName => {
          try {
            const snap = await firestore()
              .collection('results')
              .doc(`class_${className}`)
              .collection('sessions')
              .doc(currentYear)
              .collection(currentTerm)
              .doc(subjectName)
              .collection('students')
              .doc(studentId)
              .get();

            if (snap.exists) {
              const d = snap.data();
              subjects[subjectName] = {marks: d.marks, total: d.total};
            }
          } catch (e) {
            console.log(`fetchMarks error for ${subjectName}:`, e);
          }
        }),
      );

      return subjects;
    } catch (err) {
      console.log('fetchMarksForStudent error:', err);
      return {};
    }
  };

  const fetchAttendanceForStudent = async (rollNo, className) => {
    try {
      const dates = [];
      for (let i = 0; i < 60; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
      }

      let present = 0;
      let total = 0;

      await Promise.all(
        dates.map(async date => {
          try {
            const snap = await firestore()
              .collection('Attendance')
              .doc(date)
              .collection(className)
              .doc(rollNo)
              .get();

            if (snap.exists) {
              total++;
              if (snap.data()?.status === 'present') present++;
            }
          } catch (e) {}
        }),
      );

      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
      return {present, total, percentage};
    } catch (err) {
      return {present: 0, total: 0, percentage: 0};
    }
  };

  const loadClassData = async className => {
    setDataLoading(true);
    setClassData([]);
    setAnalysis('');
    setSelectedTool(null);

    try {
      const students = await fetchStudents(className);

      const enriched = await Promise.all(
        students.map(async student => {
          const rollNo = student.registrationNumber || student.studentDocId;
          const [subjects, attendance] = await Promise.all([
            fetchMarksForStudent(rollNo, className),
            fetchAttendanceForStudent(rollNo, className),
          ]);

          const subjectList = Object.values(subjects);
          const avgMarks =
            subjectList.length > 0
              ? Math.round(
                  subjectList.reduce(
                    (sum, s) => sum + (s.marks / s.total) * 100,
                    0,
                  ) / subjectList.length,
                )
              : null;

          return {
            name: student.name,
            rollNo,
            class: className,
            gender: student.gender,
            subjects,
            avgMarks,
            attendance,
          };
        }),
      );

      setClassData(enriched);
    } catch (err) {
      console.log('loadClassData error:', err);
      Alert.alert('Error', 'Failed to load class data.');
    } finally {
      setDataLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedTool) return;
    if (classData.length === 0) {
      Alert.alert('No Data', 'No student data found for this class.');
      return;
    }

    setLoading(true);
    setAnalysis('');

    try {
      let result = '';
      if (selectedTool === 'class') result = await analyzeClassPerformance(classData);
      else if (selectedTool === 'attention') result = await analyzeAttentionStudents(classData);
      else if (selectedTool === 'recommendations') result = await generateTeachingRecommendations(classData);
      setAnalysis(result);
    } catch (err) {
      setAnalysis('Failed to generate analysis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goodAttendance = classData.filter(s => s.attendance.percentage >= 75).length;
  const withMarks = classData.filter(s => s.avgMarks !== null).length;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#0F172A" barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconBadge}>
            <Text style={styles.aiIcon}>🤖</Text>
          </View>
          <Text style={styles.title}>Teacher AI Studio</Text>
          <Text style={styles.subtitle}>
            Smart insights and recommendations to support teaching and student success.
          </Text>
        </View>

        {/* Class Picker — only show if multiple classes */}
        {availableClasses.length > 1 && (
          <View style={styles.classPickerSection}>
            <Text style={styles.sectionTitle}>Select Class</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.classPickerRow}>
              {availableClasses.map(cls => (
                <TouchableOpacity
                  key={cls}
                  style={[
                    styles.classPill,
                    selectedClass === cls && styles.classPillSelected,
                  ]}
                  onPress={() => setSelectedClass(cls)}
                  disabled={dataLoading}>
                  <Text
                    style={[
                      styles.classPillText,
                      selectedClass === cls && styles.classPillTextSelected,
                    ]}>
                    Class {cls}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Stats Row */}
        {!dataLoading && selectedClass && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{classData.length}</Text>
              <Text style={styles.statLabel}>Students</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{withMarks}</Text>
              <Text style={styles.statLabel}>Marks Added</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNum, {color: '#22C55E'}]}>{goodAttendance}</Text>
              <Text style={styles.statLabel}>Good Attendance</Text>
            </View>
          </View>
        )}

        {/* Loading */}
        {dataLoading && (
          <View style={styles.dataLoadingCard}>
            <ActivityIndicator size="small" color="#3B82F6" />
            <Text style={styles.dataLoadingText}>
              {selectedClass
                ? `Loading Class ${selectedClass} data...`
                : 'Loading your classes...'}
            </Text>
          </View>
        )}

        {/* No class assigned */}
        {!dataLoading && availableClasses.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No Class Assigned</Text>
            <Text style={styles.emptyText}>
              Please ensure subjects are assigned to your account by the admin.
            </Text>
          </View>
        )}

        {/* Prompt to pick class */}
        {!dataLoading && availableClasses.length > 1 && !selectedClass && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>👆</Text>
            <Text style={styles.emptyTitle}>Select a Class</Text>
            <Text style={styles.emptyText}>
              Pick a class above to load student data and run AI analysis.
            </Text>
          </View>
        )}

        {/* AI Tools */}
        {selectedClass && !dataLoading && (
          <>
            <Text style={styles.sectionTitle}>AI Tools</Text>

            {features.map(item => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                style={[
                  styles.featureCard,
                  selectedTool === item.id && styles.selectedCard,
                ]}
                onPress={() => {
                  setSelectedTool(item.id);
                  setAnalysis('');
                }}>
                <View style={[
                  styles.iconContainer,
                  selectedTool === item.id && styles.iconContainerSelected,
                ]}>
                  <Text style={styles.icon}>{item.icon}</Text>
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{item.title}</Text>
                  <Text style={styles.featureDescription}>{item.description}</Text>
                </View>
                {selectedTool === item.id && (
                  <View style={styles.checkBadge}>
                    <Text style={styles.selectedMark}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}

            {/* Workspace */}
            {selectedTool && (
              <View style={styles.workspaceCard}>
                <Text style={styles.workspaceTitle}>⚡ AI Workspace</Text>
                <View style={styles.selectedToolBadge}>
                  <Text style={styles.selectedToolBadgeText}>
                    {features.find(f => f.id === selectedTool)?.icon}{' '}
                    {features.find(f => f.id === selectedTool)?.title}
                    {selectedClass ? `  ·  Class ${selectedClass}` : ''}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.generateButton,
                    classData.length === 0 && styles.generateButtonDisabled,
                  ]}
                  onPress={handleGenerate}
                  disabled={classData.length === 0 || loading}>
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.generateButtonText}>✦ Generate Analysis</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* AI Response */}
            {(loading || analysis) ? (
              <View style={styles.responseCard}>
                <View style={styles.responseHeader}>
                  <Text style={styles.responseTitle}>🤖 AI Response</Text>
                  {analysis ? (
                    <View style={styles.doneBadge}>
                      <Text style={styles.doneBadgeText}>Done</Text>
                    </View>
                  ) : null}
                </View>

                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.loadingText}>Analyzing class data...</Text>
                    <Text style={styles.loadingSubText}>This may take a few seconds</Text>
                  </View>
                ) : (
                  <View style={styles.markdownContainer}>
                    {renderMarkdown(analysis)}
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.responsePlaceholderCard}>
                <Text style={styles.placeholderIcon}>💬</Text>
                <Text style={styles.responsePlaceholder}>
                  Select a tool and tap Generate Analysis to see AI insights here.
                </Text>
              </View>
            )}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

export default TeacherAIHubScreen;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#0F172A'},
  scrollContainer: {padding: 20, paddingBottom: 60},
  header: {alignItems: 'center', marginTop: 10, marginBottom: 24},
  iconBadge: {
    width: 90, height: 90, borderRadius: 24,
    backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155',
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  aiIcon: {fontSize: 46},
  title: {fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3},
  subtitle: {color: '#94A3B8', textAlign: 'center', marginTop: 8, fontSize: 14, lineHeight: 22, paddingHorizontal: 20},

  // Class Picker
  classPickerSection: {marginBottom: 20},
  classPickerRow: {flexDirection: 'row', gap: 10, paddingVertical: 4},
  classPill: {
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 25, backgroundColor: '#1E293B',
    borderWidth: 1, borderColor: '#334155',
  },
  classPillSelected: {backgroundColor: '#3B82F6', borderColor: '#3B82F6'},
  classPillText: {color: '#94A3B8', fontWeight: '600', fontSize: 14},
  classPillTextSelected: {color: '#FFFFFF'},

  // Stats
  statsRow: {flexDirection: 'row', gap: 10, marginBottom: 24},
  statCard: {
    flex: 1, backgroundColor: '#1E293B', borderRadius: 14,
    padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#334155',
  },
  statNum: {fontSize: 22, fontWeight: '800', color: '#3B82F6'},
  statLabel: {fontSize: 11, color: '#94A3B8', marginTop: 3, textAlign: 'center'},

  // Loading / Empty
  dataLoadingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#1E293B', borderRadius: 14, padding: 16, marginBottom: 20,
  },
  dataLoadingText: {color: '#CBD5E1', fontSize: 14},
  emptyCard: {
    backgroundColor: '#1E293B', borderRadius: 18, padding: 28,
    alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#334155',
  },
  emptyIcon: {fontSize: 36, marginBottom: 10},
  emptyTitle: {color: '#FFFFFF', fontSize: 17, fontWeight: '700', marginBottom: 6},
  emptyText: {color: '#94A3B8', textAlign: 'center', lineHeight: 20, fontSize: 13},

  sectionTitle: {color: '#FFFFFF', fontSize: 17, fontWeight: '700', marginBottom: 12},

  // Feature Cards
  featureCard: {
    backgroundColor: '#1E293B', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', marginBottom: 12,
    borderWidth: 1, borderColor: '#334155',
  },
  selectedCard: {borderColor: '#3B82F6', borderWidth: 2, backgroundColor: '#1a2d4a'},
  iconContainer: {
    width: 54, height: 54, borderRadius: 14,
    backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center',
  },
  iconContainerSelected: {backgroundColor: '#1D4ED8'},
  icon: {fontSize: 26},
  featureContent: {flex: 1, marginLeft: 14},
  featureTitle: {color: '#FFFFFF', fontSize: 16, fontWeight: '700'},
  featureDescription: {color: '#94A3B8', fontSize: 13, marginTop: 3, lineHeight: 18},
  checkBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center',
  },
  selectedMark: {color: '#FFFFFF', fontSize: 14, fontWeight: 'bold'},

  // Workspace
  workspaceCard: {
    backgroundColor: '#1E293B', borderRadius: 16, padding: 18,
    marginTop: 8, marginBottom: 14, borderWidth: 1, borderColor: '#334155',
  },
  workspaceTitle: {color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 12},
  selectedToolBadge: {
    backgroundColor: '#0F172A', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 14,
  },
  selectedToolBadgeText: {color: '#CBD5E1', fontSize: 14},
  generateButton: {backgroundColor: '#3B82F6', paddingVertical: 15, borderRadius: 12, alignItems: 'center'},
  generateButtonDisabled: {backgroundColor: '#1E3A5F'},
  generateButtonText: {color: '#FFFFFF', fontWeight: '700', fontSize: 15, letterSpacing: 0.3},

  // Response
  responseCard: {
    backgroundColor: '#1E293B', borderRadius: 16, padding: 20,
    marginBottom: 14, borderWidth: 1, borderColor: '#334155',
  },
  responseHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16},
  responseTitle: {color: '#FFFFFF', fontSize: 16, fontWeight: '700'},
  doneBadge: {backgroundColor: '#14532D', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4},
  doneBadgeText: {color: '#22C55E', fontSize: 12, fontWeight: '600'},
  loadingContainer: {alignItems: 'center', paddingVertical: 30, gap: 10},
  loadingText: {color: '#CBD5E1', fontSize: 15, fontWeight: '600'},
  loadingSubText: {color: '#64748B', fontSize: 13},
  markdownContainer: {gap: 2},
  responsePlaceholderCard: {
    backgroundColor: '#1E293B', borderRadius: 16, padding: 28,
    alignItems: 'center', borderWidth: 1, borderColor: '#334155', borderStyle: 'dashed',
  },
  placeholderIcon: {fontSize: 32, marginBottom: 10},
  responsePlaceholder: {color: '#64748B', textAlign: 'center', lineHeight: 22, fontSize: 14},
});

const mdStyles = StyleSheet.create({
  h1: {color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginTop: 14, marginBottom: 6},
  h2: {color: '#60A5FA', fontSize: 17, fontWeight: '700', marginTop: 12, marginBottom: 4},
  h3: {color: '#CBD5E1', fontSize: 15, fontWeight: '700', marginTop: 10, marginBottom: 3},
  paragraph: {color: '#CBD5E1', fontSize: 14, lineHeight: 22},
  bold: {color: '#FFFFFF', fontWeight: '800'},
  italic: {color: '#CBD5E1', fontStyle: 'italic'},
  bulletRow: {flexDirection: 'row', alignItems: 'flex-start', marginVertical: 3},
  bulletDot: {color: '#3B82F6', fontSize: 16, marginRight: 8, lineHeight: 22},
  bulletNum: {color: '#3B82F6', fontSize: 14, marginRight: 8, lineHeight: 22, fontWeight: '700', minWidth: 20},
  bulletText: {color: '#CBD5E1', fontSize: 14, lineHeight: 22, flex: 1},
  divider: {height: 1, backgroundColor: '#334155', marginVertical: 10},
});