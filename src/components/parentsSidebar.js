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

/* ───────── INITIALS ───────── */
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
  const {name = 'User', role = 'Student', avatarUrl = null} = user;

  const slideAnim = useRef(new Animated.Value(-width)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [showModal, setShowModal] = useState(visible);

  /* ───────── ANIMATION ───────── */
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
      {/* BACKDROP */}
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
          <Text style={styles.title}>
            {role === 'Parent' ? 'Parent Menu' : 'Student Menu'}
          </Text>

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

            <View
              style={{
                backgroundColor: '#5BB8F5',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 10,
                alignSelf: 'flex-start',
                marginTop: 2,
              }}>
              <Text style={{color: '#fff', fontSize: 10}}>{role}</Text>
            </View>
          </View>
        </View>

        {/* MENU */}
        <View style={styles.menu}>
          {/* COMMON */}
          <MenuItem
            icon="home-outline"
            label="Home"
            active={activeScreen === 'Home'}
            onPress={() => goTo('Home')}
          />

          {/* STUDENT MENU */}
          {role === 'Student' && (
            <>
              <MenuItem
                icon="book-open-page-variant"
                label="Subjects"
                active={activeScreen === 'subjectScreen'}
                onPress={() => goTo('subjectScreen')}
              />

              <MenuItem
                icon="calendar-check-outline"
                label="Attendance"
                active={activeScreen === 'childAttendance'}
                onPress={() => goTo('childAttendance')}
              />

              <MenuItem
                icon="file-chart-outline"
                label="Results"
                active={activeScreen === 'ChildResult'}
                onPress={() => goTo('ChildResult')}
              />

              <MenuItem
                icon="table"
                label="Timetable"
                active={activeScreen === 'timetable'}
                onPress={() => goTo('timetable')}
              />
            </>
          )}

          {/* PARENT MENU */}
          {role === 'Parent' && (
            <>
              <MenuItem
                icon="account-child-outline"
                label="My Children"
                active={activeScreen === 'Children'}
                onPress={() => goTo('Children')}
              />

              <MenuItem
                icon="calendar-check-outline"
                label="Attendance"
                active={activeScreen === 'childAttendance'}
                onPress={() => goTo('childAttendance')}
              />

              <MenuItem
                icon="file-chart-outline"
                label="Results"
                active={activeScreen === 'childResult'}
                onPress={() => goTo('ChildResult')}
              />

              <MenuItem
                icon="bell-outline"
                label="Notifications"
                active={activeScreen === 'Notifications'}
                onPress={() => goTo('Notifications')}
              />
            </>
          )}

          {/* COMMON */}
          <MenuItem
            icon="calendar-outline"
            label="Events"
            active={activeScreen === 'ParentEvent'}
            onPress={() => goTo('ParentEvent')}
          />

          <MenuItem
            icon="account-outline"
            label="Profile"
            active={activeScreen === 'Profile'}
            onPress={() => goTo('Profile')}
          />
          <MenuItem
            icon="brain"
            label="Ai Overview"
            active={activeScreen === 'AIOverviewScreen'}
            onPress={() => goTo('AIOverviewScreen')}
          />
          <MenuItem
            icon="book-open-page-variant-outline"
            label="Rules"
            active={activeScreen === 'ParentsRules'}
            onPress={() => goTo('ParentsRules')}
          />
          <MenuItem
            icon="map-marker-radius"
            label="Track Bus"
            active={activeScreen === 'LiveBusMap'}
            onPress={() => goTo('LiveBusMap')}
          />
        </View>

        {/* LOGOUT */}
        <View style={styles.logout}>
          <TouchableOpacity onPress={() => goTo('Login')}>
            <Text style={{color: 'red', fontWeight: '700'}}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

/* ───────── MENU ITEM ───────── */
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

export default Sidebar;

/* ───────── STYLES ───────── */
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
  },

  profileName: {
    color: '#fff',
    fontWeight: '700',
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
  },

  activeText: {
    color: '#fff',
    fontWeight: '700',
  },

  logout: {
    marginTop: 'auto',
    padding: 10,
  },
});
