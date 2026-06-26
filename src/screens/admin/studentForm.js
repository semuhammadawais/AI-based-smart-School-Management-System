import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
} from 'react-native';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Spinner from '../../components/Spinner';

const StudentForm = ({route, navigation}) => {
  const {studentId} = route.params || {};

  // STATES
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [name, setName] = useState('');
  const [dateOfAdmission, setDateOfAdmission] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [caste, setCaste] = useState('');
  const [occupation, setOccupation] = useState('');
  const [residence, setResidence] = useState('');
  const [admissionClass, setAdmissionClass] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  // AUTO REG NO
  const generateRegNo = () => {
    return 'ST-' + Date.now().toString().slice(-6);
  };

  // LOAD DATA (EDIT MODE)
  useEffect(() => {
    if (studentId) {
      setLoading(true);

      firestore()
        .collection('students')
        .doc(studentId)
        .get()
        .then(doc => {
          const data = doc.data();

          setRegistrationNumber(data.registrationNumber);
          setName(data.name);
          setDateOfAdmission(data.dateOfAdmission);
          setDateOfBirth(data.dateOfBirth);
          setGender(data.gender);
          setAge(data.age);
          setFatherName(data.fatherName);
          setCaste(data.caste);
          setOccupation(data.occupation);
          setResidence(data.residence);
          setAdmissionClass(data.admissionClass);
          setEmail(data.email);
          setRemarks(data.remarks);

          setLoading(false);
        })
        .catch(err => {
          console.log(err);
          setLoading(false);
        });
    }
  }, [studentId]);

  // SAVE FUNCTION
  const handleSave = async () => {
    try {
      if (!name || !email || (!studentId && !password)) {
        Alert.alert('Error', 'Please fill required fields');
        return;
      }

      setLoading(true);

      const regNo = registrationNumber || generateRegNo();

      // CREATE STUDENT
      if (!studentId) {
        const userCredential = await auth().createUserWithEmailAndPassword(
          email,
          password,
        );

        const uid = userCredential.user.uid;

        await firestore().collection('students').doc(regNo).set({
          uid,
          registrationNumber: regNo,
          name,
          dateOfAdmission,
          dateOfBirth,
          gender,
          age,
          fatherName,
          caste,
          occupation,
          residence,
          admissionClass,
          email,
          remarks,
          role: 'student',
          createdAt: firestore.FieldValue.serverTimestamp(),
        });

        Alert.alert('Success', 'Student Created Successfully');
      }

      // UPDATE STUDENT
      else {
        await firestore().collection('students').doc(studentId).update({
          name,
          dateOfAdmission,
          dateOfBirth,
          gender,
          age,
          fatherName,
          caste,
          occupation,
          residence,
          admissionClass,
          email,
          remarks,
        });

        Alert.alert('Success', 'Student Updated Successfully');
      }

      navigation.goBack();
    } catch (error) {
      console.log(error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#104E8B" barStyle="light-content" />

      {loading && <Spinner />}

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerText}>Student Form</Text>
      </View>

      <ScrollView>
        {/* REG NO */}
        <TextInput
          style={styles.input}
          placeholderTextColor="#9CA3AF"
          placeholder="Registration Number (Auto)"
          value={registrationNumber}
          onChangeText={setRegistrationNumber}
        />

        {/* NAME */}
        <TextInput
          style={styles.input}
          placeholderTextColor="#9CA3AF"
          placeholder="Student Name"
          value={name}
          onChangeText={setName}
        />

        {/* EMAIL */}
        <TextInput
          style={styles.input}
          placeholderTextColor="#9CA3AF"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
        />

        {/* PASSWORD (ONLY CREATE) */}
        {!studentId && (
          <TextInput
            style={styles.input}
            placeholderTextColor="#9CA3AF"
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        )}

        {/* AGE + CLASS */}
        <View style={styles.row}>
          <TextInput
            style={styles.half}
            placeholderTextColor="#9CA3AF"
            placeholder="Age"
            value={age}
            onChangeText={setAge}
          />

          <TextInput
            style={styles.half}
            placeholderTextColor="#9CA3AF"
            placeholder="Class"
            value={admissionClass}
            onChangeText={setAdmissionClass}
          />
        </View>

        {/* FATHER */}
        <TextInput
          style={styles.input}
          placeholderTextColor="#9CA3AF"
          placeholder="Father Name"
          value={fatherName}
          onChangeText={setFatherName}
        />

        {/* RESIDENCE */}
        <TextInput
          style={styles.input}
          placeholderTextColor="#9CA3AF"
          placeholder="Residence"
          value={residence}
          onChangeText={setResidence}
        />

        {/* DATE OF ADMISSION */}
        <TextInput
          style={styles.input}
          placeholderTextColor="#9CA3AF"
          placeholder="Date of Admission (YYYY-MM-DD)"
          value={dateOfAdmission}
          onChangeText={setDateOfAdmission}
        />

        {/* DATE OF BIRTH */}
        <TextInput
          style={styles.input}
          placeholderTextColor="#9CA3AF"
          placeholder="Date of Birth (YYYY-MM-DD)"
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
        />

        {/* GENDER */}
        <TextInput
          style={styles.input}
          placeholderTextColor="#9CA3AF"
          placeholder="Gender (Male/Female)"
          value={gender}
          onChangeText={setGender}
        />

        {/* CASTE */}
        <TextInput
          style={styles.input}
          placeholderTextColor="#9CA3AF"
          placeholder="Caste"
          value={caste}
          onChangeText={setCaste}
        />

        {/* OCCUPATION */}
        <TextInput
          style={styles.input}
          placeholderTextColor="#9CA3AF"
          placeholder="Father Occupation"
          value={occupation}
          onChangeText={setOccupation}
        />

        {/* REMARKS */}
        <TextInput
          style={styles.input}
          placeholderTextColor="#9CA3AF"
          placeholder="Remarks"
          value={remarks}
          onChangeText={setRemarks}
          multiline
        />

        {/* BUTTON */}
        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>
            {studentId ? 'Update Student' : 'Create Student'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default StudentForm;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},

  header: {
    backgroundColor: '#104E8B',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerText: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 10,
    fontWeight: 'bold',
  },

  input: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 8,
    marginBottom: 10,
    padding: 12,
    borderRadius: 10,
    elevation: 2,
    color: 'black',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
  },

  half: {
    width: '48%',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
    elevation: 2,
    marginBottom: 10,
    color: 'black',
  },

  button: {
    backgroundColor: '#104E8B',
    margin: 20,
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
