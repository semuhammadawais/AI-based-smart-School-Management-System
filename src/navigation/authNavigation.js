// Navigation.js
import React from 'react';
import {createStackNavigator, TransitionPresets} from '@react-navigation/stack';
import SignUpScreen from '../screens/authScreens/signup';
import LoginScreen from '../screens/authScreens/login';
import RootClientTabs from './ClientTabs';
import StudentScreen from '../screens/admin/students';
import TeacherScreen from '../screens/admin/teachers';
import StudentForm from '../screens/admin/studentForm';
import RoleSelectionScreen from '../screens/roles';
import RootStudentNavigation from './StudentTabs';
import RootTeacherNavigation from './TeacherTabs';
import RootDriverNavigation from './DriverTabs';
import TeacherForm from '../screens/admin/TeacherForm';
import UploadSyllabusScreen from '../screens/admin/syllabus';
import UploadTimetableScreen from '../screens/admin/timetable';
import TeacherProfile from '../screens/admin/TeacherProfile';
import Parents from '../screens/admin/parents';
import ParentsForm from '../screens/admin/parentsForm';
import RootParentsNavigation from './ParentsTabs';
import Teacher from './TeacherTabs';
import StudentsList from '../screens/teacher/studentsList';
import AttendanceScreen from '../screens/teacher/attendance';
import AttendanceReport from '../screens/teacher/attendanceReport';
import SubjectScreen from '../screens/student/subjectScreen';
import StudentAttendanceScreen from '../screens/student/StudentAttendanceScreen';
import addMarksScreen from '../screens/teacher/addMarksScreen';
import StudentResultScreen from '../screens/student/StudentResultScreen';
import events from '../screens/student/events';
import timetable from '../screens/student/timetable';
import Profile from '../screens/parents/profile';
import childAttendance from '../screens/parents/childAttendance';
import ChildResult from '../screens/parents/ChildResult';
import ParentEvent from '../screens/parents/ParentEvent';
import AttendanceHome from '../screens/admin/AttendanceHome';
import GenerateAttendanceQR from '../screens/admin/GenerateAttendanceQR';
import ScanAttendance from '../screens/teacher/ScanAttendance';
import LiveAttendanceScreen from '../screens/admin/LiveAttendanceScreen';
import AttendanceReportScreen from '../screens/admin/AttendanceReportScreen';
import AdminEvent from '../screens/admin/AdminEvent';
import RulesScreen from '../screens/admin/RulesScreen';
import ParentsRules from '../screens/parents/Rules';
import TeacherRules from '../screens/teacher/TeacherRules';
import StudentRules from '../screens/student/StudentRules';
import AddDriverScreen from '../screens/admin/AddDriverScreen';
import DriverScreen from '../screens/admin/DriverScreen';
import TrackingScreen from '../screens/driver/TrackingScreen';
import LiveBusMap from '../screens/parents/LiveBusMap';
import AIOverviewScreen from '../screens/parents/AIOverviewScreen';
import StudentAIScreen from '../screens/student/StudentAIScreen';
import TeacherAIHubScreen from '../screens/teacher/TeacherAIHubScreen';

const Stack = createStackNavigator();

const AuthNavigation = () => {
  return (
    <Stack.Navigator initialRouteName="RoleScreen">
      <Stack.Screen
        name="RoleScreen"
        component={RoleSelectionScreen}
        options={{
          headerShown: false,
        }}></Stack.Screen>
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{
          headerShown: false,
        }}></Stack.Screen>
      <Stack.Screen
        name="SignUp"
        component={SignUpScreen}
        options={{
          headerShown: false,
        }}></Stack.Screen>
      <Stack.Screen
        name="RootClientTabs"
        component={RootClientTabs}
        options={{
          headerShown: false,
        }}></Stack.Screen>

      <Stack.Screen
        name="RootParentsNavigation"
        component={RootParentsNavigation}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="RootDriverNavigation"
        component={RootDriverNavigation}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="RootStudentNavigation"
        component={RootStudentNavigation}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="RootTeacherNavigation"
        component={RootTeacherNavigation}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="StudentsScreen"
        component={StudentScreen}
        options={{
          headerShown: false,
        }}></Stack.Screen>
      <Stack.Screen
        name="TeacherScreen"
        component={TeacherScreen}
        options={{
          headerShown: false,
        }}></Stack.Screen>
      <Stack.Screen
        name="StudentForm"
        component={StudentForm}
        options={{
          headerShown: false,
        }}></Stack.Screen>
      <Stack.Screen
        name="TeacherForm"
        component={TeacherForm}
        options={{
          headerShown: false,
        }}></Stack.Screen>
      <Stack.Screen
        name="Syllabus"
        component={UploadSyllabusScreen}
        options={{
          headerShown: false,
        }}></Stack.Screen>
      <Stack.Screen
        name="TimeTable"
        component={UploadTimetableScreen}
        options={{
          headerShown: false,
        }}></Stack.Screen>
      <Stack.Screen
        name="TeacherProfile"
        component={TeacherProfile}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ParentsScreen"
        component={Parents}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ParentsForm"
        component={ParentsForm}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="AttendanceHome"
        component={AttendanceHome}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="LiveAttendanceScreen"
        component={LiveAttendanceScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="AttendanceReportScreen"
        component={AttendanceReportScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="GenerateAttendanceQR"
        component={GenerateAttendanceQR}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="AdminEvent"
        component={AdminEvent}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="AddDriverScreen"
        component={AddDriverScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="DriverScreen"
        component={DriverScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="RulesScreen"
        component={RulesScreen}
        options={{headerShown: false}}
      />

      <Stack.Screen
        name="StudentsList"
        component={StudentsList}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="AttendanceReport"
        component={AttendanceReport}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="subjectScreen"
        component={SubjectScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="StudentAttendanceScreen"
        component={StudentAttendanceScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="addMarksScreen"
        component={addMarksScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="StudentResultScreen"
        component={StudentResultScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="events"
        component={events}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="Timetable"
        component={timetable}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ScanAttendance"
        component={ScanAttendance}
        options={{headerShown: false}}
      />

      <Stack.Screen // ✅ NEW Parents SCREEN
        name="Profile"
        component={Profile}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="childAttendance"
        component={childAttendance}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ChildResult"
        component={ChildResult}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ParentEvent"
        component={ParentEvent}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="ParentsRules"
        component={ParentsRules}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="TeacherRules"
        component={TeacherRules}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="StudentRules"
        component={StudentRules}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="TrackingScreen"
        component={TrackingScreen}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="LiveBusMap"
        component={LiveBusMap}
        options={{headerShown: false}}
      />
      <Stack.Screen
        name="AIOverviewScreen"
        component={AIOverviewScreen}
        options={{headerShown: false}}
      />
       <Stack.Screen
        name="StudentAIScreen"
        component={StudentAIScreen}
        options={{headerShown: false}}
      />
       <Stack.Screen
        name="TeacherAIHubScreen"
        component={TeacherAIHubScreen}
        options={{headerShown: false}}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigation;
