import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const FilterModal = ({visible, onClose, onSelect}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      
      {/* Overlay */}
      <View style={styles.overlay}>
        
        {/* Bottom Sheet */}
        <View style={styles.sheet}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Select Class</Text>

            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Options */}
          <ScrollView showsVerticalScrollIndicator={false}>
            
            <TouchableOpacity
              style={styles.item}
              onPress={() => onSelect(null)}>
              <Text style={styles.itemText}>All Classes</Text>
            </TouchableOpacity>

            {Array.from({length: 10}, (_, i) => i + 1).map(num => (
              <TouchableOpacity
                key={num}
                style={styles.item}
                onPress={() => onSelect(`Class ${num}`)}>
                <Text style={styles.itemText}>Class {num}</Text>
              </TouchableOpacity>
            ))}
            
          </ScrollView>

        </View>
      </View>
    </Modal>
  );
};

export default FilterModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingBottom: 20,
    maxHeight: '70%',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#104E8B',
  },

  item: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },

  itemText: {
    fontSize: 16,
    color: '#333',
  },
});