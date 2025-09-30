import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./components/AuthContext";

import PrivateRoute from "./components/PrivateRoute";
import RoleBasedRoute from "./components/RoleBasedRoute";
import AccessDenied from "./components/AccessDeniedComponent";
import NotFound from "./components/NotFound";
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
import ApproveClearanceTeachers from "./pages/ApproveClearanceTeachers";
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
import ViewMessagesStudent from "./pages/ViewMessagesStudent";
import DisciplinaryRecords from "./pages/DisciplinaryRecords";
import UpdateClass from "./pages/UpdateClass";
import ViewClass from "./pages/ViewClass";
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
import StudentGuidance from "./pages/StudentGuidance";
import ManageCounseling from "./pages/ManageCounseling";
import GuidanceReports from "./pages/GuidanceReports";

export const ROLES = {
  SUPER_ADMIN: "super-admin",
  ADMIN: "admin",
  FACULTY: "faculty",
  STUDENT: "student",

  LIBRARIAN: "Librarian",
  CHARACTER_RENEWAL: "Character Renewal Office",
  FINANCE: "Finance",
  BASIC_REGISTRAR: "Basic Education Registrar",
  COLLEGE_LIBRARY: "College Library",
  GUIDANCE: "Guidance Office",
  DEAN: "Office of The Dean",
  FINANCE_DIRECTOR: "Office of the Finance Director",
  REGISTRAR: "Office of the Registrar",
  PROPERTY: "Property Custodian",
  STUDENT_COUNCIL: "Student Council",
  DIRECTOR: "Director/Principal",
  OSAS: "OSAS",
};

const ROLE_GROUPS = {
  ADMINS: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  ALL_ADMINS: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  FACULTY_ONLY: [ROLES.FACULTY],
  STUDENT_ONLY: [ROLES.STUDENT],
  OFFICE_STAFF: [
    ROLES.LIBRARIAN,
    ROLES.CHARACTER_RENEWAL,
    ROLES.FINANCE,
    ROLES.BASIC_REGISTRAR,
    ROLES.COLLEGE_LIBRARY,
    ROLES.GUIDANCE,
    ROLES.DEAN,
    ROLES.FINANCE_DIRECTOR,
    ROLES.REGISTRAR,
    ROLES.PROPERTY,
    ROLES.STUDENT_COUNCIL,
    ROLES.DIRECTOR,
    ROLES.OSAS,
  ],
  CLEARANCE_OFFICES: [
    ROLES.LIBRARIAN,
    ROLES.CHARACTER_RENEWAL,
    ROLES.FINANCE,
    ROLES.BASIC_REGISTRAR,
    ROLES.COLLEGE_LIBRARY,
    ROLES.GUIDANCE,
    ROLES.DEAN,
    ROLES.FINANCE_DIRECTOR,
    ROLES.REGISTRAR,
    ROLES.PROPERTY,
    ROLES.STUDENT_COUNCIL,
    ROLES.DIRECTOR,
    ROLES.OSAS,
    ROLES.FACULTY,
  ],
  DISCIPLINARY_OFFICES: [
    ROLES.CHARACTER_RENEWAL,
    ROLES.GUIDANCE,
    ROLES.DEAN,
    ROLES.OSAS,
  ],
  FINANCIAL_OFFICES: [ROLES.FINANCE, ROLES.FINANCE_DIRECTOR],
  ACADEMIC_OFFICES: [ROLES.REGISTRAR, ROLES.DEAN, ROLES.DIRECTOR],
  ALL_STAFF: [],
};

ROLE_GROUPS.ALL_STAFF = [
  ...ROLE_GROUPS.ALL_ADMINS,
  ...ROLE_GROUPS.FACULTY_ONLY,
  ...ROLE_GROUPS.OFFICE_STAFF,
];

const combineRoles = (...roleGroups) => {
  const roles = new Set();
  roleGroups.forEach((group) => {
    if (Array.isArray(group)) {
      group.forEach((role) => roles.add(role));
    } else {
      roles.add(group);
    }
  });
  return Array.from(roles);
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <SignIn />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/access-denied",
    element: <AccessDenied />,
  },

  {
    path: "/dashboard",
    element: (
      <PrivateRoute>
        <Dashboard />
      </PrivateRoute>
    ),
  },

  {
    path: "/user-management",
    element: (
      <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
        <UserManagement />
      </RoleBasedRoute>
    ),
  },
  {
    path: "/create-user",
    element: (
      <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
        <CreateUser />
      </RoleBasedRoute>
    ),
  },

  {
    path: "/audit-log",
    element: (
      <RoleBasedRoute allowedRoles={ROLE_GROUPS.ALL_ADMINS}>
        <AuditLogs />
      </RoleBasedRoute>
    ),
  },
  {
    path: "/classes",
    element: (
      <RoleBasedRoute allowedRoles={ROLE_GROUPS.ALL_ADMINS}>
        <Classes />
      </RoleBasedRoute>
    ),
  },
  {
    path: "/create-class",
    element: (
      <RoleBasedRoute allowedRoles={ROLE_GROUPS.ALL_ADMINS}>
        <CreateClass />
      </RoleBasedRoute>
    ),
  },
  {
    path: "/update-class/:classId",
    element: (
      <RoleBasedRoute allowedRoles={ROLE_GROUPS.ALL_ADMINS}>
        <UpdateClass />
      </RoleBasedRoute>
    ),
  },
  {
    path: "/class/:classId",
    element: (
      <RoleBasedRoute
        allowedRoles={combineRoles(ROLE_GROUPS.ALL_ADMINS, ROLES.FACULTY)}
      >
        <ViewClass />
      </RoleBasedRoute>
    ),
  },
  {
    path: "/create-teacher",
    element: (
      <RoleBasedRoute allowedRoles={ROLE_GROUPS.ALL_ADMINS}>
        <CreateTeacherPage />
      </RoleBasedRoute>
    ),
  },
  {
    path: "/create-student",
    element: (
      <RoleBasedRoute allowedRoles={ROLE_GROUPS.ALL_ADMINS}>
        <CreateStudent />
      </RoleBasedRoute>
    ),
  },

  {
    path: "/students",
    element: (
      <RoleBasedRoute
        allowedRoles={combineRoles(
          ROLE_GROUPS.ALL_ADMINS,
          ROLES.FINANCE,
          ROLES.OSAS,
          ROLES.REGISTRAR
        )}
      >
        <Students />
      </RoleBasedRoute>
    ),
  },
  {
    path: "/student-master-list",
    element: (
      <RoleBasedRoute
        allowedRoles={combineRoles(
          ROLE_GROUPS.ALL_ADMINS,
          ROLES.FACULTY,
          ROLES.CHARACTER_RENEWAL,
          ROLES.FINANCE,
          ROLES.GUIDANCE,
          ROLES.DEAN,
          ROLES.OSAS
        )}
      >
        <StudentsMasterList />
      </RoleBasedRoute>
    ),
  },

  {
    path: "/teachers",
    element: (
      <RoleBasedRoute
        allowedRoles={combineRoles(
          ROLE_GROUPS.ALL_ADMINS,
          ROLES.REGISTRAR,
          ROLES.DIRECTOR
        )}
      >
        <Teachers />
      </RoleBasedRoute>
    ),
  },

  {
    path: "/approve-clearance-faculty",
    element: (
      <RoleBasedRoute allowedRoles={[ROLES.FACULTY]}>
        <ApproveClearanceTeachers />
      </RoleBasedRoute>
    ),
  },
  {
    path: "/manage-requirements",
    element: (
      <RoleBasedRoute allowedRoles={[ROLES.FACULTY]}>
        <ManageRequirements />
      </RoleBasedRoute>
    ),
  },
  {
    path: "/view-classes",
    element: (
      <RoleBasedRoute
        allowedRoles={combineRoles(ROLE_GROUPS.ALL_ADMINS, ROLES.FACULTY)}
      >
        <ViewClasses />
      </RoleBasedRoute>
    ),
  },
  {
    path: "/class-details/:classId",
    element: (
      <RoleBasedRoute
        allowedRoles={combineRoles(ROLE_GROUPS.ALL_ADMINS, ROLES.FACULTY)}
      >
        <ClassDetails />
      </RoleBasedRoute>
    ),
  },
  {
    path: "/class-details-adviser/:classId",
    element: (
      <RoleBasedRoute allowedRoles={[ROLES.FACULTY]}>
        <ClassDetailsForAdviser />
      </RoleBasedRoute>
    ),
  },
  {
    path: "/add-requirement",
    element: (
      <RoleBasedRoute
        allowedRoles={combineRoles(ROLE_GROUPS.ALL_ADMINS, ROLES.FACULTY)}
      >
        <AddRequirement />
      </RoleBasedRoute>
    ),
  },

  {
    path: "/student-clearance",
    element: (
      <RoleBasedRoute allowedRoles={[ROLES.STUDENT]}>
        <StudentClearance />
      </RoleBasedRoute>
    ),
  },
  {
    path: "/view-messages-student",
    element: (
      <RoleBasedRoute allowedRoles={[ROLES.STUDENT]}>
        <ViewMessagesStudent />
      </RoleBasedRoute>
    ),
  },
  {
    path: "/activity-log",
    element: (
      <RoleBasedRoute allowedRoles={[ROLES.STUDENT]}>
        <ActivityLog />
      </RoleBasedRoute>
    ),
  },
  {
    path: "/approve-clearance-office",
    element: (
      <RoleBasedRoute allowedRoles={ROLE_GROUPS.CLEARANCE_OFFICES}>
        <ApproveClearanceOffice />
      </RoleBasedRoute>
    ),
  },
  {
    path: "/manage-office-requirements",
    element: (
      <RoleBasedRoute allowedRoles={ROLE_GROUPS.CLEARANCE_OFFICES}>
        <ManageOfficeRequirements />
      </RoleBasedRoute>
    ),
  },
  {
    path: "/add-office-requirement",
    element: (
      <RoleBasedRoute allowedRoles={ROLE_GROUPS.CLEARANCE_OFFICES}>
        <AddOfficeRequirement />
      </RoleBasedRoute>
    ),
  },
  {
    path: "/office-clearance-manual",
    element: (
      <RoleBasedRoute allowedRoles={ROLE_GROUPS.CLEARANCE_OFFICES}>
        <OfficeClearanceManual />
      </RoleBasedRoute>
    ),
  },

  {
    path: "/disciplinary-records",
    element: (
      <RoleBasedRoute
        allowedRoles={combineRoles(
          ROLE_GROUPS.ALL_ADMINS,
          ROLE_GROUPS.DISCIPLINARY_OFFICES
        )}
      >
        <DisciplinaryRecords />
      </RoleBasedRoute>
    ),
  },

  {
    path: "/school-events",
    element: (
      <RoleBasedRoute
        allowedRoles={combineRoles(
          ROLE_GROUPS.ALL_ADMINS,
          ROLES.FACULTY,
          ROLES.DEAN,
          ROLES.STUDENT_COUNCIL,
          ROLES.OSAS
        )}
      >
        <SchoolEvents />
      </RoleBasedRoute>
    ),
  },

  {
    path: "/send-payment-confirmation",
    element: (
      <RoleBasedRoute
        allowedRoles={combineRoles(ROLE_GROUPS.ALL_ADMINS, ROLES.FINANCE)}
      >
        <SendPaymentConfirmationEmail />
      </RoleBasedRoute>
    ),
  },

  {
    path: "/view-messages",
    element: (
      <RoleBasedRoute
        allowedRoles={combineRoles(
          ROLE_GROUPS.ALL_ADMINS,
          ROLE_GROUPS.CLEARANCE_OFFICES
        )}
      >
        <ViewMessages />
      </RoleBasedRoute>
    ),
  },
  {
    path: "/chat/:recipientId",
    element: (
      <PrivateRoute>
        <Chat />
      </PrivateRoute>
    ),
  },

  {
    path: "/404",
    element: <NotFound />,
  },
  {
    path: "*",
    element: <Navigate to="/404" replace />,
  },
]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
