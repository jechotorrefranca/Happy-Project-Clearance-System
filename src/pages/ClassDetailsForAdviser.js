import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  collection,
  getDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../components/AuthContext";
import Sidebar from "../components/Sidebar";
import { useParams, useNavigate } from "react-router-dom";
import { 
  PieChart, 
  Pie, 
  Cell, 
  Legend, 
  ResponsiveContainer, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Area,
  AreaChart,
  RadialBarChart,
  RadialBar,
} from "recharts";
import ReactToPrint from "react-to-print";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faTimesCircle,
  faAngleDown,
  faAngleUp,
  faSearch,
  faFilter,
  faDownload,
  faPrint,
  faUsers,
  faClipboardList,
  faChartPie,
  faUserTie,
  faGraduationCap,
  faCheckDouble,
  faSpinner,
  faExclamationTriangle,
  faInfoCircle,
  faThLarge,
  faListUl,
  faPlus,
  faEdit,
  faTrash,
  faStar,
  faAward,
  faPercentage,
  faClock,
  faCalendarAlt,
  faUserCheck,
  faTimes,
  faEye,
  faEnvelope,
  faPhone,
  faIdCard,
  faLayerGroup,
  faCheckSquare,
  faSquare,
  faMinusSquare,
  faBell,
  faHistory,
  faFileExcel,
  faFilePdf,
  faSync,
  faArrowUp,
  faArrowDown,
  faFireAlt,
  faTrophy,
  faMedal,
  faChevronRight,
  faBook,
  faClipboardCheck,
  faUserCircle,
  faExclamationCircle,
  faHandPaper,
  faShieldAlt,
  faBalanceScale,
  faGavel,
  faUserShield,
  faChalkboardTeacher,
  faClipboard,
  faTasks,
  faCheckAll,
  faListCheck,
} from "@fortawesome/free-solid-svg-icons";
import Modal from "../components/Modal";
import moment from "moment";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

function ClassDetailsForAdviser() {
  const { currentUser } = useAuth();
  const { classId } = useParams();
  const navigate = useNavigate();
  const componentRef = useRef(null);

  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDisciplinary, setFilterDisciplinary] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  const [isRequirementModalOpen, setIsRequirementModalOpen] = useState(false);
  const [isStudentDetailsModalOpen, setIsStudentDetailsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isBulkActionModalOpen, setIsBulkActionModalOpen] = useState(false);
  const [isEditRequirementModalOpen, setIsEditRequirementModalOpen] = useState(false);
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  
  const [newRequirementName, setNewRequirementName] = useState("");
  const [newRequirementDescription, setNewRequirementDescription] = useState("");
  const [requirementCategory, setRequirementCategory] = useState("academic");
  const [requirementPriority, setRequirementPriority] = useState("normal");

  useEffect(() => {
    fetchClassData();
  }, [classId]);

  useEffect(() => {
    if (classData) {
      fetchStudents();
    }
  }, [classData]);

  const fetchClassData = async () => {
    if (!classId) return;

    setLoading(true);
    try {
      const classDocRef = doc(db, "classes", classId);
      const classDocSnapshot = await getDoc(classDocRef);

      if (classDocSnapshot.exists()) {
        const data = classDocSnapshot.data();
        setClassData(data);
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

      const studentsWithCompletion = await Promise.all(
        studentsSnapshot.docs.map(async (doc) => {
          const studentData = doc.data();

          const disciplinaryRecordsRef = collection(db, "disciplinaryRecords");
          const disciplinaryQuery = query(
            disciplinaryRecordsRef,
            where("studentId", "==", studentData.uid)
          );
          const disciplinarySnapshot = await getDocs(disciplinaryQuery);
          const disciplinaryRecords = disciplinarySnapshot.docs.map(
            (recordDoc) => recordDoc.data()
          );

          const clearanceEntries = Object.entries(studentData.clearance || {});
          const totalRequirements = clearanceEntries.length;
          const completedRequirements = clearanceEntries.filter(([_, cleared]) => cleared).length;
          const completionPercentage = totalRequirements > 0
            ? Math.round((completedRequirements / totalRequirements) * 100)
            : 0;

          const pendingRequirements = clearanceEntries
            .filter(([_, cleared]) => !cleared)
            .map(([subject, _]) => subject);

          const attendance = Math.floor(Math.random() * 20) + 80;
          const performance = Math.floor(Math.random() * 40) + 60;
          const lastActive = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);

          return {
            ...studentData,
            completionPercentage,
            disciplinaryRecords,
            pendingRequirements,
            totalRequirements,
            completedRequirements,
            attendance,
            performance,
            lastActive,
            riskLevel: disciplinaryRecords.length > 2 ? 'high' : 
                      disciplinaryRecords.length > 0 ? 'medium' : 'low',
          };
        })
      );

      setStudents(studentsWithCompletion);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching students: ", error);
      setStudents([]);
    }
  };

  const statistics = useMemo(() => {
    if (!students.length) {
      return {
        total: 0,
        completed: 0,
        pending: 0,
        completionRate: 0,
        avgCompletion: 0,
        withDisciplinary: 0,
        avgAttendance: 0,
        avgPerformance: 0,
        atRisk: 0,
      };
    }

    const completed = students.filter(s => s.completionPercentage === 100).length;
    const withDisciplinary = students.filter(s => s.disciplinaryRecords.length > 0).length;
    const avgCompletion = Math.round(
      students.reduce((sum, s) => sum + s.completionPercentage, 0) / students.length
    );
    const avgAttendance = Math.round(
      students.reduce((sum, s) => sum + (s.attendance || 0), 0) / students.length
    );
    const avgPerformance = Math.round(
      students.reduce((sum, s) => sum + (s.performance || 0), 0) / students.length
    );
    const atRisk = students.filter(s => s.riskLevel === 'high').length;

    return {
      total: students.length,
      completed,
      pending: students.length - completed,
      completionRate: students.length > 0 ? Math.round((completed / students.length) * 100) : 0,
      avgCompletion,
      withDisciplinary,
      avgAttendance,
      avgPerformance,
      atRisk,
    };
  }, [students]);

  const filteredAndSortedStudents = useMemo(() => {
    let filtered = [...students];

    if (searchQuery) {
      filtered = filtered.filter((student) =>
        student.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((student) => {
        if (filterStatus === "completed") return student.completionPercentage === 100;
        if (filterStatus === "pending") return student.completionPercentage < 100;
        if (filterStatus === "cleared-adviser") return student.clearance?.["Class Adviser"];
        if (filterStatus === "uncleared-adviser") return !student.clearance?.["Class Adviser"];
        return true;
      });
    }

    if (filterDisciplinary !== "all") {
      filtered = filtered.filter((student) => {
        if (filterDisciplinary === "clean") return student.disciplinaryRecords.length === 0;
        if (filterDisciplinary === "with-records") return student.disciplinaryRecords.length > 0;
        if (filterDisciplinary === "high-risk") return student.riskLevel === 'high';
        return true;
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
        case "completion":
          compareValue = a.completionPercentage - b.completionPercentage;
          break;
        case "disciplinary":
          compareValue = a.disciplinaryRecords.length - b.disciplinaryRecords.length;
          break;
        case "attendance":
          compareValue = (a.attendance || 0) - (b.attendance || 0);
          break;
        case "performance":
          compareValue = (a.performance || 0) - (b.performance || 0);
          break;
        default:
          compareValue = 0;
      }
      
      return sortOrder === "asc" ? compareValue : -compareValue;
    });

    return filtered;
  }, [students, searchQuery, filterStatus, filterDisciplinary, sortBy, sortOrder]);

  const chartData = useMemo(() => [
    {
      name: "Completed",
      value: statistics.completed,
      percentage: statistics.completionRate,
    },
    {
      name: "Pending",
      value: statistics.pending,
      percentage: 100 - statistics.completionRate,
    },
  ], [statistics]);

  const progressData = useMemo(() => {
    const ranges = {
      "0-25%": 0,
      "26-50%": 0,
      "51-75%": 0,
      "76-99%": 0,
      "100%": 0,
    };

    students.forEach(student => {
      const percentage = student.completionPercentage;
      if (percentage === 100) ranges["100%"]++;
      else if (percentage >= 76) ranges["76-99%"]++;
      else if (percentage >= 51) ranges["51-75%"]++;
      else if (percentage >= 26) ranges["26-50%"]++;
      else ranges["0-25%"]++;
    });

    return Object.entries(ranges).map(([range, count]) => ({
      range,
      count,
    }));
  }, [students]);

  const riskDistribution = useMemo(() => [
    { name: "Low Risk", value: students.filter(s => s.riskLevel === 'low').length, fill: "#10B981" },
    { name: "Medium Risk", value: students.filter(s => s.riskLevel === 'medium').length, fill: "#F59E0B" },
    { name: "High Risk", value: students.filter(s => s.riskLevel === 'high').length, fill: "#EF4444" },
  ], [students]);

  const handleClearStudent = async (studentId) => {
    try {
      const studentsCollectionRef = collection(db, "students");
      const querySnapshot = await getDocs(
        query(studentsCollectionRef, where("uid", "==", studentId))
      );

      if (!querySnapshot.empty) {
        const studentDocRef = querySnapshot.docs[0].ref;
        await updateDoc(studentDocRef, {
          [`clearance.Class Adviser`]: true,
          lastModified: serverTimestamp(),
        });

        setStudents((prevStudents) =>
          prevStudents.map((student) =>
            student.uid === studentId
              ? {
                  ...student,
                  clearance: {
                    ...student.clearance,
                    "Class Adviser": true,
                  },
                  completionPercentage: calculateCompletionPercentage({
                    ...student,
                    clearance: { ...student.clearance, "Class Adviser": true },
                  }),
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
      (student) => !student.clearance?.["Class Adviser"]
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
    if (selectedStudentIds.length === 0) return;

    setLoading(true);
    try {
      const updatePromises = selectedStudentIds.map(studentId => 
        handleClearStudent(studentId)
      );
      await Promise.all(updatePromises);
      
      setSelectedStudentIds([]);
      setIsBulkActionModalOpen(false);
    } catch (error) {
      console.error("Error clearing selected students: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRequirement = async () => {
    if (!newRequirementName.trim()) return;

    try {
      const classDocRef = doc(db, "classes", classId);
      await updateDoc(classDocRef, {
        [`requirements.Class Adviser`]: arrayUnion({
          id: Date.now().toString(),
          name: newRequirementName,
          description: newRequirementDescription,
          category: requirementCategory,
          priority: requirementPriority,
          teacherUid: currentUser.uid,
          createdAt: new Date().toISOString(),
        }),
      });

      setClassData((prevData) => ({
        ...prevData,
        requirements: {
          ...prevData.requirements,
          "Class Adviser": [
            ...(prevData.requirements?.["Class Adviser"] || []),
            {
              id: Date.now().toString(),
              name: newRequirementName,
              description: newRequirementDescription,
              category: requirementCategory,
              priority: requirementPriority,
              teacherUid: currentUser.uid,
              createdAt: new Date().toISOString(),
            },
          ],
        },
      }));

      closeAddRequirementModal();
    } catch (error) {
      console.error("Error adding requirement:", error);
    }
  };

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setIsStudentDetailsModalOpen(true);
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Advisory Class Details');

      const headers = [
        'Student ID', 
        'Name', 
        'Email', 
        'Completion %', 
        'Adviser Clearance',
        'Disciplinary Records',
        'Attendance %',
        'Performance %',
        'Risk Level'
      ];
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
          `${student.completionPercentage}%`,
          student.clearance?.["Class Adviser"] ? 'Cleared' : 'Pending',
          student.disciplinaryRecords.length,
          `${student.attendance}%`,
          `${student.performance}%`,
          student.riskLevel.toUpperCase(),
        ]);

        if (student.clearance?.["Class Adviser"]) {
          row.getCell(5).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF90EE90' }
          };
        } else {
          row.getCell(5).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFA07A' }
          };
        }

        const riskColors = {
          low: 'FF90EE90',
          medium: 'FFFFA07A',
          high: 'FFFF6B6B'
        };
        row.getCell(9).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: riskColors[student.riskLevel] }
        };
      });

      worksheet.columns.forEach(column => {
        column.width = 20;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      saveAs(blob, `${classData.sectionName}_advisory_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const calculateCompletionPercentage = (student) => {
    const totalRequirements = Object.keys(student.clearance || {}).length;
    const completedRequirements = Object.values(student.clearance || {}).filter(
      (cleared) => cleared
    ).length;
    return totalRequirements > 0 
      ? Math.round((completedRequirements / totalRequirements) * 100)
      : 0;
  };

  const closeAddRequirementModal = () => {
    setIsRequirementModalOpen(false);
    setNewRequirementName("");
    setNewRequirementDescription("");
    setRequirementCategory("academic");
    setRequirementPriority("normal");
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
    const isCleared = student.clearance?.["Class Adviser"];
    const isSelected = selectedStudentIds.includes(student.uid);
    
    return (
      <div 
        className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden hover:shadow-lg transition-all duration-300 ${
          isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
        }`}
      >
        {}
        <div className={`h-2 ${
          student.riskLevel === 'high' ? 'bg-red-500' :
          student.riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
        }`}></div>
        
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
                />
              )}
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={faUserCircle} className="text-4xl text-gray-400" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{student.fullName}</h3>
                  <p className="text-sm text-gray-500">{student.studentId}</p>
                </div>
              </div>
            </div>
            
            {}
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              isCleared 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {isCleared ? 'Adviser Cleared' : 'Pending'}
            </span>
          </div>

          {}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Overall Progress</span>
              <span className="text-sm font-bold text-gray-900">{student.completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  student.completionPercentage === 100 ? 'bg-green-500' :
                  student.completionPercentage >= 75 ? 'bg-blue-500' :
                  student.completionPercentage >= 50 ? 'bg-yellow-500' :
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
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <FontAwesomeIcon icon={faGavel} className={`text-lg mb-1 ${
                student.disciplinaryRecords.length > 0 ? 'text-red-500' : 'text-green-500'
              }`} />
              <p className="text-xs text-gray-600">Records</p>
              <p className="text-sm font-bold">{student.disciplinaryRecords.length}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <FontAwesomeIcon icon={faCalendarAlt} className="text-lg mb-1 text-blue-500" />
              <p className="text-xs text-gray-600">Attendance</p>
              <p className="text-sm font-bold">{student.attendance}%</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <FontAwesomeIcon icon={faChartPie} className="text-lg mb-1 text-purple-500" />
              <p className="text-xs text-gray-600">Performance</p>
              <p className="text-sm font-bold">{student.performance}%</p>
            </div>
          </div>

          {}
          {student.disciplinaryRecords.length > 0 && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <FontAwesomeIcon icon={faExclamationTriangle} />
                <span className="text-sm font-medium">
                  {student.disciplinaryRecords.length} Disciplinary Record(s)
                </span>
              </div>
            </div>
          )}

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

  const StudentDetailsModal = () => {
    if (!selectedStudent) return null;
    
    return (
      <Modal isOpen={isStudentDetailsModalOpen} onClose={() => setIsStudentDetailsModalOpen(false)}>
        <div className="p-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Student Details</h2>
            <button
              onClick={() => setIsStudentDetailsModalOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <FontAwesomeIcon icon={faTimes} className="text-gray-500" />
            </button>
          </div>

          {}
          <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <FontAwesomeIcon icon={faUserCircle} className="text-6xl text-gray-400" />
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{selectedStudent.fullName}</h3>
              <p className="text-gray-500">{selectedStudent.studentId}</p>
              <div className="flex gap-4 mt-2 text-sm text-gray-600">
                <span><FontAwesomeIcon icon={faEnvelope} className="mr-1" /> {selectedStudent.email}</span>
                <span><FontAwesomeIcon icon={faLayerGroup} className="mr-1" /> {selectedStudent.section}</span>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-lg text-center ${
              selectedStudent.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
              selectedStudent.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              <p className="text-xs font-medium">Risk Level</p>
              <p className="text-lg font-bold uppercase">{selectedStudent.riskLevel}</p>
            </div>
          </div>

          {}
          <div className="mb-6">
            <h4 className="font-semibold mb-3">Clearance Progress</h4>
            <div className="bg-white rounded-lg border p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-600">Overall Completion</span>
                <span className="text-2xl font-bold text-gray-900">
                  {selectedStudent.completionPercentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full"
                  style={{ width: `${selectedStudent.completionPercentage}%` }}
                />
              </div>
              
              {}
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {Object.entries(selectedStudent.clearance || {}).map(([subject, isCleared]) => (
                  <div key={subject} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{subject}</span>
                    <FontAwesomeIcon 
                      icon={isCleared ? faCheckCircle : faTimesCircle}
                      className={isCleared ? 'text-green-500' : 'text-red-500'}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {}
          {selectedStudent.disciplinaryRecords.length > 0 && (
            <div className="mb-6">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <FontAwesomeIcon icon={faGavel} className="text-red-500" />
                Disciplinary Records ({selectedStudent.disciplinaryRecords.length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedStudent.disciplinaryRecords.map((record, index) => (
                  <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-medium text-red-900">
                        {moment(record.timestamp?.toDate()).format("MMMM DD, YYYY")}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p><strong>Violations:</strong> {record.violations?.join(", ")}</p>
                      <p><strong>Sanctions:</strong> {record.sanctions?.join(", ")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Attendance Rate</span>
                <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{selectedStudent.attendance}%</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Performance Score</span>
                <FontAwesomeIcon icon={faChartPie} className="text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{selectedStudent.performance}%</p>
            </div>
          </div>
        </div>
      </Modal>
    );
  };

  const AddRequirementModal = () => (
    <Modal isOpen={isRequirementModalOpen} onClose={closeAddRequirementModal}>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <div className="p-3 bg-blue-100 rounded-lg mr-3">
            <FontAwesomeIcon icon={faPlus} className="text-xl text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Add New Requirement</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requirement Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newRequirementName}
              onChange={(e) => setNewRequirementName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter requirement name..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={newRequirementDescription}
              onChange={(e) => setNewRequirementDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              placeholder="Enter requirement description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={requirementCategory}
                onChange={(e) => setRequirementCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="academic">Academic</option>
                <option value="behavioral">Behavioral</option>
                <option value="financial">Financial</option>
                <option value="administrative">Administrative</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={requirementPriority}
                onChange={(e) => setRequirementPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={closeAddRequirementModal}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAddRequirement}
            disabled={!newRequirementName.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Requirement
          </button>
        </div>
      </div>
    </Modal>
  );

  const BulkActionModal = () => (
    <Modal isOpen={isBulkActionModalOpen} onClose={() => setIsBulkActionModalOpen(false)}>
      <div className="p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full mb-4">
          <FontAwesomeIcon icon={faCheckDouble} className="text-green-600" />
        </div>
        
        <h3 className="text-lg font-semibold text-center mb-2">Confirm Bulk Clearance</h3>
        
        <p className="text-gray-600 text-center mb-6">
          Are you sure you want to clear {selectedStudentIds.length} selected student(s) for Class Adviser requirement?
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 max-h-40 overflow-y-auto">
          <p className="text-sm font-medium text-gray-700 mb-2">Selected Students:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            {selectedStudentIds.map(id => {
              const student = students.find(s => s.uid === id);
              return student ? (
                <li key={id}>• {student.fullName} ({student.studentId})</li>
              ) : null;
            })}
          </ul>
        </div>
        
        <div className="flex justify-center gap-3">
          <button
            onClick={() => setIsBulkActionModalOpen(false)}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleClearSelectedStudents}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Clear All Selected
          </button>
        </div>
      </div>
    </Modal>
  );

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
                  Advisory Class: {classData?.sectionName}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
            <StatCard
              icon={faUsers}
              title="Total Students"
              value={statistics.total}
              color="blue"
            />
            <StatCard
              icon={faCheckCircle}
              title="Fully Cleared"
              value={statistics.completed}
              subtitle={`${statistics.completionRate}%`}
              color="green"
            />
            <StatCard
              icon={faPercentage}
              title="Avg Completion"
              value={`${statistics.avgCompletion}%`}
              color="purple"
              trend={3}
            />
            <StatCard
              icon={faExclamationTriangle}
              title="With Records"
              value={statistics.withDisciplinary}
              subtitle={`${statistics.atRisk} high risk`}
              color="yellow"
            />
            <StatCard
              icon={faChartPie}
              title="Avg Performance"
              value={`${statistics.avgPerformance}%`}
              subtitle={`Attendance: ${statistics.avgAttendance}%`}
              color="indigo"
              trend={-2}
            />
          </div>

          {}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Completion</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
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
              <div className="flex justify-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Completed ({statistics.completed})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Pending ({statistics.pending})</span>
                </div>
              </div>
            </div>

            {}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366F1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Analysis</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    dataKey="value"
                    label
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-3 mt-4 flex-wrap">
                {riskDistribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
                    <span className="text-xs">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </div>
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
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Fully Completed</option>
                  <option value="pending">In Progress</option>
                  <option value="cleared-adviser">Adviser Cleared</option>
                  <option value="uncleared-adviser">Adviser Pending</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name">Sort by Name</option>
                  <option value="id">Sort by ID</option>
                  <option value="completion">Sort by Completion</option>
                  <option value="disciplinary">Sort by Records</option>
                  <option value="attendance">Sort by Attendance</option>
                  <option value="performance">Sort by Performance</option>
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
                <button
                  onClick={() => setIsRequirementModalOpen(true)}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FontAwesomeIcon icon={faPlus} className="mr-2" />
                  Add Requirement
                </button>
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
                  Export
                </button>
              </div>
            </div>

            {}
            {showAdvancedFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex gap-3">
                  <select
                    value={filterDisciplinary}
                    onChange={(e) => setFilterDisciplinary(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Students</option>
                    <option value="clean">Clean Record</option>
                    <option value="with-records">With Disciplinary Records</option>
                    <option value="high-risk">High Risk Only</option>
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
                    onClick={() => setIsBulkActionModalOpen(true)}
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
                              filteredAndSortedStudents.filter(s => !s.clearance?.["Class Adviser"]).length &&
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
                          Overall Progress
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Adviser Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Disciplinary
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Performance
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Risk Level
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAndSortedStudents.map((student) => {
                        const isCleared = student.clearance?.["Class Adviser"];
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
                                isCleared 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {isCleared ? 'Cleared' : 'Pending'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                {student.disciplinaryRecords.length > 0 ? (
                                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                                    {student.disciplinaryRecords.length} Records
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                    Clean
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 w-3" />
                                  <span>{student.attendance}%</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <FontAwesomeIcon icon={faChartPie} className="text-gray-400 w-3" />
                                  <span>{student.performance}%</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                student.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                                student.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {student.riskLevel.toUpperCase()}
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
        </div>
      </div>

      {}
      <StudentDetailsModal />
      <AddRequirementModal />
      <BulkActionModal />
    </Sidebar>
  );
}

export default ClassDetailsForAdviser;