import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../components/AuthContext";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import moment from "moment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faTimesCircle,
  faAngleDown,
  faAngleUp,
  faSearch,
  faFilter,
  faBuilding,
  faUserCheck,
  faClipboardCheck,
  faExclamationTriangle,
  faInfoCircle,
  faThLarge,
  faListUl,
  faCheckDouble,
  faUsers,
  faChartLine,
  faClock,
  faGraduationCap,
  faIdCard,
  faEnvelope,
  faLayerGroup,
  faSpinner,
  faFileAlt,
  faUserGraduate,
  faPercentage,
  faCalendarAlt,
  faInbox,
  faBell,
  faClipboardList,
  faHandPaper,
  faCommentDots,
  faExclamationCircle,
  faHistory,
  faCheckSquare,
  faWindowClose,
  faHourglassHalf,
  faCalendarCheck,
} from "@fortawesome/free-solid-svg-icons";

function OfficeClearanceManagement() {
  const { currentUser, userRole } = useAuth();

  const [activeTab, setActiveTab] = useState("requests");

  const [students, setStudents] = useState([]);
  const [originalStudents, setOriginalStudents] = useState([]);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  const [clearanceRequests, setClearanceRequests] = useState([]);
  const [originalRequests, setOriginalRequests] = useState([]);
  const [expandedRequestId, setExpandedRequestId] = useState(null);
  const [requestToReject, setRequestToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [educationLevelFilter, setEducationLevelFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [availableSections, setAvailableSections] = useState([]);
  const [availableEducationLevels, setAvailableEducationLevels] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [officeName, setOfficeName] = useState("");
  const [userDepartment, setUserDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [studentsToClear, setStudentsToClear] = useState([]);
  const [statistics, setStatistics] = useState({
    total: 0,
    cleared: 0,
    pending: 0,
    clearanceRate: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
  });

  const [debugInfo, setDebugInfo] = useState({
    userFetchStatus: "pending",
    officeName: "",
    userRole: "",
    dataFetchStatus: "pending",
    error: null,
  });

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!currentUser) return;

      try {
        const userRef = collection(db, "users");
        const userQuery = query(userRef, where("uid", "==", currentUser.uid));
        const userDoc = await getDocs(userQuery);

        if (userDoc.empty) {
          console.error("No user document found");
          setLoading(false);
          return;
        }

        const userData = userDoc.docs[0].data();
        const role = userData.role;
        setUserDepartment(userData.department || null);

        const officeMapping = {
          librarian: "Librarian",
          finance: "Finance",
          registrarbasiced: "Basic Education Registrar",
          characterrenewalofficer: "Character Renewal Office",
          "college library": "College Library",
          "guidance office": "Guidance Office",
          "office of the dean": "Office of The Dean",
          "office of the finance director": "Office of the Finance Director",
          "office of the registrar": "Office of the Registrar",
          "property custodian": "Property Custodian",
          "student council": "Student Council",
        };

        const normalizedRole = role.toLowerCase();
        const mappedOfficeName = officeMapping[normalizedRole] || role;

        setOfficeName(mappedOfficeName);
      } catch (error) {
        console.error("Error fetching user role:", error);
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [currentUser]);

  useEffect(() => {
    console.log("Office name changed to:", officeName);
    console.log("User department:", userDepartment);

    if (officeName && officeName !== "Unknown Office") {
      console.log("Starting data fetch...");
      setDebugInfo((prev) => ({ ...prev, dataFetchStatus: "fetching" }));

      Promise.all([fetchStudents(), fetchClearanceRequests()])
        .then(() => {
          console.log("Data fetch completed");
          setDebugInfo((prev) => ({ ...prev, dataFetchStatus: "success" }));
        })
        .catch((error) => {
          console.error("Error during data fetch:", error);
          setDebugInfo((prev) => ({
            ...prev,
            dataFetchStatus: "error",
            error: error.message,
          }));
          setLoading(false);
        });
    } else {
      console.log("Skipping data fetch - office name is:", officeName);
      if (officeName === "Unknown Office") {
        setLoading(false);
      }
    }
  }, [officeName, userDepartment]);

  const fetchStudents = async () => {
    console.log("fetchStudents called");
    try {
      const studentsRef = collection(db, "students");
      const snapshot = await getDocs(studentsRef);
      console.log("Students fetched:", snapshot.size);

      let studentsData = snapshot.docs.map((doc) => {
        const studentData = doc.data();
        const clearance = studentData.clearance || {};
        const totalRequirements = Object.keys(clearance).length;
        const completedRequirements = Object.values(clearance).filter(
          (cleared) => cleared
        ).length;
        const completionPercentage =
          totalRequirements > 0
            ? Math.round((completedRequirements / totalRequirements) * 100)
            : 0;

        return {
          ...studentData,
          id: doc.id,
          clearance,
          completionPercentage,
          totalRequirements,
          completedRequirements,
          isCleared: clearance[officeName] || false,
        };
      });

      studentsData = studentsData.filter(
        (student) => student.clearance[officeName] !== undefined
      );
      console.log("Filtered students for office:", studentsData.length);

      if (
        officeName === "Office of The Dean" ||
        officeName === "Student Council"
      ) {
        studentsData = studentsData.filter(
          (student) => student.department === userDepartment
        );
        console.log("Filtered by department:", studentsData.length);
      }

      setStudents(studentsData);
      setOriginalStudents(studentsData);

      const uniqueSections = [
        ...new Set(
          studentsData.map((student) => student.section).filter(Boolean)
        ),
      ];
      const uniqueEducationLevels = [
        ...new Set(
          studentsData.map((student) => student.educationLevel).filter(Boolean)
        ),
      ];
      setAvailableSections(uniqueSections);
      setAvailableEducationLevels(uniqueEducationLevels);

      updateStatistics(studentsData, clearanceRequests);
    } catch (error) {
      console.error("Error fetching students:", error);
      throw error;
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
    }
  };

  const fetchClearanceRequests = async () => {
    console.log("fetchClearanceRequests called");
    if (!currentUser) {
      console.log("No current user for fetching requests");
      return;
    }

    try {
      const requestsRef = collection(db, "clearanceRequests");
      const q = query(requestsRef, where("officerId", "==", currentUser.uid));

      const requestsSnapshot = await getDocs(q);
      console.log("Clearance requests fetched:", requestsSnapshot.size);

      const requestsData = await Promise.all(
        requestsSnapshot.docs.map(async (doc) => {
          const requestData = doc.data();

          const disciplinaryRecordsRef = collection(db, "disciplinaryRecords");
          const disciplinaryQuery = query(
            disciplinaryRecordsRef,
            where("studentId", "==", requestData.studentId)
          );
          const disciplinarySnapshot = await getDocs(disciplinaryQuery);
          const disciplinaryRecords = disciplinarySnapshot.docs.map(
            (recordDoc) => recordDoc.data()
          );

          let eventsAttended = 0;
          if (userRole === "Office of The Dean") {
            const eventsRef = collection(db, "events");
            const eventsSnapshot = await getDocs(eventsRef);
            eventsSnapshot.forEach((eventDoc) => {
              const eventData = eventDoc.data();
              const attendeesArray = Object.values(eventData.attendees || {});
              if (
                attendeesArray.some(
                  (attendee) => attendee.studentNo === requestData.studentNo
                )
              ) {
                eventsAttended++;
              }
            });
          }

          let disciplinaryRecordsCount = 0;
          if (userRole === "Character Renewal Office") {
            disciplinaryRecordsCount = disciplinaryRecords.length;
          }

          return {
            id: doc.id,
            ...requestData,
            disciplinaryRecords,
            eventsAttended,
            disciplinaryRecordsCount,
          };
        })
      );

      setClearanceRequests(requestsData);
      setOriginalRequests(requestsData);

      const uniqueSubjects = [
        ...new Set(requestsData.map((req) => req.subject).filter(Boolean)),
      ];
      setAvailableSubjects(uniqueSubjects);

      updateStatistics(students, requestsData);
    } catch (error) {
      console.error("Error fetching clearance requests:", error);
      throw error;
    }
  };

  const updateStatistics = (
    studentsData = students,
    requestsData = clearanceRequests
  ) => {
    const stats = {
      total: studentsData.length,
      cleared: studentsData.filter((s) => s.isCleared).length,
      pending: studentsData.filter((s) => !s.isCleared).length,
      clearanceRate:
        studentsData.length > 0
          ? Math.round(
              (studentsData.filter((s) => s.isCleared).length /
                studentsData.length) *
                100
            )
          : 0,
      pendingRequests: requestsData.filter((r) => r.status === "pending")
        .length,
      approvedRequests: requestsData.filter((r) => r.status === "approved")
        .length,
      rejectedRequests: requestsData.filter((r) => r.status === "rejected")
        .length,
    };
    setStatistics(stats);
  };

  useEffect(() => {
    let filteredStudents = [...originalStudents];

    if (educationLevelFilter !== "all") {
      filteredStudents = filteredStudents.filter(
        (student) => student.educationLevel === educationLevelFilter
      );
    }

    if (sectionFilter !== "all") {
      filteredStudents = filteredStudents.filter(
        (student) => student.section === sectionFilter
      );
    }

    if (statusFilter !== "all") {
      filteredStudents = filteredStudents.filter((student) => {
        if (statusFilter === "cleared") return student.isCleared;
        if (statusFilter === "pending") return !student.isCleared;
        return true;
      });
    }

    if (searchQuery) {
      filteredStudents = filteredStudents.filter(
        (student) =>
          student.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          student.studentId
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          student.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setStudents(filteredStudents);
  }, [
    educationLevelFilter,
    sectionFilter,
    statusFilter,
    searchQuery,
    originalStudents,
  ]);

  useEffect(() => {
    let filteredRequests = [...originalRequests];

    if (sectionFilter !== "all") {
      filteredRequests = filteredRequests.filter(
        (request) => request.section === sectionFilter
      );
    }

    if (subjectFilter !== "all") {
      filteredRequests = filteredRequests.filter(
        (request) => request.subject === subjectFilter
      );
    }

    if (statusFilter !== "all") {
      filteredRequests = filteredRequests.filter(
        (request) => request.status === statusFilter
      );
    }

    if (searchQuery) {
      filteredRequests = filteredRequests.filter((request) =>
        request.studentName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setClearanceRequests(filteredRequests);
  }, [
    sectionFilter,
    subjectFilter,
    statusFilter,
    searchQuery,
    originalRequests,
  ]);

  const handleClearStudent = async (studentId) => {
    try {
      const q = query(
        collection(db, "students"),
        where("uid", "==", studentId)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.error("No student found with uid:", studentId);
        alert("Error: Student not found.");
        return;
      }

      const studentDocRef = doc(db, "students", querySnapshot.docs[0].id);

      await updateDoc(studentDocRef, {
        [`clearance.${officeName}`]: true,
      });

      setStudents((prevStudents) =>
        prevStudents.map((student) =>
          student.uid === studentId ? { ...student, isCleared: true } : student
        )
      );

      updateStatistics();
      return true;
    } catch (error) {
      console.error("Error updating student clearance: ", error);
      return false;
    }
  };

  const handleApproveRequest = async (requestId, studentId, subject) => {
    try {
      await updateDoc(doc(db, "clearanceRequests", requestId), {
        status: "approved",
        approvedAt: serverTimestamp(),
      });

      const studentsRef = collection(db, "students");
      const q = query(studentsRef, where("uid", "==", studentId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const studentDoc = querySnapshot.docs[0];
        await updateDoc(studentDoc.ref, {
          [`clearance.${subject}`]: true,
        });
      }

      setClearanceRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === requestId ? { ...req, status: "approved" } : req
        )
      );

      const notificationsRef = collection(db, "studentNotification");
      await addDoc(notificationsRef, {
        isRead: false,
        notifTimestamp: serverTimestamp(),
        status: "approved",
        studentId: studentId,
        subject: subject,
      });

      updateStatistics();
      alert("Clearance request approved!");
    } catch (error) {
      console.error("Error approving clearance:", error);
      alert("Error approving clearance. Please try again later.");
    }
  };

  const handleRejectRequest = async () => {
    if (!requestToReject || !rejectionReason) {
      alert("Please provide a reason for rejection.");
      return;
    }

    try {
      await updateDoc(doc(db, "clearanceRequests", requestToReject.id), {
        status: "rejected",
        rejectedAt: serverTimestamp(),
        rejectionReason: rejectionReason,
      });

      setClearanceRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === requestToReject.id ? { ...req, status: "rejected" } : req
        )
      );

      const notificationsRef = collection(db, "studentNotification");
      await addDoc(notificationsRef, {
        isRead: false,
        notifTimestamp: serverTimestamp(),
        status: "rejected",
        reason: rejectionReason,
        studentId: requestToReject.studentId,
        subject: requestToReject.subject,
      });

      setIsRejectModalOpen(false);
      setRequestToReject(null);
      setRejectionReason("");
      updateStatistics();
      alert("Clearance request rejected.");
    } catch (error) {
      console.error("Error rejecting clearance:", error);
      alert("Error rejecting clearance. Please try again later.");
    }
  };

  const handleSelectAllStudents = () => {
    const unclearedStudents = students.filter((student) => !student.isCleared);
    const allSelected = selectedStudentIds.length === unclearedStudents.length;

    if (allSelected) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(unclearedStudents.map((student) => student.uid));
    }
  };

  const handleSelectStudent = (studentId) => {
    if (selectedStudentIds.includes(studentId)) {
      setSelectedStudentIds(
        selectedStudentIds.filter((id) => id !== studentId)
      );
    } else {
      setSelectedStudentIds([...selectedStudentIds, studentId]);
    }
  };

  const handleClearSelectedStudents = async () => {
    if (selectedStudentIds.length === 0) return;

    const selectedStudentNames = students
      .filter((s) => selectedStudentIds.includes(s.uid))
      .map((s) => s.fullName);

    setStudentsToClear(selectedStudentNames);
    setIsConfirmModalOpen(true);
  };

  const confirmClearSelectedStudents = async () => {
    setIsConfirmModalOpen(false);
    setLoading(true);

    try {
      let successCount = 0;
      for (const studentId of selectedStudentIds) {
        const success = await handleClearStudent(studentId);
        if (success) successCount++;
      }

      alert(
        `Successfully cleared ${successCount} student(s) for ${officeName}.`
      );
      setSelectedStudentIds([]);
    } catch (error) {
      console.error("Error clearing selected students: ", error);
      alert("Error clearing students. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const getOfficeIcon = () => {
    const iconMap = {
      Librarian: faFileAlt,
      Finance: faChartLine,
      "Basic Education Registrar": faGraduationCap,
      "Character Renewal Office": faUserCheck,
      "College Library": faFileAlt,
      "Guidance Office": faUsers,
      "Office of The Dean": faBuilding,
      "Office of the Finance Director": faChartLine,
      "Office of the Registrar": faFileAlt,
      "Property Custodian": faClipboardCheck,
      "Student Council": faUsers,
    };
    return iconMap[officeName] || faBuilding;
  };

  const StatCard = ({ icon, title, value, color, subtitle }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <FontAwesomeIcon icon={icon} className="text-xl" />
        </div>
      </div>
    </div>
  );

  const RequestCard = ({ request }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200">
      <div className="p-6">
        {}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {request.studentName}
            </h3>
            <p className="text-sm text-gray-500">{request.section}</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              request.status === "approved"
                ? "bg-green-100 text-green-800"
                : request.status === "rejected"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {request.status}
          </span>
        </div>

        {}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <FontAwesomeIcon
              icon={faClipboardList}
              className="w-4 h-4 mr-2 text-gray-400"
            />
            Subject: {request.subject}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <FontAwesomeIcon
              icon={faCalendarAlt}
              className="w-4 h-4 mr-2 text-gray-400"
            />
            {moment(request.timestamp?.toDate()).format("MMM DD, YYYY h:mm A")}
          </div>
          {userRole === "Character Renewal Office" && (
            <div className="flex items-center text-sm text-gray-600">
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                className="w-4 h-4 mr-2 text-gray-400"
              />
              Disciplinary Records: {request.disciplinaryRecordsCount || 0}
            </div>
          )}
          {userRole === "Office of The Dean" && (
            <div className="flex items-center text-sm text-gray-600">
              <FontAwesomeIcon
                icon={faCalendarCheck}
                className="w-4 h-4 mr-2 text-gray-400"
              />
              Events Attended: {request.eventsAttended || 0}
            </div>
          )}
        </div>

        {}
        {request.status === "pending" && (
          <div className="flex gap-2">
            <button
              onClick={() =>
                handleApproveRequest(
                  request.id,
                  request.studentId,
                  request.subject
                )
              }
              className="flex-1 py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
              Approve
            </button>
            <button
              onClick={() => {
                setRequestToReject(request);
                setIsRejectModalOpen(true);
              }}
              className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faTimesCircle} className="mr-2" />
              Reject
            </button>
          </div>
        )}

        {request.status === "rejected" && request.rejectionReason && (
          <div className="mt-3 p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-red-700">
              <span className="font-medium">Rejection Reason:</span>{" "}
              {request.rejectionReason}
            </p>
          </div>
        )}

        {}
        <button
          onClick={() =>
            setExpandedRequestId(
              expandedRequestId === request.id ? null : request.id
            )
          }
          className="w-full mt-3 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
        >
          <FontAwesomeIcon icon={faHistory} className="mr-2" />
          View Disciplinary Records
          <FontAwesomeIcon
            icon={expandedRequestId === request.id ? faAngleUp : faAngleDown}
            className="ml-2"
          />
        </button>
      </div>

      {}
      {expandedRequestId === request.id && (
        <div className="border-t border-gray-200 bg-gray-50 p-6">
          <h4 className="font-semibold text-gray-900 mb-3">
            Disciplinary Records
          </h4>
          {request.disciplinaryRecords &&
          request.disciplinaryRecords.length > 0 ? (
            <div className="space-y-2">
              {request.disciplinaryRecords.map((record, index) => (
                <div
                  key={index}
                  className="bg-white rounded-lg p-3 border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {moment(record.date?.toDate()).format("MMMM DD, YYYY")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Violation:</span>{" "}
                    {record.violation}
                  </p>
                  {record.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Description:</span>{" "}
                      {record.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <FontAwesomeIcon
                icon={faCheckCircle}
                className="text-3xl text-green-500 mb-2"
              />
              <p className="text-gray-600">No disciplinary records found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const StudentCard = ({ student }) => (
    <div
      className={`bg-white rounded-xl shadow-sm border ${
        student.isCleared ? "border-green-200" : "border-gray-200"
      } overflow-hidden hover:shadow-md transition-all duration-200`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            {!student.isCleared && (
              <input
                type="checkbox"
                checked={selectedStudentIds.includes(student.uid)}
                onChange={(e) => {
                  e.stopPropagation();
                  handleSelectStudent(student.uid);
                }}
                className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {student.fullName}
              </h3>
              <p className="text-sm text-gray-500">{student.studentId}</p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              student.isCleared
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {student.isCleared ? "Cleared" : "Pending"}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <FontAwesomeIcon
              icon={faEnvelope}
              className="w-4 h-4 mr-2 text-gray-400"
            />
            {student.email}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <FontAwesomeIcon
              icon={faLayerGroup}
              className="w-4 h-4 mr-2 text-gray-400"
            />
            {student.section || "No Section"}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <FontAwesomeIcon
              icon={faGraduationCap}
              className="w-4 h-4 mr-2 text-gray-400"
            />
            {student.gradeLevel} - {student.educationLevel}
          </div>
        </div>

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Overall Progress
            </span>
            <span className="text-sm font-bold text-gray-900">
              {student.completionPercentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                student.completionPercentage === 100
                  ? "bg-green-500"
                  : student.completionPercentage >= 75
                  ? "bg-blue-500"
                  : student.completionPercentage >= 50
                  ? "bg-yellow-500"
                  : student.completionPercentage >= 25
                  ? "bg-orange-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${student.completionPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {student.completedRequirements} of {student.totalRequirements}{" "}
            requirements completed
          </p>
        </div>

        {!student.isCleared ? (
          <button
            onClick={() => handleClearStudent(student.uid)}
            className="w-full py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
          >
            <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
            Mark as Cleared
          </button>
        ) : (
          <div className="w-full py-2 px-4 bg-green-50 text-green-700 rounded-lg flex items-center justify-center">
            <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
            Already Cleared
          </div>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <Sidebar>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <FontAwesomeIcon
              icon={faSpinner}
              className="text-4xl text-blue-500 animate-spin mb-4"
            />
            <p className="text-gray-600">Loading clearance data...</p>

            {}
            <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left max-w-md">
              <p className="text-xs font-mono">Debug Info:</p>
              <p className="text-xs font-mono">
                User Fetch: {debugInfo.userFetchStatus}
              </p>
              <p className="text-xs font-mono">
                Office Name: {debugInfo.officeName || "Not set"}
              </p>
              <p className="text-xs font-mono">
                User Role: {debugInfo.userRole || "Not set"}
              </p>
              <p className="text-xs font-mono">
                Data Fetch: {debugInfo.dataFetchStatus}
              </p>
              {debugInfo.error && (
                <p className="text-xs font-mono text-red-600">
                  Error: {debugInfo.error}
                </p>
              )}
            </div>
          </div>
        </div>
      </Sidebar>
    );
  }

  if (officeName === "Unknown Office") {
    return (
      <Sidebar>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              className="text-4xl text-yellow-500 mb-4"
            />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Office Not Recognized
            </h2>
            <p className="text-gray-600">
              Your user role "{userRole || "undefined"}" is not mapped to any
              office.
            </p>
            <p className="text-gray-600 mt-2">
              Please contact the administrator.
            </p>
          </div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg mr-4">
                  <FontAwesomeIcon
                    icon={getOfficeIcon()}
                    className="text-2xl text-blue-600"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {officeName} Clearance
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Manage student clearances and requests
                  </p>
                </div>
              </div>
            </div>
          </div>

          {}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={faUsers}
              title="Total Students"
              value={statistics.total}
              color="bg-blue-100 text-blue-600"
            />
            <StatCard
              icon={faInbox}
              title="Pending Requests"
              value={statistics.pendingRequests}
              subtitle="Awaiting review"
              color="bg-yellow-100 text-yellow-600"
            />
            <StatCard
              icon={faCheckCircle}
              title="Cleared Students"
              value={statistics.cleared}
              subtitle={`${statistics.clearanceRate}% completion`}
              color="bg-green-100 text-green-600"
            />
            <StatCard
              icon={faTimesCircle}
              title="Rejected"
              value={statistics.rejectedRequests}
              color="bg-red-100 text-red-600"
            />
          </div>

          {}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="flex border-b">
              <button
                onClick={() => {
                  setActiveTab("requests");
                  setStatusFilter("all");
                }}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === "requests"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <FontAwesomeIcon icon={faInbox} className="mr-2" />
                Clearance Requests
                {statistics.pendingRequests > 0 && (
                  <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                    {statistics.pendingRequests}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setActiveTab("direct");
                  setStatusFilter("all");
                }}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === "direct"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <FontAwesomeIcon icon={faCheckSquare} className="mr-2" />
                Direct Clearance
              </button>
            </div>
          </div>

          {}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <FontAwesomeIcon
                    icon={faSearch}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      activeTab === "requests"
                        ? "Search by student name..."
                        : "Search by name, ID, or email..."
                    }
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                {activeTab === "requests" ? (
                  <>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>

                    <select
                      value={subjectFilter}
                      onChange={(e) => setSubjectFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Subjects</option>
                      {availableSubjects.map((subject) => (
                        <option key={subject} value={subject}>
                          {subject}
                        </option>
                      ))}
                    </select>
                  </>
                ) : (
                  <>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="cleared">Cleared</option>
                    </select>

                    <select
                      value={educationLevelFilter}
                      onChange={(e) => setEducationLevelFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Levels</option>
                      {availableEducationLevels.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                    </select>
                  </>
                )}

                <select
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Sections</option>
                  {availableSections.map((section) => (
                    <option key={section} value={section}>
                      {section}
                    </option>
                  ))}
                </select>

                <div className="flex bg-gray-100 rounded-lg p-1 ml-auto">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded ${
                      viewMode === "grid" ? "bg-white shadow-sm" : ""
                    }`}
                  >
                    <FontAwesomeIcon icon={faThLarge} />
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`p-2 rounded ${
                      viewMode === "table" ? "bg-white shadow-sm" : ""
                    }`}
                  >
                    <FontAwesomeIcon icon={faListUl} />
                  </button>
                </div>
              </div>
            </div>

            {}
            {activeTab === "direct" &&
              students.filter((s) => !s.isCleared).length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                  <label className="flex items-center text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={
                        selectedStudentIds.length ===
                        students.filter((s) => !s.isCleared).length
                      }
                      onChange={handleSelectAllStudents}
                      className="mr-2 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    Select all pending students (
                    {students.filter((s) => !s.isCleared).length})
                  </label>
                  {selectedStudentIds.length > 0 && (
                    <button
                      onClick={handleClearSelectedStudents}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
                    >
                      <FontAwesomeIcon icon={faCheckDouble} className="mr-2" />
                      Clear {selectedStudentIds.length} Selected
                    </button>
                  )}
                </div>
              )}
          </div>

          {}
          {activeTab === "requests" ? (
            clearanceRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
                <FontAwesomeIcon
                  icon={faInbox}
                  className="text-5xl text-gray-300 mb-4"
                />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No clearance requests
                </h3>
                <p className="text-gray-500">
                  Students haven't submitted any clearance requests yet.
                </p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clearanceRequests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Section
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subject
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date Submitted
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        {userRole === "Character Renewal Office" && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Disciplinary Records
                          </th>
                        )}
                        {userRole === "Office of The Dean" && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Events Attended
                          </th>
                        )}
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {clearanceRequests.map((request) => (
                        <React.Fragment key={request.id}>
                          <tr className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {request.studentName}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {request.section}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {request.subject}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {moment(request.timestamp?.toDate()).format(
                                "MMM DD, YYYY"
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  request.status === "approved"
                                    ? "bg-green-100 text-green-800"
                                    : request.status === "rejected"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {request.status}
                              </span>
                            </td>
                            {userRole === "Character Renewal Office" && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {request.disciplinaryRecordsCount || 0}
                              </td>
                            )}
                            {userRole === "Office of The Dean" && (
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {request.eventsAttended || 0}
                              </td>
                            )}
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center gap-2">
                                {request.status === "pending" && (
                                  <>
                                    <button
                                      onClick={() =>
                                        handleApproveRequest(
                                          request.id,
                                          request.studentId,
                                          request.subject
                                        )
                                      }
                                      className="text-green-600 hover:text-green-900"
                                      title="Approve"
                                    >
                                      <FontAwesomeIcon icon={faCheckCircle} />
                                    </button>
                                    <button
                                      onClick={() => {
                                        setRequestToReject(request);
                                        setIsRejectModalOpen(true);
                                      }}
                                      className="text-red-600 hover:text-red-900"
                                      title="Reject"
                                    >
                                      <FontAwesomeIcon icon={faTimesCircle} />
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() =>
                                    setExpandedRequestId(
                                      expandedRequestId === request.id
                                        ? null
                                        : request.id
                                    )
                                  }
                                  className="text-blue-600 hover:text-blue-900"
                                  title="View Details"
                                >
                                  <FontAwesomeIcon
                                    icon={
                                      expandedRequestId === request.id
                                        ? faAngleUp
                                        : faAngleDown
                                    }
                                  />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expandedRequestId === request.id && (
                            <tr>
                              <td colSpan={8} className="px-6 py-4 bg-gray-50">
                                <div className="p-4">
                                  <h3 className="text-lg font-semibold mb-2">
                                    Disciplinary Records
                                  </h3>
                                  {request.disciplinaryRecords &&
                                  request.disciplinaryRecords.length > 0 ? (
                                    <ul className="space-y-2">
                                      {request.disciplinaryRecords.map(
                                        (record, index) => (
                                          <li
                                            key={index}
                                            className="bg-white p-3 rounded-lg border border-gray-200"
                                          >
                                            <strong>Violation:</strong>{" "}
                                            {record.violation}
                                            <br />
                                            <strong>Date:</strong>{" "}
                                            {moment(
                                              record.date?.toDate()
                                            ).format("MMMM DD, YYYY")}
                                            {record.description && (
                                              <>
                                                <br />
                                                <strong>
                                                  Description:
                                                </strong>{" "}
                                                {record.description}
                                              </>
                                            )}
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  ) : (
                                    <p className="text-gray-600">
                                      No disciplinary records found.
                                    </p>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) :
          students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
              <FontAwesomeIcon
                icon={faUserGraduate}
                className="text-5xl text-gray-300 mb-4"
              />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No students found
              </h3>
              <p className="text-gray-500">
                No students require clearance from this office.
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {students.map((student) => (
                <StudentCard key={student.uid} student={student} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        {students.filter((s) => !s.isCleared).length > 0 && (
                          <input
                            type="checkbox"
                            checked={
                              selectedStudentIds.length ===
                              students.filter((s) => !s.isCleared).length
                            }
                            onChange={handleSelectAllStudents}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                        )}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Section
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student.uid} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          {!student.isCleared && (
                            <input
                              type="checkbox"
                              checked={selectedStudentIds.includes(student.uid)}
                              onChange={() => handleSelectStudent(student.uid)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {student.fullName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.studentId}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {student.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {student.section || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900">
                              {student.gradeLevel}
                            </div>
                            <div className="text-xs text-gray-500">
                              {student.educationLevel}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      student.completionPercentage === 100
                                        ? "bg-green-500"
                                        : student.completionPercentage >= 75
                                        ? "bg-blue-500"
                                        : student.completionPercentage >= 50
                                        ? "bg-yellow-500"
                                        : "bg-red-500"
                                    }`}
                                    style={{
                                      width: `${student.completionPercentage}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                  {student.completionPercentage}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              student.isCleared
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {student.isCleared ? "Cleared" : "Pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          {!student.isCleared ? (
                            <button
                              onClick={() => handleClearStudent(student.uid)}
                              className="text-green-600 hover:text-green-900"
                              title="Clear Student"
                            >
                              <FontAwesomeIcon icon={faCheckCircle} />
                            </button>
                          ) : (
                            <span className="text-green-500">
                              <FontAwesomeIcon icon={faCheckCircle} />
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
      >
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <FontAwesomeIcon icon={faTimesCircle} className="text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-center mb-2">
            Reject Clearance Request
          </h3>
          <p className="text-gray-600 text-center mb-4">
            Please provide a reason for rejecting this clearance request.
          </p>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="4"
              placeholder="Enter the reason for rejection..."
            />
          </div>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setIsRejectModalOpen(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleRejectRequest}
              disabled={!rejectionReason.trim()}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reject Request
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
      >
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full mb-4">
            <FontAwesomeIcon icon={faCheckDouble} className="text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-center mb-2">
            Confirm Bulk Clearance
          </h3>
          <p className="text-gray-600 text-center mb-4">
            Are you sure you want to clear the following{" "}
            {studentsToClear.length} student(s)?
          </p>
          <div className="max-h-40 overflow-y-auto mb-6 bg-gray-50 rounded-lg p-3">
            <ul className="text-sm text-gray-700 space-y-1">
              {studentsToClear.map((name, index) => (
                <li key={index}>• {name}</li>
              ))}
            </ul>
          </div>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setIsConfirmModalOpen(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmClearSelectedStudents}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Confirm Clear All
            </button>
          </div>
        </div>
      </Modal>
    </Sidebar>
  );
}

export default OfficeClearanceManagement;
