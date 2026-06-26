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
      try {
        const studentList = [];
        const snapshot = await firestore().collection('students').get();

        snapshot.forEach(doc => {
          const studentData = doc.data();
          studentList.push({
            id: doc.id,
            registrationNo: doc.id,
            name: studentData.name,
            fatherName: studentData.fatherName,
            dob: studentData.dateOfBirth,
            gender: studentData.gender,
            class: studentData.admissionClass,
            age: studentData.age,
          });
        });

        setStudents(studentList);
        setFilteredStudents(studentList);
        calculateAverages(studentList);
      } catch (error) {
        console.error(error);
      }
    };

    fetchStudents();
  }, []);

  const calculateAverages = studentList => {
    const boys = studentList.filter(s => s.gender === 'Male');
    const girls = studentList.filter(s => s.gender === 'Female');

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

    if (!filter) {
      setFilteredStudents(students);
      calculateAverages(students);
      return;
    }

    const clean = filter.replace(/\s/g, '');
    const filtered = students.filter(
      s => (s.class || '').replace(/\s/g, '') === clean,
    );

    setFilteredStudents(filtered);
    calculateAverages(filtered);
  };

  const generatePDF = async () => {
    let html = `<table border="1">
      <tr>
        <th>R.No</th><th>Name</th><th>Father</th><th>DOB</th><th>Age</th>
      </tr>`;

    filteredStudents.forEach(s => {
      html += `<tr>
        <td>${s.registrationNo}</td>
        <td>${s.name}</td>
        <td>${s.fatherName}</td>
        <td>${s.dob}</td>
        <td>${s.age}</td>
      </tr>`;
    });

    html += `</table>`;

    const file = await RNHTMLtoPDF.convert({
      html,
      fileName: 'student_report',
      directory: 'Documents',
    });

    await Share.open({url: `file://${file.filePath}`});
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#0F4C81" barStyle="light-content" />

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
          <MaterialIcons name="filter-list" size={20} color="#0F4C81" />
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

      {/* ANALYTICS */}
      <Text style={styles.sectionTitle}>Analytics Overview</Text>

      <View style={styles.cardRow}>
        <LinearGradient colors={['#BDC3C7', '#2C3E50']} style={styles.card}>
          <Text style={styles.cardValue}>{avgAgeBoys}</Text>
          <Text style={styles.cardLabel}>Avg Boys Age</Text>
        </LinearGradient>

        <LinearGradient colors={['#1F2A44', '#0F4C81']} style={styles.card}>
          <Text style={styles.cardValue}>{avgAgeGirls}</Text>
          <Text style={styles.cardLabel}>Avg Girls Age</Text>
        </LinearGradient>
      </View>

      {/* TABLE */}
      <Text style={styles.sectionTitle}>Student Details</Text>

      <ScrollView horizontal>
        <View style={styles.table}>
          <View style={styles.rowHeader}>
            <Text style={styles.h}>R.No</Text>
            <Text style={styles.h}>Name</Text>
            <Text style={styles.h}>Father</Text>
            <Text style={styles.h}>DOB</Text>
            <Text style={styles.h}>Age</Text>
          </View>

          {filteredStudents.map(s => (
            <View key={s.id} style={styles.row}>
              <Text style={styles.cell}>{s.registrationNo}</Text>
              <Text style={styles.cell}>{s.name}</Text>
              <Text style={styles.cell}>{s.fatherName}</Text>
              <Text style={styles.cell}>{s.dob}</Text>
              <Text style={styles.cell}>{s.age}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  );
};

export default Report1;

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F4F6F8'},

  header: {
    height: 80,
    backgroundColor: '#0F4C81',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    justifyContent: 'space-between',
  },

  headerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  filterRow: {
    padding: 15,
    alignItems: 'flex-end',
  },

  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    elevation: 3,
  },

  filterText: {
    marginLeft: 6,
    color: '#0F4C81',
    fontWeight: '600',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 15,
    marginVertical: 10,
    color: '#444',
  },

  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },

  card: {
    flex: 1,
    margin: 5,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },

  cardValue: {
    fontSize: 22,
    color: 'white',
    fontWeight: 'bold',
  },

  cardLabel: {
    color: 'white',
    marginTop: 5,
  },

  table: {
    padding: 10,
  },

  rowHeader: {
    flexDirection: 'row',
    backgroundColor: '#0F4C81',
    padding: 10,
  },

  h: {
    width: 90,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },

  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 8,
  },

  cell: {
    width: 90,
    textAlign: 'center',
    color: '#333',
  },
});