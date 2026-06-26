import React, {useState, useContext, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
} from 'react-native';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import BottomNav from '../../components/BottomNavStudent';
import MenuModal from '../../components/MenuModal';
import Spinner from '../../components/Spinner';
import Events from '../../components/Events';


import {AuthContext} from '../../context/authContext';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Auth from '@react-native-firebase/auth';
import StudentSubjects from '../../components/StudentSubjects';
import Sidebar from '../../components/studentSidebar';
import PrayerCard from '../../components/PrayerCard';

const HomeScreen = ({navigation}) => {
  const [isDuesCleared] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const {user} = useContext(AuthContext);

  /* ───────── FETCH STUDENT DATA ───────── */
  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);

        const currentUser = auth().currentUser;

        if (!currentUser) {
          console.log('No logged in user');
          setLoading(false);
          return;
        }

        console.log('Current User Email:', currentUser.email);

        // Fetch student by email
        const studentSnapshot = await firestore()
          .collection('students')
          .where('email', '==', currentUser.email)
          .get();

        console.log('Snapshot Size:', studentSnapshot.size);

        if (!studentSnapshot.empty) {
          const studentDoc = studentSnapshot.docs[0];

          const student = studentDoc.data();

          console.log('Student Found:', student);

          setStudentData({
            ...student,
            docId: studentDoc.id, // registration number
          });
        } else {
          console.log('No student document found');
          setStudentData(null);
        }
      } catch (error) {
        console.log('FETCH ERROR:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, []);

  /* ───────── LOGOUT ───────── */
  const handleLogout = async () => {
    await Auth().signOut();
    navigation.navigate('RoleScreen');
  };

  /* ───────── TIMETABLE ───────── */
  const handleViewTimeTable = async () => {
    try {
      const timetableDoc = await firestore()
        .collection('Timetable')
        .doc('timetableImage')
        .get();

      const TimeTableUrl = timetableDoc.data();

      navigation.navigate('TimeTable', {
        TimeTableUrl: TimeTableUrl,
      });
    } catch (error) {
      console.error('Error fetching timetable: ', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#0a3567" barStyle="light-content" />

      {loading && <Spinner />}

      {/* ───────── HEADER ───────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setSidebarVisible(true)}>
          <MaterialCommunityIcons name="menu" size={26} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerText}>Home</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.iconBadgeWrapper}>
              <MaterialCommunityIcons
                name="bell-outline"
                size={24}
                color="white"
              />
              <View style={styles.badge} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowLogoutModal(true)}>
            <MaterialCommunityIcons
              name="cog-outline"
              size={24}
              color="white"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ───────── LOGOUT MODAL ───────── */}
      <MenuModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onNavigate={handleLogout}
        buttonText="Logout"
      />
      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        navigation={navigation}
        activeScreen="Home"
        user={{
          name: studentData?.name,
          role: 'Student',
          avatarUrl: studentData?.profilePicture,
        }}
      />

      {/* ───────── BODY ───────── */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* ───────── STUDENT CARD ───────── */}
        <View style={styles.summaryContainer}>
          <View style={styles.decorCircle1} />
          <View style={styles.decorCircle2} />

          <TouchableOpacity style={styles.shareIcon}>
            <MaterialIcons
              name="share"
              size={20}
              color="rgba(255,255,255,0.8)"
            />
          </TouchableOpacity>

          <View style={styles.schoolInfo}>
            {/* Avatar */}
            <View style={styles.avatarWrapper}>
              <Image
                source={{
                  uri:
                    studentData?.profilePicture ||
                    'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png',
                }}
                style={styles.schoolLogo}
              />

              <View
                style={[
                  styles.onlineIndicator,
                  {
                    backgroundColor: isDuesCleared ? '#4ade80' : '#f87171',
                  },
                ]}
              />
            </View>

            {/* Student Info */}
            <View style={styles.studentInfoText}>
              <Text style={styles.schoolName}>
                {studentData?.name || 'Student'}
              </Text>

              <Text style={styles.schoolLocation}>
                Class {studentData?.admissionClass || '--'}
              </Text>

              <Text style={styles.studentId}>
                ID: {studentData?.docId || '--'}
              </Text>

              <View
                style={[
                  styles.duesStatus,
                  {
                    backgroundColor: isDuesCleared ? '#16a34a' : '#dc2626',
                  },
                ]}>
                <MaterialCommunityIcons
                  name={
                    isDuesCleared
                      ? 'check-circle-outline'
                      : 'close-circle-outline'
                  }
                  size={12}
                  color="white"
                />

                <Text style={styles.duesStatusText}>
                  {isDuesCleared ? 'Dues Cleared' : 'Dues Pending'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ───────── SERVICES ───────── */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionAccent} />
          <Text style={styles.sectionHeading}>Student Services</Text>
        </View>

        <View style={styles.iconGrid}>
          <View style={styles.iconRow}>
            {/* Fees */}
            <View style={styles.iconCard}>
              <View style={[styles.iconCircle, {backgroundColor: '#EBF2FF'}]}>
                <MaterialCommunityIcons name="bank" size={28} color="#104E8B" />
              </View>

              <Text style={styles.iconText}>Fees</Text>
            </View>

            {/* Syllabus */}
            <TouchableOpacity
              style={styles.iconCard}
              onPress={() => navigation.navigate('Syllabus')}
              activeOpacity={0.7}>
              <View style={[styles.iconCircle, {backgroundColor: '#EBF2FF'}]}>
                <MaterialCommunityIcons
                  name="book-open-variant"
                  size={28}
                  color="#104E8B"
                />
              </View>

              <Text style={styles.iconText}>Syllabus</Text>
            </TouchableOpacity>

            {/* Timetable */}
            <TouchableOpacity
              style={styles.iconCard}
              onPress={handleViewTimeTable}
              activeOpacity={0.7}>
              <View style={[styles.iconCircle, {backgroundColor: '#EBF2FF'}]}>
                <MaterialCommunityIcons
                  name="calendar-outline"
                  size={28}
                  color="#104E8B"
                />
              </View>

              <Text style={styles.iconText}>Timetable</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* ───────── Subject Componenet ───────── */}
        <View>
          <StudentSubjects />
        </View>
        {/* ───────── EVENTS COMPONENT ───────── */}
        <View style={{marginHorizontal: 20, marginTop: 28}}>
          <Events />
        </View>
         <PrayerCard />
      </ScrollView>

      {/* ───────── BOTTOM NAV ───────── */}
      <BottomNav />
    </View>
  );
};

export default HomeScreen;

/* ───────── STYLES ───────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f9',
  },

  /* HEADER */
  header: {
    height: 85,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#104E8B',
    paddingTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 15,
    elevation: 6,
    shadowColor: '#104E8B',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  menuButton: {
    padding: 2,
  },

  headerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
    letterSpacing: 0.4,
  },

  headerActions: {
    flexDirection: 'row',
    marginLeft: 'auto',
    alignItems: 'center',
  },

  actionButton: {
    marginLeft: 14,
  },

  iconBadgeWrapper: {
    position: 'relative',
  },

  badge: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f87171',
    borderWidth: 1.5,
    borderColor: '#104E8B',
  },

  /* STUDENT CARD */
  summaryContainer: {
    backgroundColor: '#1a5fa8',
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 18,
    padding: 22,
    position: 'relative',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#0a3567',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },

  decorCircle1: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -40,
    right: -30,
  },

  decorCircle2: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -20,
    left: 20,
  },

  shareIcon: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 6,
    zIndex: 1,
  },

  schoolInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatarWrapper: {
    position: 'relative',
    marginRight: 18,
  },

  schoolLogo: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },

  onlineIndicator: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#1a5fa8',
  },

  studentInfoText: {
    flex: 1,
  },

  schoolName: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 2,
  },

  schoolLocation: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },

  studentId: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 8,
  },

  duesStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },

  duesStatusText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 11,
    marginLeft: 4,
  },

  /* SECTION HEADER */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 28,
    marginBottom: 16,
  },

  sectionAccent: {
    width: 4,
    height: 20,
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

  /* SERVICES */
  iconGrid: {
    marginHorizontal: 20,
  },

  iconRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 14,
  },

  iconCard: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    width: '28%',
    elevation: 3,
    shadowColor: '#104E8B',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },

  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  iconText: {
    color: '#2d4070',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },

  /* SCROLL */
  scrollContent: {
    paddingBottom: 110,
  },
});
