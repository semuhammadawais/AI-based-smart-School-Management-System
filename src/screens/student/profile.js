import React, {useContext, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import BottomNav from '../../components/BottomNavStudent';
import {AuthContext} from '../../context/authContext';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

/* ───────── SECTION HEADER ───────── */
const SectionHeader = ({title}) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

/* ───────── INFO ROW ───────── */
const InfoRow = ({icon, label, value, last}) => (
  <View style={[styles.infoRow, last && styles.infoRowLast]}>
    <View style={styles.iconWrap}>
      <MaterialIcons name={icon} size={17} color="#104E8B" />
    </View>
    <View style={styles.rowContent}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.value}>{value || '—'}</Text>
    </View>
  </View>
);

/* ───────── MAIN SCREEN ───────── */
const ProfileScreen = ({navigation}) => {
  const {user} = useContext(AuthContext);

  const [student, setStudent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const uid = auth().currentUser.uid;

        const snapshot = await firestore()
          .collection('students')
          .where('uid', '==', uid)
          .get();

        if (!snapshot.empty) {
          setStudent(snapshot.docs[0].data());
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchStudent();
  }, []);

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await auth().currentUser.updatePassword(newPassword);
      Alert.alert('Success', 'Password updated');
      await auth().signOut();
      navigation.navigate('RoleScreen');
    } catch (error) {
      Alert.alert('Error', error.message);
    }

    setLoading(false);
    setModalVisible(false);
  };

  if (!student) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#104E8B" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </View>
    );
  }

  const initials = (student?.name || 'S')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A3A6B" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />

        <Text style={styles.headerTitle}>My Profile</Text>

        <View style={styles.avatarRing}>
          <View style={styles.avatarInner}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>

        <Text style={styles.nameText}>{student?.name}</Text>

        <View style={styles.badgeRow}>
          <View style={styles.roleBadge}>
            <MaterialIcons name="school" size={11} color="#104E8B" />
            <Text style={styles.roleBadgeText}>Student</Text>
          </View>

          <View style={styles.regBadge}>
            <Text style={styles.regBadgeText}>
              #{student?.registrationNumber}
            </Text>
          </View>
        </View>

        {/* STATS */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{student?.admissionClass}</Text>
            <Text style={styles.statLabel}>Class</Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{student?.age}</Text>
            <Text style={styles.statLabel}>Age</Text>
          </View>
        </View>
      </View>

      {/* BODY */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <SectionHeader title="Personal Information" />
        <View style={styles.card}>
          <InfoRow icon="email" label="Email" value={student?.email} />
          <InfoRow icon="person" label="Gender" value={student?.gender} />
          <InfoRow
            icon="cake"
            label="Date of Birth"
            value={student?.dateOfBirth}
          />
          <InfoRow
            icon="family-restroom"
            label="Father Name"
            value={student?.fatherName}
          />
          <InfoRow icon="work" label="Occupation" value={student?.occupation} />
          <InfoRow
            icon="location-on"
            label="Address"
            value={student?.residence}
            last
          />
        </View>

        <SectionHeader title="Academic Info" />
        <View style={styles.card}>
          <InfoRow icon="class" label="Class" value={student?.admissionClass} />
          <InfoRow
            icon="event"
            label="Admission Date"
            value={student?.dateOfAdmission}
          />
          <InfoRow
            icon="badge"
            label="Registration No"
            value={student?.registrationNumber}
          />
          <InfoRow icon="notes" label="Remarks" value={student?.remarks} last />
        </View>

        <SectionHeader title="Security" />
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => setModalVisible(true)}>
          <View style={styles.actionIconWrap}>
            <MaterialIcons name="lock" size={20} color="#104E8B" />
          </View>
          <View style={{flex: 1}}>
            <Text style={styles.actionTitle}>Change Password</Text>
            <Text style={styles.actionSub}>Update your password</Text>
          </View>
          <MaterialIcons name="chevron-right" size={22} color="#ccc" />
        </TouchableOpacity>
      </ScrollView>

      <BottomNav />

      {/* MODAL */}
      <Modal transparent visible={modalVisible} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Change Password</Text>

            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="New Password"
                secureTextEntry={!showPassword}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <MaterialIcons
                  name={showPassword ? 'visibility-off' : 'visibility'}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}>
                <Text>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleChangePassword}>
                <Text style={{color: 'white'}}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F0F3F8'},

  /* LOADING */
  loadingContainer: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  loadingText: {marginTop: 10, color: '#666', fontSize: 14},

  /* HEADER */
  header: {
    backgroundColor: '#104E8B',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 28,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },

  decorCircle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.05)',
    top: -60,
    right: -50,
  },

  decorCircle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -30,
    left: -30,
  },

  headerTitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 16,
  },

  avatarRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  avatarInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    color: '#104E8B',
    fontSize: 24,
    fontWeight: '800',
  },

  nameText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },

  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },

  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  roleBadgeText: {
    color: '#104E8B',
    fontSize: 11,
    fontWeight: '700',
  },

  regBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },

  regBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 30,
    gap: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },

  statItem: {alignItems: 'center'},

  statNumber: {
    color: 'white',
    fontSize: 20,
    fontWeight: '800',
  },

  statLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
    marginTop: 2,
  },

  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  /* SCROLL */
  scrollContent: {
    padding: 16,
    paddingBottom: 90,
  },

  /* SECTION HEADER */
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#104E8B',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 4,
  },

  /* CARD */
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#104E8B',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },

  /* INFO ROW */
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 13,
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F8',
  },

  infoRowLast: {borderBottomWidth: 0},

  iconWrap: {
    width: 32,
    alignItems: 'center',
    paddingTop: 2,
  },

  rowContent: {flex: 1},

  rowLabel: {
    fontSize: 11,
    color: '#aaa',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  value: {
    fontSize: 14,
    color: '#1a1a2e',
    marginTop: 3,
    fontWeight: '500',
  },

  /* ACTION CARD */
  actionCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 16,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#104E8B',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
    marginTop: 10,
  },

  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EBF2FB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  actionTitle: {
    color: '#1a1a2e',
    fontWeight: '600',
    fontSize: 14,
  },

  actionSub: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 1,
  },

  /* MODAL */
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  modalCard: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 20,
  },

  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e8edf2',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
    backgroundColor: '#FAFBFD',
  },

  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: '#1a1a2e',
  },

  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },

  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e8edf2',
    alignItems: 'center',
  },

  saveBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#104E8B',
    alignItems: 'center',
  },
});
export default ProfileScreen;
