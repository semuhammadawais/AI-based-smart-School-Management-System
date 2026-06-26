import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
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

const TimetableScreen = ({navigation}) => {
  const [selectedDay, setSelectedDay] = useState(() => {
    // Auto-select today if it's a weekday, else Mon
    const dayIndex = new Date().getDay(); // 0=Sun,1=Mon...5=Fri,6=Sat
    return dayIndex >= 1 && dayIndex <= 5 ? DAYS[dayIndex - 1] : 'Mon';
  });

  const [periods, setPeriods] = useState([]);
  const [studentClass, setStudentClass] = useState('');
  const [studentName, setStudentName] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingPeriods, setLoadingPeriods] = useState(false);

  // ── fetch student profile ───────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const uid = auth().currentUser?.uid;
        console.log('=== PROFILE DEBUG ===');
        console.log('uid:', uid);
        // Instead of this:
        const doc = await firestore().collection('students').doc(uid).get();

        // Do this — query by uid field:
        const snap = await firestore()
          .collection('students')
          .where('uid', '==', uid)
          .get();

        const data = snap.docs[0]?.data();

        setStudentName(data?.name || '');
        setStudentClass(data?.admissionClass || '');
      } catch (e) {
        console.log('Profile fetch error:', e);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  // ── fetch timetable when class or day changes ───────────────────────────
  useEffect(() => {
    if (studentClass) fetchPeriods();
  }, [studentClass, selectedDay]);

  const fetchPeriods = async () => {
    setLoadingPeriods(true);
    try {
      const classValue = `Class ${studentClass}`;
      console.log('=== TIMETABLE DEBUG ===');
      console.log('studentClass:', studentClass);
      console.log('classValue:', classValue);
      console.log('day:', FULL_DAYS[selectedDay]);

      const snap = await firestore()
        .collection('Timetables')
        .where('className', '==', classValue)
        .where('day', '==', FULL_DAYS[selectedDay])
        .where('active', '==', true)
        .get();

      console.log('docs found:', snap.docs.length);
      snap.docs.forEach(d => console.log('doc:', JSON.stringify(d.data())));

      const data = snap.docs
        .map(d => ({id: d.id, ...d.data()}))
        .sort((a, b) => Number(a.periodNumber) - Number(b.periodNumber));

      setPeriods(data);
    } catch (e) {
      console.log('Timetable fetch error:', e);
    } finally {
      setLoadingPeriods(false);
    }
  };

  // ── render period card ──────────────────────────────────────────────────
  const renderPeriod = ({item, index}) => {
    const color = PERIOD_COLORS[index % PERIOD_COLORS.length];
    const isNow = isCurrentPeriod(item);

    return (
      <View
        style={[
          styles.periodCard,
          {borderLeftColor: color},
          isNow && styles.periodCardNow,
        ]}>
        {isNow && (
          <View style={styles.nowBadge}>
            <Text style={styles.nowBadgeText}>NOW</Text>
          </View>
        )}

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

        <View style={styles.periodTime}>
          <MaterialCommunityIcons name="clock-outline" size={13} color="#888" />
          <Text style={styles.periodTimeText}>{item.startTime}</Text>
          <Text style={styles.periodTimeSep}>–</Text>
          <Text style={styles.periodTimeText}>{item.endTime}</Text>
        </View>
      </View>
    );
  };

  // ── helpers ─────────────────────────────────────────────────────────────

  // Check if current real time falls within a period's start-end
  const isCurrentPeriod = item => {
    try {
      const now = new Date();
      const todayDay = DAYS[now.getDay() - 1];
      if (todayDay !== selectedDay) return false;

      const toMins = t => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };
      const nowMins = now.getHours() * 60 + now.getMinutes();
      const startMins = toMins(item.startTime);
      const endMins = toMins(item.endTime);
      return nowMins >= startMins && nowMins <= endMins;
    } catch {
      return false;
    }
  };

  // ── loading state ───────────────────────────────────────────────────────
  if (loadingProfile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#104E8B" />
      </View>
    );
  }

  // ── render ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#104E8B" barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>My Timetable</Text>
          <Text style={styles.headerSub}>
            Class {studentClass} · {studentName}
          </Text>
        </View>
        {/* Spacer to center title */}
        <View style={{width: 24}} />
      </View>

      {/* DAY SELECTOR */}
      <View style={styles.dayWrapper}>
        <View style={styles.dayRow}>
          {DAYS.map(day => {
            const isToday = DAYS[new Date().getDay() - 1] === day;
            const isSelected = selectedDay === day;
            return (
              <TouchableOpacity
                key={day}
                style={[styles.dayBtn, isSelected && styles.dayBtnActive]}
                onPress={() => setSelectedDay(day)}>
                <Text
                  style={[
                    styles.dayBtnText,
                    isSelected && styles.dayBtnTextActive,
                  ]}>
                  {day}
                </Text>
                {isToday && (
                  <View
                    style={[
                      styles.todayDot,
                      isSelected && styles.todayDotActive,
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* PERIODS */}
      <View style={styles.body}>
        <View style={styles.periodListHeader}>
          <Text style={styles.dayFullLabel}>{FULL_DAYS[selectedDay]}</Text>
          {!loadingPeriods && periods.length > 0 && (
            <Text style={styles.periodCount}>{periods.length} periods</Text>
          )}
        </View>

        {loadingPeriods ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#104E8B" />
          </View>
        ) : periods.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="calendar-remove-outline"
              size={56}
              color="#D0D9E8"
            />
            <Text style={styles.emptyTitle}>No Classes</Text>
            <Text style={styles.emptySubText}>
              No periods scheduled for {FULL_DAYS[selectedDay]}
            </Text>
          </View>
        ) : (
          <FlatList
            data={periods}
            keyExtractor={item => item.id}
            renderItem={renderPeriod}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#104E8B'},
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },

  // Header
  header: {
    backgroundColor: '#104E8B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerCenter: {flex: 1, alignItems: 'center'},
  headerTitle: {fontSize: 18, fontWeight: '700', color: '#fff'},
  headerSub: {fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2},

  // Day selector (still on blue header)
  dayWrapper: {
    backgroundColor: '#104E8B',
    paddingHorizontal: 16,
    paddingBottom: 18,
  },
  dayRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14,
    padding: 4,
  },
  dayBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  dayBtnActive: {backgroundColor: '#fff'},
  dayBtnText: {fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)'},
  dayBtnTextActive: {color: '#104E8B'},
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
    marginTop: 3,
  },
  todayDotActive: {backgroundColor: '#104E8B'},

  // Body
  body: {flex: 1, backgroundColor: '#F5F7FA'},
  periodListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  dayFullLabel: {fontSize: 16, fontWeight: '700', color: '#1a1a1a'},
  periodCount: {
    fontSize: 12,
    color: '#104E8B',
    fontWeight: '600',
    backgroundColor: '#E8F0FB',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  listContent: {paddingHorizontal: 16, paddingBottom: 30},

  // Period card
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
  periodCardNow: {
    borderColor: '#104E8B',
    shadowColor: '#104E8B',
    shadowOpacity: 0.15,
    elevation: 5,
  },
  nowBadge: {
    position: 'absolute',
    top: 8,
    right: 10,
    backgroundColor: '#104E8B',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  nowBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
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
  periodTime: {alignItems: 'flex-end', gap: 1},
  periodTimeText: {fontSize: 11, color: '#888'},
  periodTimeSep: {fontSize: 10, color: '#bbb'},

  // Empty
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  emptyTitle: {fontSize: 18, fontWeight: '700', color: '#ccc', marginTop: 16},
  emptySubText: {fontSize: 13, color: '#bbb', marginTop: 6},
});

export default TimetableScreen;
