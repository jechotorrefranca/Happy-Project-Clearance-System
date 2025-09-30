import React, { useEffect, useState, useMemo } from "react";
import { 
  getDocs, 
  collection, 
  query, 
  where, 
  updateDoc, 
  doc,
  deleteDoc 
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChalkboardTeacher,
  faUser,
  faEnvelope,
  faGraduationCap,
  faSearch,
  faUserPlus,
  faEdit,
  faTrash,
  faBook,
  faIdBadge,
  faThLarge,
  faListUl,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";

function TeachersPage() {
  const [allTeachers, setAllTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [teacherToEdit, setTeacherToEdit] = useState(null);

  useEffect(() => {
    fetchTeachers();
  }, [selectedLevel]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      let q = query(collection(db, "teachers"), where("role", "==", "faculty"));
      
      if (selectedLevel) {
        q = query(q, where("level", "==", selectedLevel));
      }
      
      const teachersSnapshot = await getDocs(q);
      const teachersData = teachersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setAllTeachers(teachersData);
    } catch (error) {
      console.error("Error fetching teachers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = useMemo(() => {
    if (!searchQuery) return allTeachers;
    
    return allTeachers.filter(teacher =>
      teacher.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.employeeId?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allTeachers, searchQuery]);

  const handleEditTeacher = (teacher) => {
    setTeacherToEdit({ ...teacher });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      const updateData = {
        name: teacherToEdit.name || '',
        email: teacherToEdit.email || '',
        level: teacherToEdit.level || '',
      };

      await updateDoc(doc(db, "teachers", teacherToEdit.id), updateData);

      setAllTeachers(allTeachers.map(t => 
        t.id === teacherToEdit.id ? { ...t, ...updateData } : t
      ));
      
      setIsEditModalOpen(false);
      setTeacherToEdit(null);
    } catch (error) {
      console.error("Error updating teacher:", error);
      alert("Failed to update teacher. Please try again.");
    }
  };

  const getLevelDisplay = (level) => {
    const levelMap = {
      elementary: "Elementary",
      juniorHighschool: "Junior High School",
      seniorHighschool: "Senior High School",
      college: "College",
    };
    return levelMap[level] || level;
  };

  const getLevelColor = (level) => {
    const colorMap = {
      elementary: "bg-green-100 text-green-800",
      juniorHighschool: "bg-blue-100 text-blue-800",
      seniorHighschool: "bg-purple-100 text-purple-800",
      college: "bg-orange-100 text-orange-800",
    };
    return colorMap[level] || "bg-gray-100 text-gray-800";
  };

  const TeacherCard = ({ teacher }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
            {teacher.name?.charAt(0).toUpperCase()}
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900">{teacher.name}</h3>
            <p className="text-sm text-gray-500">{teacher.employeeId}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 mr-2 text-gray-400" />
          {teacher.email}
        </div>
        <div className="flex items-center">
          <FontAwesomeIcon icon={faGraduationCap} className="w-4 h-4 mr-2 text-gray-400" />
          <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(teacher.level)}`}>
            {getLevelDisplay(teacher.level)}
          </span>
        </div>
      </div>

      {teacher.subjects && teacher.subjects.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Subjects:</p>
          <div className="flex flex-wrap gap-1">
            {teacher.subjects.slice(0, 3).map((subject, index) => (
              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                {subject}
              </span>
            ))}
            {teacher.subjects.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                +{teacher.subjects.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => handleEditTeacher(teacher)}
        className="w-full py-2 px-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
      >
        <FontAwesomeIcon icon={faEdit} className="mr-2" />
        Edit Details
      </button>
    </div>
  );

  if (loading) {
    return (
      <Sidebar>
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="text-center">Loading teachers...</div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
              <p className="text-gray-600">Manage faculty members for clearance</p>
            </div>
            <Link
              to="/create-teacher"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faUserPlus} />
              Add Teacher
            </Link>
          </div>

          {}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, email, or ID..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Levels</option>
                <option value="elementary">Elementary</option>
                <option value="juniorHighschool">Junior High School</option>
                <option value="seniorHighschool">Senior High School</option>
                <option value="college">College</option>
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

          {}
          {filteredTeachers.length === 0 ? (
            <div className="text-center py-12">
              <FontAwesomeIcon icon={faChalkboardTeacher} className="text-4xl text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No teachers found</h3>
              <p className="text-gray-500">
                {searchQuery ? "Try adjusting your search" : "Add your first teacher to get started"}
              </p>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeachers.map((teacher) => (
                <TeacherCard key={teacher.id} teacher={teacher} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTeachers.map((teacher) => (
                    <tr key={teacher.id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                            {teacher.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="ml-3 text-sm font-medium text-gray-900">{teacher.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{teacher.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(teacher.level)}`}>
                          {getLevelDisplay(teacher.level)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleEditTeacher(teacher)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        {teacherToEdit && (
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Teacher</h2>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={teacherToEdit.name || ''}
                  onChange={(e) => setTeacherToEdit({ ...teacherToEdit, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              {
}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Education Level</label>
                <select
                  value={teacherToEdit.level || ''}
                  onChange={(e) => setTeacherToEdit({ ...teacherToEdit, level: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Level</option>
                  <option value="elementary">Elementary</option>
                  <option value="juniorHighschool">Junior High School</option>
                  <option value="seniorHighschool">Senior High School</option>
                  <option value="college">College</option>
                </select>
              </div>
            </form>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setTeacherToEdit(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                disabled={!teacherToEdit.name || !teacherToEdit.email || !teacherToEdit.level}
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </Modal>
    </Sidebar>
  );
}

export default TeachersPage;