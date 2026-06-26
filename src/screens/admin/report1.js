import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import BottomNav from '../../components/BottomNav';
import firestore from '@react-native-firebase/firestore';
import FilterModal from '../../components/ClassFilterModal';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';

const Report1 = ({navigation}) => {
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [avgAgeBoys, setAvgAgeBoys] = useState(0);
  const [avgAgeGirls, setAvgAgeGirls] = useState(0);

  useEffect(() => {
    const fetchStudents = async () => {
      const studentList = [];
      const snapshot = await firestore().collection('students').get();

      snapshot.forEach(doc => {
        const s = doc.data();
        studentList.push({
          id: doc.id,
          registrationNo: doc.id,
          name: s.name,
          fatherName: s.fatherName,
          dob: s.dateOfBirth,
          gender: s.gender,
          class: s.admissionClass,
          age: s.age,
        });
      });

      setStudents(studentList);
      setFilteredStudents(studentList);
      calculateAverages(studentList);
    };

    fetchStudents();
  }, []);

  const calculateAverages = list => {
    const boys = list.filter(s => s.gender === 'Male');
    const girls = list.filter(s => s.gender === 'Female');

    const avgBoys =
      boys.length > 0
        ? (boys.reduce((a, b) => a + parseFloat(b.age), 0) / boys.length).toFixed(0)
        : 0;

    const avgGirls =
      girls.length > 0
        ? (girls.reduce((a, b) => a + parseFloat(b.age), 0) / girls.length).toFixed(0)
        : 0;

    setAvgAgeBoys(avgBoys);
    setAvgAgeGirls(avgGirls);
  };

  const handleFilterSelect = filter => {
    setSelectedFilter(filter);
    setShowFilterModal(false);

    if (filter) {
      const trimmed = filter.replace(/\s/g, '');
      const filtered = students.filter(
        s => s.class.replace(/\s/g, '') === trimmed,
      );
      setFilteredStudents(filtered);
      calculateAverages(filtered);
    } else {
      setFilteredStudents(students);
      calculateAverages(students);
    }
  };

  const generatePDF = async () => {
    let htmlContent = '<table border="1">';
    htmlContent += '<tr><th>R.No</th><th>Name</th><th>Father</th><th>DOB</th><th>Age</th></tr>';

    filteredStudents.forEach(s => {
      htmlContent += `<tr>
        <td>${s.registrationNo}</td>
        <td>${s.name}</td>
        <td>${s.fatherName}</td>
        <td>${s.dob}</td>
        <td>${s.age}</td>
      </tr>`;
    });

    htmlContent += '</table>';

    const file = await RNHTMLtoPDF.convert({
      html: htmlContent,
      fileName: 'student_report',
      directory: 'Documents',
    });

    await Share.open({url: `file://${file.filePath}`});
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#104E8B" barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerText}>Student Age Report</Text>

        <TouchableOpacity onPress={generatePDF}>
          <MaterialIcons name="file-download" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* FILTER */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setShowFilterModal(true)}>
          <MaterialIcons name="filter-list" size={20} color="#104E8B" />
          <Text style={styles.filterText}>
            {selectedFilter || 'Select Class'}
          </Text>
        </TouchableOpacity>
      </View>

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onSelect={handleFilterSelect}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ANALYTICS */}
        <Text style={styles.sectionTitle}>Analytics Overview</Text>

        <View style={styles.cards}>
          <LinearGradient colors={['#BDC3C7', '#2C3E50']} style={styles.card}>
            <Text style={styles.cardNumber}>{avgAgeBoys}</Text>
            <Text style={styles.cardLabel}>Avg Age Boys</Text>
          </LinearGradient>

          <LinearGradient colors={['#111', '#104E8B']} style={styles.card}>
            <Text style={styles.cardNumber}>{avgAgeGirls}</Text>
            <Text style={styles.cardLabel}>Avg Age Girls</Text>
          </LinearGradient>
        </View>

        {/* TABLE */}
        <Text style={styles.sectionTitle}>Student Details</Text>

        <ScrollView horizontal>
          <View style={styles.tableCard}>
            <View style={styles.tableHeaderRow}>
              <Text style={styles.thSmall}>R.No</Text>
              <Text style={styles.th}>Name</Text>
              <Text style={styles.th}>Father</Text>
              <Text style={styles.th}>DOB</Text>
              <Text style={styles.th}>Age</Text>
            </View>

            {filteredStudents.map(s => (
              <View key={s.id} style={styles.tr}>
                <Text style={styles.tdSmall}>{s.registrationNo}</Text>
                <Text style={styles.td}>{s.name}</Text>
                <Text style={styles.td}>{s.fatherName}</Text>
                <Text style={styles.td}>{s.dob}</Text>
                <Text style={styles.td}>{s.age}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>

      <BottomNav />
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f9',
  },

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
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },

  filterRow: {
    paddingHorizontal: 15,
    marginTop: 15,
  },

  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    elevation: 2,
  },

  filterText: {
    marginLeft: 10,
    color: '#333',
    fontWeight: '600',
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginLeft: 15,
    color: '#333',
  },

  cards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginTop: 15,
  },

  card: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },

  cardNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },

  cardLabel: {
    color: '#fff',
    marginTop: 5,
  },

  tableCard: {
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 12,
    padding: 10,
    elevation: 3,
  },

  tableHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingBottom: 8,
  },

  tr: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },

  th: {
    width: 120,
    fontWeight: 'bold',
    color: '#333',
  },

  thSmall: {
    width: 60,
    fontWeight: 'bold',
  },

  td: {
    width: 120,
    color: '#555',
  },

  tdSmall: {
    width: 60,
    color: '#555',
  },
});
export default Report1;