import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  StatusBar,
} from 'react-native';

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const AddDriverScreen = ({navigation}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [busNumber, setBusNumber] = useState('');
  const [route, setRoute] = useState('');
  const [loading, setLoading] = useState(false);

  const createDriver = async () => {
    if (!name || !email || !password || !phone || !busNumber || !route) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      setLoading(true);

      const userCredential = await auth().createUserWithEmailAndPassword(
        email,
        password,
      );

      const uid = userCredential.user.uid;

      await firestore().collection('Drivers').doc(uid).set({
        name,
        email,
        phone,
        busNumber,
        route,
        role: 'driver',
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      Alert.alert('Success', 'Driver created successfully');

      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setBusNumber('');
      setRoute('');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#104E8B" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerText}>Add Driver</Text>

        <View style={{width: 24}} />
      </View>

      {/* Form */}
      <ScrollView
        contentContainerStyle={styles.form}
        showsVerticalScrollIndicator={false}>
        <TextInput
          style={styles.input}
          placeholderTextColor="#9CA3AF"
          placeholder="Driver Name"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholderTextColor="#9CA3AF"
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholderTextColor="#9CA3AF"
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TextInput
          style={styles.input}
          placeholderTextColor="#9CA3AF"
          placeholder="Phone"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />

        <TextInput
          style={styles.input}
          placeholderTextColor="#9CA3AF"
          placeholder="Bus Number"
          value={busNumber}
          onChangeText={setBusNumber}
        />

        <TextInput
          style={styles.input}
          placeholderTextColor="#9CA3AF"
          placeholder="Route"
          value={route}
          onChangeText={setRoute}
        />

        <TouchableOpacity
          style={[styles.button, loading && {opacity: 0.7}]}
          onPress={createDriver}
          disabled={loading}>
          <Text style={styles.buttonText}>
            {loading ? 'Creating...' : 'Create Driver'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2F7',
  },

  header: {
    height: 80,
    backgroundColor: '#104E8B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 30,
    elevation: 5,
  },

  headerText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },

  form: {
    padding: 20,
    paddingBottom: 40,
  },

  input: {
    backgroundColor: '#fff',
    marginBottom: 15,
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
    elevation: 3,
    color: '#000',
  },

  button: {
    backgroundColor: '#104E8B',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default AddDriverScreen;
