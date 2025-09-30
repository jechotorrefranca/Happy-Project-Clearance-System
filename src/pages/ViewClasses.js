import React, { useState, useEffect, useMemo } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../components/AuthContext";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChalkboardTeacher,
  faUserGraduate,
  faUsers,
  faBook,
  faSearch,
  faFilter,
  faThLarge,
  faListUl,
  faArrowRight,
  faSchool,
  faGraduationCap,
  faCalendarAlt,
  faClock,
  faLayerGroup,
  faBookOpen,
  faUserTie,
  faTimes,
  faSpinner,
  faChevronRight,
  faEye,
  faCrown,
} from "@fortawesome/free-solid-svg-icons";

function ViewClasses() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [teachingClasses, setTeachingClasses] = useState([]);
  const [advisoryClasses, setAdvisoryClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [selectedClass, setSelectedClass] = useState(null);
  const [showQuickView, setShowQuickView] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, [currentUser]);

  const fetchAllData = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const allClassesSnapshot = await getDocs(collection(db, "classes"));
      
      const teaching = [];
      for (const classDoc of allClassesSnapshot.docs) {
        const classData = classDoc.data();
        const subjects = classData.subjects || [];
        
        const mySubjects = subjects.filter(
          subject => subject.teacherUid === currentUser.uid
        );
        
        if (mySubjects.length > 0) {
          const studentsSnapshot = await getDocs(
            query(collection(db, "students"), where("section", "==", classData.sectionName))
          );
          
          teaching.push({
            id: classDoc.id,
            ...classData,
            mySubjects: mySubjects.map(s => ({
              name: s.subject,
              teacherUid: s.teacherUid,
              schedule: s.schedule || "TBA"
            })),
            studentCount: studentsSnapshot.size,
            type: "teaching",
          });
        }
      }
      setTeachingClasses(teaching);
      
      const advisory = [];
      for (const classDoc of allClassesSnapshot.docs) {
        const classData = classDoc.data();
        
        if (classData.adviserUid === currentUser.uid) {
          const studentsSnapshot = await getDocs(
            query(collection(db, "students"), where("section", "==", classData.sectionName))
          );
          
          const studentsList = studentsSnapshot.docs.map(studentDoc => ({
            id: studentDoc.id,
            ...studentDoc.data()
          }));
          
          advisory.push({
            id: classDoc.id,
            ...classData,
            studentCount: studentsSnapshot.size,
            students: studentsList,
            type: "advisory",
          });
        }
      }
      setAdvisoryClasses(advisory);
      
    } catch (error) {
      console.error("Error fetching classes:", error);
    } finally {
      setLoading(false);
    }
  };

  const statistics = useMemo(() => {
    const totalTeaching = teachingClasses.length;
    const totalAdvisory = advisoryClasses.length;
    const totalStudentsTeaching = teachingClasses.reduce((sum, cls) => sum + (cls.studentCount || 0), 0);
    const totalStudentsAdvisory = advisoryClasses.reduce((sum, cls) => sum + (cls.studentCount || 0), 0);
    const totalSubjects = teachingClasses.reduce((sum, cls) => sum + (cls.mySubjects?.length || 0), 0);
    
    return {
      totalClasses: totalTeaching + totalAdvisory,
      totalTeaching,
      totalAdvisory,
      totalStudents: totalStudentsTeaching + totalStudentsAdvisory,
      totalStudentsTeaching,
      totalStudentsAdvisory,
      totalSubjects,
      avgClassSize: totalTeaching > 0 ? Math.round(totalStudentsTeaching / totalTeaching) : 0,
    };
  }, [teachingClasses, advisoryClasses]);

  const filteredClasses = useMemo(() => {
    let classes = [];
    
    if (activeTab === "all") {
      classes = [...teachingClasses, ...advisoryClasses];
    } else if (activeTab === "teaching") {
      classes = teachingClasses;
    } else if (activeTab === "advisory") {
      classes = advisoryClasses;
    }
    
    if (searchTerm) {
      classes = classes.filter(cls => 
        cls.sectionName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.gradeLevel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.educationLevel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cls.mySubjects?.some(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (filterLevel !== "all") {
      classes = classes.filter(cls => cls.educationLevel === filterLevel);
    }
    
    return classes;
  }, [activeTab, teachingClasses, advisoryClasses, searchTerm, filterLevel]);

  const educationLevels = useMemo(() => {
    const allClasses = [...teachingClasses, ...advisoryClasses];
    return [...new Set(allClasses.map(cls => cls.educationLevel))].filter(Boolean);
  }, [teachingClasses, advisoryClasses]);

  const handleQuickView = (classItem) => {
    setSelectedClass(classItem);
    setShowQuickView(true);
  };

  const handleNavigate = (classItem) => {
    if (classItem.type === "advisory") {
      navigate(`/class-details-adviser/${classItem.id}`);
    } else {
      navigate(`/class-details/${classItem.id}`);
    }
  };

  const getEducationLevelStyle = (level) => {
    const styles = {
      'Elementary': { 
        bg: 'bg-gradient-to-br from-green-50 to-emerald-50', 
        text: 'text-green-700', 
        border: 'border-gray-200',
        icon: faSchool,
        badge: 'bg-green-100 text-green-800'
      },
      'High School': { 
        bg: 'bg-gradient-to-br from-blue-50 to-cyan-50', 
        text: 'text-blue-700', 
        border: 'border-gray-200',
        icon: faBookOpen,
        badge: 'bg-blue-100 text-blue-800'
      },
      'Senior High': { 
        bg: 'bg-gradient-to-br from-purple-50 to-indigo-50', 
        text: 'text-purple-700', 
        border: 'border-gray-200',
        icon: faGraduationCap,
        badge: 'bg-purple-100 text-purple-800'
      },
      'College': { 
        bg: 'bg-gradient-to-br from-orange-50 to-amber-50', 
        text: 'text-orange-700', 
        border: 'border-gray-200',
        icon: faUserGraduate,
        badge: 'bg-orange-100 text-orange-800'
      },
    };
    return styles[level] || styles['Elementary'];
  };

  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-gray-200 rounded-xl h-32"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="bg-gray-200 rounded-xl h-64"></div>
        ))}
      </div>
    </div>
  );

  const EmptyState = ({ type }) => (
    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
        <FontAwesomeIcon 
          icon={type === "teaching" ? faChalkboardTeacher : faUserTie} 
          className="text-4xl text-gray-400" 
        />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">
        No {type === "teaching" ? "Teaching" : "Advisory"} Classes
      </h3>
      <p className="text-gray-500 text-center max-w-md">
        {type === "teaching" 
          ? "You are not currently assigned to teach any classes. Contact your administrator for class assignments."
          : "You are not currently an adviser for any classes. Advisory roles are assigned by administrators."}
      </p>
    </div>
  );

  const StatCard = ({ icon, title, value, subtitle, color }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <FontAwesomeIcon icon={icon} className={`text-xl text-${color}-600`} />
        </div>
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

  const ClassCard = ({ classItem }) => {
    const levelStyle = getEducationLevelStyle(classItem.educationLevel);
    const isAdvisory = classItem.type === "advisory";
    
    return (
      <div 
        className={`relative bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border-2 overflow-hidden cursor-pointer group ${levelStyle.border}`}
        onClick={() => handleNavigate(classItem)}
      >
        {}
        <div className={`h-2 ${levelStyle.bg}`}></div>
        
        {}
        <div className="absolute top-4 right-4">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
            isAdvisory ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
          }`}>
            <FontAwesomeIcon icon={isAdvisory ? faCrown : faChalkboardTeacher} className="w-3 h-3" />
            {isAdvisory ? 'Advisory' : 'Teaching'}
          </span>
        </div>

        {}
        <div className="p-6">
          {}
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
              {classItem.gradeLevel} - {classItem.sectionName}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FontAwesomeIcon icon={levelStyle.icon} className={`w-4 h-4 ${levelStyle.text}`} />
              <span className={levelStyle.badge}>
                {classItem.educationLevel}
              </span>
            </div>
          </div>

          {}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <FontAwesomeIcon icon={faUsers} className="w-4 h-4" />
                <span className="text-xs font-medium">Students</span>
              </div>
              <p className="text-lg font-bold text-gray-900">{classItem.studentCount || 0}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <FontAwesomeIcon icon={faBook} className="w-4 h-4" />
                <span className="text-xs font-medium">
                  {isAdvisory ? "Total Subjects" : "My Subjects"}
                </span>
              </div>
              <p className="text-lg font-bold text-gray-900">
                {isAdvisory ? classItem.subjects?.length || 0 : classItem.mySubjects?.length || 0}
              </p>
            </div>
          </div>

          {}
          {!isAdvisory && classItem.mySubjects?.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Your Subjects:</p>
              <div className="flex flex-wrap gap-1">
                {classItem.mySubjects.slice(0, 3).map((subject, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700"
                  >
                    {subject.name}
                  </span>
                ))}
                {classItem.mySubjects.length > 3 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                    +{classItem.mySubjects.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {}
          <div className="flex gap-2 mt-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleQuickView(classItem);
              }}
              className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <FontAwesomeIcon icon={faEye} className="mr-2" />
              Quick View
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNavigate(classItem);
              }}
              className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <FontAwesomeIcon icon={faArrowRight} className="mr-2" />
              Details
            </button>
          </div>
        </div>

        {}
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
      </div>
    );
  };

  const TableRow = ({ classItem }) => {
    const levelStyle = getEducationLevelStyle(classItem.educationLevel);
    const isAdvisory = classItem.type === "advisory";
    
    return (
      <tr 
        onClick={() => handleNavigate(classItem)}
        className="hover:bg-gray-50 cursor-pointer transition-colors group"
      >
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${levelStyle.bg} mr-3`}>
              <FontAwesomeIcon icon={levelStyle.icon} className={`w-5 h-5 ${levelStyle.text}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600">
                {classItem.sectionName}
              </p>
              <p className="text-xs text-gray-500">{classItem.gradeLevel}</p>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${levelStyle.badge}`}>
            {classItem.educationLevel}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
            isAdvisory ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
          }`}>
            <FontAwesomeIcon icon={isAdvisory ? faCrown : faChalkboardTeacher} className="w-3 h-3" />
            {isAdvisory ? 'Advisory' : 'Teaching'}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faUsers} className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-900">{classItem.studentCount || 0}</span>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <FontAwesomeIcon icon={faBook} className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-900">
              {isAdvisory ? classItem.subjects?.length || 0 : classItem.mySubjects?.length || 0}
            </span>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleQuickView(classItem);
              }}
              className="text-gray-600 hover:text-gray-900"
            >
              <FontAwesomeIcon icon={faEye} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNavigate(classItem);
              }}
              className="text-blue-600 hover:text-blue-900"
            >
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  const QuickViewModal = () => {
    if (!selectedClass) return null;
    
    const levelStyle = getEducationLevelStyle(selectedClass.educationLevel);
    const isAdvisory = selectedClass.type === "advisory";
    
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={() => setShowQuickView(false)}
      >
        <div 
          className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {}
          <div className={`p-6 border-b ${levelStyle.bg}`}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedClass.gradeLevel} - {selectedClass.sectionName}
                </h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${levelStyle.badge}`}>
                    {selectedClass.educationLevel}
                  </span>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${
                    isAdvisory ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    <FontAwesomeIcon icon={isAdvisory ? faCrown : faChalkboardTeacher} />
                    {isAdvisory ? 'Advisory' : 'Teaching'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowQuickView(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="text-gray-500" />
              </button>
            </div>
          </div>

          {}
          <div className="p-6">
            {}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <FontAwesomeIcon icon={faUsers} className="text-blue-600 text-xl mb-2" />
                <p className="text-2xl font-bold text-gray-900">{selectedClass.studentCount || 0}</p>
                <p className="text-sm text-gray-600">Students</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <FontAwesomeIcon icon={faBook} className="text-purple-600 text-xl mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {isAdvisory ? selectedClass.subjects?.length || 0 : selectedClass.mySubjects?.length || 0}
                </p>
                <p className="text-sm text-gray-600">
                  {isAdvisory ? "Total Subjects" : "My Subjects"}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <FontAwesomeIcon icon={faCalendarAlt} className="text-green-600 text-xl mb-2" />
                <p className="text-2xl font-bold text-gray-900">Active</p>
                <p className="text-sm text-gray-600">Status</p>
              </div>
            </div>

            {}
            {!isAdvisory && selectedClass.mySubjects?.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Subjects</h3>
                <div className="space-y-2">
                  {selectedClass.mySubjects.map((subject, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FontAwesomeIcon icon={faBook} className="text-blue-600" />
                        <span className="font-medium">{subject.name}</span>
                      </div>
                      <span className="text-sm text-gray-500">{subject.schedule || "TBA"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Class Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Section Name</p>
                  <p className="font-medium">{selectedClass.sectionName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Grade Level</p>
                  <p className="font-medium">{selectedClass.gradeLevel}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Education Level</p>
                  <p className="font-medium">{selectedClass.educationLevel}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Class Type</p>
                  <p className="font-medium">{isAdvisory ? "Advisory" : "Teaching"}</p>
                </div>
              </div>
            </div>

            {}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowQuickView(false);
                  handleNavigate(selectedClass);
                }}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <FontAwesomeIcon icon={faArrowRight} className="mr-2" />
                View Full Details
              </button>
              <button
                onClick={() => setShowQuickView(false)}
                className="py-3 px-6 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Sidebar>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-4xl font-bold text-gray-900">My Classes</h1>
              {
}
            </div>
            <p className="text-lg text-gray-600">
              Manage your teaching and advisory classes
            </p>
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : (
            <>
              {}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <StatCard
                  icon={faLayerGroup}
                  title="Total Classes"
                  value={statistics.totalClasses}
                  subtitle={`${statistics.totalTeaching} teaching, ${statistics.totalAdvisory} advisory`}
                  color="blue"
                />
                <StatCard
                  icon={faUsers}
                  title="Total Students"
                  value={statistics.totalStudents}
                  subtitle={`Avg. ${statistics.avgClassSize} per class`}
                  color="green"
                />
                <StatCard
                  icon={faBook}
                  title="Subjects Teaching"
                  value={statistics.totalSubjects}
                  subtitle="Across all classes"
                  color="purple"
                />
              </div>

              {}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  {}
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setActiveTab("all")}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        activeTab === "all"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      All Classes ({statistics.totalClasses})
                    </button>
                    <button
                      onClick={() => setActiveTab("teaching")}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        activeTab === "teaching"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <FontAwesomeIcon icon={faChalkboardTeacher} className="mr-2" />
                      Teaching ({statistics.totalTeaching})
                    </button>
                    <button
                      onClick={() => setActiveTab("advisory")}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        activeTab === "advisory"
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <FontAwesomeIcon icon={faCrown} className="mr-2" />
                      Advisory ({statistics.totalAdvisory})
                    </button>
                  </div>

                  {}
                  <div className="flex flex-1 gap-2">
                    <div className="flex-1 relative">
                      <FontAwesomeIcon 
                        icon={faSearch} 
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      />
                      <input
                        type="text"
                        placeholder="Search classes, subjects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <select
                      value={filterLevel}
                      onChange={(e) => setFilterLevel(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Levels</option>
                      {educationLevels.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>

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
                </div>
              </div>

              {}
              {filteredClasses.length === 0 ? (
                <EmptyState type={activeTab} />
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredClasses.map((classItem) => (
                    <ClassCard key={classItem.id} classItem={classItem} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Class
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Level
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Students
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subjects
                        </th>
                        <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredClasses.map((classItem) => (
                        <TableRow key={classItem.id} classItem={classItem} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {}
      {showQuickView && <QuickViewModal />}
    </Sidebar>
  );
}

export default ViewClasses;