import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./components/AuthContext";

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

const router = createBrowserRouter([
  { path: "/", element: <SignIn /> },
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/teachers", element: <Teachers /> },
  { path: "/create-teacher", element: <CreateTeacherPage /> },
  { path: "/classes", element: <Classes /> },
  { path: "/create-class", element: <CreateClass /> },
  { path: "/students", element: <Students /> },
  { path: "/create-student", element: <CreateStudent /> },
  { path: "/add-requirement", element: <AddRequirement /> },
  { path: "/student-clearance", element: <StudentClearance /> },
  { path: "/approve-clearance-faculty", element: <ApproveClearanceTeachers />},
  { path: "/user-management", element: <UserManagement /> },
  { path: "/create-user", element: <CreateUser />},
  { path: "/add-office-requirement", element: <AddOfficeRequirement />},
  { path: "/approve-clearance-office", element: <ApproveClearanceOffice />},
  { path: "/view-classes", element: <ViewClasses />},
  { path: "/class-details/:classId", element: <ClassDetails />},
  { path: "/class-details-adviser/:classId", element: <ClassDetailsForAdviser />},
  { path: "/audit-log", element: <AuditLogs />},
  { path: "/student-master-list", element: <StudentsMasterList />},
  { path: "/chat/:recipientId", element: <Chat />},
  { path: "/view-messages", element: <ViewMessages />},
  { path: "/view-messages-student", element: <ViewMessagesStudent />},
  { path: "/disciplinary-records", element: <DisciplinaryRecords />},
  { path: "/update-class/:classId", element: <UpdateClass />},
  { path: "/manage-requirements", element: <ManageRequirements />},
  { path: "/manage-office-requirements", element: <ManageOfficeRequirements />},
  { path: "/office-clearance-manual", element: <OfficeClearanceManual />},
  { path: "/forgot-password", element: <ForgotPassword />},
  { path: "/school-events", element: <SchoolEvents />},
  { path: "/send-payment-confirmation", element: <SendPaymentConfirmationEmail />}
]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
