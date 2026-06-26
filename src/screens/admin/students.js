import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MenuModal from '../../components/MenuModal';
import firestore from '@react-native-firebase/firestore';
import FilterModal from '../../components/ClassFilterModal';
import Spinner from '../../components/Spinner';

const StudentScreen = ({navigation}) => {
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showMenuOptions, setShowMenuOptions] = useState(false);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [imgError, setImgError] = React.useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const studentsList = [];
        const querySnapshot = await firestore().collection('students').get();
        querySnapshot.forEach(documentSnapshot => {
          studentsList.push({
            id: documentSnapshot.id,
            ...documentSnapshot.data(),
          });
        });
        setStudents(studentsList);
        setFilteredStudents(studentsList);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const handleFilterSelect = filter => {
    setSelectedFilter(filter);
    setShowFilterModal(false);
    if (filter) {
      const filteredList = students.filter(
        student => student.admissionClass === filter,
      );
      setFilteredStudents(filteredList);
    } else {
      setFilteredStudents(students);
    }
  };

  const handleSearch = query => {
    setSearchQuery(query);
    if (query) {
      const filteredList = students.filter(student =>
        student.name.toLowerCase().includes(query.toLowerCase()),
      );
      setFilteredStudents(filteredList);
    } else {
      setFilteredStudents(students);
    }
  };

  const handleDeleteStudent = async studentId => {
    try {
      await firestore().collection('students').doc(studentId).delete();
      setStudents(prev => prev.filter(s => s.id !== studentId));
      setFilteredStudents(prev => prev.filter(s => s.id !== studentId));
      Alert.alert('Success', 'Student deleted');
    } catch (error) {
      Alert.alert('Error', 'Delete failed');
    }
  };

  const confirmDeleteStudent = id => {
    Alert.alert('Delete', 'Are you sure?', [
      {text: 'Cancel'},
      {text: 'Delete', onPress: () => handleDeleteStudent(id)},
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#104E8B" barStyle="light-content" />
      {loading && <Spinner />}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerText}>Students</Text>

        <TouchableOpacity onPress={() => setShowMenuOptions(true)}>
          <MaterialIcons name="more-vert" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <MenuModal
        visible={showMenuOptions}
        onClose={() => setShowMenuOptions(false)}
        onNavigate={() => navigation.navigate('StudentForm')}
        buttonText="Add Student"
      />

      {/* Search + Filter */}
      <View style={styles.searchBox}>
        <MaterialIcons name="search" size={22} color="#777" />
        <TextInput
          placeholder="Search students..."
          placeholderTextColor="#999"
          style={styles.input}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        <TouchableOpacity onPress={() => setShowFilterModal(true)}>
          <MaterialIcons name="filter-list" size={22} color="#0A3D62" />
        </TouchableOpacity>
      </View>

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onSelect={handleFilterSelect}
      />

      {/* Students List */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {filteredStudents.map(student => (
          <View key={student.id} style={styles.card}>
            <Image
              source={
                student.profilePicture && !imgError
                  ? {uri: student.profilePicture}
                  : require('../../../assets/man.png')
              }
              style={styles.avatar}
              onError={() => setImgError(true)}
            />

            <View style={{flex: 1}}>
              <Text style={styles.name}>{student.name}</Text>
              <Text style={styles.class}>Class: {student.admissionClass}</Text>
              <Text style={styles.id}>ID: {student.id}</Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('StudentForm', {
                    studentId: student.id,
                  })
                }>
                <MaterialIcons name="visibility" size={22} color="#0A3D62" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => confirmDeleteStudent(student.id)}>
                <MaterialIcons name="delete" size={22} color="red" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Floating Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('StudentForm')}>
        <MaterialIcons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default StudentScreen;

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

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 12,
    paddingHorizontal: 12,
    elevation: 3,
  },

  input: {
    flex: 1,
    padding: 10,
    fontSize: 15,
  },

  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginBottom: 12,
    padding: 12,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
  },

  avatar: {
    width: 55,
    height: 55,
    borderRadius: 30,
    marginRight: 12,
  },

  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },

  class: {
    fontSize: 13,
    color: '#555',
    marginTop: 2,
  },

  id: {
    fontSize: 11,
    color: '#999',
  },

  actions: {
    justifyContent: 'space-between',
    height: 50,
  },

  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#104E8B',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
});
