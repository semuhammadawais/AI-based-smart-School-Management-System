import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  StatusBar,
  FlatList,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MenuModal from '../../components/MenuModal';
import firestore from '@react-native-firebase/firestore';
import Spinner from '../../components/Spinner';

const TeacherScreen = ({navigation}) => {
  const [showMenuOptions, setShowMenuOptions] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);

      const snapshot = await firestore().collection('Teachers').get();

      const teacherList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setTeachers(teacherList);

      setLoading(false);
    } catch (error) {
      console.log('FETCH ERROR:', error);
      setLoading(false);
    }
  };

  const filteredTeachers =
    searchQuery.trim() === ''
      ? teachers
      : teachers.filter(t =>
          t.name?.toLowerCase().includes(searchQuery.toLowerCase()),
        );

  const renderTeacherCard = ({item}) => {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.card}
        onPress={() =>
          navigation.navigate('TeacherProfile', {teacherId: item.id})
        }>

        {/* Avatar */}
        <View style={styles.avatarWrapper}>
          <Image
            source={{
              uri: item.profilePicture || 'https://i.pravatar.cc/150?img=12',
            }}
            style={styles.image}
          />
        </View>

        {/* Name */}
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>

        {/* Role */}
        <Text style={styles.role}>{item.role || 'Teacher'}</Text>

        {/* SUBJECT + CLASS FIXED */}
        {Array.isArray(item.assignedSubjects) &&
          item.assignedSubjects.map((obj, index) => (
            <View key={index} style={{marginTop: 6, alignItems: 'center'}}>

              {/* Subject */}
              <View style={[styles.chip, styles.subjectChip]}>
                <Text style={styles.chipText}>
                  {obj.subject}
                </Text>
              </View>

              {/* Classes */}
              <View style={styles.rowWrap}>
                {obj.classes?.map((cls, i) => (
                  <View key={i} style={styles.classChip}>
                    <Text style={styles.chipText}>Class {cls}</Text>
                  </View>
                ))}
              </View>

            </View>
          ))}
      </TouchableOpacity>
    );
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

        <Text style={styles.headerText}>Teachers</Text>

        <TouchableOpacity onPress={() => setShowMenuOptions(true)}>
          <MaterialIcons name="more-vert" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <MenuModal
        visible={showMenuOptions}
        onClose={() => setShowMenuOptions(false)}
        onNavigate={() => navigation.navigate('TeacherForm')}
        buttonText="Add a Teacher"
      />

      {/* Search */}
      <View style={styles.searchBox}>
        <MaterialIcons name="search" size={22} color="#888" />
        <TextInput
          placeholder="Search teachers..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchInput}
        />
      </View>

      {/* List */}
      <FlatList
        data={filteredTeachers}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.list}
        renderItem={renderTeacherCard}
      />
    </View>
  );
};

export default TeacherScreen;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f4f6f9'},

  header: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#104E8B',
  },

  headerText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    paddingHorizontal: 12,
    borderRadius: 10,
    elevation: 2,
  },

  searchInput: {
    flex: 1,
    padding: 10,
    fontSize: 15,
    color: '#333',
  },

  list: {
    paddingHorizontal: 10,
    paddingBottom: 20,
  },

  card: {
    flex: 1,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 15,
    alignItems: 'center',
    elevation: 5,
    borderWidth: 1,
    borderColor: '#EEF2F7',
  },

  avatarWrapper: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#EAF1FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  image: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: '#104E8B',
  },

  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },

  role: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },

  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: 5,
  },

  chip: {
    backgroundColor: '#104E8B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 4,
  },

  subjectChip: {
    backgroundColor: '#22A96E',
  },

  classChip: {
    backgroundColor: '#104E8B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    margin: 2,
  },

  chipText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});