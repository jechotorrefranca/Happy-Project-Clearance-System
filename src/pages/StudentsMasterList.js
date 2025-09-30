import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faTimesCircle,
  faAngleDown,
  faAngleUp,
  faSearch,
  faFilter,
  faGraduationCap,
  faUsers,
  faChartLine,
  faListUl,
  faThLarge,
  faUserGraduate,
  faExclamationTriangle,
  faEdit,
  faArchive,
  faUserPlus,
  faArrowUp,
} from "@fortawesome/free-solid-svg-icons";

function StudentsMasterList() {
  const [students, setStudents] = useState([]);
  const [originalStudents, setOriginalStudents] = useState([]);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [educationLevelFilter, setEducationLevelFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [completionFilter, setCompletionFilter] = useState("all");
  const [availableSections, setAvailableSections] = useState([]);
  const [availableEducationLevels, setAvailableEducationLevels] = useState([]);
  const [viewMode, setViewMode] = useState("table");
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    notStarted: 0,
    averageCompletion: 0,
  });

  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [studentToArchive, setStudentToArchive] = useState(null);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [studentToPromote, setStudentToPromote] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null);

  useEffect(() => {
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
          
          let status = "Not Started";
          if (completionPercentage === 100) status = "Completed";
          else if (completionPercentage > 0) status = "In Progress";

          return {
            id: doc.id,
            ...studentData,
            clearance,
            completionPercentage,
            completedRequirements,
            totalRequirements,
            status,
          };
        });

        studentsData = studentsData.filter((student) => student.archived !== true);

        const stats = {
          total: studentsData.length,
          completed: studentsData.filter(s => s.status === "Completed").length,
          inProgress: studentsData.filter(s => s.status === "In Progress").length,
          notStarted: studentsData.filter(s => s.status === "Not Started").length,
          averageCompletion: Math.round(
            studentsData.reduce((acc, s) => acc + s.completionPercentage, 0) / 
            (studentsData.length || 1)
          ),
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

    fetchStudents();
  }, []);

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

    if (completionFilter !== "all") {
      filteredStudents = filteredStudents.filter(
        (student) => student.status === completionFilter
      );
    }

    if (searchQuery) {
      filteredStudents = filteredStudents.filter((student) =>
        student.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setStudents(filteredStudents);
  }, [educationLevelFilter, sectionFilter, completionFilter, searchQuery, originalStudents]);

  const handleStudentClick = (studentId) => {
    setExpandedStudent((prev) => (prev === studentId ? null : studentId));
  };

  const handleArchiveStudent = async () => {
    try {
      if (!studentToArchive) return;

      await updateDoc(doc(db, "students", studentToArchive.id), {
        archived: true,
      });

      setStudents(students.filter((student) => student.id !== studentToArchive.id));
      setOriginalStudents(originalStudents.filter((student) => student.id !== studentToArchive.id));
      
      const updatedStudents = students.filter((student) => student.id !== studentToArchive.id);
      const stats = {
        total: updatedStudents.length,
        completed: updatedStudents.filter(s => s.status === "Completed").length,
        inProgress: updatedStudents.filter(s => s.status === "In Progress").length,
        notStarted: updatedStudents.filter(s => s.status === "Not Started").length,
        averageCompletion: Math.round(
          updatedStudents.reduce((acc, s) => acc + s.completionPercentage, 0) / 
          (updatedStudents.length || 1)
        ),
      };
      setStatistics(stats);

      setStudentToArchive(null);
      setIsArchiveModalOpen(false);

      alert("Student archived successfully!");
    } catch (error) {
      console.error("Error archiving student: ", error);
      alert("Error archiving student. Please try again later.");
    }
  };

  const handlePromoteStudent = async () => {
    try {
      if (!studentToPromote) return;

      const currentGrade = parseInt(studentToPromote.gradeLevel);
      let newGradeLevel = currentGrade + 1;
      let newEducationLevel = studentToPromote.educationLevel;

      if (newGradeLevel === 7) {
        newEducationLevel = "junior high school";
      } else if (newGradeLevel === 11) {
        newEducationLevel = "senior high school";
      } else if (newGradeLevel > 12) {
        newGradeLevel = "Freshman";
        newEducationLevel = "college";
      }

      await updateDoc(doc(db, "students", studentToPromote.id), {
        gradeLevel: newGradeLevel.toString(),
        educationLevel: newEducationLevel,
        section: null,
        clearance: {},
      });

      const updatedStudent = {
        ...studentToPromote,
        gradeLevel: newGradeLevel.toString(),
        educationLevel: newEducationLevel,
        section: null,
        clearance: {},
        completionPercentage: 0,
        completedRequirements: 0,
        totalRequirements: 0,
        status: "Not Started",
      };

      setStudents((prevStudents) =>
        prevStudents.map((student) =>
          student.id === studentToPromote.id ? updatedStudent : student
        )
      );
      setOriginalStudents((prevStudents) =>
        prevStudents.map((student) =>
          student.id === studentToPromote.id ? updatedStudent : student
        )
      );

      setStudentToPromote(null);
      setIsPromoteModalOpen(false);

      alert("Student promoted successfully!");
    } catch (error) {
      console.error("Error promoting student: ", error);
      alert("Error promoting student. Please try again later.");
    }
  };

  const handleOpenEditModal = (student) => {
    setStudentToEdit({
      ...student,
      originalStudentId: student.studentId,
    });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setStudentToEdit(null);
    setIsEditModalOpen(false);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      if (!studentToEdit) return;

      if (studentToEdit.studentId !== studentToEdit.originalStudentId) {
        const existingStudentQuery = query(
          collection(db, "students"),
          where("studentId", "==", studentToEdit.studentId)
        );
        const existingStudentSnapshot = await getDocs(existingStudentQuery);
        if (!existingStudentSnapshot.empty) {
          alert("Student ID already exists!");
          return;
        }
      }

      await updateDoc(doc(db, "students", studentToEdit.id), {
        studentId: studentToEdit.studentId,
        fullName: studentToEdit.fullName,
        email: studentToEdit.email,
      });

      setStudents((prevStudents) =>
        prevStudents.map((student) =>
          student.id === studentToEdit.id 
            ? { ...student, studentId: studentToEdit.studentId, fullName: studentToEdit.fullName, email: studentToEdit.email }
            : student
        )
      );
      setOriginalStudents((prevStudents) =>
        prevStudents.map((student) =>
          student.id === studentToEdit.id 
            ? { ...student, studentId: studentToEdit.studentId, fullName: studentToEdit.fullName, email: studentToEdit.email }
            : student
        )
      );

      handleCloseEditModal();
      alert("Student information updated successfully!");
    } catch (error) {
      console.error("Error updating student information:", error);
      alert("Error updating student. Please try again later.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed": return "text-green-600 bg-green-100";
      case "In Progress": return "text-yellow-600 bg-yellow-100";
      case "Not Started": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getProgressBarColor = (percentage) => {
    if (percentage === 100) return "bg-green-500";
    if (percentage >= 75) return "bg-blue-500";
    if (percentage >= 50) return "bg-yellow-500";
    if (percentage >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  const StatCard = ({ icon, title, value, color, percentage }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {percentage !== undefined && (
            <p className="text-xs text-gray-500 mt-1">{percentage}% of total</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <FontAwesomeIcon icon={icon} className="text-xl" />
        </div>
      </div>
    </div>
  );

  const StudentCard = ({ student }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{student.fullName}</h3>
            <p className="text-sm text-gray-500">{student.studentId}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(student.status)}`}>
            {student.status}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Email:</span>
            <span className="text-gray-900 truncate ml-2">{student.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Section:</span>
            <span className="text-gray-900">{student.section || "N/A"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Grade Level:</span>
            <span className="text-gray-900">{student.gradeLevel}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Education Level:</span>
            <span className="text-gray-900">{student.educationLevel}</span>
          </div>
        </div>

        {student.section && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Clearance Progress</span>
              <span className="text-sm font-bold text-gray-900">{student.completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(student.completionPercentage)}`}
                style={{ width: `${student.completionPercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {student.completedRequirements} of {student.totalRequirements} completed
            </p>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleOpenEditModal(student)}
            className="flex-1 py-2 px-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-1"
          >
            <FontAwesomeIcon icon={faEdit} /> Edit
          </button>
          <button
            onClick={() => {
              setStudentToPromote(student);
              setIsPromoteModalOpen(true);
            }}
            className="flex-1 py-2 px-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-1"
          >
            <FontAwesomeIcon icon={faArrowUp} /> Promote
          </button>
          <button
            onClick={() => {
              setStudentToArchive(student);
              setIsArchiveModalOpen(true);
            }}
            className="flex-1 py-2 px-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-1"
          >
            <FontAwesomeIcon icon={faArchive} /> Archive
          </button>
        </div>

        {student.section && (
          <button
            onClick={() => handleStudentClick(student.uid || student.id)}
            className="w-full mt-2 py-2 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            View Clearance Details
            <FontAwesomeIcon icon={expandedStudent === (student.uid || student.id) ? faAngleUp : faAngleDown} />
          </button>
        )}
      </div>

      {expandedStudent === (student.uid || student.id) && student.section && (
        <div className="border-t border-gray-200 bg-gray-50 p-6">
          <h4 className="font-semibold text-gray-900 mb-4">Clearance Details</h4>
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(student.clearance)
              .sort(([subjectA], [subjectB]) => subjectA.localeCompare(subjectB))
              .map(([subject, isCleared]) => (
                <div key={subject} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <span className="text-sm text-gray-700">{subject}</span>
                  <FontAwesomeIcon
                    icon={isCleared ? faCheckCircle : faTimesCircle}
                    className={isCleared ? "text-green-500" : "text-red-500"}
                  />
                </div>
              ))}
          </div>
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
      <p className="text-gray-500 text-center max-w-sm mb-4">
        {searchQuery || educationLevelFilter !== "all" || sectionFilter !== "all" || completionFilter !== "all"
          ? "Try adjusting your filters or search query."
          : "No students found in the system."}
      </p>
      <Link
        to="/create-student"
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
      >
        <FontAwesomeIcon icon={faUserPlus} /> Add First Student
      </Link>
    </div>
  );

  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-gray-200 rounded-xl h-64"></div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-200 rounded-xl h-96"></div>
      )}
    </div>
  );

  if (loading) {
    return (
      <Sidebar>
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <LoadingSkeleton />
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
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Students Master List</h1>
              <p className="mt-2 text-gray-600">Monitor student clearance progress and manage records</p>
            </div>
            <Link
              to="/create-student"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faUserPlus} /> Add Student
            </Link>
          </div>

          {}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <StatCard 
              icon={faUsers} 
              title="Total Students" 
              value={statistics.total} 
              color="bg-blue-100 text-blue-600"
            />
            <StatCard 
              icon={faCheckCircle} 
              title="Completed" 
              value={statistics.completed}
              percentage={statistics.total ? Math.round((statistics.completed / statistics.total) * 100) : 0}
              color="bg-green-100 text-green-600"
            />
            <StatCard 
              icon={faChartLine} 
              title="In Progress" 
              value={statistics.inProgress}
              percentage={statistics.total ? Math.round((statistics.inProgress / statistics.total) * 100) : 0}
              color="bg-yellow-100 text-yellow-600"
            />
            <StatCard 
              icon={faExclamationTriangle} 
              title="Not Started" 
              value={statistics.notStarted}
              percentage={statistics.total ? Math.round((statistics.notStarted / statistics.total) * 100) : 0}
              color="bg-red-100 text-red-600"
            />
            <StatCard 
              icon={faGraduationCap} 
              title="Avg. Progress" 
              value={`${statistics.averageCompletion}%`}
              color="bg-purple-100 text-purple-600"
            />
          </div>

          {}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {}
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
                  </div>
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
                  value={educationLevelFilter}
                  onChange={(e) => setEducationLevelFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Sections</option>
                  {availableSections.map((section) => (
                    <option key={section} value={section}>
                      {section}
                    </option>
                  ))}
                </select>

                <select
                  value={completionFilter}
                  onChange={(e) => setCompletionFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Not Started">Not Started</option>
                </select>

                {}
                <div className="flex bg-gray-100 rounded-lg p-1 ml-auto">
                  <button
                    onClick={() => setViewMode("table")}
                    className={`p-2 rounded ${viewMode === "table" ? "bg-white shadow-sm" : ""}`}
                    title="Table View"
                  >
                    <FontAwesomeIcon icon={faListUl} />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded ${viewMode === "grid" ? "bg-white shadow-sm" : ""}`}
                    title="Grid View"
                  >
                    <FontAwesomeIcon icon={faThLarge} />
                  </button>
                </div>
              </div>
            </div>

            {}
            {(educationLevelFilter !== "all" || sectionFilter !== "all" || completionFilter !== "all" || searchQuery) && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                <span className="text-sm text-gray-500">Active filters:</span>
                <div className="flex flex-wrap gap-2">
                  {searchQuery && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      Search: {searchQuery}
                    </span>
                  )}
                  {educationLevelFilter !== "all" && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      Level: {educationLevelFilter}
                    </span>
                  )}
                  {sectionFilter !== "all" && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      Section: {sectionFilter}
                    </span>
                  )}
                  {completionFilter !== "all" && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      Status: {completionFilter}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setEducationLevelFilter("all");
                    setSectionFilter("all");
                    setCompletionFilter("all");
                  }}
                  className="ml-auto text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {}
          {students.length === 0 ? (
            <EmptyState />
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {students.map((student) => (
                <StudentCard key={student.id} student={student} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student Info
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
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
                      <React.Fragment key={student.id}>
                        <tr className="hover:bg-gray-50 transition-colors">
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
                            <div className="text-sm text-gray-900">{student.section || "N/A"}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm text-gray-900">{student.gradeLevel}</div>
                              <div className="text-xs text-gray-500">{student.educationLevel}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(student.status)}`}>
                              {student.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {student.section ? (
                              <div className="flex items-center">
                                <div className="flex-1">
                                  <div className="flex items-center">
                                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                                      <div
                                        className={`h-2 rounded-full ${getProgressBarColor(student.completionPercentage)}`}
                                        style={{ width: `${student.completionPercentage}%` }}
                                      />
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">
                                      {student.completionPercentage}%
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {student.completedRequirements}/{student.totalRequirements}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">No clearance</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleOpenEditModal(student)}
                                className="text-yellow-600 hover:text-yellow-900 transition-colors"
                                title="Edit"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                              <button
                                onClick={() => {
                                  setStudentToPromote(student);
                                  setIsPromoteModalOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 transition-colors"
                                title="Promote"
                              >
                                <FontAwesomeIcon icon={faArrowUp} />
                              </button>
                              <button
                                onClick={() => {
                                  setStudentToArchive(student);
                                  setIsArchiveModalOpen(true);
                                }}
                                className="text-red-600 hover:text-red-900 transition-colors"
                                title="Archive"
                              >
                                <FontAwesomeIcon icon={faArchive} />
                              </button>
                              {student.section && (
                                <button
                                  onClick={() => handleStudentClick(student.uid || student.id)}
                                  className="text-blue-600 hover:text-blue-900 transition-colors"
                                  title="View Details"
                                >
                                  <FontAwesomeIcon
                                    icon={expandedStudent === (student.uid || student.id) ? faAngleUp : faAngleDown}
                                  />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {expandedStudent === (student.uid || student.id) && student.section && (
                          <tr>
                            <td colSpan={7} className="px-6 py-4 bg-gray-50">
                              <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900">Clearance Details</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                  {Object.entries(student.clearance)
                                    .sort(([subjectA], [subjectB]) => subjectA.localeCompare(subjectB))
                                    .map(([subject, isCleared]) => (
                                      <div
                                        key={subject}
                                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                                      >
                                        <span className="text-sm text-gray-700 flex-1 mr-2">{subject}</span>
                                        <FontAwesomeIcon
                                          icon={isCleared ? faCheckCircle : faTimesCircle}
                                          className={isCleared ? "text-green-500" : "text-red-500"}
                                        />
                                      </div>
                                    ))}
                                </div>
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
      <Modal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Confirm Archive</h3>
          <p>
            Are you sure you want to archive student{" "}
            <strong>{studentToArchive?.fullName}</strong>?
          </p>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setIsArchiveModalOpen(false)}
              className="mr-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleArchiveStudent}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Archive
            </button>
          </div>
        </div>
      </Modal>

      {}
      <Modal
        isOpen={isPromoteModalOpen}
        onClose={() => setIsPromoteModalOpen(false)}
      >
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Confirm Promotion</h3>
          <p>
            Are you sure you want to promote student{" "}
            <strong>{studentToPromote?.fullName}</strong> to the next grade
            level? This will remove their current section and reset their
            clearance.
          </p>
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setIsPromoteModalOpen(false)}
              className="mr-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handlePromoteStudent}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Promote
            </button>
          </div>
        </div>
      </Modal>

      {}
      <Modal isOpen={isEditModalOpen} onClose={handleCloseEditModal}>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Edit Student</h3>
          {studentToEdit && (
            <form className="space-y-4">
              <div>
                <label className="block text-gray-700">Student ID:</label>
                <input
                  type="text"
                  value={studentToEdit.studentId}
                  onChange={(e) =>
                    setStudentToEdit({
                      ...studentToEdit,
                      studentId: e.target.value,
                    })
                  }
                  required
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>

              <div>
                <label className="block text-gray-700">Full Name:</label>
                <input
                  type="text"
                  value={studentToEdit.fullName}
                  onChange={(e) =>
                    setStudentToEdit({
                      ...studentToEdit,
                      fullName: e.target.value,
                    })
                  }
                  required
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>

              <div>
                <label className="block text-gray-700">Email:</label>
                <input
                  type="email"
                  value={studentToEdit.email}
                  onChange={(e) =>
                    setStudentToEdit({
                      ...studentToEdit,
                      email: e.target.value,
                    })
                  }
                  required
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="mr-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => handleSaveEdit(e)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </Sidebar>
  );
}

export default StudentsMasterList;