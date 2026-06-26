import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Animated,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';

// ─── Animated Stat Card ───────────────────────────────────────────────────────
const StatCard = ({label, value, color, delay = 0}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.statCard,
        {opacity: fadeAnim, transform: [{translateY: slideAnim}]},
      ]}>
      <View style={[styles.statAccent, {backgroundColor: color}]} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
};

// ─── Attendance Row ───────────────────────────────────────────────────────────
const AttendanceRow = ({item, index}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const isPresent = item.status === 'Present';

  const formatTime = timeStr => {
    if (!timeStr) return null;
    try {
      const date = timeStr?.toDate ? timeStr.toDate() : new Date(timeStr);
      return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
    } catch {
      return null;
    }
  };

  const formattedTime = formatTime(item.time);

  // Avatar initials
  const initials = item.name
    ? item.name
        .split(' ')
        .slice(0, 2)
        .map(n => n[0])
        .join('')
        .toUpperCase()
    : '?';

  return (
    <Animated.View
      style={[
        styles.row,
        {opacity: fadeAnim, transform: [{translateY: slideAnim}]},
      ]}>
      {/* Left Accent Bar */}
      <View
        style={[
          styles.rowAccentBar,
          {backgroundColor: isPresent ? '#22c55e' : '#ef4444'},
        ]}
      />

      {/* Avatar */}
      <View
        style={[
          styles.avatar,
          {backgroundColor: isPresent ? '#DBEAFE' : '#FEE2E2'},
        ]}>
        <Text style={[styles.avatarText, {color: isPresent ? '#1D4ED8' : '#DC2626'}]}>
          {initials}
        </Text>
      </View>

      {/* Info */}
      <View style={styles.rowInfo}>
        <Text style={styles.rowName}>{item.name}</Text>
        <Text style={styles.rowSub}>
          {isPresent && formattedTime
            ? `Scanned at ${formattedTime}`
            : isPresent
            ? 'Scanned'
            : 'Not Scanned'}
        </Text>
      </View>

      {/* Badge */}
      <View
        style={[
          styles.badge,
          {
            backgroundColor: isPresent
              ? 'rgba(34,197,94,0.12)'
              : 'rgba(239,68,68,0.12)',
            borderColor: isPresent ? '#22c55e' : '#ef4444',
          },
        ]}>
        <View
          style={[
            styles.badgeDot,
            {backgroundColor: isPresent ? '#22c55e' : '#ef4444'},
          ]}
        />
        <Text
          style={[
            styles.badgeText,
            {color: isPresent ? '#4ade80' : '#f87171'},
          ]}>
          {item.status}
        </Text>
      </View>
    </Animated.View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const LiveAttendanceScreen = () => {
  const [teachers, setTeachers] = useState([]);
  const [presentCount, setPresentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    const loadData = async () => {
      const teacherSnap = await firestore().collection('Teachers').get();
      const teacherList = [];
      teacherSnap.forEach(doc => teacherList.push({id: doc.id, ...doc.data()}));

      const attendanceSnap = await firestore()
        .collection('teacherAttendance')
        .where('date', '==', today)
        .get();

      const attendanceMap = {};
      attendanceSnap.forEach(doc => {
        const data = doc.data();
        attendanceMap[data.teacherId] = data;
      });

      let present = 0;
      const finalList = teacherList.map(t => {
        const att = attendanceMap[t.id];
        if (att?.status === 'Present') present++;
        return {
          id: t.id,
          name: t.name,
          status: att ? att.status : 'Absent',
          time: att?.scannedAt || null,
        };
      });

      // Sort: Present first
      finalList.sort((a, b) => {
        if (a.status === b.status) return 0;
        return a.status === 'Present' ? -1 : 1;
      });

      setTeachers(finalList);
      setPresentCount(present);
      setLoading(false);
    };

    loadData();

    const unsubscribe = firestore()
      .collection('teacherAttendance')
      .where('date', '==', today)
      .onSnapshot(() => loadData());

    return () => unsubscribe();
  }, []);

  const attendanceRate =
    teachers.length > 0
      ? Math.round((presentCount / teachers.length) * 100)
      : 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#104E8B" />

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Live Attendance</Text>
          <Text style={styles.headerDate}>{todayLabel}</Text>
        </View>
        <View style={styles.liveChip}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#104E8B" />
          <Text style={styles.loadingText}>Loading attendance…</Text>
        </View>
      ) : (
        <>
          {/* ── STAT CARDS ── */}
          <View style={styles.statsRow}>
            <StatCard
              label="Total"
              value={teachers.length}
              color="#104E8B"
              delay={0}
            />
            <StatCard
              label="Present"
              value={presentCount}
              color="#22c55e"
              delay={80}
            />
            <StatCard
              label="Absent"
              value={teachers.length - presentCount}
              color="#ef4444"
              delay={160}
            />
          </View>

          {/* ── ATTENDANCE RATE BAR ── */}
          <View style={styles.rateCard}>
            <View style={styles.rateHeader}>
              <Text style={styles.rateLabel}>Attendance Rate</Text>
              <Text style={styles.rateValue}>{attendanceRate}%</Text>
            </View>
            <View style={styles.rateTrack}>
              <View style={[styles.rateFill, {width: `${attendanceRate}%`}]} />
            </View>
          </View>

          {/* ── SECTION LABEL ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Teachers</Text>
            <Text style={styles.sectionCount}>{teachers.length} total</Text>
          </View>

          {/* ── LIST ── */}
          <FlatList
            data={teachers}
            keyExtractor={item => item.id}
            renderItem={({item, index}) => (
              <AttendanceRow item={item} index={index} />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </View>
  );
};

export default LiveAttendanceScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6FA',
  },

  // ── Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#104E8B',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerDate: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    marginTop: 3,
  },
  liveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#4ade80',
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // ── Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 18,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  statAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  statValue: {
    color: '#1E293B',
    fontSize: 26,
    fontWeight: '800',
    marginTop: 6,
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // ── Rate Bar
  rateCard: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  rateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  rateLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
  rateValue: {
    color: '#104E8B',
    fontSize: 13,
    fontWeight: '700',
  },
  rateTrack: {
    height: 7,
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  rateFill: {
    height: '100%',
    backgroundColor: '#104E8B',
    borderRadius: 10,
  },

  // ── Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionCount: {
    color: '#94A3B8',
    fontSize: 12,
  },

  // ── Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  rowAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '600',
  },
  rowSub: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },

  // ── Badge
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // ── Loading
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
  },

  listContent: {
    paddingBottom: 24,
  },
});