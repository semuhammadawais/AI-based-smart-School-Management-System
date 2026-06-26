import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const SUBJECT_THEMES = [
  {bg: '#EBF2FF', iconBg: '#FFFFFF', iconColor: '#104E8B', textColor: '#0C447C', border: '#BFCFF0'},
  {bg: '#E1F5EEF', iconBg: '#FFFFFF', iconColor: '#0F6E56', textColor: '#085041', border: '#9FD8C0'},
  {bg: '#FAEEDA', iconBg: '#FFFFFF', iconColor: '#854F0B', textColor: '#633806', border: '#FAC775'},
  {bg: '#FBEAF0', iconBg: '#FFFFFF', iconColor: '#993556', textColor: '#72243E', border: '#F4C0D1'},
  {bg: '#EEEDFE', iconBg: '#FFFFFF', iconColor: '#534AB7', textColor: '#3C3489', border: '#CECBF6'},
  {bg: '#EAF3DE', iconBg: '#FFFFFF', iconColor: '#3B6D11', textColor: '#27500A', border: '#C0DD97'},
];

// Maps subject name keywords → MaterialCommunityIcons icon name
const getSubjectIcon = name => {
  const n = name?.toLowerCase() || '';

  if (n.includes('math'))                          return 'calculator-variant';
  if (n.includes('science') && n.includes('computer')) return 'laptop';
  if (n.includes('physics'))                       return 'atom';
  if (n.includes('chem'))                          return 'flask';
  if (n.includes('bio'))                           return 'dna';
  if (n.includes('science'))                       return 'microscope';
  if (n.includes('english') || n.includes('literature')) return 'book-alphabet';
  if (n.includes('urdu') || n.includes('arabic') || n.includes('persian')) return 'abjad-arabic';
  if (n.includes('lang') || n.includes('french') || n.includes('german')) return 'translate';
  if (n.includes('history'))                       return 'bank';
  if (n.includes('geo'))                           return 'earth';
  if (n.includes('civics') || n.includes('social')) return 'account-group';
  if (n.includes('islamic') || n.includes('religion') || n.includes('quran')) return 'mosque';
  if (n.includes('art') || n.includes('draw'))     return 'palette';
  if (n.includes('music'))                         return 'music-note';
  if (n.includes('sport') || n.includes('p.e') || n.includes('physical')) return 'run';
  if (n.includes('computer') || n.includes('ict'))  return 'monitor';
  if (n.includes('econ'))                          return 'chart-line';
  if (n.includes('account'))                       return 'calculator';
  if (n.includes('pakistan'))                      return 'flag';
  if (n.includes('stat'))                          return 'chart-bar';

  return 'book-open-page-variant'; // fallback
};

const StudentSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const currentUid = auth().currentUser?.uid;
        if (!currentUid) return;

        const studentSnap = await firestore()
          .collection('students')
          .where('uid', '==', currentUid)
          .get();

        if (studentSnap.empty) return;

        const student = studentSnap.docs[0].data();
        const studentClass = student?.admissionClass?.toString().trim();

        const classesSnap = await firestore().collection('Classes').get();
        let foundSubjects = [];

        classesSnap.forEach(doc => {
          const data = doc.data();
          if (
            doc.id === studentClass ||
            doc.id === `Class ${studentClass}` ||
            doc.id === `class ${studentClass}` ||
            data.class === studentClass ||
            data.className === studentClass
          ) {
            foundSubjects = data.subjects || [];
          }
        });

        setSubjects(foundSubjects);
      } catch (error) {
        console.log('ERROR:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  return (
    <View>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionAccent} />
        <Text style={styles.sectionHeading}>My Subjects</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="small" color="#104E8B" style={{marginTop: 20}} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subjectsContainer}>
          {subjects?.length > 0 ? (
            subjects.map((subject, index) => {
              const theme = SUBJECT_THEMES[index % SUBJECT_THEMES.length];
              const icon = getSubjectIcon(subject);
              return (
                <View
                  key={index}
                  style={[
                    styles.subjectCard,
                    {backgroundColor: theme.bg, borderColor: theme.border},
                  ]}>
                  <View
                    style={[
                      styles.iconCircle,
                      {backgroundColor: theme.iconBg, borderColor: theme.border},
                    ]}>
                    <MaterialCommunityIcons
                      name={icon}
                      size={20}
                      color={theme.iconColor}
                    />
                  </View>
                  <Text style={[styles.subjectText, {color: theme.textColor}]}>
                    {subject}
                  </Text>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No Subjects Found</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default StudentSubjects;

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 28,
    marginBottom: 18,
  },
  sectionAccent: {
    width: 4,
    height: 22,
    borderRadius: 2,
    backgroundColor: '#104E8B',
    marginRight: 10,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a2744',
    letterSpacing: 0.2,
  },
  subjectsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    paddingTop: 4,
  },
  subjectCard: {
    width: 110,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 12,
    marginRight: 12,
    alignItems: 'center',
    borderWidth: 0.5,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 0.5,
  },
  subjectText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
    marginLeft: 4,
    marginBottom: 10,
  },
});