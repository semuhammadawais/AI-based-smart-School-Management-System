// RootDriverNavigation.js

import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';

import Home from '../screens/driver/home';

const DriverTabs = createStackNavigator();

const RootDriverNavigation = ({route}) => {
  const {role, driverData} = route.params || {};

  return (
    <DriverTabs.Navigator initialRouteName="DriverHome">
      {/* HOME */}
      <DriverTabs.Screen
        name="DriverHome"
        component={Home}
        initialParams={{role, driverData}}
        options={{
          headerShown: false,
        }}
      />
    </DriverTabs.Navigator>
  );
};

export default RootDriverNavigation;
