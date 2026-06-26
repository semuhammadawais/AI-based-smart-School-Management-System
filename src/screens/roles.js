import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  SafeAreaView,
  Animated,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const ROLES = [
  {
    key: 'admin',
    label: 'Administrator',
    icon: 'shield-account-outline',
    description: 'Manage system, users & permissions',
  },
  {
    key: 'teacher',
    label: 'Teacher',
    icon: 'book-open-variant',
    description: 'Classes, attendance & grading',
  },
  {
    key: 'student',
    label: 'Student',
    icon: 'school-outline',
    description: 'Courses, results & timetable',
  },
  {
    key: 'parent',
    label: 'Parent / Guardian',
    icon: 'account-child-outline',
    description: "Track your child's progress",
  },
  {
    key: 'driver',
    label: 'Driver',
    icon: 'bus-school',
    description: 'Live bus tracking & transport management',
  },
];

const PRIMARY = '#1C3FAA';

const RoleSelectionScreen = ({navigation}) => {
  const [selected, setSelected] = useState(null);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef(ROLES.map(() => new Animated.Value(0))).current;
  const scaleAnims = useRef(ROLES.map(() => new Animated.Value(1))).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    cardAnims.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 400,
        delay: 150 + i * 120,
        useNativeDriver: true,
      }).start();
    });

    Animated.timing(buttonAnim, {
      toValue: 1,
      duration: 400,
      delay: 700,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSelect = key => {
    setSelected(key);
  };

  const handlePressIn = i => {
    Animated.spring(scaleAnims[i], {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = i => {
    Animated.spring(scaleAnims[i], {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleContinue = () => {
    if (selected) navigation.navigate('Login', {role: selected});
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.container}>
        {/* HERO */}
        <Animated.View
          style={[
            styles.hero,
            {
              opacity: headerAnim,
              transform: [
                {
                  translateY: headerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
            },
          ]}>
          <Text style={styles.brand}>EduManage</Text>
          <Text style={styles.title}>Welcome 👋</Text>
          <Text style={styles.subtitle}>
            Select your role to continue into your dashboard
          </Text>
        </Animated.View>

        {/* CARDS */}
        <View style={styles.list}>
          {ROLES.map((role, i) => {
            const isActive = selected === role.key;

            return (
              <Animated.View
                key={role.key}
                style={{
                  opacity: cardAnims[i],
                  transform: [
                    {
                      translateY: cardAnims[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0],
                      }),
                    },
                    {scale: scaleAnims[i]},
                  ],
                }}>
                <TouchableOpacity
                  activeOpacity={1}
                  onPressIn={() => handlePressIn(i)}
                  onPressOut={() => handlePressOut(i)}
                  onPress={() => handleSelect(role.key)}
                  style={[styles.card, isActive && styles.cardActive]}>
                  <View
                    style={[
                      styles.iconWrap,
                      isActive && styles.iconWrapActive,
                    ]}>
                    <MaterialCommunityIcons
                      name={role.icon}
                      size={22}
                      color={isActive ? '#fff' : PRIMARY}
                    />
                  </View>

                  <View style={{flex: 1}}>
                    <Text
                      style={[styles.label, isActive && styles.labelActive]}>
                      {role.label}
                    </Text>
                    <Text style={styles.desc}>{role.description}</Text>
                  </View>

                  <View
                    style={[styles.radio, isActive && styles.radioActive]}
                  />
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* BUTTON */}
        <Animated.View style={{opacity: buttonAnim}}>
          <TouchableOpacity
            disabled={!selected}
            onPress={handleContinue}
            style={[styles.button, !selected && styles.buttonDisabled]}>
            <Text style={styles.buttonText}>Continue</Text>
            <MaterialCommunityIcons name="arrow-right" size={18} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.footerText}>
          You’ll be redirected to login after selection
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#fff'},

  container: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 40,
  },

  hero: {
    marginBottom: 30,
  },
  brand: {
    fontSize: 13,
    fontWeight: '700',
    color: PRIMARY,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 8,
    color: '#111827',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },

  list: {
    gap: 12,
    marginBottom: 25,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#fff',

    borderWidth: 1,
    borderColor: '#E5E7EB',

    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  cardActive: {
    borderColor: PRIMARY,
    backgroundColor: '#EEF2FF',
  },

  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  iconWrapActive: {
    backgroundColor: PRIMARY,
  },

  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },

  labelActive: {
    color: PRIMARY,
  },

  desc: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },

  radioActive: {
    borderColor: PRIMARY,
    backgroundColor: PRIMARY,
  },

  button: {
    backgroundColor: PRIMARY,
    paddingVertical: 15,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },

  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },

  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },

  footerText: {
    textAlign: 'center',
    marginTop: 14,
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default RoleSelectionScreen;
