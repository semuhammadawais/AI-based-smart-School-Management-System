// HomeScreen.js
import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
} from 'react-native';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import BottomNav from '../../components/BottomNav';
import Auth from '@react-native-firebase/auth';
import MenuModal from '../../components/MenuModal';
import Events from '../../components/Events'; // ✅ SINGLE SOURCE OF EVENTS
import PrayerCard from '../../components/PrayerCard'; // ✅ NEW PRAYER CARD COMPONENT
import AdminSidebar from '../../components/adminSidebar'; // ✅ ADMIN SIDEBAR

const HomeScreen = ({navigation}) => {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = async () => {
    await Auth().signOut();
    navigation.navigate('RoleScreen');
  };
  const openSidebar = () => {
    setSidebarVisible(true);
  };

  // CLOSE SIDEBAR
  const closeSidebar = () => {
    setSidebarVisible(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#104E8B" barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton} onPress={openSidebar}>
          <MaterialCommunityIcons name="menu" size={20} color="white" />
        </TouchableOpacity>
        <AdminSidebar
          visible={sidebarVisible}
          onClose={closeSidebar}
          navigation={navigation}
          activeScreen="Dashboard"
          user={{
            name: 'Admin User',
            role: 'Administrator',
          }}
        />

        <Text style={styles.headerText}>Home</Text>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialCommunityIcons
              name="bell-outline"
              size={20}
              color="white"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowLogoutModal(true)}>
            <MaterialCommunityIcons
              name="cog-outline"
              size={20}
              color="white"
            />
          </TouchableOpacity>
        </View>
      </View>

      <MenuModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onNavigate={handleLogout}
        buttonText="Logout"
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* SUMMARY CARD */}
        <View style={styles.summaryContainer}>
          <View style={styles.schoolInfo}>
            <Image
              source={{
                uri: 'https://w7.pngwing.com/pngs/551/211/png-transparent-education-logo-pre-school-others-text-logo-business-thumbnail.png',
              }}
              style={styles.schoolLogo}
            />
            <View>
              <Text style={styles.schoolName}>Abbottabad School</Text>
              <Text style={styles.schoolLocation}>📍 Abbottabad, Pakistan</Text>
            </View>
          </View>

          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryCount}>100</Text>
              <Text style={styles.summaryText}>Teachers</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryCount}>1500</Text>
              <Text style={styles.summaryText}>Students</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryCount}>10</Text>
              <Text style={styles.summaryText}>Departments</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryCount}>50</Text>
              <Text style={styles.summaryText}>Staff</Text>
            </View>
          </View>
        </View>

        {/* ICON GRID */}
        <View style={styles.iconGrid}>
          <View style={styles.iconRow}>
            <TouchableOpacity
              style={styles.iconContainer}
              onPress={() => navigation.navigate('StudentsScreen')}>
              <MaterialCommunityIcons
                name="account-outline"
                size={28}
                color="#104E8B"
              />
              <Text style={styles.iconText}>Students</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconContainer}
              onPress={() => navigation.navigate('TeacherScreen')}>
              <MaterialCommunityIcons
                name="account-outline"
                size={28}
                color="#104E8B"
              />
              <Text style={styles.iconText}>Teachers</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconContainer}
              onPress={() => navigation.navigate('TimeTable')}>
              <MaterialCommunityIcons
                name="calendar-outline"
                size={28}
                color="#104E8B"
              />
              <Text style={styles.iconText}>Timetable</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.iconRow, {marginTop: 12}]}>
            <TouchableOpacity
              style={styles.iconContainer}
              onPress={() => navigation.navigate('Syllabus')}>
              <MaterialCommunityIcons
                name="book-open-outline"
                size={28}
                color="#104E8B"
              />
              <Text style={styles.iconText}>Syllabus</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconContainer}
              onPress={() => navigation.navigate('ParentsScreen')}>
              <MaterialCommunityIcons
                name="account-child-outline"
                size={28}
                color="#104E8B"
              />
              <Text style={styles.iconText}>Parents</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconContainer}
              onPress={() => navigation.navigate('DriverScreen')}>
              <MaterialCommunityIcons name="bus" size={28} color="#104E8B" />
              <Text style={styles.iconText}>Drivers</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.iconRow, {marginTop: 12}]}>
            <TouchableOpacity
              style={styles.iconContainer}
              onPress={() => navigation.navigate('AttendanceHome')}>
              <MaterialCommunityIcons
                name="qrcode-scan"
                size={28}
                color="#104E8B"
              />
              <Text style={styles.iconText}>Attendance</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* EVENTS (FIXED - ONLY COMPONENT USED) */}
        <View style={{marginHorizontal: 16, marginTop: 20}}>
          <Events />
        </View>
        {/* PRAYER CARD (NEW) */}

        <PrayerCard />
      </ScrollView>

      <BottomNav />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4F7',
  },

  header: {
    backgroundColor: '#104E8B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 45,
    paddingBottom: 18,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },

  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },

  headerActions: {
    flexDirection: 'row',
    marginLeft: 'auto',
  },

  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  scrollContent: {
    paddingBottom: 120,
  },

  summaryContainer: {
    backgroundColor: '#1A5FA8',
    padding: 18,
    margin: 16,
    borderRadius: 16,
    elevation: 3,
  },

  schoolInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },

  schoolLogo: {
    width: 55,
    height: 55,
    borderRadius: 30,
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'white',
  },

  schoolName: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },

  schoolLocation: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },

  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  summaryItem: {
    width: '23%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },

  summaryCount: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },

  summaryText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
  },

  iconGrid: {
    marginHorizontal: 16,
    marginTop: 10,
  },

  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  iconContainer: {
    width: '32%',
    backgroundColor: 'white',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    elevation: 2,
  },

  iconText: {
    color: '#444',
    fontSize: 11,
    marginTop: 6,
  },
});

export default HomeScreen;
