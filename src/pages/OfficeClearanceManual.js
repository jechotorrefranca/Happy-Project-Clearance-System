import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../components/AuthContext";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import moment from "moment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faBook,
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
  faBan,
  faUserGraduate,
  faPercentage,
  faCalendarAlt,
  faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";

function OfficeClearanceManagement() {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState([]);
  const [originalStudents, setOriginalStudents] = useState([]);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [educationLevelFilter, setEducationLevelFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [availableSections, setAvailableSections] = useState([]);
  const [availableEducationLevels, setAvailableEducationLevels] = useState([]);
  const [officeName, setOfficeName] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
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
  });

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!currentUser) return;

      try {
        const userRef = collection(db, "users");
        const userQuery = query(userRef, where("uid", "==", currentUser.uid));
        const userDoc = await getDocs(userQuery);
        const userData = userDoc.docs[0].data();
        const userRole = userData.role;
        setUserDepartment(userData.department || null);

        const officeMapping = {
          librarian: "Librarian",
          finance: "Finance",
          registrarBasicEd: "Basic Education Registrar",
          characterRenewalOfficer: "Character Renewal Office",
          "College Library": "College Library",
          "Guidance Office": "Guidance Office",
          "Office of The Dean": "Office of The Dean",
          "Office of the Finance Director": "Office of the Finance Director",
          "Office of the Registrar": "Office of the Registrar",
          "Property Custodian": "Property Custodian",
          "Student Council": "Student Council",
        };

        setOfficeName(officeMapping[userRole] || "Unknown Office");
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };

    fetchUserRole();
  }, [currentUser]);

  useEffect(() => {
    if (officeName && officeName !== "Unknown Office") {
      fetchStudents();
    }
  }, [officeName, userDepartment]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const studentsRef = collection(db, "students");
      const snapshot = await getDocs(studentsRef);

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

      if (
        officeName === "Office of The Dean" ||
        officeName === "Student Council"
      ) {
        studentsData = studentsData.filter(
          (student) => student.department === userDepartment
        );
      }

      const stats = {
        total: studentsData.length,
        cleared: studentsData.filter(s => s.isCleared).length,
        pending: studentsData.filter(s => !s.isCleared).length,
        clearanceRate: studentsData.length > 0 
          ? Math.round((studentsData.filter(s => s.isCleared).length / studentsData.length) * 100)
          : 0,
      };

      setStatistics(stats);
      setStudents(studentsData);
      setOriginalStudents(studentsData);

      const uniqueSections = [
        ...new Set(studentsData.map((student) => student.section).filter(Boolean)),
      ];
      const uniqueEducationLevels = [
        ...new Set(studentsData.map((student) => student.educationLevel).filter(Boolean)),
      ];
      setAvailableSections(uniqueSections);
      setAvailableEducationLevels(uniqueEducationLevels);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
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
      filteredStudents = filteredStudents.filter((student) =>
        student.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setStudents(filteredStudents);
  }, [educationLevelFilter, sectionFilter, statusFilter, searchQuery, originalStudents]);

  const handleStudentClick = (studentId) => {
    setExpandedStudent((prev) => (prev === studentId ? null : studentId));
  };

  const handleClearStudent = async (studentId) => {
    try {
      const q = query(collection(db, "students"), where("uid", "==", studentId));
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
          student.uid === studentId
            ? {
                ...student,
                clearance: { ...student.clearance, [officeName]: true },
                isCleared: true,
                completionPercentage: calculateCompletionPercentage({
                  ...student,
                  clearance: { ...student.clearance, [officeName]: true },
                }),
              }
            : student
        )
      );

      setOriginalStudents((prevStudents) =>
        prevStudents.map((student) =>
          student.uid === studentId
            ? {
                ...student,
                clearance: { ...student.clearance, [officeName]: true },
                isCleared: true,
                completionPercentage: calculateCompletionPercentage({
                  ...student,
                  clearance: { ...student.clearance, [officeName]: true },
                }),
              }
            : student
        )
      );

      setStatistics(prev => ({
        ...prev,
        cleared: prev.cleared + 1,
        pending: prev.pending - 1,
        clearanceRate: Math.round(((prev.cleared + 1) / prev.total) * 100),
      }));
  
      return true;
    } catch (error) {
      console.error("Error updating student clearance: ", error);
      return false;
    }
  };

  const handleSelectAllStudents = () => {
    const unclearedStudents = students.filter(
      (student) => !student.isCleared
    );
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
      .filter(s => selectedStudentIds.includes(s.uid))
      .map(s => s.fullName);

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

      alert(`Successfully cleared ${successCount} student(s) for ${officeName}.`);
      setSelectedStudentIds([]);
    } catch (error) {
      console.error("Error clearing selected students: ", error);
      alert("Error clearing students. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const calculateCompletionPercentage = (student) => {
    const totalRequirements = Object.keys(student.clearance).length;
    const completedRequirements = Object.values(student.clearance).filter(
      (cleared) => cleared
    ).length;
    return totalRequirements > 0
      ? Math.round((completedRequirements / totalRequirements) * 100)
      : 0;
  };

  const getOfficeIcon = () => {
    const iconMap = {
      "Librarian": faBook,
      "Finance": faChartLine,
      "Basic Education Registrar": faGraduationCap,
      "Character Renewal Office": faUserCheck,
      "College Library": faBook,
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
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <FontAwesomeIcon icon={icon} className="text-xl" />
        </div>
      </div>
    </div>
  );

  const StudentCard = ({ student }) => (
    <div className={`bg-white rounded-xl shadow-sm border ${student.isCleared ? 'border-green-200' : 'border-gray-200'} overflow-hidden hover:shadow-md transition-all duration-200`}>
      <div className="p-6">
        {}
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
              <h3 className="text-lg font-semibold text-gray-900">{student.fullName}</h3>
              <p className="text-sm text-gray-500">{student.studentId}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            student.isCleared 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {student.isCleared ? 'Cleared' : 'Pending'}
          </span>
        </div>

        {}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 mr-2 text-gray-400" />
            {student.email}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <FontAwesomeIcon icon={faLayerGroup} className="w-4 h-4 mr-2 text-gray-400" />
            {student.section || 'No Section'}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <FontAwesomeIcon icon={faGraduationCap} className="w-4 h-4 mr-2 text-gray-400" />
            {student.gradeLevel} - {student.educationLevel}
          </div>
        </div>

        {}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-bold text-gray-900">{student.completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                student.completionPercentage === 100 ? 'bg-green-500' :
                student.completionPercentage >= 75 ? 'bg-blue-500' :
                student.completionPercentage >= 50 ? 'bg-yellow-500' :
                student.completionPercentage >= 25 ? 'bg-orange-500' :
                'bg-red-500'
              }`}
              style={{ width: `${student.completionPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {student.completedRequirements} of {student.totalRequirements} requirements completed
          </p>
        </div>

        {}
        <div className="flex gap-2">
          {!student.isCleared ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClearStudent(student.uid);
              }}
              className="flex-1 py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
              Mark as Cleared
            </button>
          ) : (
            <div className="flex-1 py-2 px-4 bg-green-50 text-green-700 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
              Already Cleared
            </div>
          )}
          <button
            onClick={() => handleStudentClick(student.uid)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <FontAwesomeIcon icon={expandedStudent === student.uid ? faAngleUp : faAngleDown} />
          </button>
        </div>
      </div>

      {}
      {expandedStudent === student.uid && (
        <div className="border-t border-gray-200 bg-gray-50 p-6">
          {student.disciplinaryRecords && student.disciplinaryRecords.length > 0 ? (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 text-yellow-500" />
                Disciplinary Records
              </h4>
              <div className="space-y-2">
                {student.disciplinaryRecords.map((record, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        <FontAwesomeIcon icon={faCalendarAlt} className="mr-2 text-gray-400" />
                        {moment(record.timestamp.toDate()).format("MMMM DD, YYYY")}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Violations:</span> {record.violations.join(", ")}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Sanctions:</span> {record.sanctions.join(", ")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <FontAwesomeIcon icon={faCheckCircle} className="text-3xl text-green-500 mb-2" />
              <p className="text-gray-600">No disciplinary records found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <FontAwesomeIcon icon={faUserGraduate} className="text-3xl text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No students found</h3>
      <p className="text-gray-500 text-center max-w-sm">
        {searchQuery || educationLevelFilter !== "all" || sectionFilter !== "all" || statusFilter !== "all"
          ? "Try adjusting your filters or search query."
          : "No students require clearance from this office."}
      </p>
    </div>
  );

  if (loading) {
    return (
      <Sidebar>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <FontAwesomeIcon icon={faSpinner} className="text-4xl text-blue-500 animate-spin mb-4" />
            <p className="text-gray-600">Loading students...</p>
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
                  <FontAwesomeIcon icon={getOfficeIcon()} className="text-2xl text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{officeName} Clearance</h1>
                  <p className="text-gray-600 mt-1">Manage student clearances for your office</p>
                </div>
              </div>
              {selectedStudentIds.length > 0 && (
                <button
                  onClick={handleClearSelectedStudents}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
                >
                  <FontAwesomeIcon icon={faCheckDouble} className="mr-2" />
                  Clear {selectedStudentIds.length} Selected
                </button>
              )}
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
              icon={faCheckCircle} 
              title="Cleared" 
              value={statistics.cleared}
              subtitle={`${statistics.clearanceRate}% completion rate`}
              color="bg-green-100 text-green-600"
            />
            <StatCard 
              icon={faClock} 
              title="Pending" 
              value={statistics.pending}
              subtitle="Awaiting clearance"
              color="bg-yellow-100 text-yellow-600"
            />
            <StatCard 
              icon={faPercentage} 
              title="Clearance Rate" 
              value={`${statistics.clearanceRate}%`}
              color="bg-purple-100 text-purple-600"
            />
          </div>

          {}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {}
              <div className="flex-1">
                <div className="relative">
                  <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, ID, or email..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {}
              <div className="flex gap-2 flex-wrap">
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

                {}
                <div className="flex bg-gray-100 rounded-lg p-1 ml-auto">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded ${viewMode === "grid" ? "bg-white shadow-sm" : ""}`}
                  >
                    <FontAwesomeIcon icon={faThLarge} />
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`p-2 rounded ${viewMode === "table" ? "bg-white shadow-sm" : ""}`}
                  >
                    <FontAwesomeIcon icon={faListUl} />
                  </button>
                </div>
              </div>
            </div>

            {}
            {students.filter(s => !s.isCleared).length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="flex items-center text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.length === students.filter(s => !s.isCleared).length}
                    onChange={handleSelectAllStudents}
                    className="mr-2 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  Select all pending students ({students.filter(s => !s.isCleared).length})
                </label>
              </div>
            )}
          </div>

          {}
          {students.length === 0 ? (
            <EmptyState />
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
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.length === students.filter(s => !s.isCleared).length}
                          onChange={handleSelectAllStudents}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
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
                      <React.Fragment key={student.uid}>
                        <tr className="hover:bg-gray-50">
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
                            <div className="text-sm text-gray-900">{student.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{student.section || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm text-gray-900">{student.gradeLevel}</div>
                              <div className="text-xs text-gray-500">{student.educationLevel}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                                    <div
                                      className={`h-2 rounded-full ${
                                        student.completionPercentage === 100 ? 'bg-green-500' :
                                        student.completionPercentage >= 75 ? 'bg-blue-500' :
                                        student.completionPercentage >= 50 ? 'bg-yellow-500' :
                                        'bg-red-500'
                                      }`}
                                      style={{ width: `${student.completionPercentage}%` }}
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
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              student.isCleared 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {student.isCleared ? 'Cleared' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
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
                              <button
                                onClick={() => handleStudentClick(student.uid)}
                                className="text-blue-600 hover:text-blue-900"
                                title="View Details"
                              >
                                <FontAwesomeIcon icon={expandedStudent === student.uid ? faAngleUp : faAngleDown} />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {expandedStudent === student.uid && (
                          <tr>
                            <td colSpan={8} className="px-6 py-4 bg-gray-50">
                              {student.disciplinaryRecords && student.disciplinaryRecords.length > 0 ? (
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-3">
                                    Disciplinary Records
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {student.disciplinaryRecords.map((record, index) => (
                                      <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                                        <div className="text-sm">
                                          <p className="font-medium text-gray-700 mb-1">
                                            {moment(record.timestamp.toDate()).format("MMMM DD, YYYY")}
                                          </p>
                                          <p className="text-gray-600">
                                            <span className="font-medium">Violations:</span> {record.violations.join(", ")}
                                          </p>
                                          <p className="text-gray-600">
                                            <span className="font-medium">Sanctions:</span> {record.sanctions.join(", ")}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-gray-600">No disciplinary records found.</p>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {}
          {students.length > 0 && (
            <div className="mt-6 text-center text-sm text-gray-500">
              Showing {students.length} of {originalStudents.length} students
            </div>
          )}
        </div>
      </div>

      {}
      <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)}>
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full mb-4">
            <FontAwesomeIcon icon={faCheckDouble} className="text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-center mb-2">Confirm Bulk Clearance</h3>
          <p className="text-gray-600 text-center mb-4">
            Are you sure you want to clear the following {studentsToClear.length} student(s)?
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