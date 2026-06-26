import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {NavigationContainer} from '@react-navigation/native';

import HomeScreen from '../screens/parents/home';
import ProfileScreen from '../screens/parents/profile';
import childAttendance from '../screens/parents/childAttendance';
import ParentEvent from '../screens/parents/ParentEvent';

const ParentsTabs = createStackNavigator();

const RootParentsNavigation = () => {
  return (
    <ParentsTabs.Navigator initialRouteName="Home">
      <ParentsTabs.Screen
        name="Home"
        component={HomeScreen}
        options={{headerShown: false}}
      />
      <ParentsTabs.Screen
        name="Profile"
        component={ProfileScreen}
        options={{headerShown: false}}
      />
      <ParentsTabs.Screen
        name="childAttendance"
        component={childAttendance}
        options={{headerShown: false}}
      />
         <ParentsTabs.Screen
        name="ParentEvent"
        component={ParentEvent}
        options={{headerShown: false}}
      />
    </ParentsTabs.Navigator>
  );
};

export default RootParentsNavigation;
