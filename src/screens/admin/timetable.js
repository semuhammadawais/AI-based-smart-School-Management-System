import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  ScrollView,
  StatusBar,
  SafeAreaView,
  Alert,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const FULL_DAYS = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
};

const PERIOD_COLORS = ['#104E8B', '#1565C0', '#0277BD', '#00695C', '#4527A0'];

// ─── helpers ────────────────────────────────────────────────────────────────

/** "09:30" + 45 min → "10:15" */
const addMinutes = (timeStr, mins) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m + mins;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
};

const DEFAULT_PERIOD_MINS = 45;

// ────────────────────────────────────────────────────────────────────────────

const AdminTimetableScreen = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [timetableEntries, setTimetableEntries] = useState([]);

  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedDay, setSelectedDay] = useState('Mon');

  // Smart-filtered lists derived from selectedClass / selectedSubject
  const [classSubjects, setClassSubjects] = useState([]); // subjects[] from selected class doc
  const [classTeachers, setClassTeachers] = useState([]); // teachers whose classIds includes this class

  const [modalVisible, setModalVisible] = useState(false);
  const [subjectPickerVisible, setSubjectPickerVisible] = useState(false);
  const [teacherPickerVisible, setTeacherPickerVisible] = useState(false);

  const [teacherSearch, setTeacherSearch] = useState('');

  const [form, setForm] = useState({
    periodNumber: '',
    subject: '',
    teacherId: '',
    teacherName: '',
    startTime: '',
    endTime: '',
  });

  // ── fetch all ──────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchTimetable();
      deriveClassData();
    }
  }, [selectedClass, selectedDay]);

  const fetchClasses = async () => {
    const snap = await firestore().collection('Classes').get();
    setClasses(snap.docs.map(d => ({id: d.id, ...d.data()})));
  };

  const fetchTeachers = async () => {
    const snap = await firestore().collection('Teachers').get();
    setTeachers(snap.docs.map(d => ({id: d.id, ...d.data()})));
  };

  const fetchTimetable = async () => {
    if (!selectedClass) return;
    const classValue = selectedClass?.name || selectedClass?.id;

    const snap = await firestore()
      .collection('Timetables')
      .where('className', '==', classValue)
      .where('day', '==', FULL_DAYS[selectedDay])
      .where('active', '==', true)
      .get();

    const data = snap.docs
      .map(d => ({id: d.id, ...d.data()}))
      .sort((a, b) => Number(a.periodNumber) - Number(b.periodNumber));

    setTimetableEntries(data);
  };

  // ── derive subjects + teachers for selected class ─────────────────────────

  // Extract "1" from "Class 1"
  const getClassNumber = cls => {
    const name = cls?.name || cls?.id || '';
    const match = name.match(/\d+/);
    return match ? match[0] : name;
  };

  const deriveClassData = useCallback(() => {
    if (!selectedClass) return;

    const classNum = getClassNumber(selectedClass); // "1"

    const subjects = Array.isArray(selectedClass.subjects)
      ? selectedClass.subjects
      : [];
    setClassSubjects(subjects);

    const filtered = teachers.filter(t => {
      const assigned = Array.isArray(t.assignedSubjects)
        ? t.assignedSubjects
        : [];
      return assigned.some(
        entry =>
          Array.isArray(entry.classes) && entry.classes.includes(classNum),
      );
    });

    setClassTeachers(filtered);
  }, [selectedClass, teachers]);

  const teachersForSubject = useCallback(() => {
    const classNum = getClassNumber(selectedClass); // "1"
    let list = classTeachers;

    if (form.subject) {
      const filtered = list.filter(t => {
        const assigned = Array.isArray(t.assignedSubjects)
          ? t.assignedSubjects
          : [];
        return assigned.some(
          entry =>
            entry.subject === form.subject &&
            Array.isArray(entry.classes) &&
            entry.classes.includes(classNum),
        );
      });
      if (filtered.length > 0) list = filtered;
    }

    if (teacherSearch.trim()) {
      const q = teacherSearch.toLowerCase();
      list = list.filter(t =>
        (t.name || t.fullName || '').toLowerCase().includes(q),
      );
    }

    return list;
  }, [classTeachers, form.subject, selectedClass, teacherSearch]);
  // ── auto-suggest next period number + start time ──────────────────────────
  const getNextDefaults = () => {
    if (timetableEntries.length === 0) {
      return {
        periodNumber: '1',
        startTime: '08:00',
        endTime: addMinutes('08:00', DEFAULT_PERIOD_MINS),
      };
    }
    const last = timetableEntries[timetableEntries.length - 1];
    const nextNum = String(Number(last.periodNumber) + 1);
    const startTime = last.endTime || '';
    const endTime = addMinutes(startTime, DEFAULT_PERIOD_MINS);
    return {periodNumber: nextNum, startTime, endTime};
  };

  // ── open add modal pre-filled ─────────────────────────────────────────────
  const openAddModal = () => {
    const defaults = getNextDefaults();
    setForm({
      periodNumber: defaults.periodNumber,
      subject: '',
      teacherId: '',
      teacherName: '',
      startTime: defaults.startTime,
      endTime: defaults.endTime,
    });
    setTeacherSearch('');
    setModalVisible(true);
  };

  // ── class selection ───────────────────────────────────────────────────────
  const onSelectClass = cls => {
    setSelectedClass(cls);
    setForm({
      periodNumber: '',
      subject: '',
      teacherId: '',
      teacherName: '',
      startTime: '',
      endTime: '',
    });
  };

  // ── save ──────────────────────────────────────────────────────────────────
  const saveTimetable = async () => {
    if (!selectedClass) return;
    if (!form.subject || !form.teacherId || !form.startTime || !form.endTime) {
      Alert.alert('Missing fields', 'Please fill in all fields before saving.');
      return;
    }

    const classValue = selectedClass?.name || selectedClass?.id;

    await firestore().collection('Timetables').add({
      className: classValue,
      day: FULL_DAYS[selectedDay],
      periodNumber: form.periodNumber,
      subject: form.subject,
      teacherId: form.teacherId,
      teacherName: form.teacherName,
      startTime: form.startTime,
      endTime: form.endTime,
      active: true,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });

    setModalVisible(false);
    fetchTimetable();
  };

  const resetForm = () => {
    setForm({
      periodNumber: '',
      subject: '',
      teacherId: '',
      teacherName: '',
      startTime: '',
      endTime: '',
    });
    setModalVisible(false);
  };

  // ── delete period ─────────────────────────────────────────────────────────
  const deletePeriod = item => {
    Alert.alert(
      'Delete Period',
      `Remove ${item.subject} (Period ${item.periodNumber})?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await firestore()
              .collection('Timetables')
              .doc(item.id)
              .update({active: false});
            fetchTimetable();
          },
        },
      ],
    );
  };

  // ── render period card ────────────────────────────────────────────────────
  const renderPeriodCard = ({item, index}) => {
    const color = PERIOD_COLORS[index % PERIOD_COLORS.length];
    return (
      <View style={[styles.periodCard, {borderLeftColor: color}]}>
        <View style={[styles.periodBadge, {backgroundColor: color}]}>
          <Text style={styles.periodBadgeText}>{item.periodNumber}</Text>
        </View>

        <View style={styles.periodInfo}>
          <Text style={styles.periodSubject}>{item.subject}</Text>
          <View style={styles.periodMeta}>
            <MaterialCommunityIcons name="account" size={13} color="#666" />
            <Text style={styles.periodTeacher}>
              {item.teacherName || 'N/A'}
            </Text>
          </View>
        </View>

        <View style={styles.periodRight}>
          <View style={styles.periodTime}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={13}
              color="#888"
            />
            <Text style={styles.periodTimeText}>
              {item.startTime} – {item.endTime}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => deletePeriod(item)}>
            <MaterialCommunityIcons
              name="trash-can-outline"
              size={16}
              color="#E53935"
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#104E8B" barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Timetable</Text>
          <Text style={styles.headerSub}>Manage class schedules</Text>
        </View>
        {selectedClass && (
          <TouchableOpacity style={styles.addFab} onPress={openAddModal}>
            <MaterialCommunityIcons name="plus" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        {/* CLASS */}
        <Text style={styles.sectionLabel}>CLASS</Text>
        <FlatList
          horizontal
          data={classes}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{paddingHorizontal: 20, gap: 10}}
          renderItem={({item}) => (
            <TouchableOpacity
              style={[
                styles.classChip,
                selectedClass?.id === item.id && styles.classChipActive,
              ]}
              onPress={() => onSelectClass(item)}>
              <Text
                style={[
                  styles.classChipText,
                  selectedClass?.id === item.id && styles.classChipTextActive,
                ]}>
                {item.name || item.id}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* Selected class info badge */}
        {selectedClass && (
          <View style={styles.classInfoBadge}>
            <View style={styles.classInfoItem}>
              <MaterialCommunityIcons
                name="book-open-variant"
                size={14}
                color="#104E8B"
              />
              <Text style={styles.classInfoText}>
                {classSubjects.length} subject
                {classSubjects.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.classInfoDivider} />
            <View style={styles.classInfoItem}>
              <MaterialCommunityIcons
                name="account-group"
                size={14}
                color="#104E8B"
              />
              <Text style={styles.classInfoText}>
                {classTeachers.length} teacher
                {classTeachers.length !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        )}

        {/* DAY */}
        <Text style={[styles.sectionLabel, {marginTop: 20}]}>DAY</Text>
        <View style={styles.dayRow}>
          {DAYS.map(day => (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayBtn,
                selectedDay === day && styles.dayBtnActive,
              ]}
              onPress={() => setSelectedDay(day)}>
              <Text
                style={[
                  styles.dayBtnText,
                  selectedDay === day && styles.dayBtnTextActive,
                ]}>
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* TIMETABLE */}
        {selectedClass ? (
          <View style={styles.timetableSection}>
            <View style={styles.timetableHeader}>
              <Text style={styles.timetableTitle}>
                {FULL_DAYS[selectedDay]} · {selectedClass.name}
              </Text>
              {timetableEntries.length > 0 && (
                <Text style={styles.timetableCount}>
                  {timetableEntries.length} periods
                </Text>
              )}
            </View>

            {timetableEntries.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons
                  name="calendar-blank-outline"
                  size={40}
                  color="#ccc"
                />
                <Text style={styles.emptyText}>No periods scheduled</Text>
                <Text style={styles.emptySubText}>
                  Tap + to add the first period
                </Text>
              </View>
            ) : (
              <FlatList
                data={timetableEntries}
                keyExtractor={item => item.id}
                renderItem={renderPeriodCard}
                scrollEnabled={false}
              />
            )}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="gesture-tap" size={40} color="#ccc" />
            <Text style={styles.emptyText}>Select a class to begin</Text>
          </View>
        )}

        <View style={{height: 40}} />
      </ScrollView>

      {/* ── ADD PERIOD MODAL ── */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Add Period</Text>
                <Text style={styles.modalSub}>
                  {selectedClass?.name} · {FULL_DAYS[selectedDay]}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={resetForm}>
                <MaterialCommunityIcons name="close" size={18} color="#555" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{padding: 16}}>
              {/* Period number (auto-filled, editable) */}
              <Text style={styles.inputLabel}>PERIOD NUMBER</Text>
              <TextInput
                placeholder="Auto-filled"
                placeholderTextColor="#aaa"
                value={form.periodNumber}
                onChangeText={t => setForm({...form, periodNumber: t})}
                keyboardType="numeric"
                style={styles.input}
              />

              {/* Subject dropdown */}
              <Text style={[styles.inputLabel, {marginTop: 14}]}>SUBJECT</Text>
              <TouchableOpacity
                style={[
                  styles.pickerBtn,
                  form.subject ? styles.pickerBtnFilled : null,
                ]}
                onPress={() => setSubjectPickerVisible(true)}>
                <MaterialCommunityIcons
                  name="book-open-variant"
                  size={16}
                  color={form.subject ? '#104E8B' : '#aaa'}
                />
                <Text
                  style={[
                    styles.pickerBtnText,
                    form.subject && styles.pickerBtnTextFilled,
                  ]}>
                  {form.subject || 'Select subject'}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={18}
                  color="#aaa"
                />
              </TouchableOpacity>

              {/* Teacher dropdown */}
              <Text style={[styles.inputLabel, {marginTop: 14}]}>TEACHER</Text>
              <TouchableOpacity
                style={[
                  styles.pickerBtn,
                  form.teacherName ? styles.pickerBtnFilled : null,
                ]}
                onPress={() => {
                  setTeacherSearch('');
                  setTeacherPickerVisible(true);
                }}>
                <MaterialCommunityIcons
                  name="account"
                  size={16}
                  color={form.teacherName ? '#104E8B' : '#aaa'}
                />
                <Text
                  style={[
                    styles.pickerBtnText,
                    form.teacherName && styles.pickerBtnTextFilled,
                  ]}>
                  {form.teacherName ||
                    (form.subject
                      ? 'Select teacher for subject'
                      : 'Select subject first')}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-down"
                  size={18}
                  color="#aaa"
                />
              </TouchableOpacity>

              {/* Teacher cross-filter hint */}
              {form.subject &&
                teachersForSubject().length < classTeachers.length && (
                  <Text style={styles.filterHint}>
                    Showing {teachersForSubject().length} teacher
                    {teachersForSubject().length !== 1 ? 's' : ''} who teach{' '}
                    {form.subject}
                  </Text>
                )}

              {/* Time row */}
              <View style={styles.timeRow}>
                <View style={{flex: 1}}>
                  <Text style={styles.inputLabel}>START TIME</Text>
                  <TextInput
                    placeholder="08:00"
                    placeholderTextColor="#aaa"
                    value={form.startTime}
                    onChangeText={t =>
                      setForm({
                        ...form,
                        startTime: t,
                        endTime: addMinutes(t, DEFAULT_PERIOD_MINS),
                      })
                    }
                    style={styles.input}
                  />
                </View>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={18}
                  color="#aaa"
                  style={{marginTop: 30, marginHorizontal: 8}}
                />
                <View style={{flex: 1}}>
                  <Text style={styles.inputLabel}>END TIME</Text>
                  <TextInput
                    placeholder="08:45"
                    placeholderTextColor="#aaa"
                    value={form.endTime}
                    onChangeText={t => setForm({...form, endTime: t})}
                    style={styles.input}
                  />
                </View>
              </View>

              {/* End time auto-note */}
              <Text style={styles.filterHint}>
                End time auto-set to {DEFAULT_PERIOD_MINS} min after start
              </Text>

              <TouchableOpacity style={styles.saveBtn} onPress={saveTimetable}>
                <MaterialCommunityIcons
                  name="check"
                  size={18}
                  color="#fff"
                  style={{marginRight: 8}}
                />
                <Text style={styles.saveBtnText}>Save Period</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── SUBJECT PICKER MODAL ── */}
      <Modal visible={subjectPickerVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, {maxHeight: '60%'}]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Subject</Text>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setSubjectPickerVisible(false)}>
                <MaterialCommunityIcons name="close" size={18} color="#555" />
              </TouchableOpacity>
            </View>

            {classSubjects.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  No subjects found for this class
                </Text>
              </View>
            ) : (
              <FlatList
                data={classSubjects}
                keyExtractor={(item, i) => `${item}-${i}`}
                renderItem={({item}) => (
                  <TouchableOpacity
                    style={[
                      styles.pickerItem,
                      form.subject === item && styles.pickerItemActive,
                    ]}
                    onPress={() => {
                      setForm({
                        ...form,
                        subject: item,
                        teacherId: '',
                        teacherName: '',
                      });
                      setSubjectPickerVisible(false);
                    }}>
                    <MaterialCommunityIcons
                      name="book-open-outline"
                      size={18}
                      color={form.subject === item ? '#104E8B' : '#888'}
                    />
                    <Text
                      style={[
                        styles.pickerItemText,
                        form.subject === item && styles.pickerItemTextActive,
                      ]}>
                      {item}
                    </Text>
                    {form.subject === item && (
                      <MaterialCommunityIcons
                        name="check"
                        size={18}
                        color="#104E8B"
                      />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* ── TEACHER PICKER MODAL ── */}
      <Modal visible={teacherPickerVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, {maxHeight: '70%'}]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Teacher</Text>
                {form.subject && (
                  <Text style={styles.modalSub}>
                    Filtered for {form.subject}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setTeacherPickerVisible(false)}>
                <MaterialCommunityIcons name="close" size={18} color="#555" />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchRow}>
              <MaterialCommunityIcons name="magnify" size={18} color="#aaa" />
              <TextInput
                placeholder="Search teacher..."
                placeholderTextColor="#aaa"
                value={teacherSearch}
                onChangeText={setTeacherSearch}
                style={styles.searchInput}
              />
            </View>

            {teachersForSubject().length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No teachers found</Text>
              </View>
            ) : (
              <FlatList
                data={teachersForSubject()}
                keyExtractor={item => item.id}
                renderItem={({item}) => {
                  const name = item.name || item.fullName || '?';
                  const initials = name
                    .split(' ')
                    .map(w => w[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2);
                  const isSelected = form.teacherId === item.id;
                  return (
                    <TouchableOpacity
                      style={[
                        styles.pickerItem,
                        isSelected && styles.pickerItemActive,
                      ]}
                      onPress={() => {
                        setForm({
                          ...form,
                          teacherId: item.id,
                          teacherName: name,
                        });
                        setTeacherPickerVisible(false);
                      }}>
                      <View
                        style={[
                          styles.teacherAvatar,
                          isSelected && {backgroundColor: '#0D3F6F'},
                        ]}>
                        <Text style={styles.teacherAvatarText}>{initials}</Text>
                      </View>
                      <View style={{flex: 1}}>
                        <Text
                          style={[
                            styles.pickerItemText,
                            isSelected && styles.pickerItemTextActive,
                          ]}>
                          {name}
                        </Text>
                        {item.subjects && (
                          <Text style={styles.teacherSubjectsList}>
                            {item.subjects.join(' · ')}
                          </Text>
                        )}
                      </View>
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
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#104E8B'},

  header: {
    backgroundColor: '#104E8B',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  headerSub: {fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2},
  addFab: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  body: {flex: 1, backgroundColor: '#F5F7FA'},
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 1,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },

  classChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#104E8B',
  },
  classChipActive: {backgroundColor: '#104E8B'},
  classChipText: {fontSize: 13, fontWeight: '600', color: '#104E8B'},
  classChipTextActive: {color: '#fff'},

  classInfoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: '#EBF1FB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    gap: 12,
  },
  classInfoItem: {flexDirection: 'row', alignItems: 'center', gap: 5},
  classInfoText: {fontSize: 12, fontWeight: '600', color: '#104E8B'},
  classInfoDivider: {width: 1, height: 14, backgroundColor: '#B8CBE8'},

  dayRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  dayBtn: {flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10},
  dayBtnActive: {backgroundColor: '#104E8B'},
  dayBtnText: {fontSize: 13, fontWeight: '600', color: '#999'},
  dayBtnTextActive: {color: '#fff'},

  timetableSection: {marginHorizontal: 20, marginTop: 24},
  timetableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  timetableTitle: {fontSize: 16, fontWeight: '700', color: '#1a1a1a'},
  timetableCount: {
    fontSize: 12,
    color: '#104E8B',
    fontWeight: '600',
    backgroundColor: '#E8F0FB',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },

  periodCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  periodBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  periodBadgeText: {fontSize: 14, fontWeight: '800', color: '#fff'},
  periodInfo: {flex: 1},
  periodSubject: {fontSize: 15, fontWeight: '700', color: '#1a1a1a'},
  periodMeta: {flexDirection: 'row', alignItems: 'center', marginTop: 3},
  periodTeacher: {fontSize: 12, color: '#666', marginLeft: 4},
  periodRight: {alignItems: 'flex-end', gap: 6},
  periodTime: {flexDirection: 'row', alignItems: 'center'},
  periodTimeText: {fontSize: 11, color: '#888', marginLeft: 2},
  deleteBtn: {padding: 4},

  emptyState: {alignItems: 'center', paddingVertical: 50},
  emptyText: {fontSize: 15, fontWeight: '600', color: '#999', marginTop: 14},
  emptySubText: {fontSize: 13, color: '#bbb', marginTop: 4},

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 30,
    maxHeight: '90%',
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
  modalSub: {fontSize: 12, color: '#999', marginTop: 2},
  closeBtn: {
    backgroundColor: '#F5F5F5',
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },

  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8F9FB',
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1a1a1a',
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8F9FB',
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  pickerBtnFilled: {borderColor: '#104E8B', backgroundColor: '#EBF1FB'},
  pickerBtnText: {flex: 1, fontSize: 14, color: '#aaa'},
  pickerBtnTextFilled: {color: '#104E8B', fontWeight: '600'},
  filterHint: {fontSize: 11, color: '#104E8B', marginTop: 5, marginLeft: 2},

  timeRow: {flexDirection: 'row', alignItems: 'center', marginTop: 14},

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {flex: 1, marginLeft: 8, fontSize: 14, color: '#1a1a1a'},

  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderColor: '#F5F5F5',
  },
  pickerItemActive: {backgroundColor: '#EBF1FB'},
  pickerItemText: {flex: 1, fontSize: 15, color: '#1a1a1a'},
  pickerItemTextActive: {fontWeight: '700', color: '#104E8B'},

  teacherAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#104E8B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherAvatarText: {color: '#fff', fontWeight: '700', fontSize: 15},
  teacherSubjectsList: {fontSize: 11, color: '#999', marginTop: 2},

  saveBtn: {
    backgroundColor: '#104E8B',
    marginTop: 24,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#104E8B',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveBtnText: {color: '#fff', fontSize: 15, fontWeight: '700'},
});

export default AdminTimetableScreen;
