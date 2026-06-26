import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Image,
  ScrollView,
} from 'react-native';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const {width} = Dimensions.get('window');

const getInitials = name => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const Sidebar = ({
  visible,
  onClose,
  navigation,
  activeScreen = 'Home',
  user = {},
}) => {
  const {name = 'Teacher', role = 'Teacher', avatarUrl = null} = user;

  const slideAnim = useRef(new Animated.Value(-width)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -width,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setShowModal(false));
    }
  }, [visible]);

  const goTo = screen => {
    onClose();
    navigation.navigate(screen);
  };

  if (!showModal) return null;

  const MenuItem = ({icon, label, screen}) => {
    const active = activeScreen === screen;

    return (
      <TouchableOpacity
        onPress={() => goTo(screen)}
        style={[styles.item, active && styles.itemActive]}>
        {active && <View style={styles.activeBar} />}

        <View style={[styles.iconBox, active && styles.iconBoxActive]}>
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={active ? '#0A3561' : '#A8C4DC'}
          />
        </View>

        <Text style={[styles.itemText, active && styles.itemTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal transparent visible={showModal} onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, {opacity: fadeAnim}]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        />
      </Animated.View>

      <Animated.View
        style={[styles.sidebar, {transform: [{translateX: slideAnim}]}]}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Teacher Menu</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* PROFILE CARD (THIS FIX MAKES IT STUDENT STYLE) */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            {avatarUrl ? (
              <Image source={{uri: avatarUrl}} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarText}>{getInitials(name)}</Text>
            )}
          </View>

          <View>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.role}>{role}</Text>
          </View>
        </View>

        {/* MENU */}
        <ScrollView>
          <MenuItem icon="home-outline" label="Home" screen="Home" />
          <MenuItem icon="account-outline" label="Profile" screen="Profile" />
          <MenuItem
            icon="book-plus-outline"
            label="Add Marks"
            screen="addMarksScreen"
          />
          <MenuItem
            icon="account-group-outline"
            label="Students"
            screen="StudentsList"
          />
          <MenuItem
            icon="clipboard-text-outline"
            label="Student Attendance"
            screen="AttendanceReport"
          />
          <MenuItem
            icon="clipboard-text-outline"
            label="Teacher Attendance"
            screen="ScanAttendance"
          />
          <MenuItem
            icon="book-open-page-variant-outline"
            label="Rules"
            screen="TeacherRules"
          />
           <MenuItem
            icon="brain"
            label="Ai Analysis"
            screen="TeacherAIHubScreen"
          />
          <MenuItem icon="calendar-outline" label="Events" screen="Events" />
        </ScrollView>

        {/* LOGOUT (student style) */}
        <View style={styles.logoutBox}>
          <TouchableOpacity
            onPress={() => goTo('Login')}
            style={styles.logoutBtn}>
            <MaterialCommunityIcons name="logout" size={20} color="#E05C5C" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

export default Sidebar;

/* ───── STUDENT STYLE UI EXACT MATCH ───── */

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },

  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '74%',
    backgroundColor: '#104E8B',
    padding: 16,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },

  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  /* PROFILE CARD (NOW SAME AS STUDENT) */
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    padding: 14,
    borderRadius: 16,
    marginBottom: 18,
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
  },

  avatarText: {
    color: '#fff',
    fontWeight: '800',
  },

  name: {
    color: '#fff',
    fontWeight: '700',
  },

  role: {
    color: '#94A3B8',
    fontSize: 12,
  },

  /* MENU ITEM EXACT STYLE */
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 1,
  },

  itemActive: {
    backgroundColor: 'rgba(56,189,248,0.12)',
  },

  activeBar: {
    position: 'absolute',
    left: 0,
    top: 10,
    bottom: 10,
    width: 3,
    backgroundColor: '#38BDF8',
    borderRadius: 10,
  },

  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  iconBoxActive: {
    backgroundColor: '#38BDF8',
  },

  itemText: {
    color: '#A8C4DC',
    fontSize: 14,
  },

  itemTextActive: {
    color: '#fff',
    fontWeight: '700',
  },

  /* LOGOUT */
  logoutBox: {
    marginTop: 20,
  },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },

  logoutText: {
    color: '#E05C5C',
    marginLeft: 10,
    fontWeight: '700',
  },
});
