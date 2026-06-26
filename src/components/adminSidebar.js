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
} from 'react-native';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const {width} = Dimensions.get('window');

const getInitials = name => {
  if (!name) return '?';

  const parts = name.trim().split(' ');

  if (parts.length === 1) {
    return parts[0][0].toUpperCase();
  }

  return parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase();
};

const AdminSidebar = ({
  visible,
  onClose,
  navigation,
  activeScreen = 'Dashboard',
  user = {},
}) => {
  const {name = 'Admin', role = 'Administrator', avatarUrl = null} = user;

  const slideAnim = useRef(new Animated.Value(-width)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [showModal, setShowModal] = useState(visible);

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

  return (
    <Modal transparent visible={showModal} onRequestClose={onClose}>
      {/* OVERLAY */}
      <Animated.View style={[styles.overlay, {opacity: fadeAnim}]}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        />
      </Animated.View>

      {/* SIDEBAR */}
      <Animated.View
        style={[styles.sidebar, {transform: [{translateX: slideAnim}]}]}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.title}>Admin Menu</Text>

          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* PROFILE */}
        <View style={styles.profileSection}>
          <View style={styles.avatarRing}>
            {avatarUrl ? (
              <Image source={{uri: avatarUrl}} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarInner}>
                <Text style={styles.avatarInitials}>{getInitials(name)}</Text>
              </View>
            )}
          </View>

          <View>
            <Text style={styles.profileName}>{name}</Text>

            <Text style={styles.roleText}>{role}</Text>
          </View>
        </View>

        {/* MENU */}
        <View style={styles.menu}>
          <MenuItem
            icon="view-dashboard-outline"
            label="Dashboard"
            active={activeScreen === 'Dashboard'}
            onPress={() => goTo('Dashboard')}
          />

          <MenuItem
            icon="account-group-outline"
            label="Students"
            active={activeScreen === 'StudentsScreen'}
            onPress={() => goTo('StudentsScreen')}
          />

          <MenuItem
            icon="account-tie-outline"
            label="Teachers"
            active={activeScreen === 'TeacherScreen'}
            onPress={() => goTo('TeacherScreen')}
          />

          <MenuItem
            icon="account-supervisor-outline"
            label="Parents"
            active={activeScreen === 'ParentsScreen'}
            onPress={() => goTo('ParentsScreen')}
          />

          <MenuItem
            icon="bus-school"
            label="School Bus"
            active={activeScreen === 'SchoolBus'}
            onPress={() => goTo('SchoolBus')}
          />

          <MenuItem
            icon="steering"
            label="Drivers"
            active={activeScreen === 'Drivers'}
            onPress={() => goTo('Drivers')}
          />

          <MenuItem
            icon="calendar-check-outline"
            label="Attendance"
            active={activeScreen === 'AttendanceHome'}
            onPress={() => goTo('AttendanceHome')}
          />

          <MenuItem
            icon="table"
            label="Timetable"
            active={activeScreen === 'TimeTable'}
            onPress={() => goTo('TimeTable')}
          />

          <MenuItem
            icon="book-open-page-variant-outline"
            label="Rules"
            active={activeScreen === 'RulesScreen'}
            onPress={() => goTo('RulesScreen')}
          />

          <MenuItem
            icon="calendar-outline"
            label="Events"
            active={activeScreen === 'AdminEvent'}
            onPress={() => goTo('AdminEvent')}
          />
        </View>

        {/* LOGOUT */}
        <View style={styles.logout}>
          <TouchableOpacity onPress={() => goTo('Login')}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

const MenuItem = ({icon, label, active, onPress}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.item, active && styles.activeItem]}>
    <MaterialCommunityIcons
      name={icon}
      size={22}
      color={active ? '#fff' : '#A8C4DC'}
    />

    <Text style={[styles.itemText, active && styles.activeText]}>{label}</Text>
  </TouchableOpacity>
);

export default AdminSidebar;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '75%',
    backgroundColor: '#104E8B',
    padding: 16,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 10,
  },

  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  avatarRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
    overflow: 'hidden',
  },

  avatarInner: {
    flex: 1,
    backgroundColor: '#5BB8F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarImage: {
    width: '100%',
    height: '100%',
  },

  avatarInitials: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },

  profileName: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  roleText: {
    color: '#A8C4DC',
    fontSize: 12,
    marginTop: 2,
  },

  menu: {
    marginTop: 10,
  },

  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
  },

  activeItem: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  itemText: {
    color: '#A8C4DC',
    marginLeft: 12,
    fontSize: 15,
  },

  activeText: {
    color: '#fff',
    fontWeight: '700',
  },

  logout: {
    marginTop: 'auto',
    padding: 10,
  },

  logoutText: {
    color: 'red',
    fontWeight: '700',
    fontSize: 15,
  },
});
