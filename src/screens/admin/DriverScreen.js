import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';

import firestore from '@react-native-firebase/firestore';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const DriversScreen = ({navigation}) => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('Drivers')
      .onSnapshot(snapshot => {
        const list = [];
        snapshot.forEach(doc => {
          list.push({id: doc.id, ...doc.data()});
        });
        setDrivers(list);
        setLoading(false);
      });

    return () => unsubscribe();
  }, []);

  const renderDriver = ({item}) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.iconBox}>
        <MaterialCommunityIcons name="bus-school" size={26} color="#104E8B" />
      </View>

      <View style={{flex: 1}}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.subText}>📧 {item.email}</Text>
        <Text style={styles.subText}>📱 {item.phone}</Text>
        <Text style={styles.subText}>🚌 Bus: {item.busNumber || 'N/A'}</Text>
        <Text style={styles.subText}>📍 Route: {item.route || 'N/A'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#104E8B" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerText}>Drivers</Text>

        <TouchableOpacity
          onPress={() => navigation.navigate('AddDriverScreen')}>
          <MaterialIcons name="more-vert" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* List */}
      <View style={styles.body}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color="#104E8B"
            style={{marginTop: 60}}
          />
        ) : drivers.length === 0 ? (
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons name="bus-off" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No drivers found</Text>
          </View>
        ) : (
          <FlatList
            data={drivers}
            keyExtractor={item => item.id}
            renderItem={renderDriver}
            contentContainerStyle={{paddingBottom: 100, paddingTop: 10}}
          />
        )}
      </View>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddDriverScreen')}>
        <MaterialIcons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF2F7',
  },

  header: {
    height: 80,
    backgroundColor: '#104E8B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 30,
    elevation: 5,
  },

  headerText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },

  body: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: 10,
  },

  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },

  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#EEF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  name: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
  },

  subText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 80,
  },

  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#9CA3AF',
  },

  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#104E8B',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
});

export default DriversScreen;
