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
  faTimesCircle,
  faAngleDown,
  faAngleUp,
} from "@fortawesome/free-solid-svg-icons";
import { motion } from 'framer-motion';
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


function OfficeClearanceManagement() {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState([]);
  const [originalStudents, setOriginalStudents] = useState([]);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [educationLevelFilter, setEducationLevelFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [availableSections, setAvailableSections] = useState([]);
  const [availableEducationLevels, setAvailableEducationLevels] = useState([]);
  const [officeName, setOfficeName] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [userDepartment, setUserDepartment] = useState(null);

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
            clearance,
            completionPercentage,
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

        setStudents(studentsData);
        setOriginalStudents(studentsData);

        const uniqueSections = [
          ...new Set(studentsData.map((student) => student.section)),
        ];
        const uniqueEducationLevels = [
          ...new Set(studentsData.map((student) => student.educationLevel)),
        ];
        setAvailableSections(uniqueSections);
        setAvailableEducationLevels(uniqueEducationLevels);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };

    const fetchUserRole = async () => {
      if (!currentUser) return;

      try {
        const userRef = collection(db, "users");
        const userQuery = query(userRef, where("uid", "==", currentUser.uid));
        const userDoc = await getDocs(userQuery);
        const userData = userDoc.docs[0].data();
        const userRole = userData.role;
        setUserDepartment(userData.department || null);

        switch (userRole) {
          case "Librarian":
            setOfficeName("Librarian");
            break;
          case "Finance":
            setOfficeName("Finance");
            break;
          case "registrarBasicEd":
            setOfficeName("Basic Education Registrar");
            break;
          case "characterRenewalOfficer":
            setOfficeName("Character Renewal Office");
            break;
          case "College Library":
            setOfficeName("College Library");
            break;
          case "Guidance Office":
            setOfficeName("Guidance Office");
            break;
          case "Office of The Dean":
            setOfficeName("Office of The Dean");
            break;
          case "Office of the Finance Director":
            setOfficeName("Office of the Finance Director");
            break;
          case "Office of the Registrar":
            setOfficeName("Office of the Registrar");
            break;
          case "Property Custodian":
            setOfficeName("Property Custodian");
            break;
          case "Student Council":
            setOfficeName("Student Council");
            break;
          default:
            setOfficeName("Unknown Office");
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };

    fetchStudents();
    fetchUserRole();
  }, [currentUser, officeName, userDepartment]);

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

    if (searchQuery) {
      filteredStudents = filteredStudents.filter((student) =>
        student.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setStudents(filteredStudents);
  }, [educationLevelFilter, sectionFilter, searchQuery, originalStudents]);

  const handleStudentClick = (studentId) => {
    setExpandedStudent((prev) => (prev === studentId ? null : studentId));
  };

  const handleClearStudent = async (studentId) => {
    try {
      const q = query(collection(db, "students"), where("uid", "==", studentId));
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        console.error("No student found with uid:", studentId);
        showFailedToast("Error: Student not found");
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
                completionPercentage: calculateCompletionPercentage(student),
              }
            : student
        )
      );
  
      showSuccessToast(`${officeName} clearance marked for the student`)
    } catch (error) {
      console.error("Error updating student clearance: ", error);
      showFailedToast("Error updating clearance. Please try again later")
    }
  };

  const handleSelectAllStudents = () => {
    const unclearedStudents = students.filter(
      (student) => !student.clearance[officeName]
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
    if (selectedStudentIds.length === 0) {
      showWarnToast("Please select students to clear")
      return;
    }

    try {
      const updatePromises = selectedStudentIds.map(async (studentId) => {
        await handleClearStudent(studentId);
      });
      await Promise.all(updatePromises);

      showSuccessToast(`Selected students cleared for ${officeName} clearance`);
      setSelectedStudentIds([]);
    } catch (error) {
      console.error("Error clearing selected students: ", error);
      showFailedToast("Error clearing students. Please try again later");
    }
  };

  const calculateCompletionPercentage = (student) => {
    const totalRequirements = Object.keys(student.clearance).length;
    const completedRequirements = Object.values(student.clearance).filter(
      (cleared) => cleared
    ).length;
    return Math.round((completedRequirements / totalRequirements) * 100);
  };

  return (
    <Sidebar>
      <ToastContainer/>
      <div className="container mx-auto bg-blue-100 rounded pb-10 min-h-[90vh]">
        <div className="bg-blue-300 p-5 rounded flex justify-center items-center mb-10">
          <h2 className="text-3xl font-bold text-blue-950 text-center">Office Clearance Management ({officeName})</h2>
        </div>

        <div className="p-5">
          <div className="bg-white p-5 rounded-xl overflow-auto">

            <div className="mb-4 sm:flex gap-4">
              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                <label
                  htmlFor="educationLevelFilter"
                  className="block text-gray-700 mb-1"
                >
                  Filter by Education Level:
                </label>
                <select
                  id="educationLevelFilter"
                  value={educationLevelFilter}
                  onChange={(e) => setEducationLevelFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                >
                  <option value="all">All Education Levels</option>
                  {availableEducationLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                <label htmlFor="sectionFilter" className="block text-gray-700 mb-1">
                  Filter by Section:
                </label>
                <select
                  id="sectionFilter"
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                >
                  <option value="all">All Sections</option>
                  {availableSections.map((section) => (
                    <option key={section} value={section}>
                      {section}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                <label htmlFor="searchQuery" className="block text-gray-700 mb-1">
                  Search by Name:
                </label>
                <input
                  type="text"
                  id="searchQuery"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>
            </div>

            <div className="w-full flex justify-center items-center bg-blue-100 p-5 rounded mb-4">
              <motion.button
              whileHover={{scale: 1.03}}
              whileTap={{scale: 0.95}}              
                onClick={handleClearSelectedStudents}
                className="w-full sm:w-[50%] px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                disabled={selectedStudentIds.length === 0}
              >
                Clear Selected Students
              </motion.button>
            </div>

            <div className="w-full overflow-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-blue-300">
                    <th className="py-3 px-2 border border-gray-400 w-8">
                      <input type="checkbox" onChange={handleSelectAllStudents} />
                    </th>
                    <th className="py-3 px-2 border border-gray-400">Student ID</th>
                    <th className="py-3 px-2 border border-gray-400">Name</th>
                    <th className="py-3 px-2 border border-gray-400">Email</th>
                    <th className="py-3 px-2 border border-gray-400">Section</th>
                    <th className="py-3 px-2 border border-gray-400">Grade Level</th>
                    <th className="py-3 px-2 border border-gray-400">Education Level</th>
                    <th className="py-3 px-2 border border-gray-400 text-center">
                      Completion (%)
                    </th>
                    <th className="py-3 px-2 border border-gray-400 text-center bg-[#fff2c1]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <React.Fragment key={student.uid}>
                      <tr
                        key={student.uid}
                        onClick={() => handleStudentClick(student.uid)}
                        className="custom-row bg-blue-100 hover:bg-blue-200"
                      >
                        <td className="border border-gray-400 px-4 py-2">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(student.uid)}
                            onChange={() => handleSelectStudent(student.uid)}
                            disabled={student.clearance[officeName]}
                          />
                        </td>
                        <td className="border border-gray-400 px-4 py-2">{student.studentId}</td>
                        <td className="border border-gray-400 px-4 py-2">{student.fullName}</td>
                        <td className="border border-gray-400 px-4 py-2">{student.email}</td>
                        <td className="border border-gray-400 px-4 py-2">{student.section}</td>
                        <td className="border border-gray-400 px-4 py-2">{student.gradeLevel}</td>
                        <td className="border border-gray-400 px-4 py-2">{student.educationLevel}</td>
                        <td className="border border-gray-400 px-4 py-2 text-center">
                          {student.completionPercentage}%
                        </td>
                        <td className="custom-cell border border-gray-400 px-4 py-2 text-center">
                          {!student.clearance[officeName] && (
                            <motion.button
                              whileHover={{scale: 1.03}}
                              whileTap={{scale: 0.95}}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClearStudent(student.uid);
                              }}
                              className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                              Clear
                            </motion.button>
                          )}
                        </td>
                      </tr>

                      {/* {expandedStudent === student.uid && (
                        <tr className="bg-gray-100">
                          <td colSpan={9} className="border px-4 py-2">
                            {student.disciplinaryRecords &&
                            student.disciplinaryRecords.length > 0 ? (
                              <div>
                                <h4 className="font-medium mb-2">
                                  Disciplinary Records:
                                </h4>
                                <table className="min-w-full">
                                  <thead>
                                    <tr>
                                      <th className="py-2 border-b border-gray-200">
                                        Date
                                      </th>
                                      <th className="py-2 border-b border-gray-200">
                                        Violations
                                      </th>
                                      <th className="py-2 border-b border-gray-200">
                                        Sanctions
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {student.disciplinaryRecords.map((record) => (
                                      <tr key={record.timestamp}>
                                        <td className="border px-4 py-2">
                                          {moment(record.timestamp.toDate()).format(
                                            "YYYY-MM-DD"
                                          )}
                                        </td>
                                        <td className="border px-4 py-2">
                                          {record.violations.join(", ")}
                                        </td>
                                        <td className="border px-4 py-2">
                                          {record.sanctions.join(", ")}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <p>No disciplinary records found.</p>
                            )}
                          </td>
                        </tr>
                      )} */}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>

            </div>

          </div>
        </div>

      </div>
    </Sidebar>
  );
}

export default OfficeClearanceManagement;
