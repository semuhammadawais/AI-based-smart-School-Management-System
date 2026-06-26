import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, Image, ScrollView} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import Spinner from '../../components/Spinner';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const Row = ({icon, label, value}) => (
  <View style={styles.row}>
    <MaterialCommunityIcons name={icon} size={20} color="#1A56DB" />
    <Text style={styles.label}>{label}:</Text>
    <Text style={styles.value}>{value || 'N/A'}</Text>
  </View>
);

const TeacherProfile = ({route}) => {
  const {teacherId} = route.params;

  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacher();
  }, []);

  const fetchTeacher = async () => {
    try {
      const doc = await firestore()
        .collection('Teachers')
        .doc(teacherId)
        .get();

      setTeacher(doc.data());
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <ScrollView style={styles.container}>

      {/* HEADER */}
      <View style={styles.headerCard}>
        <Image
          source={{
            uri: teacher?.profilePicture || 'https://i.pravatar.cc/150?img=12',
          }}
          style={styles.image}
        />

        <Text style={styles.name}>{teacher?.name || 'N/A'}</Text>
        <Text style={styles.role}>{teacher?.role || 'Teacher'}</Text>
      </View>

      {/* INFO */}
      <View style={styles.card}>
        <Row
          icon="badge-account-horizontal"
          label="Reg No"
          value={teacher?.registrationNumber}
        />

        <Row icon="email-outline" label="Email" value={teacher?.email} />

        <Row
          icon="calendar"
          label="Date of Birth"
          value={teacher?.dateofBirth}
        />

        <Row icon="gender-male-female" label="Gender" value={teacher?.gender} />

        <Row icon="map-marker" label="Residence" value={teacher?.residence} />

        {/* ✅ FIXED ASSIGNED DATA */}

        <View style={styles.sectionBox}>
          <Text style={styles.sectionTitle}>Assigned Subjects</Text>

          {Array.isArray(teacher?.assignedSubjects) &&
          teacher.assignedSubjects.length > 0 ? (
            teacher.assignedSubjects.map((item, index) => (
              <View key={index} style={styles.subjectCard}>

                {/* Subject */}
                <Text style={styles.subjectText}>
                  📘 {item.subject}
                </Text>

                {/* Classes */}
                <Text style={styles.classText}>
                  🏫 Classes: {item.classes?.join(', ') || 'N/A'}
                </Text>

              </View>
            ))
          ) : (
            <Text style={styles.na}>N/A</Text>
          )}
        </View>

      </View>
    </ScrollView>
  );
};

export default TeacherProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F9',
  },

  headerCard: {
    alignItems: 'center',
    backgroundColor: '#104E8B',
    padding: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  image: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
  },

  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },

  role: {
    fontSize: 14,
    color: '#E5E7EB',
    marginTop: 4,
  },

  card: {
    margin: 15,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    elevation: 3,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  label: {
    marginLeft: 10,
    fontWeight: '600',
    width: 120,
    color: '#444',
  },

  value: {
    flex: 1,
    color: '#222',
  },

  sectionBox: {
    marginTop: 10,
    paddingTop: 10,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    color: '#104E8B',
  },

  subjectCard: {
    backgroundColor: '#F1F5FF',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },

  subjectText: {
    fontWeight: '700',
    color: '#1A1A1A',
  },

  classText: {
    marginTop: 4,
    color: '#555',
  },

  na: {
    color: '#888',
  },
});