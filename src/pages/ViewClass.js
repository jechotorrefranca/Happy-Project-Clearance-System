import React, { useState, useEffect } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useNavigate, useParams, Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faUserGraduate, 
  faChalkboardTeacher, 
  faBook, 
  faUsers,
  faEdit,
  faArrowLeft,
  faSpinner,
  faSchool,
  faGraduationCap,
  faBookOpen,
  faDownload,
  faPrint,
  faShare,
  faEnvelope,
  faPhone,
  faCheckCircle,
  faExclamationTriangle,
  faInfoCircle,
  faCalendarAlt,
  faTag,
  faClock,
  faChartBar,
  faPercentage,
  faUserCheck,
  faUserTimes,
  faSearch,
  faFilter,
  faSort,
  faEye,
  faTrash,
  faArchive,
  faUndo,
  faTimes,
  faClipboardList,
  faIdCard,
  faMapMarkerAlt,
  faBirthdayCake,
  faVenusMars,
  faHome,
  faUserFriends,
  faStar,
  faAward,
  faExternalLinkAlt,
  faCopy,
  faQrcode,
  faFileExport,
} from "@fortawesome/free-solid-svg-icons";

function ViewClass() {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [teacher, setTeacher] = useState(null);
  const [subjectTeachers, setSubjectTeachers] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  useEffect(() => {
    fetchClassData();
  }, [classId]);

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, type: '', message: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchClassData = async () => {
    setLoading(true);
    try {
      const classDocRef = doc(db, "classes", classId);
      const classDocSnapshot = await getDoc(classDocRef);

      if (classDocSnapshot.exists()) {
        const data = { id: classDocSnapshot.id, ...classDocSnapshot.data() };
        setClassData(data);

        const studentsSnapshot = await getDocs(collection(db, "students"));
        const allStudentsData = studentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setAllStudents(allStudentsData);

        const classStudents = allStudentsData.filter(
          student => student.section === data.sectionName && !student.archived
        );
        setStudents(classStudents);

        if (data.adviserUid) {
          const teachersSnapshot = await getDocs(
            query(collection(db, "teachers"), where("uid", "==", data.adviserUid))
          );
          if (!teachersSnapshot.empty) {
            setTeacher(teachersSnapshot.docs[0].data());
          }
        }

        if (data.subjects && data.subjects.length > 0) {
          const teacherUids = [...new Set(data.subjects.map(s => s.teacherUid).filter(Boolean))];
          const teachersSnapshot = await getDocs(collection(db, "teachers"));
          const teachersMap = new Map();
          teachersSnapshot.docs.forEach(doc => {
            const teacherData = doc.data();
            if (teacherUids.includes(teacherData.uid)) {
              teachersMap.set(teacherData.uid, teacherData);
            }
          });
          setSubjectTeachers(Array.from(teachersMap.values()));
        }
      }
    } catch (error) {
      console.error("Error fetching class data:", error);
      showNotification('error', 'Failed to load class data');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
  };

  const getClassStats = () => {
    if (!classData || !students) {
      return {
        totalStudents: 0,
        maleStudents: 0,
        femaleStudents: 0,
        averageAge: 0,
        clearanceProgress: 0,
        fullyClearedStudents: 0,
        pendingClearances: 0,
      };
    }

    const totalStudents = students.length;
    const maleStudents = students.filter(s => s.gender?.toLowerCase() === 'male').length;
    const femaleStudents = students.filter(s => s.gender?.toLowerCase() === 'female').length;
    
    const ages = students
      .map(s => {
        if (!s.dateOfBirth) return null;
        const birthDate = new Date(s.dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age;
      })
      .filter(age => age !== null);
    
    const averageAge = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;

    let totalClearanceItems = 0;
    let completedClearanceItems = 0;
    let fullyClearedStudents = 0;

    students.forEach(student => {
      if (student.clearance) {
        const clearanceKeys = Object.keys(student.clearance);
        const completed = clearanceKeys.filter(key => student.clearance[key] === true).length;
        totalClearanceItems += clearanceKeys.length;
        completedClearanceItems += completed;
        if (completed === clearanceKeys.length && clearanceKeys.length > 0) {
          fullyClearedStudents++;
        }
      }
    });

    const clearanceProgress = totalClearanceItems > 0 
      ? Math.round((completedClearanceItems / totalClearanceItems) * 100) 
      : 0;

    const pendingClearances = totalClearanceItems - completedClearanceItems;

    return {
      totalStudents,
      maleStudents,
      femaleStudents,
      averageAge,
      clearanceProgress,
      fullyClearedStudents,
      pendingClearances,
    };
  };

  const filteredAndSortedStudents = () => {
    let filtered = students.filter(student => {
      const fullName = (student.fullName || '').toLowerCase();
      const studentId = (student.studentId || '').toLowerCase();
      const email = (student.email || '').toLowerCase();
      const searchLower = searchTerm.toLowerCase();

      return fullName.includes(searchLower) || 
             studentId.includes(searchLower) || 
             email.includes(searchLower);
    });

    filtered.sort((a, b) => {
      let compareValue = 0;
      
      switch(sortBy) {
        case "name":
          compareValue = (a.fullName || '').localeCompare(b.fullName || '');
          break;
        case "id":
          compareValue = (a.studentId || '').localeCompare(b.studentId || '');
          break;
        case "clearance":
          const aClearance = getClearanceProgress(a);
          const bClearance = getClearanceProgress(b);
          compareValue = aClearance - bClearance;
          break;
        case "gender":
          compareValue = (a.gender || '').localeCompare(b.gender || '');
          break;
        default:
          compareValue = 0;
      }
      
      return sortOrder === "asc" ? compareValue : -compareValue;
    });

    return filtered;
  };

  const getClearanceProgress = (student) => {
    if (!student.clearance) return 0;
    const total = Object.keys(student.clearance).length;
    if (total === 0) return 0;
    const completed = Object.values(student.clearance).filter(v => v === true).length;
    return Math.round((completed / total) * 100);
  };

  const handleExportClass = (format) => {
    const stats = getClassStats();
    
    if (format === 'csv') {
      const csvHeaders = ["Student ID", "Full Name", "Email", "Gender", "Date of Birth", "Contact", "Address", "Guardian", "Guardian Contact", "Clearance Progress"];
      const csvData = students.map(student => [
        student.studentId || "",
        student.fullName || "",
        student.email || "",
        student.gender || "",
        student.dateOfBirth || "",
        student.contact || "",
        student.address || "",
        student.guardian || "",
        student.guardianContact || "",
        `${getClearanceProgress(student)}%`
      ]);

      const csvContent = [
        [`Class Information`],
        [`Grade Level:`, classData.gradeLevel],
        [`Section:`, classData.sectionName],
        [`Education Level:`, classData.educationLevel],
        [`Adviser:`, classData.adviser || 'Not Assigned'],
        [`Total Students:`, stats.totalStudents],
        [],
        csvHeaders,
        ...csvData
      ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", `class_${classData.gradeLevel}_${classData.sectionName}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.display = "none";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showNotification('success', 'Class data exported successfully');
    } else if (format === 'pdf') {
      showNotification('info', 'PDF export coming soon');
    }
    
    setShowExportModal(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyClassCode = () => {
    navigator.clipboard.writeText(classId);
    showNotification('success', 'Class code copied to clipboard');
  };

  const getEducationLevelColor = (level) => {
    const colors = {
      'elementary': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: faSchool },
      'junior high school': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: faBookOpen },
      'senior high school': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: faGraduationCap },
      'college': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', icon: faUserGraduate },
    };
    const levelLower = level?.toLowerCase() || '';
    return colors[levelLower] || { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', icon: faSchool };
  };

  const stats = getClassStats();
  const levelColor = getEducationLevelColor(classData?.educationLevel);

  if (loading) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-blue-500 mb-4" />
            <p className="text-gray-600">Loading class details...</p>
          </div>
        </div>
      </Sidebar>
    );
  }

  if (!classData) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-4xl text-red-500 mb-4" />
            <p className="text-gray-600 mb-4">Class not found</p>
            <button
              onClick={() => navigate("/classes")}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Back to Classes
            </button>
          </div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {}
        {notification.show && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in ${
            notification.type === 'success' ? 'bg-green-500 text-white' : 
            notification.type === 'error' ? 'bg-red-500 text-white' : 
            'bg-blue-500 text-white'
          }`}>
            <FontAwesomeIcon 
              icon={
                notification.type === 'success' ? faCheckCircle : 
                notification.type === 'error' ? faExclamationTriangle : 
                faInfoCircle
              } 
              className="text-xl"
            />
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification({ show: false, type: '', message: '' })}
              className="ml-2"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {}
          <div className="mb-8">
            <button
              onClick={() => navigate("/classes")}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
              Back to Classes
            </button>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`p-4 rounded-xl ${levelColor.bg} ${levelColor.border} border`}>
                      <FontAwesomeIcon icon={levelColor.icon} className={`text-3xl ${levelColor.text}`} />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Grade {classData.gradeLevel} - {classData.sectionName}
                      </h1>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full ${levelColor.bg} ${levelColor.text} ${levelColor.border} border font-medium`}>
                          <FontAwesomeIcon icon={levelColor.icon} className="w-3 h-3" />
                          {classData.educationLevel}
                        </span>
                        {classData.archived && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-300 font-medium">
                            <FontAwesomeIcon icon={faArchive} className="w-3 h-3" />
                            Archived
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faCalendarAlt} />
                          Created {new Date(classData.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faTag} />
                          ID: {classId.slice(0, 8)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-gray-900">{stats.totalStudents}</div>
                      <div className="text-xs text-gray-600">Total Students</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-2xl font-bold text-gray-900">{stats.clearanceProgress}%</div>
                      <div className="text-xs text-gray-600">Clearance Progress</div>
                    </div>
                    {
}
                    {
}
                  </div>
                </div>

                {}
                <div className="flex flex-wrap gap-2">
                  {!classData.archived && (
                    <Link
                      to={`/update-class/${classId}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                      Edit Class
                    </Link>
                  )}
                  <button
                    onClick={() => setShowExportModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <FontAwesomeIcon icon={faDownload} />
                    Export
                  </button>
                  <button
                    onClick={handlePrint}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <FontAwesomeIcon icon={faPrint} />
                    Print
                  </button>
                  {
}
                </div>
              </div>
            </div>
          </div>

          {}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "overview"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <FontAwesomeIcon icon={faInfoCircle} className="mr-2" />
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("students")}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "students"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <FontAwesomeIcon icon={faUsers} className="mr-2" />
                  Students ({stats.totalStudents})
                </button>
                {classData.educationLevel !== "college" && (
                  <button
                    onClick={() => setActiveTab("subjects")}
                    className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === "subjects"
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <FontAwesomeIcon icon={faBook} className="mr-2" />
                    Subjects & Teachers
                  </button>
                )}
                <button
                  onClick={() => setActiveTab("clearance")}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "clearance"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <FontAwesomeIcon icon={faClipboardList} className="mr-2" />
                  Clearance Status
                </button>
              </nav>
            </div>

            {}
            <div className="p-6">
              {}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm text-gray-600 mb-1">Education Level</div>
                        <div className="font-medium text-gray-900">{classData.educationLevel}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm text-gray-600 mb-1">Grade Level</div>
                        <div className="font-medium text-gray-900">Grade {classData.gradeLevel}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm text-gray-600 mb-1">Section Name</div>
                        <div className="font-medium text-gray-900">{classData.sectionName}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm text-gray-600 mb-1">Class Adviser</div>
                        <div className="font-medium text-gray-900">
                          {classData.adviser || "Not Assigned"}
                          {teacher && (
                            <div className="text-sm text-gray-500 mt-1">
                              {teacher.email}
                            </div>
                          )}
                        </div>
                      </div>
                      {classData.educationLevel === "college" && (
                        <>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="text-sm text-gray-600 mb-1">Department</div>
                            <div className="font-medium text-gray-900">{classData.department}</div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="text-sm text-gray-600 mb-1">Course</div>
                            <div className="font-medium text-gray-900">{classData.course}</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Statistics</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <FontAwesomeIcon icon={faUsers} className="text-2xl text-blue-600" />
                          <span className="text-xs bg-blue-200 text-blue-700 px-2 py-1 rounded-full">Total</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{stats.totalStudents}</div>
                        <div className="text-sm text-gray-600">Total Students</div>
                      </div>
                      
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <FontAwesomeIcon icon={faCheckCircle} className="text-2xl text-green-600" />
                          <span className="text-xs bg-green-200 text-green-700 px-2 py-1 rounded-full">Cleared</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{stats.fullyClearedStudents}</div>
                        <div className="text-sm text-gray-600">Fully Cleared</div>
                      </div>
                      
                      {
}
                      
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                        <div className="flex items-center justify-between mb-2">
                          <FontAwesomeIcon icon={faPercentage} className="text-2xl text-purple-600" />
                          <span className="text-xs bg-purple-200 text-purple-700 px-2 py-1 rounded-full">Progress</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{stats.clearanceProgress}%</div>
                        <div className="text-sm text-gray-600">Overall Progress</div>
                        <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${stats.clearanceProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {}
                  {
}
                </div>
              )}

              {}
              {activeTab === "students" && (
                <div>
                  {}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="name">Sort by Name</option>
                      <option value="id">Sort by ID</option>
                      <option value="clearance">Sort by Clearance</option>
                      <option value="gender">Sort by Gender</option>
                    </select>
                    <button
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                      className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <FontAwesomeIcon icon={sortOrder === "asc" ? faSort : faSort} className="rotate-180" />
                    </button>
                  </div>

                  {}
                  {filteredAndSortedStudents().length === 0 ? (
                    <div className="text-center py-12">
                      <FontAwesomeIcon icon={faUsers} className="text-4xl text-gray-300 mb-4" />
                      <p className="text-gray-500">No students found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredAndSortedStudents().map((student) => (
                        <div 
                          key={student.id} 
                          className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => {
                            setSelectedStudent(student);
                            setShowStudentModal(true);
                          }}
                        >
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                                  {student.fullName?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900">{student.fullName}</h4>
                                  <p className="text-sm text-gray-500">{student.studentId}</p>
                                </div>
                              </div>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                student.gender?.toLowerCase() === 'male' 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-pink-100 text-pink-700'
                              }`}>
                                {student.gender}
                              </span>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2 text-gray-600">
                                <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4" />
                                <span className="truncate">{student.email || 'No email'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-600">
                                <FontAwesomeIcon icon={faPhone} className="w-4 h-4" />
                                <span>{student.contact || 'No contact'}</span>
                              </div>
                            </div>

                            {}
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-gray-600">Clearance Progress</span>
                                <span className="text-xs font-semibold text-gray-900">
                                  {getClearanceProgress(student)}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-500 ${
                                    getClearanceProgress(student) === 100 
                                      ? 'bg-green-500' 
                                      : getClearanceProgress(student) >= 50 
                                      ? 'bg-yellow-500' 
                                      : 'bg-red-500'
                                  }`}
                                  style={{ width: `${getClearanceProgress(student)}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {}
              {activeTab === "subjects" && classData.educationLevel !== "college" && (
                <div>
                  {!classData.subjects || classData.subjects.length === 0 ? (
                    <div className="text-center py-12">
                      <FontAwesomeIcon icon={faBook} className="text-4xl text-gray-300 mb-4" />
                      <p className="text-gray-500">No subjects assigned</p>
                      <Link
                        to={`/update-class/${classId}`}
                        className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                        Add Subjects
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {classData.subjects.map((subject, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900 text-lg">{subject.subject}</h4>
                              <p className="text-sm text-gray-500 mt-1">Subject #{index + 1}</p>
                            </div>
                            <div className="p-2 bg-blue-50 rounded-lg">
                              <FontAwesomeIcon icon={faBook} className="text-blue-600" />
                            </div>
                          </div>
                          
                          <div className="border-t border-gray-100 pt-3">
                            <div className="flex items-center gap-2 text-sm">
                              <FontAwesomeIcon icon={faChalkboardTeacher} className="text-gray-400" />
                              <span className="text-gray-600">Teacher:</span>
                              <span className="font-medium text-gray-900">
                                {subject.teacher || 'Not Assigned'}
                              </span>
                            </div>
                            {subjectTeachers.find(t => t.uid === subject.teacherUid) && (
                              <div className="mt-2 text-sm text-gray-500">
                                {subjectTeachers.find(t => t.uid === subject.teacherUid)?.email}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {}
                  {classData.adviser && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Adviser</h3>
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center text-white">
                            <FontAwesomeIcon icon={faChalkboardTeacher} className="text-2xl" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-lg">{classData.adviser}</h4>
                            {teacher && (
                              <>
                                <p className="text-sm text-gray-600">{teacher.email}</p>
                                {teacher.contact && (
                                  <p className="text-sm text-gray-600">{teacher.contact}</p>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {}
              {activeTab === "clearance" && (
                <div>
                  <div className="mb-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Overall Clearance Status</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-green-600">{stats.fullyClearedStudents}</div>
                          <div className="text-sm text-gray-600">Fully Cleared</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-yellow-600">
                            {stats.totalStudents - stats.fullyClearedStudents}
                          </div>
                          <div className="text-sm text-gray-600">In Progress</div>
                        </div>
                        <div className="text-center">
                          <div className="text-3xl font-bold text-blue-600">{stats.clearanceProgress}%</div>
                          <div className="text-sm text-gray-600">Completion Rate</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {}
                  {students.length > 0 && students[0].clearance && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Clearance Items Status</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.keys(students[0].clearance).map(item => {
                          const cleared = students.filter(s => s.clearance && s.clearance[item] === true).length;
                          const percentage = students.length > 0 ? Math.round((cleared / students.length) * 100) : 0;
                          
                          return (
                            <div key={item} className="bg-white border border-gray-200 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-900">{item}</span>
                                <span className={`text-sm font-semibold ${
                                  percentage === 100 ? 'text-green-600' : 
                                  percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {percentage}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-500 ${
                                    percentage === 100 ? 'bg-green-500' : 
                                    percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {cleared} of {students.length} cleared
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Clearance Details</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Student
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
                          {filteredAndSortedStudents().map((student) => {
                            const progress = getClearanceProgress(student);
                            return (
                              <tr key={student.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                                    <div className="text-sm text-gray-500">{student.studentId}</div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-3">
                                    <div className="flex-1">
                                      <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                          className={`h-2 rounded-full ${
                                            progress === 100 ? 'bg-green-500' : 
                                            progress >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                          }`}
                                          style={{ width: `${progress}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">{progress}%</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    progress === 100 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {progress === 100 ? 'Completed' : 'In Progress'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <button
                                    onClick={() => {
                                      setSelectedStudent(student);
                                      setShowStudentModal(true);
                                    }}
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    <FontAwesomeIcon icon={faEye} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {}
        <Modal isOpen={showStudentModal} onClose={() => setShowStudentModal(false)}>
          {selectedStudent && (
            <div className="p-6 max-w-2xl max-h-[80vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Student Details</h3>
              
              {}
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
                    {selectedStudent.fullName?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{selectedStudent.fullName}</h4>
                    <p className="text-sm text-gray-500">{selectedStudent.studentId}</p>
                    <p className="text-sm text-gray-500">{selectedStudent.email}</p>
                  </div>
                </div>
              </div>

              {}
              {selectedStudent.clearance && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Clearance Status</h4>
                  <div className="space-y-2">
                    {Object.entries(selectedStudent.clearance).map(([item, status]) => (
                      <div key={item} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-900">{item}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          status ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <FontAwesomeIcon icon={status ? faCheckCircle : faClock} />
                          {status ? 'Cleared' : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowStudentModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </Modal>

        {}
        <Modal isOpen={showExportModal} onClose={() => setShowExportModal(false)}>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Export Class Data</h3>
            <p className="text-gray-600 mb-6">Choose your preferred export format:</p>
            
            <div className="space-y-3">
              <button
                onClick={() => handleExportClass('csv')}
                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={faFileExport} className="text-green-600 text-xl" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">CSV Format</div>
                    <div className="text-sm text-gray-500">Excel compatible spreadsheet</div>
                  </div>
                </div>
                <FontAwesomeIcon icon={faExternalLinkAlt} className="text-gray-400" />
              </button>
              
              <button
                onClick={() => handleExportClass('pdf')}
                className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={faFileExport} className="text-red-600 text-xl" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">PDF Format</div>
                    <div className="text-sm text-gray-500">Printable document</div>
                  </div>
                </div>
                <FontAwesomeIcon icon={faExternalLinkAlt} className="text-gray-400" />
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>

        {}
        <Modal isOpen={showShareModal} onClose={() => setShowShareModal(false)}>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Share Class</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Class Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={classId}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
                <button
                  onClick={handleCopyClassCode}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FontAwesomeIcon icon={faCopy} />
                </button>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">QR Code</label>
              <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
                <div className="w-32 h-32 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center">
                  <FontAwesomeIcon icon={faQrcode} className="text-4xl text-gray-400" />
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center mt-2">QR Code generation coming soon</p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </Sidebar>
  );
}

export default ViewClass;