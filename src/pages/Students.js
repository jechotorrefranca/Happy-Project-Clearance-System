import React, { useState, useEffect } from "react";
import {
  getDocs,
  collection,
  query,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";

function Students() {
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [studentToArchive, setStudentToArchive] = useState(null);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [studentToPromote, setStudentToPromote] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      let q = query(collection(db, "students"));

      if (searchQuery) {
        q = query(
          q,
          where("fullName", ">=", searchQuery),
          where("fullName", "<=", searchQuery + "uf8ff")
        );
      }
      if (selectedLevel) {
        q = query(q, where("educationLevel", "==", selectedLevel));
      }

      const studentsSnapshot = await getDocs(q);
      const studentsData = studentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const filteredStudents = studentsData.filter(
        (student) => student.archived !== true
      );

      setStudents(filteredStudents);
    };

    fetchStudents();
  }, [searchQuery, selectedLevel]);

  const handleArchiveStudent = async () => {
    try {
      if (!studentToArchive) return;

      await updateDoc(doc(db, "students", studentToArchive.id), {
        archived: true,
      });

      setStudents(
        students.filter((student) => student.id !== studentToArchive.id)
      );
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

      setStudents((prevStudents) =>
        prevStudents.map((student) =>
          student.id === studentToPromote.id
            ? {
                ...student,
                gradeLevel: newGradeLevel.toString(),
                educationLevel: newEducationLevel,
                section: null,
                clearance: {},
              }
            : student
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
          student.id === studentToEdit.id ? studentToEdit : student
        )
      );

      handleCloseEditModal();
      alert("Student information updated successfully!");
    } catch (error) {
      console.error("Error updating student information:", error);
      alert("Error updating student. Please try again later.");
    }
  };

  return (
    <Sidebar>
      <div>
        <h2 className="text-2xl font-semibold mb-4">Students</h2>
        <Link
          to="/create-student"
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-700"
        >
          Add Student
        </Link>
        <div className="my-4">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
          />
        </div>
        <div className="my-4">
          <label htmlFor="level" className="block text-gray-700">
            Filter by Education Level
          </label>
          <select
            id="level"
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
          >
            <option value="">All Levels</option>
            <option value="elementary">Elementary</option>
            <option value="juniorHighschool">Junior High School</option>
            <option value="seniorHighschool">Senior High School</option>
            <option value="college">College</option>
          </select>
        </div>
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2">Student ID</th>
              <th className="py-2">Name</th>
              <th className="py-2">Email</th>
              <th className="py-2">Education Level</th>
              <th className="py-2">Grade Level</th>
              <th className="py-2">Section</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td className="border px-4 py-2">{student.studentId}</td>
                <td className="border px-4 py-2">{student.fullName}</td>
                <td className="border px-4 py-2">{student.email}</td>
                <td className="border px-4 py-2">{student.educationLevel}</td>
                <td className="border px-4 py-2">{student.gradeLevel}</td>
                <td className="border px-4 py-2">
                  {student.section ? student.section : "N/A"}
                </td>
                <td className="border px-4 py-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setStudentToArchive(student);
                      setIsArchiveModalOpen(true);
                    }}
                    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 mr-2"
                  >
                    Archive
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setStudentToPromote(student);
                      setIsPromoteModalOpen(true);
                    }}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
                  >
                    Promote
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenEditModal(student);
                    }}
                    className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

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
      </div>
    </Sidebar>
  );
}

export default Students;
