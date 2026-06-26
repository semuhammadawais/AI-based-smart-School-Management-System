import React, {useEffect, useState, useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';

import firestore from '@react-native-firebase/firestore';
import {AuthContext} from '../../context/authContext';

const Profile = () => {
  const {user} = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [parent, setParent] = useState(null);
  const [children, setChildren] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const uid = user.uid;

        // 1️⃣ Parent Info
        const parentSnap = await firestore().collection('users').doc(uid).get();

        setParent(parentSnap.data());

        // 2️⃣ Get Mapping
        const mappingSnap = await firestore()
          .collection('ParentStudentMapping')
          .where('parentId', '==', uid)
          .get();

        const studentIds = mappingSnap.docs.map(doc => doc.data().studentId);

        // 3️⃣ Fetch Students
        const students = await Promise.all(
          studentIds.map(async id => {
            const stu = await firestore().collection('students').doc(id).get();

            return {id: stu.id, ...stu.data()};
          }),
        );

        setChildren(students);
        setLoading(false);
      } catch (error) {
        console.log('Profile Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#104E8B" />
      </View>
    );
  }

  const initials = (parent?.name || 'P')
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <ScrollView style={styles.container}>
      {/* ─── PARENT CARD ─── */}
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <Text style={styles.name}>{parent?.name}</Text>
        <Text style={styles.email}>{parent?.email}</Text>

        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{parent?.role}</Text>
        </View>
      </View>

      {/* ─── CHILDREN ─── */}
      {/* ─── CHILDREN ─── */}
      <Text style={styles.sectionTitle}>Children</Text>

      {children.length > 0 ? (
        children.map(child => (
          <View key={child.id} style={styles.childCard}>
            <Text style={styles.childName}>{child.name || 'No Name'}</Text>

            <Text style={styles.childInfo}>
              Class: {child.admissionClass || 'N/A'}
            </Text>

            <Text style={styles.childInfo}>
              Roll No: {child.registrationNumber || child.rollNo || 'N/A'}
            </Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No child assigned yet</Text>
        </View>
      )}
    </ScrollView>
  );
};

export default Profile;

/* ───────── STYLES ───────── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4F7',
    padding: 16,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },

  emptyText: {
    color: '#777',
    fontSize: 13,
  },

  card: {
    backgroundColor: '#104E8B',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },

  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#BFDBF7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#104E8B',
  },

  name: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },

  email: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 4,
  },

  roleBadge: {
    marginTop: 10,
    backgroundColor: '#22A96E',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },

  roleText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    color: '#333',
  },

  childCard: {
    backgroundColor: 'white',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },

  childName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#104E8B',
  },

  childInfo: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});
