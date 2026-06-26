import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import BottomNav from '../../components/BottomNavStudent';
import SubjectModal from '../../components/SubjectModal';
import firestore from '@react-native-firebase/firestore';
import Spinner from '../../components/Spinner';
import MenuModal from '../../components/MenuModal';
import auth from '@react-native-firebase/auth';
import Events from '../../components/Events';
import Sidebar from '../../components/sidebar';
import PrayerCard from '../../components/PrayerCard';

/* GET ALL TEACHER CLASSES */
const getTeacherClasses = teacher => {
  if (!teacher?.assignedSubjects) return [];

  let allClasses = [];

  teacher.assignedSubjects.forEach(item => {
    if (Array.isArray(item.classes)) {
      allClasses.push(...item.classes);
    }
  });

  // REMOVE DUPLICATES
  return [...new Set(allClasses)];
};

/* SUBJECT COLORS */
const SUBJECT_COLORS = {
  Urdu: {
    bg: '#E6F1FB',
    icon: 'book-outline',
    iconColor: '#185FA5',
  },

  Math: {
    bg: '#EAF3DE',
    icon: 'calculator-variant',
    iconColor: '#3B6D11',
  },

  physics: {
    bg: '#FFF4E5',
    icon: 'atom',
    iconColor: '#D97706',
  },

  English: {
    bg: '#FBEAF0',
    icon: 'book-open-page-variant',
    iconColor: '#993556',
  },
};

const DEFAULT_SUBJECT = {
  bg: '#F2F4F7',
  icon: 'book',
  iconColor: '#888',
};

/* SUBJECT TILE */
const SubjectTile = ({subject, onPress}) => {
  const cfg = SUBJECT_COLORS[subject] || DEFAULT_SUBJECT;

  return (
    <TouchableOpacity style={styles.subjectTile} onPress={onPress}>
      <MaterialCommunityIcons
        name={cfg.icon}
        size={22}
        color={cfg.iconColor}
      />

      <Text style={styles.subjectLabel}>{subject}</Text>
    </TouchableOpacity>
  );
};

/* MAIN SCREEN */
const HomeScreen = ({navigation}) => {
  const [teacher, setTeacher] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  /* FETCH TEACHER */
  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        setLoading(true);

        const uid = auth().currentUser?.uid;

        console.log('CURRENT UID:', uid);

        // FETCH TEACHER USING UID FIELD
        const snap = await firestore()
          .collection('Teachers')
          .where('uid', '==', uid)
          .get();

        console.log('TEACHER FOUND:', snap.size);

        if (snap.empty) {
          console.log('Teacher not found');
          setLoading(false);
          return;
        }

        const teacherData = snap.docs[0].data();

        console.log('TEACHER DATA:', teacherData);

        setTeacher(teacherData);

        /* SUBJECTS */
        const teacherSubjects = teacherData?.assignedSubjects || [];

        const subjectList = teacherSubjects.map(item => item.subject);

        setSubjects(subjectList);
      } catch (error) {
        console.log('ERROR:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacher();
  }, []);

  /* LOGOUT */
  const handleLogout = async () => {
    try {
      await auth().signOut();

      navigation.reset({
        index: 0,
        routes: [{name: 'RoleScreen'}],
      });
    } catch (error) {
      console.log('Logout error:', error);
    }
  };

  /* INITIALS */
  const initials =
    teacher?.name
      ?.split(' ')
      ?.map(w => w?.[0])
      ?.join('')
      ?.slice(0, 2)
      ?.toUpperCase() || 'T';

  /* CLASSES */
  const classes = getTeacherClasses(teacher);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#104E8B" barStyle="light-content" />

      {loading && <Spinner />}

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidebarVisible(true)}>
          <MaterialCommunityIcons name="menu" size={22} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Home</Text>

        <TouchableOpacity onPress={() => setShowLogoutModal(true)}>
          <MaterialCommunityIcons name="logout" size={22} color="white" />
        </TouchableOpacity>
      </View>

      {/* LOGOUT MODAL */}
      <MenuModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onNavigate={handleLogout}
        buttonText="Logout"
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* TEACHER CARD */}
        <View style={styles.teacherCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <View style={{flex: 1}}>
            <Text style={styles.name}>
              {teacher?.name || 'Loading...'}
            </Text>

            {/* CLASSES */}
            <View style={styles.classRow}>
              {classes.length > 0 ? (
                classes.map((c, i) => (
                  <View key={i} style={styles.classChip}>
                    <Text style={styles.classText}>
                      Class {c}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={{color: '#fff'}}>
                  No Classes Assigned
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* SUBJECTS */}
        <Text style={styles.section}>Subjects</Text>

        <View style={styles.grid}>
          {subjects?.map((s, i) => (
            <SubjectTile
              key={i}
              subject={s}
              onPress={() => {
                setSelectedSubject(s);
                setModalVisible(true);
              }}
            />
          ))}
        </View>

        <Events />
         <PrayerCard />
      </ScrollView>

      {/* SIDEBAR */}
      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        navigation={navigation}
      />

      {/* BOTTOM NAV */}
      <BottomNav />

      {/* SUBJECT MODAL */}
      <SubjectModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAddMarks={() =>
          navigation.navigate('AddMarks', {
            subject: selectedSubject,
          })
        }
      />
    </View>
  );
};

export default HomeScreen;

/* STYLES */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4F7',
  },

  header: {
    backgroundColor: '#104E8B',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },

  teacherCard: {
    backgroundColor: '#1A5FA8',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    marginBottom: 20,
  },

  avatar: {
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  avatarText: {
    fontWeight: 'bold',
    color: '#104E8B',
  },

  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  classRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },

  classChip: {
    backgroundColor: '#22A96E',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 6,
    marginTop: 4,
  },

  classText: {
    color: '#fff',
    fontSize: 11,
  },

  section: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#666',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  subjectTile: {
    width: '22%',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
  },

  subjectLabel: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 5,
    color: '#333',
  },
});