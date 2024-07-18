import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./components/AuthContext";

import PrivateRoute from "./components/PrivateRoute";
import RoleBasedRoute from "./components/RoleBasedRoute";
import AccessDenied from "./components/AccessDeniedComponent";
import SignIn from "./pages/SignIn";
import Dashboard from "./pages/Dashboard";
import Teachers from "./pages/Teachers";
import CreateTeacherPage from "./pages/CreateTeacherPage";
import Classes from "./pages/Classes";
import CreateClass from "./pages/CreateClass";
import Students from "./pages/Students";
import CreateStudent from "./pages/CreateStudent";
import AddRequirement from "./pages/AddRequirements";
import StudentClearance from "./pages/StudentClearance";
import ApproveClearanceTeachers from "./pages/ApproveClearanceTeachers"
import UserManagement from "./pages/UserManagement";
import AddOfficeRequirement from "./pages/AddOfficeRequirement";
import CreateUser from "./pages/CreateUser";
import ApproveClearanceOffice from "./pages/ApproveClearanceOffice";
import ViewClasses from "./pages/ViewClasses";
import ClassDetails from "./pages/ClassDetails";
import ClassDetailsForAdviser from "./pages/ClassDetailsForAdviser";
import AuditLogs from "./pages/AuditLogs";
import StudentsMasterList from "./pages/StudentsMasterList";
import Chat from "./pages/Chat";
import ViewMessages from "./pages/ViewMessages";
import ViewMessagesStudent from "./pages/ViewMessagesStudent"
import DisciplinaryRecords from "./pages/DisciplinaryRecords";
import UpdateClass from "./pages/UpdateClass";
import ManageRequirements from "./pages/ManageRequirements";
import ManageOfficeRequirements from "./pages/ManageOfficeRequirements";
import OfficeClearanceManual from "./pages/OfficeClearanceManual";
import ForgotPassword from "./pages/ForgotPassword";
import SchoolEvents from "./pages/SchoolEvents";
import SendPaymentConfirmationEmail from "./pages/SendPaymentConfirmationEmail";
import Settings from "./pages/Settings";
import ActivityLog from "./pages/ActivityLog";
import Notification from "./pages/Notifications";
import StudentDashboard from "./pages/StudentDashboard";
import ChangePassword from "./pages/ChangePassword";


const router = createBrowserRouter([
  { path: "/", element: <SignIn /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/access-denied", element: <AccessDenied /> },
  { path: "/dashboard", element: <PrivateRoute><Dashboard /></PrivateRoute> },
  { path: "/settings", element: <PrivateRoute><Settings /></PrivateRoute> },
  { 
    path: "/disciplinary-records", 
    element: <RoleBasedRoute allowedRoles={['admin', 'super-admin', 'Character Renewal Office', 'Guidance Office', 'Office of The Dean', 'OSAS']}>
      <DisciplinaryRecords />
    </RoleBasedRoute> 
  },
  { 
    path: "/classes", 
    element: <RoleBasedRoute allowedRoles={['admin', 'super-admin']}>
      <Classes />
    </RoleBasedRoute> 
  },
  { 
    path: "/student-master-list", 
    element: <RoleBasedRoute allowedRoles={['admin', 'super-admin', 'faculty', 'Character Renewal Office', 'Finance', 'Guidance Office', 'Office of The Dean', 'OSAS']}>
      <StudentsMasterList />
    </RoleBasedRoute> 
  },
  { 
    path: "/students", 
    element: <RoleBasedRoute allowedRoles={['admin', 'super-admin', 'Finance', 'OSAS', 'Office of the Registrar']}>
      <Students />
    </RoleBasedRoute> 
  },
  { 
    path: "/teachers", 
    element: <RoleBasedRoute allowedRoles={['admin', 'super-admin', 'Office of the Registrar', 'Director/Principal']}>
      <Teachers />
    </RoleBasedRoute> 
  },
  { 
    path: "/school-events", 
    element: <RoleBasedRoute allowedRoles={['admin', 'super-admin', 'faculty', 'Office of The Dean', 'Student Council', 'OSAS']}>
      <SchoolEvents />
    </RoleBasedRoute> 
  },
  { 
    path: "/send-payment-confirmation", 
    element: <RoleBasedRoute allowedRoles={['admin', 'super-admin', 'Finance']}>
      <SendPaymentConfirmationEmail />
    </RoleBasedRoute> 
  },
  { 
    path: "/user-management", 
    element: <RoleBasedRoute allowedRoles={['super-admin']}>
      <UserManagement />
    </RoleBasedRoute> 
  },
  { 
    path: "/audit-log", 
    element: <RoleBasedRoute allowedRoles={['admin', 'super-admin']}>
      <AuditLogs />
    </RoleBasedRoute> 
  },
  { 
    path: "/view-messages", 
    element: <RoleBasedRoute allowedRoles={['admin', 'super-admin', 'faculty', 'Character Renewal Office', 'Finance', 'Guidance Office', 'Office of The Dean', 'Student Council', 'OSAS', 'Librarian']}>
      <ViewMessages />
    </RoleBasedRoute> 
  },
  { 
    path: "/approve-clearance-faculty", 
    element: <RoleBasedRoute allowedRoles={['faculty']}>
      <ApproveClearanceTeachers />
    </RoleBasedRoute> 
  },
  { 
    path: "/manage-requirements", 
    element: <RoleBasedRoute allowedRoles={['faculty']}>
      <ManageRequirements />
    </RoleBasedRoute> 
  },
  { 
    path: "/view-classes", 
    element: <RoleBasedRoute allowedRoles={['faculty']}>
      <ViewClasses />
    </RoleBasedRoute> 
  },
  { 
    path: "/student-clearance", 
    element: <RoleBasedRoute allowedRoles={['student']}>
      <StudentClearance />
    </RoleBasedRoute> 
  },
  { 
    path: "/view-messages-student", 
    element: <RoleBasedRoute allowedRoles={['student']}>
      <ViewMessagesStudent />
    </RoleBasedRoute> 
  },
  { 
    path: "/activitylog", 
    element: <RoleBasedRoute allowedRoles={['student']}>
      <ActivityLog />
    </RoleBasedRoute> 
  },
  { 
    path: "/notifications", 
    element: <RoleBasedRoute allowedRoles={['student']}>
      <Notification />
    </RoleBasedRoute> 
  },
  { 
    path: "/studentdashboard", 
    element: <RoleBasedRoute allowedRoles={['student']}>
      <StudentDashboard />
    </RoleBasedRoute> 
  },
  { 
    path: "/changepassword", 
    element: <RoleBasedRoute allowedRoles={['student']}>
      <ChangePassword />
    </RoleBasedRoute> 
  },
  { 
    path: "/approve-clearance-office", 
    element: <RoleBasedRoute allowedRoles={['Character Renewal Office', 'Finance', 'Guidance Office', 'Office of The Dean', 'Student Council', 'OSAS', 'Librarian']}>
      <ApproveClearanceOffice />
    </RoleBasedRoute> 
  },
  { 
    path: "/manage-office-requirements", 
    element: <RoleBasedRoute allowedRoles={['Character Renewal Office', 'Finance', 'Guidance Office', 'Office of The Dean', 'Student Council', 'OSAS', 'Librarian']}>
      <ManageOfficeRequirements />
    </RoleBasedRoute> 
  },
  { 
    path: "/create-teacher", 
    element: <RoleBasedRoute allowedRoles={['admin', 'super-admin']}>
      <CreateTeacherPage />
    </RoleBasedRoute> 
  },
  { 
    path: "/create-class", 
    element: <RoleBasedRoute allowedRoles={['admin', 'super-admin']}>
      <CreateClass />
    </RoleBasedRoute> 
  },
  { 
    path: "/create-student", 
    element: <RoleBasedRoute allowedRoles={['admin', 'super-admin']}>
      <CreateStudent />
    </RoleBasedRoute> 
  },
  { 
    path: "/add-requirement", 
    element: <RoleBasedRoute allowedRoles={['admin', 'super-admin', 'faculty']}>
      <AddRequirement />
    </RoleBasedRoute> 
  },
  { 
    path: "/create-user", 
    element: <RoleBasedRoute allowedRoles={['super-admin']}>
      <CreateUser />
    </RoleBasedRoute> 
  },
  { 
    path: "/add-office-requirement", 
    element: <RoleBasedRoute allowedRoles={['Character Renewal Office', 'Finance', 'Guidance Office', 'Office of The Dean', 'Student Council', 'OSAS']}>
      <AddOfficeRequirement />
    </RoleBasedRoute> 
  },
  { 
    path: "/view-classes", 
    element: <RoleBasedRoute allowedRoles={['admin', 'super-admin', 'faculty']}>
      <ViewClasses />
    </RoleBasedRoute> 
  },
  { 
    path: "/class-details/:classId", 
    element: <RoleBasedRoute allowedRoles={['admin', 'super-admin', 'faculty']}>
      <ClassDetails />
    </RoleBasedRoute> 
  },
  { 
    path: "/class-details-adviser/:classId", 
    element: <RoleBasedRoute allowedRoles={['faculty']}>
      <ClassDetailsForAdviser />
    </RoleBasedRoute> 
  },
  { 
    path: "/chat/:recipientId", 
    element: <PrivateRoute>
      <Chat />
    </PrivateRoute> 
  },
  { 
    path: "/update-class/:classId", 
    element: <RoleBasedRoute allowedRoles={['admin', 'super-admin']}>
      <UpdateClass />
    </RoleBasedRoute> 
  },
  { 
    path: "/office-clearance-manual", 
    element: <RoleBasedRoute allowedRoles={['Character Renewal Office', 'Finance', 'Guidance Office', 'Office of The Dean', 'Student Council', 'OSAS', 'Librarian']}>
      <OfficeClearanceManual />
    </RoleBasedRoute> 
  }
]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;