import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  TextInput,
  Alert,
} from 'react-native';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FilterModal from '../../components/ClassFilterModal';
import firestore from '@react-native-firebase/firestore';
import {launchImageLibrary} from 'react-native-image-picker';
import storage from '@react-native-firebase/storage';

const UploadSyllabusScreen = ({navigation}) => {
  const [subjects, setSubjects] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [uploadStatus, setUploadStatus] = useState({});
  const [newSubject, setNewSubject] = useState('');

  useEffect(() => {
    fetchSubjects();
  }, [selectedClass]);

  /* ───────── FETCH SUBJECTS ───────── */
  const fetchSubjects = async () => {
    try {
      if (!selectedClass) return;

      const doc = await firestore()
        .collection('Classes')
        .doc(selectedClass)
        .get();

      if (doc.exists) {
        setSubjects(doc.data().subjects || []);
      } else {
        setSubjects([]);
      }
    } catch (e) {
      console.log(e);
    }
  };

  /* ───────── ADD SUBJECT ───────── */
  const addSubject = async () => {
    if (!newSubject.trim()) return;

    try {
      const updated = [...subjects, newSubject.trim()];

      await firestore()
        .collection('Classes')
        .doc(selectedClass)
        .set({subjects: updated}, {merge: true});

      setNewSubject('');
      setSubjects(updated);
    } catch (e) {
      console.log(e);
    }
  };

  /* ───────── DELETE SUBJECT ───────── */
  const deleteSubject = subject => {
    Alert.alert('Delete', `Remove ${subject}?`, [
      {text: 'Cancel'},
      {
        text: 'Yes',
        onPress: async () => {
          const updated = subjects.filter(s => s !== subject);

          await firestore()
            .collection('Classes')
            .doc(selectedClass)
            .set({subjects: updated}, {merge: true});

          setSubjects(updated);
        },
      },
    ]);
  };

  /* ───────── UPLOAD SYLLABUS ───────── */
  const handleUpload = subject => {
    launchImageLibrary({mediaType: 'photo'}, async res => {
      if (res.didCancel || res.errorMessage) return;

      const uri = res.assets[0].uri;
      const filename = uri.substring(uri.lastIndexOf('/') + 1);

      setUploadStatus(prev => ({...prev, [subject]: 'uploading'}));

      const ref = storage().ref(`${selectedClass}/${subject}/${filename}`);

      await ref.putFile(uri);
      const url = await ref.getDownloadURL();

      await firestore()
        .collection('Syllabus')
        .doc(selectedClass)
        .set({[subject]: url}, {merge: true});

      setUploadStatus(prev => ({...prev, [subject]: 'done'}));
    });
  };

  /* ───────── UI ───────── */
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#104E8B" barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerText}>Manage Subjects</Text>

        <TouchableOpacity onPress={() => setShowFilterModal(true)}>
          <MaterialIcons name="filter-list" size={26} color="white" />
        </TouchableOpacity>
      </View>

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onSelect={c => {
          setSelectedClass(c);
          setShowFilterModal(false);
        }}
      />

      {/* EMPTY */}
      {!selectedClass ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Select Class</Text>
        </View>
      ) : (
        <>
          {/* ADD SUBJECT */}
          <View style={styles.addBox}>
            <TextInput
              placeholder="Add new subject"
              placeholderTextColor="#888"
              value={newSubject}
              onChangeText={setNewSubject}
              style={styles.input}
            />

            <TouchableOpacity style={styles.addBtn} onPress={addSubject}>
              <Text style={styles.addText}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* SUBJECT LIST */}
          <ScrollView style={{padding: 16}}>
            {subjects.map(subject => {
              const status = uploadStatus[subject];

              return (
                <View key={subject} style={styles.card}>
                  <Text style={styles.subject}>{subject}</Text>

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={styles.uploadBtn}
                      onPress={() => handleUpload(subject)}>
                      {status === 'uploading' ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.btnText}>
                          {status === 'done' ? 'Uploaded' : 'Upload'}
                        </Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => deleteSubject(subject)}>
                      <MaterialIcons name="delete" color="#fff" size={18} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </>
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F4F6F8'},

  header: {
    height: 80,
    backgroundColor: '#104E8B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  headerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyTitle: {
    fontSize: 20,
    color: '#104E8B',
  },

  addBox: {
    flexDirection: 'row',
    padding: 16,
  },

  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: 'black',
  },

  addBtn: {
    backgroundColor: '#104E8B',
    marginLeft: 10,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
  },

  addText: {
    color: '#fff',
    fontWeight: 'bold',
  },

  card: {
    backgroundColor: '#131735',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  subject: {
    fontSize: 16,
    fontWeight: '600',
  },

  actions: {
    flexDirection: 'row',
  },

  uploadBtn: {
    backgroundColor: '#104E8B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 6,
  },

  deleteBtn: {
    backgroundColor: '#e74c3c',
    padding: 6,
    borderRadius: 6,
  },

  btnText: {
    color: '#fff',
    fontSize: 12,
  },
});
export default UploadSyllabusScreen;
