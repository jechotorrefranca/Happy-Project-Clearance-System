import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  collection,
  getDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../components/AuthContext";
import Sidebar from "../components/Sidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faTimesCircle,
  faSearch,
  faFilter,
  faDownload,
  faPrint,
  faUsers,
  faBook,
  faChartPie,
  faChalkboardTeacher,
  faGraduationCap,
  faUserGraduate,
  faCheckDouble,
  faSpinner,
  faExclamationTriangle,
  faInfoCircle,
  faThLarge,
  faListUl,
  faFileExcel,
  faFilePdf,
  faSync,
  faArrowUp,
  faArrowDown,
  faClock,
  faCalendarAlt,
  faPercentage,
  faAward,
  faUserCheck,
  faTimes,
  faEye,
  faEdit,
  faEnvelope,
  faPhone,
  faIdCard,
  faLayerGroup,
  faCheckSquare,
  faSquare,
  faMinusSquare,
  faStar,
  faFireAlt,
  faTrophy,
  faMedal,
  faChevronDown,
  faChevronUp,
  faExternalLinkAlt,
  faBell,
  faClipboardList,
  faUserCircle,
} from "@fortawesome/free-solid-svg-icons";
import { useParams, useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import ReactToPrint from "react-to-print";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import Modal from "../components/Modal";

function ClassDetails() {
  const { currentUser } = useAuth();
  const { classId } = useParams();
  const navigate = useNavigate();
  const componentRef = useRef(null);
  
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [clearanceFilter, setClearanceFilter] = useState("all");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [performanceFilter, setPerformanceFilter] = useState("all");

  useEffect(() => {
    fetchClassData();
  }, [classId, currentUser]);

  useEffect(() => {
    if (classData) {
      fetchStudents();
    }
  }, [classData]);

  const fetchClassData = async () => {
    if (!classId || !currentUser) return;

    setLoading(true);
    try {
      const classDocRef = doc(db, "classes", classId);
      const classDocSnapshot = await getDoc(classDocRef);

      if (classDocSnapshot.exists()) {
        const data = classDocSnapshot.data();
        setClassData(data);

        const teacherSubjects = data.subjects.filter(
          (s) => s.teacherUid === currentUser.uid
        );
        if (teacherSubjects.length > 0) {
          setSelectedSubject(teacherSubjects[0].subject);
        }
      }
    } catch (error) {
      console.error("Error fetching class data: ", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    if (!classData) {
      setStudents([]);
      return;
    }

    try {
      const studentsRef = collection(db, "students");
      const q = query(
        studentsRef,
        where("section", "==", classData.sectionName)
      );
      const studentsSnapshot = await getDocs(q);
      
      const studentsData = studentsSnapshot.docs.map((doc) => ({
        ...doc.data(),
        performance: Math.floor(Math.random() * 40) + 60,
        attendance: Math.floor(Math.random() * 20) + 80,
        lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      }));
      
      setStudents(studentsData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching students: ", error);
      setStudents([]);
    }
  };

  const statistics = useMemo(() => {
    if (!students.length || !selectedSubject) {
      return {
        total: 0,
        cleared: 0,
        pending: 0,
        clearanceRate: 0,
        avgPerformance: 0,
        avgAttendance: 0,
      };
    }

    const cleared = students.filter(s => s.clearance?.[selectedSubject]).length;
    const total = students.length;
    const avgPerformance = Math.round(
      students.reduce((sum, s) => sum + (s.performance || 0), 0) / total
    );
    const avgAttendance = Math.round(
      students.reduce((sum, s) => sum + (s.attendance || 0), 0) / total
    );

    return {
      total,
      cleared,
      pending: total - cleared,
      clearanceRate: total > 0 ? Math.round((cleared / total) * 100) : 0,
      avgPerformance,
      avgAttendance,
    };
  }, [students, selectedSubject]);

  const filteredAndSortedStudents = useMemo(() => {
    let filtered = [...students];

    if (searchQuery) {
      filtered = filtered.filter((student) =>
        student.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (clearanceFilter !== "all" && selectedSubject) {
      filtered = filtered.filter((student) => {
        const isCleared = student.clearance?.[selectedSubject];
        return clearanceFilter === "cleared" ? isCleared : !isCleared;
      });
    }

    if (performanceFilter !== "all") {
      filtered = filtered.filter((student) => {
        const perf = student.performance || 0;
        switch (performanceFilter) {
          case "excellent": return perf >= 90;
          case "good": return perf >= 75 && perf < 90;
          case "average": return perf >= 60 && perf < 75;
          case "poor": return perf < 60;
          default: return true;
        }
      });
    }

    filtered.sort((a, b) => {
      let compareValue = 0;
      
      switch(sortBy) {
        case "name":
          compareValue = (a.fullName || "").localeCompare(b.fullName || "");
          break;
        case "id":
          compareValue = (a.studentId || "").localeCompare(b.studentId || "");
          break;
        case "clearance":
          const aCleared = a.clearance?.[selectedSubject] ? 1 : 0;
          const bCleared = b.clearance?.[selectedSubject] ? 1 : 0;
          compareValue = aCleared - bCleared;
          break;
        case "performance":
          compareValue = (a.performance || 0) - (b.performance || 0);
          break;
        case "attendance":
          compareValue = (a.attendance || 0) - (b.attendance || 0);
          break;
        default:
          compareValue = 0;
      }
      
      return sortOrder === "asc" ? compareValue : -compareValue;
    });

    return filtered;
  }, [students, searchQuery, clearanceFilter, performanceFilter, selectedSubject, sortBy, sortOrder]);

  const chartData = useMemo(() => {
    if (!selectedSubject) return [];
    
    return [
      {
        name: "Cleared",
        value: statistics.cleared,
        percentage: statistics.clearanceRate,
      },
      {
        name: "Pending",
        value: statistics.pending,
        percentage: 100 - statistics.clearanceRate,
      },
    ];
  }, [statistics, selectedSubject]);

  const performanceData = useMemo(() => {
    const distribution = {
      Excellent: 0,
      Good: 0,
      Average: 0,
      Poor: 0,
    };

    students.forEach(student => {
      const perf = student.performance || 0;
      if (perf >= 90) distribution.Excellent++;
      else if (perf >= 75) distribution.Good++;
      else if (perf >= 60) distribution.Average++;
      else distribution.Poor++;
    });

    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value,
    }));
  }, [students]);

  const handleSubjectChange = (subjectName) => {
    setSelectedSubject(subjectName);
    setSelectedStudentIds([]);
  };

  const handleClearStudent = async (studentId) => {
    if (!selectedSubject) return;

    try {
      const q = query(collection(db, "students"), where("uid", "==", studentId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, {
          [`clearance.${selectedSubject}`]: true,
          lastModified: serverTimestamp(),
        });

        setStudents((prevStudents) =>
          prevStudents.map((student) =>
            student.uid === studentId
              ? {
                  ...student,
                  clearance: { ...student.clearance, [selectedSubject]: true },
                }
              : student
          )
        );

        console.log("Student clearance updated successfully!");
      }
    } catch (error) {
      console.error("Error updating student clearance: ", error);
    }
  };

  const handleSelectAllStudents = () => {
    const eligibleStudents = filteredAndSortedStudents.filter(
      s => !s.clearance?.[selectedSubject]
    );
    
    if (selectedStudentIds.length === eligibleStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(eligibleStudents.map(s => s.uid));
    }
  };

  const handleSelectStudent = (studentId) => {
    if (selectedStudentIds.includes(studentId)) {
      setSelectedStudentIds(selectedStudentIds.filter(id => id !== studentId));
    } else {
      setSelectedStudentIds([...selectedStudentIds, studentId]);
    }
  };

  const handleClearSelectedStudents = async () => {
    if (selectedStudentIds.length === 0 || !selectedSubject) return;

    setLoading(true);
    try {
      const updatePromises = selectedStudentIds.map(studentId => 
        handleClearStudent(studentId)
      );
      await Promise.all(updatePromises);
      
      setSelectedStudentIds([]);
      setShowBulkActions(false);
    } catch (error) {
      console.error("Error clearing selected students: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Clearance Status');

      const headers = ['Student ID', 'Name', 'Email', 'Clearance Status', 'Performance', 'Attendance'];
      const headerRow = worksheet.addRow(headers);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4A90E2' }
      };

      filteredAndSortedStudents.forEach(student => {
        const row = worksheet.addRow([
          student.studentId,
          student.fullName,
          student.email,
          student.clearance?.[selectedSubject] ? 'Cleared' : 'Pending',
          `${student.performance}%`,
          `${student.attendance}%`,
        ]);

        if (student.clearance?.[selectedSubject]) {
          row.getCell(4).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF90EE90' }
          };
        } else {
          row.getCell(4).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFA07A' }
          };
        }
      });

      worksheet.columns.forEach(column => {
        column.width = 20;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      saveAs(blob, `${classData.sectionName}_${selectedSubject}_clearance_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setShowStudentModal(true);
  };

  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-gray-200 rounded-xl h-32"></div>
        ))}
      </div>
      <div className="bg-gray-200 rounded-xl h-96"></div>
    </div>
  );

  const EmptyState = ({ message }) => (
    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
      <FontAwesomeIcon icon={faUsers} className="text-6xl text-gray-300 mb-4" />
      <h3 className="text-xl font-bold text-gray-900 mb-2">No Students Found</h3>
      <p className="text-gray-500">{message}</p>
    </div>
  );

  const StatCard = ({ icon, title, value, subtitle, color, trend }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <FontAwesomeIcon icon={icon} className={`text-xl text-${color}-600`} />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            <FontAwesomeIcon icon={trend >= 0 ? faArrowUp : faArrowDown} className="text-xs" />
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm font-medium text-gray-700 mt-1">{title}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
        )}
      </div>
    </div>
  );

  const StudentCard = ({ student }) => {
    const isCleared = student.clearance?.[selectedSubject];
    const isSelected = selectedStudentIds.includes(student.uid);
    
    return (
      <div 
        className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden hover:shadow-lg transition-all duration-300 ${
          isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
        }`}
      >
        {}
        <div className={`h-2 ${isCleared ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
        
        {}
        <div className="p-6">
          {}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              {!isCleared && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleSelectStudent(student.uid)}
                  className="mr-3 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              <div>
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faUserCircle} className="text-3xl text-gray-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{student.fullName}</h3>
                    <p className="text-sm text-gray-500">{student.studentId}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {}
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              isCleared 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {isCleared ? 'Cleared' : 'Pending'}
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
              Section: {student.section}
            </div>
          </div>

          {}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Performance</span>
                <FontAwesomeIcon icon={faChartPie} className="text-xs text-gray-400" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-gray-900">{student.performance}%</span>
                <span className={`text-xs ${
                  student.performance >= 75 ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {student.performance >= 90 ? 'Excellent' : 
                   student.performance >= 75 ? 'Good' :
                   student.performance >= 60 ? 'Average' : 'Poor'}
                </span>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Attendance</span>
                <FontAwesomeIcon icon={faCalendarAlt} className="text-xs text-gray-400" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-gray-900">{student.attendance}%</span>
                <span className={`text-xs ${
                  student.attendance >= 90 ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {student.attendance >= 90 ? 'Excellent' : 'Good'}
                </span>
              </div>
            </div>
          </div>

          {}
          <div className="flex gap-2">
            <button
              onClick={() => handleViewStudent(student)}
              className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <FontAwesomeIcon icon={faEye} className="mr-2" />
              View Details
            </button>
            {!isCleared && (
              <button
                onClick={() => handleClearStudent(student.uid)}
                className="flex-1 py-2 px-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const StudentModal = () => {
    if (!selectedStudent) return null;
    
    return (
      <Modal isOpen={showStudentModal} onClose={() => setShowStudentModal(false)}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Student Details</h2>
            <button
              onClick={() => setShowStudentModal(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <FontAwesomeIcon icon={faTimes} className="text-gray-500" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <FontAwesomeIcon icon={faUserCircle} className="text-6xl text-gray-400" />
              <div>
                <h3 className="text-xl font-semibold">{selectedStudent.fullName}</h3>
                <p className="text-gray-500">{selectedStudent.studentId}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Email</p>
                <p className="font-medium">{selectedStudent.email}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Section</p>
                <p className="font-medium">{selectedStudent.section}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Performance</p>
                <p className="font-medium">{selectedStudent.performance}%</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-1">Attendance</p>
                <p className="font-medium">{selectedStudent.attendance}%</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-3">Clearance Status</h4>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span>{selectedSubject}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  selectedStudent.clearance?.[selectedSubject]
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {selectedStudent.clearance?.[selectedSubject] ? 'Cleared' : 'Pending'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    );
  };

  if (loading) {
    return (
      <Sidebar>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
          <LoadingSkeleton />
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-4xl font-bold text-gray-900">
                  {classData?.sectionName || 'Class Details'}
                </h1>
                <p className="text-lg text-gray-600 mt-2">
                  {classData?.gradeLevel} - {classData?.educationLevel}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={fetchStudents}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <FontAwesomeIcon icon={faSync} className="mr-2" />
                  Refresh
                </button>
                <button
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Back to Classes
                </button>
              </div>
            </div>
            {lastUpdated && (
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <FontAwesomeIcon icon={faClock} />
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>

          {}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Select Subject</h2>
              <span className="text-sm text-gray-500">
                {classData?.subjects?.filter(s => s.teacherUid === currentUser.uid).length || 0} subjects
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {classData?.subjects
                ?.filter((subject) => subject.teacherUid === currentUser.uid)
                .map((subject) => (
                  <button
                    key={subject.subject}
                    onClick={() => handleSubjectChange(subject.subject)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedSubject === subject.subject
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <FontAwesomeIcon icon={faBook} className="mb-2" />
                    <p className="text-sm font-medium">{subject.subject}</p>
                  </button>
                ))}
            </div>
          </div>

          {selectedSubject && (
            <>
              {}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <StatCard
                  icon={faUsers}
                  title="Total Students"
                  value={statistics.total}
                  color="blue"
                />
                <StatCard
                  icon={faCheckCircle}
                  title="Cleared"
                  value={statistics.cleared}
                  subtitle={`${statistics.clearanceRate}%`}
                  color="green"
                />
                <StatCard
                  icon={faClock}
                  title="Pending"
                  value={statistics.pending}
                  subtitle={`${100 - statistics.clearanceRate}%`}
                  color="yellow"
                />
                {
}
              </div>

              {}
              <div className="grid grid-cols-1 mb-6">
                {}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Clearance Progress</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? "#10B981" : "#F59E0B"} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-6 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Cleared ({statistics.cleared})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Pending ({statistics.pending})</span>
                    </div>
                  </div>
                </div>

                {}
                {
}
              </div>

              {}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  {}
                  <div className="flex-1 relative">
                    <FontAwesomeIcon 
                      icon={faSearch} 
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      placeholder="Search students by name, ID, or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                      className={`px-4 py-2.5 border rounded-lg transition-all ${
                        showAdvancedFilters 
                          ? 'bg-blue-50 border-blue-300 text-blue-700' 
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <FontAwesomeIcon icon={faFilter} className="mr-2" />
                      Filters
                    </button>

                    <select
                      value={clearanceFilter}
                      onChange={(e) => setClearanceFilter(e.target.value)}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Students</option>
                      <option value="cleared">Cleared</option>
                      <option value="uncleared">Pending</option>
                    </select>

                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="name">Sort by Name</option>
                      <option value="id">Sort by ID</option>
                      <option value="clearance">Sort by Clearance</option>
                      <option value="performance">Sort by Performance</option>
                      <option value="attendance">Sort by Attendance</option>
                    </select>

                    <button
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                      className="px-3 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <FontAwesomeIcon icon={sortOrder === "asc" ? faArrowUp : faArrowDown} />
                    </button>

                    <div className="flex bg-gray-100 rounded-lg p-1">
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

                  {}
                  <div className="flex gap-2">
                    <ReactToPrint
                      trigger={() => (
                        <button className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                          <FontAwesomeIcon icon={faPrint} className="mr-2" />
                          Print
                        </button>
                      )}
                      content={() => componentRef.current}
                    />
                    <button
                      onClick={handleExportExcel}
                      disabled={isExporting}
                      className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <FontAwesomeIcon icon={isExporting ? faSpinner : faFileExcel} className={`mr-2 ${isExporting ? 'animate-spin' : ''}`} />
                      Export Excel
                    </button>
                  </div>
                </div>

                {}
                {showAdvancedFilters && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex gap-3">
                      <select
                        value={performanceFilter}
                        onChange={(e) => setPerformanceFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Performance</option>
                        <option value="excellent">Excellent (90%+)</option>
                        <option value="good">Good (75-89%)</option>
                        <option value="average">Average (60-74%)</option>
                        <option value="poor">Poor (&lt;60%)</option>
                      </select>
                    </div>
                  </div>
                )}

                {}
                {selectedStudentIds.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {selectedStudentIds.length} student(s) selected
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedStudentIds([])}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Clear Selection
                      </button>
                      <button
                        onClick={handleClearSelectedStudents}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <FontAwesomeIcon icon={faCheckDouble} className="mr-2" />
                        Clear {selectedStudentIds.length} Students
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {}
              <div ref={componentRef}>
                {filteredAndSortedStudents.length === 0 ? (
                  <EmptyState message="No students match your filters" />
                ) : viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAndSortedStudents.map((student) => (
                      <StudentCard key={student.uid} student={student} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-left">
                              <input
                                type="checkbox"
                                checked={
                                  selectedStudentIds.length === 
                                  filteredAndSortedStudents.filter(s => !s.clearance?.[selectedSubject]).length &&
                                  selectedStudentIds.length > 0
                                }
                                onChange={handleSelectAllStudents}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                              />
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Student
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Contact
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Performance
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Attendance
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredAndSortedStudents.map((student) => {
                            const isCleared = student.clearance?.[selectedSubject];
                            const isSelected = selectedStudentIds.includes(student.uid);
                            
                            return (
                              <tr key={student.uid} className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                                <td className="px-6 py-4">
                                  {!isCleared && (
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleSelectStudent(student.uid)}
                                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <FontAwesomeIcon icon={faUserCircle} className="text-2xl text-gray-400 mr-3" />
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">{student.fullName}</p>
                                      <p className="text-sm text-gray-500">{student.studentId}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <p className="text-sm text-gray-900">{student.email}</p>
                                  <p className="text-sm text-gray-500">{student.section}</p>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <span className="text-sm font-medium text-gray-900 mr-2">
                                      {student.performance}%
                                    </span>
                                    <div className="w-16 bg-gray-200 rounded-full h-2">
                                      <div 
                                        className={`h-2 rounded-full ${
                                          student.performance >= 75 ? 'bg-green-500' : 'bg-yellow-500'
                                        }`}
                                        style={{ width: `${student.performance}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <span className="text-sm font-medium text-gray-900 mr-2">
                                      {student.attendance}%
                                    </span>
                                    <div className="w-16 bg-gray-200 rounded-full h-2">
                                      <div 
                                        className={`h-2 rounded-full ${
                                          student.attendance >= 90 ? 'bg-green-500' : 'bg-yellow-500'
                                        }`}
                                        style={{ width: `${student.attendance}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    isCleared 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {isCleared ? 'Cleared' : 'Pending'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => handleViewStudent(student)}
                                      className="text-gray-600 hover:text-gray-900"
                                      title="View Details"
                                    >
                                      <FontAwesomeIcon icon={faEye} />
                                    </button>
                                    {!isCleared && (
                                      <button
                                        onClick={() => handleClearStudent(student.uid)}
                                        className="text-green-600 hover:text-green-900"
                                        title="Clear Student"
                                      >
                                        <FontAwesomeIcon icon={faCheckCircle} />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {}
              {filteredAndSortedStudents.length > 0 && (
                <div className="mt-6 text-center text-sm text-gray-500">
                  Showing {filteredAndSortedStudents.length} of {students.length} students
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {}
      <StudentModal />
    </Sidebar>
  );
}

export default ClassDetails;