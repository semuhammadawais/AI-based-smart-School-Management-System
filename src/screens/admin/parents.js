import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MenuModal from '../../components/MenuModal';
import firestore from '@react-native-firebase/firestore';
import Spinner from '../../components/Spinner';

const Parents = ({navigation}) => {
  const [parents, setParents] = useState([]);
  const [filteredParents, setFilteredParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenuOptions, setShowMenuOptions] = useState(false);

  /* ─── FETCH PARENTS ─── */
  useEffect(() => {
    const fetchParents = async () => {
      try {
        const list = [];

        const snapshot = await firestore()
          .collection('users')
          .where('role', '==', 'parent')
          .get();

        snapshot.forEach(doc => {
          list.push({
            id: doc.id,
            ...doc.data(),
          });
        });

        setParents(list);
        setFilteredParents(list);
        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    };

    fetchParents();
  }, []);

  /* ─── SEARCH ─── */
  const handleSearch = query => {
    setSearchQuery(query);

    if (query) {
      const filtered = parents.filter(p =>
        p.name.toLowerCase().includes(query.toLowerCase()),
      );
      setFilteredParents(filtered);
    } else {
      setFilteredParents(parents);
    }
  };

  /* ─── DELETE PARENT ─── */
  const deleteParent = async parentId => {
    try {
      await firestore().collection('users').doc(parentId).delete();

      setParents(prev => prev.filter(p => p.id !== parentId));
      setFilteredParents(prev => prev.filter(p => p.id !== parentId));

      Alert.alert('Success', 'Parent deleted');
    } catch (error) {
      Alert.alert('Error', 'Delete failed');
    }
  };

  const confirmDelete = id => {
    Alert.alert('Delete Parent', 'Are you sure?', [
      {text: 'Cancel'},
      {text: 'Delete', onPress: () => deleteParent(id)},
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#104E8B" barStyle="light-content" />
      {loading && <Spinner />}

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerText}>Parents</Text>

        <TouchableOpacity onPress={() => setShowMenuOptions(true)}>
          <MaterialIcons name="more-vert" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <MenuModal
        visible={showMenuOptions}
        onClose={() => setShowMenuOptions(false)}
        onNavigate={() => navigation.navigate('parentsForm')}
        buttonText="Add Parent"
      />

      {/* ── SEARCH ── */}
      <View style={styles.searchBox}>
        <MaterialIcons name="search" size={22} color="#777" />
        <TextInput
          placeholder="Search parents..."
          placeholderTextColor="#999"
          style={styles.input}
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {/* ── LIST ── */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {filteredParents.map(parent => (
          <View key={parent.id} style={styles.card}>
            {/* Avatar */}
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {parent.name?.charAt(0).toUpperCase()}
              </Text>
            </View>

            {/* Info */}
            <View style={{flex: 1}}>
              <Text style={styles.name}>{parent.name}</Text>
              <Text style={styles.email}>{parent.email}</Text>
              <Text style={styles.role}>Role: Parent</Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('ParentForm', {
                    parentId: parent.id,
                  })
                }>
                <MaterialIcons name="visibility" size={22} color="#104E8B" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => confirmDelete(parent.id)}>
                <MaterialIcons name="delete" size={22} color="red" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('ParentsForm')}>
        <MaterialIcons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
};

export default Parents;

/* ─── STYLES ─── */
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#EEF2F7'},

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

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 15,
    borderRadius: 12,
    paddingHorizontal: 12,
    elevation: 3,
  },

  input: {
    flex: 1,
    padding: 10,
    fontSize: 15,
  },

  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginBottom: 12,
    padding: 12,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 3,
  },

  avatar: {
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: '#104E8B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },

  email: {
    fontSize: 13,
    color: '#555',
    marginTop: 2,
  },

  role: {
    fontSize: 11,
    color: '#999',
  },

  actions: {
    justifyContent: 'space-between',
    height: 50,
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