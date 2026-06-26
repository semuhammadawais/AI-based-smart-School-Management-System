import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import BottomNavParent from '../../components/BottomNavParent';
import firestore from '@react-native-firebase/firestore';
import {AuthContext} from '../../context/authContext';
import Spinner from '../../components/Spinner';
import MenuModal from '../../components/MenuModal';
import Auth from '@react-native-firebase/auth';
import Events from '../../components/Events';
import PrayerCard from '../../components/PrayerCard';

// ✅ ADD SIDEBAR
import Sidebar from '../../components/parentsSidebar';

const FEATURES = [
  {name: 'Marks', icon: 'chart-bar', bg: '#EAF3DE', color: '#3B6D11'},
  {name: 'Attendance', icon: 'calendar-check', bg: '#E6F1FB', color: '#185FA5'},
  {name: 'LiveBusMap', icon: 'map', bg: '#EAF7FB', color: '#356699'},
  {name: 'Timetable', icon: 'timetable', bg: '#FAEEDA', color: '#854F0B'},
];

const FeatureTile = ({item, onPress}) => (
  <TouchableOpacity
    style={styles.subjectTile}
    onPress={onPress}
    activeOpacity={0.7}>
    <View style={[styles.subjectIconWrap, {backgroundColor: item.bg}]}>
      <MaterialCommunityIcons name={item.icon} size={22} color={item.color} />
    </View>
    <Text style={styles.subjectLabel}>{item.name}</Text>
  </TouchableOpacity>
);

const HomeScreen = ({navigation}) => {
  const {user} = useContext(AuthContext);

  const [parent, setParent] = useState(null);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // ✅ SIDEBAR STATE
  const [sidebarVisible, setSidebarVisible] = useState(false);

  /* ─── FETCH DATA ─── */
  useEffect(() => {
    const loadData = async () => {
      try {
        const uid = user.uid;

        const parentDoc = await firestore().collection('users').doc(uid).get();

        setParent(parentDoc.data());

        const mapping = await firestore()
          .collection('ParentStudentMapping')
          .where('parentId', '==', uid)
          .get();

        const studentIds = mapping.docs.map(d => d.data().studentId);

        const studentData = await Promise.all(
          studentIds.map(async id => {
            const doc = await firestore().collection('students').doc(id).get();
            return {id: doc.id, ...doc.data()};
          }),
        );

        setChildren(studentData);
        setSelectedChild(studentData[0]);
        setLoading(false);
      } catch (e) {
        console.log(e);
      }
    };

    loadData();
  }, []);

  const handleLogout = async () => {
    await Auth().signOut();
    navigation.navigate('RoleScreen');
  };

  const handleFeaturePress = feature => {
    if (!selectedChild) return;

    navigation.navigate(feature, {
      studentId: selectedChild.id,
    });
  };

  const initials = (parent?.name || 'P')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#104E8B" barStyle="light-content" />
      {loading && <Spinner />}

      {/* ─── HEADER ─── */}
      <View style={styles.header}>
        {/* ✅ MENU BUTTON (OPEN SIDEBAR) */}
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => setSidebarVisible(true)}>
          <MaterialCommunityIcons name="menu" size={20} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Parent Home</Text>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => setShowLogoutModal(true)}>
            <MaterialCommunityIcons
              name="cog-outline"
              size={20}
              color="white"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* LOGOUT MODAL */}
      <MenuModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onNavigate={handleLogout}
        buttonText="Logout"
      />

      {/* ─── SIDEBAR ─── */}
      <Sidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        navigation={navigation}
        activeScreen="Home"
        user={{
          name: parent?.name,
          role: 'Parent',
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ─── PARENT CARD ─── */}
        <View style={styles.teacherCard}>
          <View style={styles.teacherAvatar}>
            <Text style={styles.teacherInitials}>{initials}</Text>
          </View>

          <View style={styles.teacherInfo}>
            <Text style={styles.teacherName}>{parent?.name}</Text>
            <Text style={styles.teacherOcc}>Parent</Text>

            {selectedChild && (
              <View style={styles.classBadge}>
                <Text style={styles.classBadgeText}>
                  {selectedChild.name} ({selectedChild.class})
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ─── CHILD SWITCH ─── */}
        {children.length > 1 && (
          <>
            <Text style={styles.sectionLabel}>Select Child</Text>
            <View style={{flexDirection: 'row', gap: 10}}>
              {children.map(child => (
                <TouchableOpacity
                  key={child.id}
                  style={[
                    styles.childBtn,
                    selectedChild?.id === child.id && {
                      backgroundColor: '#104E8B',
                    },
                  ]}
                  onPress={() => setSelectedChild(child)}>
                  <Text
                    style={{
                      color: selectedChild?.id === child.id ? 'white' : '#333',
                    }}>
                    {child.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* ─── FEATURES ─── */}
        <Text style={styles.sectionLabel}>Features</Text>
        <View style={styles.subjectsGrid}>
          {FEATURES.map((item, index) => (
            <FeatureTile
              key={index}
              item={item}
              onPress={() => handleFeaturePress(item.name)}
            />
          ))}
        </View>

        {/* ─── EVENTS ─── */}
        <Events />
        {/* ─── PRAYER CARD ─── */}
        <PrayerCard />
      </ScrollView>
      <BottomNavParent />
    </View>
  );
};

export default HomeScreen;

/* ───────── STYLES ───────── */
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F2F4F7'},

  header: {
    backgroundColor: '#104E8B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 44,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },

  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginLeft: 10,
  },

  headerRight: {flexDirection: 'row'},

  scrollContent: {padding: 16, paddingBottom: 100},

  teacherCard: {
    backgroundColor: '#1A5FA8',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },

  teacherAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#BFDBF7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  teacherInitials: {
    color: '#104E8B',
    fontSize: 22,
    fontWeight: '700',
  },

  teacherInfo: {flex: 1},

  teacherName: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },

  teacherOcc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },

  classBadge: {
    backgroundColor: '#22A96E',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 20,
    marginTop: 6,
  },

  classBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
    marginBottom: 12,
  },

  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  subjectTile: {
    backgroundColor: 'white',
    borderRadius: 14,
    width: '22%',
    paddingVertical: 12,
    alignItems: 'center',
    gap: 7,
  },

  subjectIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  subjectLabel: {
    fontSize: 10,
    color: '#555',
  },

  childBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ddd',
    borderRadius: 20,
  },
});
