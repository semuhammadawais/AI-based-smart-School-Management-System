import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';

import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const rulesData = [
  {
    id: 1,
    title: 'Attendance Rules',
    icon: 'calendar-check',
    rules: [
      'Students must maintain at least 80% attendance.',
      'Late arrival after 15 minutes will be marked absent.',
      'Leave applications must be submitted in advance.',
    ],
  },
  {
    id: 2,
    title: 'Uniform Rules',
    icon: 'hanger',
    rules: [
      'Students must wear complete school uniform.',
      'ID cards are mandatory during school hours.',
      'Shoes must be clean and polished.',
    ],
  },
  {
    id: 3,
    title: 'Discipline Rules',
    icon: 'shield-check',
    rules: [
      'Respect teachers, staff, and classmates.',
      'Bullying and fighting are strictly prohibited.',
      'Classroom discipline must be maintained.',
    ],
  },
  {
    id: 4,
    title: 'Mobile Phone Policy',
    icon: 'cellphone-off',
    rules: [
      'Mobile phones are not allowed during class.',
      'Unauthorized recordings are prohibited.',
      'Confiscated phones will only be returned to parents.',
    ],
  },
  {
    id: 5,
    title: 'Exam Regulations',
    icon: 'file-document-edit',
    rules: [
      'Cheating during exams is strictly prohibited.',
      'Students must arrive 15 minutes before exam time.',
      'Required stationery should be brought by students.',
    ],
  },
  {
    id: 6,
    title: 'Library Rules',
    icon: 'library',
    rules: [
      'Maintain silence inside the library.',
      'Books must be returned before the due date.',
      'Damaged books must be replaced.',
    ],
  },
];

const RuleCard = ({item}) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={styles.card}
      onPress={toggleExpand}>
      <View style={styles.cardHeader}>
        <View style={styles.leftSection}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name={item.icon} size={24} color="#fff" />
          </View>

          <Text style={styles.cardTitle}>{item.title}</Text>
        </View>

        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={26}
          color="#1E3A8A"
        />
      </View>

      {expanded && (
        <View style={styles.rulesContainer}>
          {item.rules.map((rule, index) => (
            <View key={index} style={styles.ruleRow}>
              <View style={styles.dot} />
              <Text style={styles.ruleText}>{rule}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
};

const SchoolRulesScreen = () => {
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#104E8B" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Rules & Regulations</Text>
        <Text style={styles.headerSubtitle}>
          Follow school policies to maintain discipline and a healthy learning
          environment.
        </Text>
      </View>

      {/* Last Updated */}
      <View style={styles.updateBox}>
        <MaterialCommunityIcons
          name="clock-outline"
          size={18}
          color="#1E3A8A"
        />

        <Text style={styles.updateText}>Last Updated: 21 May 2026</Text>
      </View>

      {/* Rules List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {rulesData.map(item => (
          <RuleCard key={item.id} item={item} />
        ))}

        {/* Footer */}
        <View style={styles.footer}>
          <MaterialCommunityIcons name="school" size={26} color="#1E3A8A" />

          <Text style={styles.footerText}>
            Thank you for helping maintain a respectful and disciplined school
            environment.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default SchoolRulesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F6FB',
  },

  header: {
    backgroundColor: '#1E3A8A',
    paddingTop: 55,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },

  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },

  headerSubtitle: {
    color: '#D6E4FF',
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
  },

  updateBox: {
    marginTop: -18,
    alignSelf: 'center',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 30,
    elevation: 5,
  },

  updateText: {
    marginLeft: 8,
    color: '#1E3A8A',
    fontWeight: '600',
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#1E3A8A',
    justifyContent: 'center',
    alignItems: 'center',
  },

  cardTitle: {
    marginLeft: 14,
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },

  rulesContainer: {
    marginTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },

  ruleRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1E3A8A',
    marginTop: 7,
    marginRight: 10,
  },

  ruleText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 22,
    color: '#475569',
  },

  footer: {
    marginTop: 20,
    backgroundColor: '#E8F0FF',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
  },

  footerText: {
    marginTop: 10,
    textAlign: 'center',
    color: '#1E3A8A',
    fontWeight: '600',
    lineHeight: 22,
  },
});
