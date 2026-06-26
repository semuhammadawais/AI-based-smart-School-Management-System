import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

const LoginScreen = ({route, navigation}) => {
  const {role} = route.params;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [regNo, setRegNo] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setMessage('');

    try {
      if (role === 'student') {
        await handleStudentLogin();
      } else {
        await handleAuthLogin();
      }
    } catch (error) {
      setMessage(error.message);
    }

    setLoading(false);
  };

  const handleStudentLogin = async () => {
    try {
      const studentDoc = await firestore()
        .collection('students')
        .doc(regNo)
        .get();

      if (studentDoc.exists) {
        const studentData = studentDoc.data();

        const Email = studentData.email;

        await auth().signInWithEmailAndPassword(Email, password);

        navigation.replace('RootStudentNavigation');
      } else {
        setMessage('No student record found for this registration number.');
      }
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleAuthLogin = async () => {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(
        email,
        password,
      );

      const user = userCredential.user;

      /* ───────── TEACHER ───────── */
      if (role === 'teacher') {
        const teacherDoc = await firestore()
          .collection('Teachers')
          .doc(user.uid)
          .get();

        if (teacherDoc.exists) {
          navigation.replace('RootTeacherNavigation');
        } else {
          setMessage('No teacher record found for this user.');
        }
      } else if (role === 'admin') {

      /* ───────── ADMIN ───────── */
        const adminDoc = await firestore()
          .collection('admin')
          .doc(user.uid)
          .get();

        if (adminDoc.exists) {
          navigation.replace('RootClientTabs');
        } else {
          setMessage('No admin record found.');
        }
      } else if (role === 'parent') {

      /* ───────── PARENT ───────── */
        const parentDoc = await firestore()
          .collection('users')
          .doc(user.uid)
          .get();

        if (parentDoc.exists) {
          const data = parentDoc.data();

          if (data.role === 'parent') {
            navigation.replace('RootParentsNavigation');
          } else {
            setMessage('This account is not a parent.');
          }
        } else {
          setMessage('No parent record found.');
        }
      } else if (role === 'driver') {

      /* ───────── DRIVER ───────── */
        const driverDoc = await firestore()
          .collection('Drivers')
          .doc(user.uid)
          .get();

        if (driverDoc.exists) {
          navigation.replace('RootDriverNavigation');
        } else {
          setMessage('No driver record found.');
        }
      }
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../../assets/logo.png')} style={styles.logo} />

      <Text style={styles.title}>Login</Text>

      {role === 'student' ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Reg No"
            placeholderTextColor="#999"
            autoCapitalize="none"
            value={regNo}
            onChangeText={setRegNo}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </>
      )}

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      {message ? (
        <Text style={{marginTop: 10, color: 'red'}}>{message}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    padding: 20,
    marginTop: 40,
  },

  logo: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },

  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#104E8B',
  },

  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    marginBottom: 20,

    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },

  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#104E8B',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,

    shadowColor: '#104E8B',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 5,

    marginBottom: 10,
  },

  buttonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default LoginScreen;
