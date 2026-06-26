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
  Modal,
  FlatList,
} from 'react-native';

import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import Spinner from '../../components/Spinner';

const GENDERS = ['Male', 'Female'];

const TeacherForm = ({navigation}) => {
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [name, setName] = useState('');
  const [dateofBirth, setDateofBirth] = useState('');
  const [gender, setGender] = useState('');
  const [residence, setResidence] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Classes from Firestore
  const [allClasses, setAllClasses] = useState([]);

  // Assignments: [{classId, className, subjects: ['Math','English']}]
  const [assignments, setAssignments] = useState([]);

  // Modal states
  const [classModalVisible, setClassModalVisible] = useState(false);
  const [subjectModalVisible, setSubjectModalVisible] = useState(false);
  const [genderModalVisible, setGenderModalVisible] = useState(false);

  // Which assignment entry is being edited
  const [editingIndex, setEditingIndex] = useState(null);

  // Temp subject selections while subject modal is open
  const [tempSubjects, setTempSubjects] = useState([]);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    const snap = await firestore().collection('Classes').get();
    setAllClasses(snap.docs.map(d => ({id: d.id, ...d.data()})));
  };

  // ── assignment helpers ──────────────────────────────────────────────────

  // Add a new blank assignment row
  const addAssignment = () => {
    setAssignments(prev => [
      ...prev,
      {classId: '', className: '', subjects: []},
    ]);
  };

  const removeAssignment = index => {
    setAssignments(prev => prev.filter((_, i) => i !== index));
  };

  // Open class picker for a specific assignment row
  const openClassPicker = index => {
    setEditingIndex(index);
    setClassModalVisible(true);
  };

  // When a class is selected from modal
  const onSelectClass = cls => {
    setAssignments(prev =>
      prev.map((a, i) =>
        i === editingIndex
          ? {classId: cls.id, className: cls.name || cls.id, subjects: []}
          : a,
      ),
    );
    setClassModalVisible(false);
  };

  // Open subject picker for a specific assignment row
  const openSubjectPicker = index => {
    setEditingIndex(index);
    setTempSubjects([...assignments[index].subjects]);
    setSubjectModalVisible(true);
  };

  // Toggle a subject in temp selection
  const toggleSubject = subject => {
    setTempSubjects(prev =>
      prev.includes(subject)
        ? prev.filter(s => s !== subject)
        : [...prev, subject],
    );
  };

  // Confirm subject selection
  const confirmSubjects = () => {
    setAssignments(prev =>
      prev.map((a, i) =>
        i === editingIndex ? {...a, subjects: tempSubjects} : a,
      ),
    );
    setSubjectModalVisible(false);
  };

  // Get subjects for a class from allClasses
  const getSubjectsForClass = classId => {
    const cls = allClasses.find(c => c.id === classId);
    return Array.isArray(cls?.subjects) ? cls.subjects : [];
  };

  // ── save ───────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (
      !registrationNumber ||
      !name ||
      !dateofBirth ||
      !gender ||
      !residence ||
      !email ||
      !password
    ) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (assignments.length === 0) {
      Alert.alert('Error', 'Please add at least one class assignment');
      return;
    }

    for (const a of assignments) {
      if (!a.classId) {
        Alert.alert('Error', 'Please select a class for all assignments');
        return;
      }
      if (a.subjects.length === 0) {
        Alert.alert(
          'Error',
          `Please select at least one subject for ${a.className}`,
        );
        return;
      }
    }

    try {
      setLoading(true);

      const userCredential = await auth().createUserWithEmailAndPassword(
        email.trim(),
        password,
      );
      const uid = userCredential.user.uid;

      // Build assignedSubjects in the same structure as before:
      // [{subject: 'Math', classes: ['1']}, {subject: 'English', classes: ['1','2']}]
      const subjectMap = {};
      for (const a of assignments) {
        const classNum = a.classId.match(/\d+/)?.[0] || a.classId;
        for (const sub of a.subjects) {
          if (!subjectMap[sub]) subjectMap[sub] = [];
          if (!subjectMap[sub].includes(classNum)) {
            subjectMap[sub].push(classNum);
          }
        }
      }
      const assignedSubjects = Object.entries(subjectMap).map(
        ([subject, classes]) => ({
          subject,
          classes,
        }),
      );

      await firestore().collection('Teachers').doc(uid).set({
        uid,
        registrationNumber: registrationNumber.trim(),
        name: name.trim(),
        dateofBirth: dateofBirth.trim(),
        gender,
        residence: residence.trim(),
        assignedSubjects,
        email: email.trim(),
        role: 'teacher',
      });

      setLoading(false);
      Alert.alert('Success', 'Teacher added successfully', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', error.message);
    }
  };

  // ── render ─────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#104E8B" barStyle="light-content" />
      {loading && <Spinner />}

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Add Teacher</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* ── Basic Info Section ── */}
        <Text style={styles.sectionLabel}>BASIC INFORMATION</Text>
        <View style={styles.card}>
          <Field label="Registration Number" icon="badge-account-horizontal">
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. T-001"
              placeholderTextColor="#aaa"
              value={registrationNumber}
              onChangeText={setRegistrationNumber}
            />
          </Field>

          <Field label="Full Name" icon="account">
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. Hamza Ejaz"
              placeholderTextColor="#aaa"
              value={name}
              onChangeText={setName}
            />
          </Field>

          <Field label="Date of Birth" icon="calendar">
            <TextInput
              style={styles.fieldInput}
              placeholder="DD-MM-YYYY"
              placeholderTextColor="#aaa"
              value={dateofBirth}
              onChangeText={setDateofBirth}
            />
          </Field>

          {/* Gender picker */}
          <Field label="Gender" icon="gender-male-female">
            <TouchableOpacity
              style={styles.pickerBtn}
              onPress={() => setGenderModalVisible(true)}>
              <Text
                style={[
                  styles.pickerBtnText,
                  gender && styles.pickerBtnTextFilled,
                ]}>
                {gender || 'Select gender'}
              </Text>
              <MaterialCommunityIcons
                name="chevron-down"
                size={18}
                color="#aaa"
              />
            </TouchableOpacity>
          </Field>

          <Field label="Residence" icon="map-marker" last>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. Peshawar"
              placeholderTextColor="#aaa"
              value={residence}
              onChangeText={setResidence}
            />
          </Field>
        </View>

        {/* ── Class & Subject Assignments ── */}
        <Text style={styles.sectionLabel}>CLASS & SUBJECT ASSIGNMENTS</Text>

        {assignments.map((assignment, index) => (
          <View key={index} style={styles.assignmentCard}>
            {/* Card header */}
            <View style={styles.assignmentCardHeader}>
              <Text style={styles.assignmentCardTitle}>
                Assignment {index + 1}
              </Text>
              <TouchableOpacity onPress={() => removeAssignment(index)}>
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={20}
                  color="#E53935"
                />
              </TouchableOpacity>
            </View>

            {/* Class picker */}
            <Text style={styles.assignmentFieldLabel}>CLASS</Text>
            <TouchableOpacity
              style={[
                styles.assignmentPickerBtn,
                assignment.classId && styles.assignmentPickerBtnFilled,
              ]}
              onPress={() => openClassPicker(index)}>
              <MaterialCommunityIcons
                name="school"
                size={16}
                color={assignment.classId ? '#104E8B' : '#aaa'}
              />
              <Text
                style={[
                  styles.pickerBtnText,
                  assignment.classId && styles.pickerBtnTextFilled,
                ]}>
                {assignment.className || 'Select class'}
              </Text>
              <MaterialCommunityIcons
                name="chevron-down"
                size={18}
                color="#aaa"
              />
            </TouchableOpacity>

            {/* Subject multi-select */}
            <Text style={[styles.assignmentFieldLabel, {marginTop: 12}]}>
              SUBJECTS
            </Text>
            <TouchableOpacity
              style={[
                styles.assignmentPickerBtn,
                assignment.subjects.length > 0 &&
                  styles.assignmentPickerBtnFilled,
                !assignment.classId && styles.assignmentPickerBtnDisabled,
              ]}
              onPress={() => assignment.classId && openSubjectPicker(index)}
              disabled={!assignment.classId}>
              <MaterialCommunityIcons
                name="book-open-variant"
                size={16}
                color={assignment.subjects.length > 0 ? '#104E8B' : '#aaa'}
              />
              <Text
                style={[
                  styles.pickerBtnText,
                  assignment.subjects.length > 0 && styles.pickerBtnTextFilled,
                ]}>
                {assignment.subjects.length > 0
                  ? assignment.subjects.join(', ')
                  : assignment.classId
                  ? 'Select subjects'
                  : 'Select class first'}
              </Text>
              <MaterialCommunityIcons
                name="chevron-down"
                size={18}
                color="#aaa"
              />
            </TouchableOpacity>
          </View>
        ))}

        {/* Add assignment button */}
        <TouchableOpacity
          style={styles.addAssignmentBtn}
          onPress={addAssignment}>
          <MaterialCommunityIcons
            name="plus-circle-outline"
            size={20}
            color="#104E8B"
          />
          <Text style={styles.addAssignmentText}>Add Class Assignment</Text>
        </TouchableOpacity>

        {/* ── Account Info ── */}
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.card}>
          <Field label="Email" icon="email-outline">
            <TextInput
              style={styles.fieldInput}
              placeholder="teacher@school.com"
              placeholderTextColor="#aaa"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </Field>

          <Field label="Password" icon="lock-outline" last>
            <TextInput
              style={styles.fieldInput}
              placeholder="Min 6 characters"
              placeholderTextColor="#aaa"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </Field>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <MaterialCommunityIcons
            name="check"
            size={20}
            color="#fff"
            style={{marginRight: 8}}
          />
          <Text style={styles.saveBtnText}>Save Teacher</Text>
        </TouchableOpacity>

        <View style={{height: 40}} />
      </ScrollView>

      {/* ── GENDER MODAL ── */}
      <Modal visible={genderModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.simpleModal}>
            <Text style={styles.modalTitle}>Select Gender</Text>
            {GENDERS.map(g => (
              <TouchableOpacity
                key={g}
                style={[
                  styles.simpleModalItem,
                  gender === g && styles.simpleModalItemActive,
                ]}
                onPress={() => {
                  setGender(g);
                  setGenderModalVisible(false);
                }}>
                <Text
                  style={[
                    styles.simpleModalItemText,
                    gender === g && styles.simpleModalItemTextActive,
                  ]}>
                  {g}
                </Text>
                {gender === g && (
                  <MaterialCommunityIcons
                    name="check"
                    size={18}
                    color="#104E8B"
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* ── CLASS PICKER MODAL ── */}
      <Modal visible={classModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Class</Text>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setClassModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={18} color="#555" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={allClasses}
              keyExtractor={item => item.id}
              renderItem={({item}) => {
                const isSelected =
                  assignments[editingIndex]?.classId === item.id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.pickerItem,
                      isSelected && styles.pickerItemActive,
                    ]}
                    onPress={() => onSelectClass(item)}>
                    <MaterialCommunityIcons
                      name="school"
                      size={18}
                      color={isSelected ? '#104E8B' : '#888'}
                    />
                    <Text
                      style={[
                        styles.pickerItemText,
                        isSelected && styles.pickerItemTextActive,
                      ]}>
                      {item.name || item.id}
                    </Text>
                    {isSelected && (
                      <MaterialCommunityIcons
                        name="check"
                        size={18}
                        color="#104E8B"
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* ── SUBJECT MULTI-SELECT MODAL ── */}
      <Modal visible={subjectModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Subjects</Text>
                <Text style={styles.modalSub}>
                  {assignments[editingIndex]?.className} · {tempSubjects.length}{' '}
                  selected
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setSubjectModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={18} color="#555" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={getSubjectsForClass(assignments[editingIndex]?.classId)}
              keyExtractor={(item, i) => `${item}-${i}`}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>
                    No subjects found for this class
                  </Text>
                </View>
              }
              renderItem={({item}) => {
                const selected = tempSubjects.includes(item);
                return (
                  <TouchableOpacity
                    style={[
                      styles.pickerItem,
                      selected && styles.pickerItemActive,
                    ]}
                    onPress={() => toggleSubject(item)}>
                    <MaterialCommunityIcons
                      name={
                        selected ? 'checkbox-marked' : 'checkbox-blank-outline'
                      }
                      size={20}
                      color={selected ? '#104E8B' : '#aaa'}
                    />
                    <Text
                      style={[
                        styles.pickerItemText,
                        selected && styles.pickerItemTextActive,
                      ]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />

            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={confirmSubjects}>
              <Text style={styles.confirmBtnText}>
                Confirm{' '}
                {tempSubjects.length > 0
                  ? `(${tempSubjects.length} selected)`
                  : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ── Field wrapper component ────────────────────────────────────────────────
const Field = ({label, icon, children, last}) => (
  <View style={[styles.fieldRow, !last && styles.fieldRowBorder]}>
    <MaterialCommunityIcons
      name={icon}
      size={20}
      color="#104E8B"
      style={styles.fieldIcon}
    />
    <View style={styles.fieldContent}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  </View>
);

// ────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F5F7FA'},

  header: {
    backgroundColor: '#104E8B',
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {color: '#fff', fontSize: 18, marginLeft: 12, fontWeight: '700'},

  scroll: {paddingVertical: 20, paddingHorizontal: 16},

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 8,
    marginLeft: 2,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    overflow: 'hidden',
  },

  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  fieldRowBorder: {borderBottomWidth: 1, borderBottomColor: '#F0F0F0'},
  fieldIcon: {marginRight: 12},
  fieldContent: {flex: 1},
  fieldLabel: {fontSize: 11, color: '#aaa', fontWeight: '600', marginBottom: 2},
  fieldInput: {fontSize: 14, color: '#1a1a1a', padding: 0},

  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pickerBtnText: {flex: 1, fontSize: 14, color: '#aaa'},
  pickerBtnTextFilled: {color: '#1a1a1a'},

  // Assignment cards
  assignmentCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#104E8B',
  },
  assignmentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  assignmentCardTitle: {fontSize: 13, fontWeight: '700', color: '#104E8B'},
  assignmentFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  assignmentPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8F9FB',
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  assignmentPickerBtnFilled: {
    borderColor: '#104E8B',
    backgroundColor: '#EBF1FB',
  },
  assignmentPickerBtnDisabled: {opacity: 0.5},

  addAssignmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#104E8B',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 13,
    marginBottom: 20,
  },
  addAssignmentText: {fontSize: 14, fontWeight: '600', color: '#104E8B'},

  saveBtn: {
    backgroundColor: '#104E8B',
    borderRadius: 14,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#104E8B',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveBtnText: {color: '#fff', fontSize: 15, fontWeight: '700'},

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  modalTitle: {fontSize: 17, fontWeight: '700', color: '#1a1a1a'},
  modalSub: {fontSize: 12, color: '#104E8B', fontWeight: '600', marginTop: 2},
  closeBtn: {
    backgroundColor: '#F5F5F5',
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  simpleModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 30,
    padding: 20,
    alignSelf: 'center',
    width: '80%',
    position: 'absolute',
    top: '40%',
  },
  simpleModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  simpleModalItemActive: {
    backgroundColor: '#EBF1FB',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  simpleModalItemText: {fontSize: 15, color: '#333'},
  simpleModalItemTextActive: {color: '#104E8B', fontWeight: '700'},

  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#F5F5F5',
  },
  pickerItemActive: {backgroundColor: '#EBF1FB'},
  pickerItemText: {flex: 1, fontSize: 15, color: '#1a1a1a'},
  pickerItemTextActive: {fontWeight: '700', color: '#104E8B'},

  confirmBtn: {
    backgroundColor: '#104E8B',
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  confirmBtnText: {color: '#fff', fontWeight: '700', fontSize: 15},

  emptyState: {alignItems: 'center', paddingVertical: 40},
  emptyText: {color: '#999', fontSize: 14},
});

export default TeacherForm;
