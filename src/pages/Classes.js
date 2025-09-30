import React, { useEffect, useState, useMemo } from "react";
import { getDocs, collection, doc, deleteDoc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faPlus,
  faEdit,
  faTrash,
  faUsers,
  faThLarge,
  faListUl,
  faFilter,
  faSort,
  faSchool,
  faChalkboardTeacher,
  faGraduationCap,
  faUserGraduate,
  faChartLine,
  faInfoCircle,
  faEllipsisV,
  faDownload,
  faUpload,
  faCopy,
  faArchive,
  faCheckCircle,
  faExclamationTriangle,
  faTimes,
  faArrowUp,
  faArrowDown,
  faStar,
  faBookOpen,
  faClipboardList,
  faUserFriends,
  faClock,
  faCalendarAlt,
  faTag,
  faPalette,
  faEye,
  faPrint,
  faShare,
  faFolder,
  faSpinner,
  faUndo,
} from "@fortawesome/free-solid-svg-icons";
import Modal from "../components/Modal";

function Classes() {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [filterEducationLevel, setFilterEducationLevel] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedClasses, setSelectedClasses] = useState([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [classToArchive, setClassToArchive] = useState(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkArchiveModalOpen, setIsBulkArchiveModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  const stats = useMemo(() => {
    const activeClasses = showArchived 
      ? classes 
      : classes.filter(cls => !cls.archived);

    const classStudentMap = new Map();
    
    activeClasses.forEach(cls => {
      const classKey = `${cls.sectionName}`.toLowerCase().trim();
      classStudentMap.set(classKey, {
        classData: cls,
        studentCount: 0,
        students: []
      });
    });

    students.forEach(student => {
      if (student.archived || !student.section) {
        return;
      }

      const studentSection = `${student.section}`.toLowerCase().trim();
      
      if (classStudentMap.has(studentSection)) {
        const classInfo = classStudentMap.get(studentSection);
        classInfo.studentCount++;
        classInfo.students.push(student);
      }
    });

    const classesWithCounts = activeClasses.map(cls => {
      const classKey = `${cls.sectionName}`.toLowerCase().trim();
      const classInfo = classStudentMap.get(classKey);
      
      return {
        ...cls,
        studentCount: classInfo ? classInfo.studentCount : 0,
        students: classInfo ? classInfo.students : []
      };
    });

    const totalStudentsInClasses = Array.from(classStudentMap.values())
      .reduce((sum, classInfo) => sum + classInfo.studentCount, 0);

    const studentsWithoutClasses = students.filter(student => 
      !student.archived && !student.section
    ).length;

    const classesWithStudents = classesWithCounts.filter(c => c.studentCount > 0);
    const avgClassSize = classesWithStudents.length > 0 
      ? Math.round(totalStudentsInClasses / classesWithStudents.length) 
      : 0;

    const withAdvisers = classesWithCounts.filter(c => c.adviser && c.adviser !== "").length;
    const withoutAdviser = classesWithCounts.filter(c => !c.adviser || c.adviser === "").length;
    const activeClassesCount = classesWithCounts.filter(c => 
      !c.archived && (c.status === 'active' || (!c.status && c.adviser))
    ).length;
    const archivedCount = classes.filter(c => c.archived).length;

    return {
      totalClasses: classesWithCounts.length,
      totalStudents: totalStudentsInClasses,
      studentsWithoutClasses,
      avgClassSize,
      withAdvisers,
      withoutAdviser,
      activeClasses: activeClassesCount,
      archivedClasses: archivedCount,
      classesWithCounts,
      classesWithStudents: classesWithStudents.length,
      emptyClasses: classesWithCounts.filter(c => c.studentCount === 0).length
    };
  }, [classes, students, showArchived]);

  useEffect(() => {
    fetchClassesAndStudents();
  }, []);

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, type: '', message: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchClassesAndStudents = async () => {
    try {
      setLoading(true);
      
      const classesSnapshot = await getDocs(collection(db, "classes"));
      const classesData = classesSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          status: data.status || (data.adviser ? 'active' : 'inactive'),
          createdAt: data.createdAt || new Date(),
          archived: data.archived || false,
          archivedAt: data.archivedAt || null,
          ...data,
        };
      });
      
      const studentsSnapshot = await getDocs(collection(db, "students"));
      const studentsData = studentsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          archived: data.archived || false,
          ...data,
        };
      });
      
      setClasses(classesData);
      setStudents(studentsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      showNotification('error', 'Failed to fetch classes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
  };

  const filteredAndSortedClasses = useMemo(() => {
    let filtered = stats.classesWithCounts.filter((cls) => {
      const gradeLevel = cls.gradeLevel ? cls.gradeLevel.toString().toLowerCase() : "";
      const sectionName = cls.sectionName ? cls.sectionName.toLowerCase() : "";
      const adviser = cls.adviser ? cls.adviser.toLowerCase() : "";
      const educationLevel = cls.educationLevel ? cls.educationLevel.toLowerCase() : "";
      const searchLower = searchTerm.toLowerCase();

      const matchesSearch = 
        gradeLevel.includes(searchLower) ||
        sectionName.includes(searchLower) ||
        adviser.includes(searchLower) ||
        educationLevel.includes(searchLower);

      const matchesEducationFilter = 
        filterEducationLevel === "all" || 
        educationLevel === filterEducationLevel.toLowerCase();

      const matchesStatusFilter =
        filterStatus === "all" ||
        (filterStatus === "active" && (cls.status === "active" || cls.adviser)) ||
        (filterStatus === "inactive" && cls.status === "inactive" && !cls.adviser) ||
        (filterStatus === "no-adviser" && !cls.adviser) ||
        (filterStatus === "empty" && cls.studentCount === 0) ||
        (filterStatus === "has-students" && cls.studentCount > 0) ||
        (filterStatus === "archived" && cls.archived);

      return matchesSearch && matchesEducationFilter && matchesStatusFilter;
    });

    filtered.sort((a, b) => {
      let compareValue = 0;
      
      switch(sortBy) {
        case "name":
          const aGrade = parseInt(a.gradeLevel) || a.gradeLevel || "";
          const bGrade = parseInt(b.gradeLevel) || b.gradeLevel || "";
          compareValue = aGrade === bGrade 
            ? (a.sectionName || "").localeCompare(b.sectionName || "")
            : aGrade > bGrade ? 1 : -1;
          break;
        case "section":
          compareValue = (a.sectionName || "").localeCompare(b.sectionName || "");
          break;
        case "adviser":
          compareValue = (a.adviser || "zzz").localeCompare(b.adviser || "zzz");
          break;
        case "students":
          compareValue = (a.studentCount || 0) - (b.studentCount || 0);
          break;
        case "level":
          compareValue = (a.educationLevel || "").localeCompare(b.educationLevel || "");
          break;
        case "created":
          const aDate = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt || 0);
          const bDate = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt || 0);
          compareValue = aDate - bDate;
          break;
        default:
          compareValue = 0;
      }
      
      return sortOrder === "asc" ? compareValue : -compareValue;
    });

    return filtered;
  }, [stats.classesWithCounts, searchTerm, filterEducationLevel, filterStatus, sortBy, sortOrder]);

  const educationLevels = [...new Set(classes.map(cls => cls.educationLevel))].filter(Boolean);

  const handleSelectAll = () => {
    if (selectedClasses.length === filteredAndSortedClasses.length) {
      setSelectedClasses([]);
    } else {
      setSelectedClasses(filteredAndSortedClasses.map(cls => cls.id));
    }
  };

  const handleSelectClass = (classId) => {
    if (selectedClasses.includes(classId)) {
      setSelectedClasses(selectedClasses.filter(id => id !== classId));
    } else {
      setSelectedClasses([...selectedClasses, classId]);
    }
  };

  const handleArchiveClass = async () => {
    if (!classToArchive) return;
    
    setIsProcessing(true);
    try {
      const classRef = doc(db, "classes", classToArchive.id);
      await updateDoc(classRef, {
        archived: true,
        archivedAt: new Date(),
        status: 'archived'
      });

      setClasses(prevClasses => 
        prevClasses.map(cls => 
          cls.id === classToArchive.id 
            ? { ...cls, archived: true, archivedAt: new Date(), status: 'archived' }
            : cls
        )
      );

      setIsArchiveModalOpen(false);
      setClassToArchive(null);
      showNotification('success', `Class "${classToArchive.sectionName}" has been archived successfully.`);
    } catch (error) {
      console.error("Error archiving class:", error);
      showNotification('error', 'Failed to archive class. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreClass = async (classData) => {
    setIsProcessing(true);
    try {
      const classRef = doc(db, "classes", classData.id);
      await updateDoc(classRef, {
        archived: false,
        archivedAt: null,
        status: classData.adviser ? 'active' : 'inactive'
      });

      setClasses(prevClasses => 
        prevClasses.map(cls => 
          cls.id === classData.id 
            ? { ...cls, archived: false, archivedAt: null, status: classData.adviser ? 'active' : 'inactive' }
            : cls
        )
      );

      showNotification('success', `Class "${classData.sectionName}" has been restored successfully.`);
    } catch (error) {
      console.error("Error restoring class:", error);
      showNotification('error', 'Failed to restore class. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteClass = async () => {
    if (!classToDelete) return;
    
    setIsProcessing(true);
    try {
      const studentsInClass = students.filter(
        student => student.section === classToDelete.sectionName
      );

      const batch = writeBatch(db);
      
      for (const student of studentsInClass) {
        const studentRef = doc(db, "students", student.id);
        batch.update(studentRef, {
          section: null,
          department: null,
          clearance: {}
        });
      }

      const classRef = doc(db, "classes", classToDelete.id);
      batch.delete(classRef);

      await batch.commit();

      setClasses(classes.filter(cls => cls.id !== classToDelete.id));
      setStudents(prevStudents => 
        prevStudents.map(student => 
          student.section === classToDelete.sectionName
            ? { ...student, section: null, department: null, clearance: {} }
            : student
        )
      );

      setIsDeleteModalOpen(false);
      setClassToDelete(null);
      showNotification('success', `Class "${classToDelete.sectionName}" has been deleted successfully.`);
    } catch (error) {
      console.error("Error deleting class:", error);
      showNotification('error', 'Failed to delete class. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkArchive = async () => {
    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      
      for (const classId of selectedClasses) {
        const classRef = doc(db, "classes", classId);
        batch.update(classRef, {
          archived: true,
          archivedAt: new Date(),
          status: 'archived'
        });
      }

      await batch.commit();

      setClasses(prevClasses => 
        prevClasses.map(cls => 
          selectedClasses.includes(cls.id)
            ? { ...cls, archived: true, archivedAt: new Date(), status: 'archived' }
            : cls
        )
      );

      setIsBulkArchiveModalOpen(false);
      setSelectedClasses([]);
      showNotification('success', `${selectedClasses.length} class(es) have been archived successfully.`);
    } catch (error) {
      console.error("Error archiving classes:", error);
      showNotification('error', 'Failed to archive classes. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      
      for (const classId of selectedClasses) {
        const classData = classes.find(cls => cls.id === classId);
        if (!classData) continue;

        const studentsInClass = students.filter(
          student => student.section === classData.sectionName
        );

        for (const student of studentsInClass) {
          const studentRef = doc(db, "students", student.id);
          batch.update(studentRef, {
            section: null,
            department: null,
            clearance: {}
          });
        }

        const classRef = doc(db, "classes", classId);
        batch.delete(classRef);
      }

      await batch.commit();

      setClasses(prevClasses => 
        prevClasses.filter(cls => !selectedClasses.includes(cls.id))
      );
      
      const deletedSectionNames = selectedClasses
        .map(id => classes.find(cls => cls.id === id)?.sectionName)
        .filter(Boolean);
        
      setStudents(prevStudents => 
        prevStudents.map(student => 
          deletedSectionNames.includes(student.section)
            ? { ...student, section: null, department: null, clearance: {} }
            : student
        )
      );

      setIsBulkDeleteModalOpen(false);
      setSelectedClasses([]);
      showNotification('success', `${selectedClasses.length} class(es) have been deleted successfully.`);
    } catch (error) {
      console.error("Error deleting classes:", error);
      showNotification('error', 'Failed to delete classes. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = () => {
    const csvHeaders = ["Grade Level", "Section", "Education Level", "Adviser", "Number of Students", "Status"];
    const csvData = filteredAndSortedClasses.map(cls => [
      cls.gradeLevel || "",
      cls.sectionName || "",
      cls.educationLevel || "",
      cls.adviser || "Not Assigned",
      cls.studentCount || 0,
      cls.archived ? "Archived" : !cls.adviser ? "Needs Adviser" : cls.studentCount === 0 ? "Empty" : "Active"
    ]);

    const csvContent = [
      csvHeaders,
      ...csvData
    ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `classes_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.display = "none";
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const getStatusColor = (cls) => {
    if (cls.archived) return { bg: 'bg-gray-50', text: 'text-gray-500', border: 'border-gray-300' };
    if (!cls.adviser) return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' };
    if (cls.studentCount === 0) return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
    if (cls.status === 'inactive') return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
    return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };
  };

  const getStatusText = (cls) => {
    if (cls.archived) return "Archived";
    if (!cls.adviser) return "Needs Adviser";
    if (cls.studentCount === 0) return "No Students";
    if (cls.status === 'inactive') return "Inactive";
    return "Active";
  };

  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-6"></div>
              <div className="space-y-3">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded mt-4"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="h-12 bg-gray-100 border-b border-gray-200"></div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 border-b border-gray-100 bg-white flex items-center px-6">
              <div className="h-4 bg-gray-200 rounded w-1/4 mr-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/6 mr-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/5"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-full flex items-center justify-center mb-6">
        <FontAwesomeIcon icon={faFolder} className="text-4xl text-blue-600" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-3">No classes found</h3>
      <p className="text-gray-500 mb-8 text-center max-w-md">
        {searchTerm || filterEducationLevel !== "all" || filterStatus !== "all"
          ? "Try adjusting your search or filters to find what you're looking for."
          : "Get started by creating your first class. It only takes a minute!"}
      </p>
      <div className="flex gap-3">
        {(searchTerm || filterEducationLevel !== "all" || filterStatus !== "all") && (
          <button
            onClick={() => {
              setSearchTerm("");
              setFilterEducationLevel("all");
              setFilterStatus("all");
            }}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear Filters
          </button>
        )}
        <Link
          to="/create-class"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 shadow-md"
        >
          <FontAwesomeIcon icon={faPlus} />
          Create Your First Class
        </Link>
      </div>
    </div>
  );

  const ClassCard = ({ cls }) => {
    const levelColor = getEducationLevelColor(cls.educationLevel);
    const statusColor = getStatusColor(cls);
    const statusText = getStatusText(cls);
    const isSelected = selectedClasses.includes(cls.id);
    
    return (
      <div className={`relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border-2 overflow-hidden group ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-100 hover:border-gray-200'
      } ${cls.archived ? 'opacity-75' : ''}`}>
        {}
        <div className="absolute top-4 left-4 z-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => handleSelectClass(cls.id)}
            className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowActionMenu(showActionMenu === cls.id ? null : cls.id);
            }}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
          >
            <FontAwesomeIcon icon={faEllipsisV} className="text-gray-500" />
          </button>
          
          {showActionMenu === cls.id && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
              <Link
                to={`/class/${cls.id}`}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                View Details
              </Link>
              {!cls.archived && (
                <Link
                  to={`/update-class/${cls.id}`}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
                  Edit Class
                </Link>
              )}
              {!cls.archived && (
                <button
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                >
                  <FontAwesomeIcon icon={faCopy} className="w-4 h-4" />
                  Duplicate
                </button>
              )}
              {cls.archived ? (
                <button
                  onClick={() => handleRestoreClass(cls)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50 w-full text-left"
                >
                  <FontAwesomeIcon icon={faUndo} className="w-4 h-4" />
                  Restore
                </button>
              ) : (
                <button
                  onClick={() => {
                    setClassToArchive(cls);
                    setIsArchiveModalOpen(true);
                    setShowActionMenu(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                >
                  <FontAwesomeIcon icon={faArchive} className="w-4 h-4" />
                  Archive
                </button>
              )}
              <hr className="my-1" />
              <button
                onClick={() => {
                  setClassToDelete(cls);
                  setIsDeleteModalOpen(true);
                  setShowActionMenu(null);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
              >
                <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>

        {}
        {cls.archived && (
          <div className="absolute top-0 left-0 w-full bg-gray-800 text-white text-xs py-1 px-2 text-center">
            <FontAwesomeIcon icon={faArchive} className="mr-1" />
            Archived
          </div>
        )}

        {}
        <div className={`p-6 ${cls.archived ? 'pt-12' : 'pt-12'}`}>
          {}
          <div className="mb-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  Grade {cls.gradeLevel}
                </h3>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <FontAwesomeIcon icon={faTag} className="w-3 h-3" />
                  {cls.sectionName}
                </p>
              </div>
            </div>
            
            {}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${levelColor.bg} ${levelColor.text} ${levelColor.border} border`}>
              <FontAwesomeIcon icon={levelColor.icon} className="w-3 h-3" />
              {cls.educationLevel || 'Not Set'}
            </div>
          </div>

          {}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <FontAwesomeIcon icon={faChalkboardTeacher} className="w-4 h-4" />
                <span className="text-xs font-medium">Adviser</span>
              </div>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {cls.adviser || "Not Assigned"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <FontAwesomeIcon icon={faUserFriends} className="w-4 h-4" />
                <span className="text-xs font-medium">Students</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {cls.studentCount || 0}
              </p>
            </div>
          </div>

          {}
          <div className="mb-4">
            <div className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg ${statusColor.bg} ${statusColor.text} ${statusColor.border} border`}>
              <FontAwesomeIcon 
                icon={statusText === "Active" ? faCheckCircle : statusText === "Archived" ? faArchive : faExclamationTriangle} 
                className="w-4 h-4" 
              />
              <span className="text-xs font-medium">
                {statusText}
              </span>
            </div>
          </div>

          {}
          <div className="flex gap-2">
            {cls.archived ? (
              <>
                <button
                  onClick={() => handleRestoreClass(cls)}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all transform hover:scale-105 text-sm font-medium"
                >
                  <FontAwesomeIcon icon={faUndo} />
                  Restore
                </button>
                <Link
                  to={`/class/${cls.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all transform hover:scale-105 text-sm font-medium"
                >
                  <FontAwesomeIcon icon={faEye} />
                  View
                </Link>
              </>
            ) : (
              <>
                <Link
                  to={`/update-class/${cls.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 text-sm font-medium"
                >
                  <FontAwesomeIcon icon={faEdit} />
                  Edit
                </Link>
                <Link
                  to={`/class/${cls.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all transform hover:scale-105 text-sm font-medium"
                >
                  <FontAwesomeIcon icon={faEye} />
                  View
                </Link>
              </>
            )}
          </div>
        </div>

        {}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
      </div>
    );
  };

  return (
    <Sidebar>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {}
          {notification.show && (
            <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in ${
              notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
            }`}>
              <FontAwesomeIcon 
                icon={notification.type === 'success' ? faCheckCircle : faExclamationTriangle} 
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

          {}
          <div className="mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  Class Management
                </h1>
                <p className="text-lg text-gray-600">
                  Organize and manage your school's classes efficiently
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    showArchived 
                      ? 'bg-gray-600 text-white hover:bg-gray-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FontAwesomeIcon icon={faArchive} className="mr-2" />
                  {showArchived ? 'Hide' : 'Show'} Archived ({stats.archivedClasses})
                </button>
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <FontAwesomeIcon icon={faDownload} className="mr-2" />
                  Export
                </button>

                <Link
                  to="/create-class"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md transform hover:scale-105"
                >
                  <FontAwesomeIcon icon={faPlus} />
                  Add New Class
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mt-8">
              <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <FontAwesomeIcon icon={faSchool} className="text-2xl text-blue-500" />
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Total</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{stats.totalClasses}</div>
                <div className="text-sm text-gray-600 mt-1">Total Classes</div>
              </div>
              
              <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <FontAwesomeIcon icon={faUsers} className="text-2xl text-green-500" />
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Enrolled</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{stats.totalStudents}</div>
                <div className="text-sm text-gray-600 mt-1">Students in Classes</div>
                {stats.studentsWithoutClasses > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    +{stats.studentsWithoutClasses} unassigned
                  </div>
                )}
              </div>
              
              <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <FontAwesomeIcon icon={faChartLine} className="text-2xl text-purple-500" />
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">Average</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{stats.avgClassSize}</div>
                <div className="text-sm text-gray-600 mt-1">Avg. Class Size</div>
                {stats.classesWithStudents > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {stats.classesWithStudents} with students
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <FontAwesomeIcon icon={faChalkboardTeacher} className="text-2xl text-indigo-500" />
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">Advisers</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{stats.withAdvisers}</div>
                <div className="text-sm text-gray-600 mt-1">With Advisers</div>
              </div>

              <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-2xl text-yellow-500" />
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Needs</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{stats.withoutAdviser}</div>
                <div className="text-sm text-gray-600 mt-1">Need Advisers</div>
              </div>

              <div className="bg-white rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-2xl text-emerald-500" />
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Status</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{stats.activeClasses}</div>
                <div className="text-sm text-gray-600 mt-1">Active Classes</div>
                {stats.emptyClasses > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {stats.emptyClasses} empty
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search classes, sections, advisers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <FontAwesomeIcon icon={faTimes} className="text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
                
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
                    {(filterEducationLevel !== "all" || filterStatus !== "all") && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                        {[filterEducationLevel !== "all", filterStatus !== "all"].filter(Boolean).length}
                      </span>
                    )}
                  </button>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="name">Sort by Name</option>
                    <option value="section">Sort by Section</option>
                    <option value="adviser">Sort by Adviser</option>
                    <option value="students">Sort by Students</option>
                    <option value="level">Sort by Level</option>
                    <option value="created">Sort by Created</option>
                  </select>

                  <button
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    className="px-3 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <FontAwesomeIcon icon={sortOrder === "asc" ? faArrowUp : faArrowDown} />
                  </button>

                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded transition-all ${
                        viewMode === "grid" 
                          ? "bg-white shadow-sm text-blue-600" 
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <FontAwesomeIcon icon={faThLarge} />
                    </button>
                    <button
                      onClick={() => setViewMode("table")}
                      className={`p-2 rounded transition-all ${
                        viewMode === "table" 
                          ? "bg-white shadow-sm text-blue-600" 
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <FontAwesomeIcon icon={faListUl} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {showAdvancedFilters && (
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex flex-wrap gap-3">
                  <select
                    value={filterEducationLevel}
                    onChange={(e) => setFilterEducationLevel(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="all">All Education Levels</option>
                    {educationLevels.map(level => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="no-adviser">No Adviser</option>
                    <option value="empty">Empty Classes</option>
                    <option value="has-students">Has Students</option>
                    {showArchived && <option value="archived">Archived Only</option>}
                  </select>

                  {(filterEducationLevel !== "all" || filterStatus !== "all") && (
                    <button
                      onClick={() => {
                        setFilterEducationLevel("all");
                        setFilterStatus("all");
                      }}
                      className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Clear All Filters
                    </button>
                  )}
                </div>
              </div>
            )}

            {selectedClasses.length > 0 && (
              <div className="px-4 py-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedClasses.length === filteredAndSortedClasses.length}
                    onChange={handleSelectAll}
                    className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-blue-900">
                    {selectedClasses.length} {selectedClasses.length === 1 ? 'class' : 'classes'} selected
                  </span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsBulkArchiveModalOpen(true)}
                    className="px-3 py-1.5 text-sm bg-white text-gray-700 rounded-lg hover:bg-gray-50 border border-gray-300"
                  >
                    <FontAwesomeIcon icon={faArchive} className="mr-2" />
                    Archive
                  </button>
                  <button 
                    onClick={() => setIsBulkDeleteModalOpen(true)}
                    className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <FontAwesomeIcon icon={faTrash} className="mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>

          {!loading && filteredAndSortedClasses.length > 0 && (
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredAndSortedClasses.length}</span> of{" "}
                <span className="font-semibold text-gray-900">{stats.classesWithCounts.length}</span> classes
              </p>
              {selectedClasses.length === 0 && (
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Select All
                </button>
              )}
            </div>
          )}

          {loading ? (
            <LoadingSkeleton />
          ) : filteredAndSortedClasses.length === 0 ? (
            <EmptyState />
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAndSortedClasses.map((cls) => (
                <ClassCard key={cls.id} cls={cls} />
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
                          checked={selectedClasses.length === filteredAndSortedClasses.length}
                          onChange={handleSelectAll}
                          className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Class Info
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Adviser
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Education Level
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Students
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
                    {filteredAndSortedClasses.map((cls) => {
                      const levelColor = getEducationLevelColor(cls.educationLevel);
                      const statusColor = getStatusColor(cls);
                      const statusText = getStatusText(cls);
                      const isSelected = selectedClasses.includes(cls.id);
                      
                      return (
                        <tr 
                          key={cls.id} 
                          className={`hover:bg-gray-50 transition-colors ${
                            isSelected ? 'bg-blue-50' : ''
                          } ${cls.archived ? 'opacity-75' : ''}`}
                        >
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectClass(cls.id)}
                              className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-semibold text-gray-900">Grade {cls.gradeLevel}</div>
                              <div className="text-sm text-gray-500">{cls.sectionName}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {cls.adviser || (
                                <span className="text-yellow-600 flex items-center gap-1">
                                  <FontAwesomeIcon icon={faExclamationTriangle} className="w-3 h-3" />
                                  Not assigned
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${levelColor.bg} ${levelColor.text}`}>
                              <FontAwesomeIcon icon={levelColor.icon} className="w-3 h-3" />
                              {cls.educationLevel || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-semibold text-gray-900">{cls.studentCount || 0}</div>
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${Math.min((cls.studentCount || 0) / 40 * 100, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusColor.bg} ${statusColor.text}`}>
                              <FontAwesomeIcon 
                                icon={statusText === "Active" ? faCheckCircle : statusText === "Archived" ? faArchive : faExclamationTriangle} 
                                className="w-3 h-3" 
                              />
                              {statusText}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              <Link
                                to={`/class/${cls.id}`}
                                className="text-gray-600 hover:text-gray-900 transition-colors"
                                title="View"
                              >
                                <FontAwesomeIcon icon={faEye} />
                              </Link>
                              {cls.archived ? (
                                <button
                                  onClick={() => handleRestoreClass(cls)}
                                  className="text-green-600 hover:text-green-900 transition-colors"
                                  title="Restore"
                                >
                                  <FontAwesomeIcon icon={faUndo} />
                                </button>
                              ) : (
                                <>
                                  <Link
                                    to={`/update-class/${cls.id}`}
                                    className="text-blue-600 hover:text-blue-900 transition-colors"
                                    title="Edit"
                                  >
                                    <FontAwesomeIcon icon={faEdit} />
                                  </Link>
                                  <button
                                    onClick={() => {
                                      setClassToArchive(cls);
                                      setIsArchiveModalOpen(true);
                                    }}
                                    className="text-gray-600 hover:text-gray-900 transition-colors"
                                    title="Archive"
                                  >
                                    <FontAwesomeIcon icon={faArchive} />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => {
                                  setClassToDelete(cls);
                                  setIsDeleteModalOpen(true);
                                }}
                                className="text-red-600 hover:text-red-900 transition-colors"
                                title="Delete"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
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
      </div>

      <Modal isOpen={isArchiveModalOpen} onClose={() => !isProcessing && setIsArchiveModalOpen(false)}>
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full mb-4">
            <FontAwesomeIcon icon={faArchive} className="text-yellow-600 text-xl" />
          </div>
          
          <h3 className="text-lg font-semibold text-center mb-2">Archive Class</h3>
          
          <p className="text-gray-600 text-center mb-6">
            Are you sure you want to archive <strong>Grade {classToArchive?.gradeLevel} - {classToArchive?.sectionName}</strong>? 
            You can restore it later from the archived classes.
          </p>
          
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setIsArchiveModalOpen(false)}
              disabled={isProcessing}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleArchiveClass}
              disabled={isProcessing}
              className="px-6 py-2.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing && <FontAwesomeIcon icon={faSpinner} spin />}
              Archive Class
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => !isProcessing && setIsDeleteModalOpen(false)}>
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 text-xl" />
          </div>
          
          <h3 className="text-lg font-semibold text-center mb-2">Delete Class</h3>
          
          <p className="text-gray-600 text-center mb-4">
            Are you sure you want to delete <strong>Grade {classToDelete?.gradeLevel} - {classToDelete?.sectionName}</strong>? 
          </p>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-red-700">
              <strong>Warning:</strong> This action cannot be undone. All {classToDelete?.studentCount || 0} student(s) 
              will be removed from this class and their clearance data will be reset.
            </p>
          </div>
          
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isProcessing}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteClass}
              disabled={isProcessing}
              className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing && <FontAwesomeIcon icon={faSpinner} spin />}
              Delete Class
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isBulkArchiveModalOpen} onClose={() => !isProcessing && setIsBulkArchiveModalOpen(false)}>
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full mb-4">
            <FontAwesomeIcon icon={faArchive} className="text-yellow-600 text-xl" />
          </div>
          
          <h3 className="text-lg font-semibold text-center mb-2">Archive Multiple Classes</h3>
          
          <p className="text-gray-600 text-center mb-6">
            Are you sure you want to archive <strong>{selectedClasses.length} class(es)</strong>? 
            You can restore them later from the archived classes.
          </p>
          
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setIsBulkArchiveModalOpen(false)}
              disabled={isProcessing}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkArchive}
              disabled={isProcessing}
              className="px-6 py-2.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing && <FontAwesomeIcon icon={faSpinner} spin />}
              Archive {selectedClasses.length} Classes
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isBulkDeleteModalOpen} onClose={() => !isProcessing && setIsBulkDeleteModalOpen(false)}>
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 text-xl" />
          </div>
          
          <h3 className="text-lg font-semibold text-center mb-2">Delete Multiple Classes</h3>
          
          <p className="text-gray-600 text-center mb-4">
            Are you sure you want to delete <strong>{selectedClasses.length} class(es)</strong>? 
          </p>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-red-700">
              <strong>Warning:</strong> This action cannot be undone. All students in these classes 
              will be removed and their clearance data will be reset.
            </p>
          </div>
          
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setIsBulkDeleteModalOpen(false)}
              disabled={isProcessing}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={isProcessing}
              className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isProcessing && <FontAwesomeIcon icon={faSpinner} spin />}
              Delete {selectedClasses.length} Classes
            </button>
          </div>
        </div>
      </Modal>
    </Sidebar>
  );
}

export default Classes;