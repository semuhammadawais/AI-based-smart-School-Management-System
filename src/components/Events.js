import React, {useEffect, useState} from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';
import firestore from '@react-native-firebase/firestore';

const Events = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('Event')
      .onSnapshot(
        snapshot => {
          if (!snapshot) {
            console.log('Snapshot is null');
            return;
          }

          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));

          setEvents(data);
        },

        error => {
          console.log('Firestore Error:', error);
        },
      );

    return () => unsubscribe();
  }, []);

  return (
    <View style={styles.eventsContainer}>
      <Text style={styles.sectionTitle}>Upcoming Events</Text>

      {events.length === 0 ? (
        <Text>No Events Found</Text>
      ) : (
        events.map(event => (
          <View key={event.id} style={styles.eventCard}>
            {/* Image */}
            <Image
              source={{uri: event.imageUrl}}
              style={styles.eventImage}
              resizeMode="cover"
            />

            {/* Details */}
            <View style={styles.eventDetails}>
              <Text style={styles.eventName}>{event.eventName}</Text>

              <Text style={styles.eventLocation}>{event.eventLocation}</Text>
            </View>

            {/* Date */}
            <Text style={styles.eventDate}>{event.eventDate}</Text>
          </View>
        ))
      )}
    </View>
  );
};

export default Events;

const styles = StyleSheet.create({
  eventsContainer: {
    marginTop: 20,
    marginHorizontal: 1,
  },

  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  eventCard: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
  },

  eventImage: {
    width: 50,
    height: 50,
    borderRadius: 12,
    marginRight: 12,
  },

  eventDetails: {
    flex: 1,
  },

  eventName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },

  eventLocation: {
    fontSize: 12,
    color: '#888',
  },

  eventDate: {
    backgroundColor: '#E6F1FB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    fontSize: 11,
    color: '#104E8B',
    fontWeight: '700',
  },
});
