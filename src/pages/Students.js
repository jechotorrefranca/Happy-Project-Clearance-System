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
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCirclePlus } from "@fortawesome/free-solid-svg-icons";
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';



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

  const showSuccessToast = (msg) => toast.success(msg, {
    position: "top-center",
    autoClose: 2500,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: false,
    draggable: true,
    progress: undefined,
    theme: "colored",
    transition: Bounce,
    });

    const showFailedToast = (msg) => toast.error(msg, {
      position: "top-center",
      autoClose: 2500,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      progress: undefined,
      theme: "colored",
      transition: Bounce,
      });

  const showWarnToast = (msg) => toast.warn(msg, {
    position: "top-center",
    autoClose: 2500,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: false,
    draggable: true,
    progress: undefined,
    theme: "colored",
    transition: Bounce,
    });  


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

      showSuccessToast("Student archived successfully!");
    } catch (error) {
      console.error("Error archiving student: ", error);
      showFailedToast("Error archiving student. Please try again later");
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

      showSuccessToast("Student promoted successfully!");
    } catch (error) {
      console.error("Error promoting student: ", error);
      showFailedToast("Error promoting student. Please try again later");
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
          showWarnToast("Student ID already exists!");
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
      showSuccessToast("Student information updated successfully!");
    } catch (error) {
      console.error("Error updating student information:", error);
      showFailedToast("Error updating student. Please try again later");
    }
  };

  return (
    <Sidebar>
      <ToastContainer/>
      <div className="container mx-auto bg-blue-100 rounded pb-10 min-h-[90vh]">
        <div className="bg-blue-300 p-5 rounded flex justify-center items-center mb-10">
          <h2 className="text-3xl font-bold text-blue-950">Students</h2>
        </div>

        <div className="p-5">
          <div className="bg-white p-5 rounded-xl overflow-auto">

          <div className="w-full flex justify-center mb-4">

            <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0 flex justify-center sm:w-[50%]">
              <motion.div
              whileHover={{scale: 1.03}}
              whileTap={{scale: 0.95}}
              className="w-full"
              >
                <Link
                  to="/create-student"
                  className="bg-blue-500 text-white p-2 rounded hover:bg-blue-700 w-full flex justify-center items-center gap-1"
                >
                  <FontAwesomeIcon icon={faCirclePlus} className="text-xl"/>
                  <span>
                    Add Student

                  </span>
                </Link>

              </motion.div>

            </div>

            </div>

            <div className="mb-4 sm:flex gap-4">
              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0 flex items-center">
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>

              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
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

            </div>



            <div className="w-full overflow-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-blue-300">
                    <th className="py-3 px-2 border border-gray-400">Student ID</th>
                    <th className="py-3 px-2 border border-gray-400">Name</th>
                    <th className="py-3 px-2 border border-gray-400">Email</th>
                    <th className="py-3 px-2 border border-gray-400">Education Level</th>
                    <th className="py-3 px-2 border border-gray-400">Grade Level</th>
                    <th className="py-3 px-2 border border-gray-400">Section</th>
                    <th className="py-3 px-2 border border-gray-400 text-center bg-[#fff2c1]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="custom-row bg-blue-100 hover:bg-blue-200">
                      <td className="border border-gray-400 px-4 py-2">{student.studentId}</td>
                      <td className="border border-gray-400 px-4 py-2">{student.fullName}</td>
                      <td className="border border-gray-400 px-4 py-2">{student.email}</td>
                      <td className="border border-gray-400 px-4 py-2">{student.educationLevel}</td>
                      <td className="border border-gray-400 px-4 py-2">{student.gradeLevel}</td>
                      <td className="border border-gray-400 px-4 py-2">
                        {student.section ? student.section : "N/A"}
                      </td>
                      <td className="custom-cell border border-gray-400 px-4 py-2 text-center">
                        <div className="flex flex-wrap gap-2 justify-center">

                          <motion.button
                          whileHover={{scale: 1.03}}
                          whileTap={{scale: 0.95}}                          
                            onClick={(e) => {
                              e.stopPropagation();
                              setStudentToArchive(student);
                              setIsArchiveModalOpen(true);
                            }}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                          >
                            Archive
                          </motion.button>

                          <motion.button
                          whileHover={{scale: 1.03}}
                          whileTap={{scale: 0.95}}                          
                            onClick={(e) => {
                              e.stopPropagation();
                              setStudentToPromote(student);
                              setIsPromoteModalOpen(true);
                            }}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            Promote
                          </motion.button>

                          <motion.button
                          whileHover={{scale: 1.03}}
                          whileTap={{scale: 0.95}}                          
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(student);
                            }}
                            className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                          >
                            Edit
                          </motion.button>

                        </div>


                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>


          </div>
        </div>




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

            <div className="mt-6 flex justify-around">
              <motion.button
              whileHover={{scale: 1.03}}
              whileTap={{scale: 0.95}}              
                onClick={() => setIsArchiveModalOpen(false)}
                className="w-full mr-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </motion.button>
              <motion.button
              whileHover={{scale: 1.03}}
              whileTap={{scale: 0.95}}              
                onClick={handleArchiveStudent}
                className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Archive
              </motion.button>
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
            <div className="mt-6 flex justify-around">
              <motion.button
              whileHover={{scale: 1.03}}
              whileTap={{scale: 0.95}}              
                onClick={() => setIsPromoteModalOpen(false)}
                className="w-full mr-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </motion.button>
              <motion.button
              whileHover={{scale: 1.03}}
              whileTap={{scale: 0.95}}              
                onClick={handlePromoteStudent}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Promote
              </motion.button>
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

                <div className="flex justify-around">
                  <motion.button
                  whileHover={{scale: 1.03}}
                  whileTap={{scale: 0.95}}                  
                    onClick={handleCloseEditModal}
                    className="w-full mr-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                  whileHover={{scale: 1.03}}
                  whileTap={{scale: 0.95}}                  
                    onClick={(e) => handleSaveEdit(e)}
                    className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Save Changes
                  </motion.button>
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
