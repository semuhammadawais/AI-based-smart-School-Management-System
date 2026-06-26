import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import BottomNav from '../../components/BottomNav';

const ProfileScreen = () => {
  const name = 'Admin User';
  const initials = 'AU';

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#104E8B" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>

        <TouchableOpacity style={styles.editBtn}>
          <MaterialIcons name="edit" size={18} color="white" />
        </TouchableOpacity>

        <View style={styles.avatarContainer}>
          {/* If image not available, show initials */}
          {/* <Image source={require('../../../assets/profile.jpg')} style={styles.avatar} /> */}
          <Text style={styles.initials}>{initials}</Text>
        </View>

        <Text style={styles.name}>{name}</Text>
        <Text style={styles.role}>Administrator</Text>
      </View>

      {/* Info Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Personal Information</Text>

        <View style={styles.infoRow}>
          <MaterialIcons name="email" size={20} color="#104E8B" />
          <Text style={styles.infoText}>admin@gmail.com</Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialIcons name="phone" size={20} color="#104E8B" />
          <Text style={styles.infoText}>0300-1234567</Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialIcons name="person" size={20} color="#104E8B" />
          <Text style={styles.infoText}>Male</Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialIcons name="cake" size={20} color="#104E8B" />
          <Text style={styles.infoText}>01 Jan 1995</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.card}>
        <TouchableOpacity style={styles.actionRow}>
          <MaterialIcons name="lock" size={22} color="#104E8B" />
          <Text style={styles.actionText}>Change Password</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionRow}>
          <MaterialIcons name="logout" size={22} color="red" />
          <Text style={[styles.actionText, {color: 'red'}]}>Logout</Text>
        </TouchableOpacity>
      </View>

      <BottomNav />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4F7',
  },

  /* Header */
  header: {
    backgroundColor: '#104E8B',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 30,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  editBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
  },

  avatarContainer: {
    marginTop: 20,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#BFDBF7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#104E8B',
  },

  name: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  role: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },

  /* Cards */
  card: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    padding: 16,
    elevation: 3,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
    marginBottom: 15,
    textTransform: 'uppercase',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  actionText: {
    fontSize: 15,
    color: '#333',
  },
});

export default ProfileScreen;