import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Spinner from '../../components/Spinner';

const ParentsForm = ({navigation, route}) => {
  const parentId = route?.params?.parentId || null;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password] = useState('123456'); // default password
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ─── Load Students ─── */
  useEffect(() => {
    const fetchStudents = async () => {
      const list = [];
      const snapshot = await firestore().collection('students').get();

      snapshot.forEach(doc => {
        list.push({id: doc.id, ...doc.data()});
      });

      setStudents(list);
    };

    fetchStudents();
  }, []);

  /* ─── Load Parent if editing ─── */
  useEffect(() => {
    if (parentId) {
      const loadParent = async () => {
        const doc = await firestore().collection('users').doc(parentId).get();

        if (doc.exists) {
          const data = doc.data();
          setName(data.name);
          setEmail(data.email);
        }
      };

      loadParent();
    }
  }, [parentId]);

  /* ─── CREATE PARENT ─── */
  const handleSave = async () => {
    if (!name || !email || !selectedStudent) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      setLoading(true);

      // 1. Create Auth account
      const userCredential = await auth().createUserWithEmailAndPassword(
        email,
        password,
      );

      const uid = userCredential.user.uid;

      // 2. Save parent in users
      await firestore().collection('users').doc(uid).set({
        name,
        email,
        role: 'parent',
      });

      // 3. Create mapping
      await firestore().collection('ParentStudentMapping').add({
        parentId: uid,
        studentId: selectedStudent,
      });

      setLoading(false);

      Alert.alert('Success', 'Parent created successfully');

      navigation.goBack();
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {loading && <Spinner />}

      <Text style={styles.title}>Add Parent</Text>

      {/* Name */}
      <TextInput
        placeholder="Parent Name"
        placeholderTextColor="#9CA3AF"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />

      {/* Email */}
      <TextInput
        placeholder="Parent Email"
        placeholderTextColor="#9CA3AF"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />

      {/* Password (fixed) */}
      <Text style={styles.note}>Default Password: 123456</Text>

      {/* Student Selection */}
      <Text style={styles.label}>Select Student</Text>

      {students.map(student => (
        <TouchableOpacity
          key={student.id}
          style={[
            styles.studentItem,
            selectedStudent === student.id && {
              backgroundColor: '#0A3D62',
            },
          ]}
          onPress={() => setSelectedStudent(student.id)}>
          <Text
            style={{
              color: selectedStudent === student.id ? 'white' : '#000',
            }}>
            {student.name} ({student.admissionClass})
          </Text>
        </TouchableOpacity>
      ))}

      {/* Button */}
      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Create Parent</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ParentsForm;

/* ─── STYLES ─── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#EEF2F7',
  },

  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#104E8B',
  },

  input: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    color: '#000',
  },

  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#312d2d',
  },

  note: {
    color: 'gray',
    marginBottom: 10,
  },

  studentItem: {
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 8,
  },

  button: {
    backgroundColor: '#104E8B',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
  },

  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
