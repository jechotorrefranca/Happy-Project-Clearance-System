import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  getDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../components/AuthContext";
import Sidebar from "../components/Sidebar";
import { useParams } from "react-router-dom";
import { PieChart, Pie, Cell, Legend } from "recharts";
import ReactToPrint from "react-to-print";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faTimesCircle,
  faAngleDown,
  faAngleUp,
} from "@fortawesome/free-solid-svg-icons";
import Modal from "../components/Modal";
import moment from "moment";
import { motion } from 'framer-motion';
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


function ClassDetailsForAdviser() {
  const { currentUser } = useAuth();
  const { classId } = useParams();
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const componentRef = useRef(null);
  const [isRequirementModalOpen, setIsRequirementModalOpen] = useState(false);
  const [newRequirementName, setNewRequirementName] = useState("");
  const [newRequirementDescription, setNewRequirementDescription] =
    useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

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
    const fetchClassData = async () => {
      if (!classId) return;

      try {
        const classDocRef = doc(db, "classes", classId);
        const classDocSnapshot = await getDoc(classDocRef);

        if (classDocSnapshot.exists()) {
          const data = classDocSnapshot.data();
          setClassData(data);
        }
      } catch (error) {
        console.error("Error fetching class data: ", error);
      }
    };

    fetchClassData();
  }, [classId]);

  useEffect(() => {
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

            const disciplinaryRecordsRef = collection(
              db,
              "disciplinaryRecords"
            );
            const disciplinaryQuery = query(
              disciplinaryRecordsRef,
              where("studentId", "==", studentData.uid)
            );
            const disciplinarySnapshot = await getDocs(disciplinaryQuery);
            const disciplinaryRecords = disciplinarySnapshot.docs.map(
              (recordDoc) => recordDoc.data()
            );

            const totalRequirements = Object.keys(studentData.clearance).length;
            const completedRequirements = Object.values(
              studentData.clearance
            ).filter((cleared) => cleared).length;
            const completionPercentage = Math.round(
              (completedRequirements / totalRequirements) * 100
            );

            return {
              ...studentData,
              completionPercentage,
              disciplinaryRecords,
            };
          })
        );

        setStudents(studentsWithCompletion);
      } catch (error) {
        console.error("Error fetching students: ", error);
        setStudents([]);
      }
    };

    fetchStudents();
  }, [classData]);

  const chartData = [
    {
      name: "Completed",
      value: students.filter((student) => student.completionPercentage === 100)
        .length,
    },
    {
      name: "Incomplete",
      value: students.filter((student) => student.completionPercentage < 100)
        .length,
    },
  ];

  const handleStudentClick = (studentId) => {
    setExpandedStudent((prev) => (prev === studentId ? null : studentId));
  };

  const openAddRequirementModal = () => {
    setIsRequirementModalOpen(true);
  };

  const closeAddRequirementModal = () => {
    setIsRequirementModalOpen(false);
    setNewRequirementName("");
    setNewRequirementDescription("");
  };

  const handleAddRequirement = async () => {
    try {
      const classDocRef = doc(db, "classes", classId);
      await updateDoc(classDocRef, {
        [`requirements.Class Adviser`]: arrayUnion({
          name: newRequirementName,
          description: newRequirementDescription,
          teacherUid: currentUser.uid,
        }),
      });

      setClassData((prevData) => ({
        ...prevData,
        requirements: {
          ...prevData.requirements,
          "Class Adviser": [
            ...(prevData.requirements["Class Adviser"] || []),
            {
              name: newRequirementName,
              description: newRequirementDescription,
              teacherUid: currentUser.uid,
            },
          ],
        },
      }));

      closeAddRequirementModal();
      showSuccessToast("Requirement added successfully!");
    } catch (error) {
      console.error("Error adding requirement:", error);
      showFailedToast("Error adding requirement. Please try again later");
    }
  };

  const handleClearStudent = async (studentId, subject) => {
    try {
      const studentsCollectionRef = collection(db, "students");
      const querySnapshot = await getDocs(
        query(studentsCollectionRef, where("uid", "==", studentId))
      );
  
      if (!querySnapshot.empty) {
        const studentDocRef = querySnapshot.docs[0].ref;
        await updateDoc(studentDocRef, {
          [`clearance.Class Adviser`]: true,
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
                  completionPercentage: calculateCompletionPercentage(student), 
                }
              : student
          )
        );
        
        showSuccessToast("Student clearance updated successfully!");
      } else {
        console.log("No student document found with the provided studentId");
      }
    } catch (error) {
      console.error("Error updating student clearance: ", error);
      showFailedToast("Error updating clearance. Please try again later");
    }
  };

  const handleSelectAllStudents = () => {
    const unclearedStudents = students.filter(
      (student) => !student.clearance["Class Adviser"]
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
      showWarnToast("Please select students to clear");
      return;
    }

    try {
      const updatePromises = selectedStudentIds.map(async (studentId) => {
        await handleClearStudent(studentId);
      });
      await Promise.all(updatePromises);

      showSuccessToast("Selected students cleared for Class Adviser requirement")
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

  if (!classData) {
    return <div>Loading class details...</div>;
  }

  return (
    <Sidebar>
      <ToastContainer/>
      <div className="container mx-auto bg-blue-100 rounded pb-10 min-h-[90vh]">
        <div className="bg-blue-300 p-5 rounded flex justify-center items-center mb-10">
          <h2 className="text-3xl font-bold text-blue-950">Advisory Class Details</h2>
        </div>

        <div className="p-5">
          <div className="bg-white p-5 rounded-xl overflow-auto">

            <div className="w-full flex mb-2 justify-center">
              <div className="w-full bg-blue-100 p-5 rounded sm:w-[50%]">
                <ReactToPrint
                  trigger={() => (
                    <motion.button 
                    whileHover={{scale: 1.03}}
                    whileTap={{scale: 0.95}}
                    className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                      Print
                    </motion.button>
                  )}
                  content={() => componentRef.current}
                />

              </div>
            </div>

            <div className="mb-4 sm:flex gap-4">

            <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                <motion.button
                whileHover={{scale: 1.03}}
                whileTap={{scale: 0.95}}                
                  onClick={openAddRequirementModal}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add Adviser Requirement
                </motion.button>
              </div>

              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                <motion.button
                whileHover={{scale: 1.03}}
                whileTap={{scale: 0.95}}                
                  onClick={handleClearSelectedStudents}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  disabled={selectedStudentIds.length === 0}
                >
                  Clear Selected Students
                </motion.button>
              </div>

            </div>

            <div>
              <div className="flex justify-center items-center text-center bg-blue-300 p-3 rounded mb-4">
                <h2 className="text-2xl text-blue-950 font-bold">Advisory Class: {classData.sectionName}</h2>
              </div>
            </div>

            <div className="w-full overflow-auto">
              {students.length === 0 ? (
                <p>No students found.</p>
              ) : (
                <div className="overflow-x-auto" ref={componentRef}>


                  <table className="min-w-full bg-white border border-gray-200 rounded-md shadow-md">
                    <thead>
                      <tr className="bg-blue-300">
                        <th className="py-3 px-2 border border-gray-400">
                          <input type="checkbox" onChange={handleSelectAllStudents} />
                        </th>
                        <th className="py-3 px-2 border border-gray-400">
                          Student ID
                        </th>
                        <th className="py-3 px-2 border border-gray-400">
                          Name
                        </th>
                        <th className="py-3 px-2 border border-gray-400">
                          Disciplinary Records
                        </th>
                        <th className="py-3 px-2 border border-gray-400">
                          Completion (%)
                        </th>
                        <th className="py-3 px-2 border border-gray-400 text-center bg-[#fff2c1]">
                          Actions
                        </th>
                        <th className="py-3 px-2 border border-gray-400 text-center bg-[#fff2c1]"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <React.Fragment key={student.uid}>
                          <tr
                            key={student.uid}
                            onClick={() => handleStudentClick(student.uid)}
                            className="custom-row bg-blue-100 hover:bg-blue-200 cursor-pointer"
                          >
                            <td className="border border-gray-400 px-4 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={selectedStudentIds.includes(student.uid)}
                                onChange={() => handleSelectStudent(student.uid)}
                                disabled={student.clearance["Class Adviser"]}
                              />
                            </td>
                            <td className="border border-gray-400 px-4 py-2 text-center">
                              {student.studentId}
                            </td>
                            <td className="border border-gray-400 px-4 py-2 text-center">
                              {student.fullName}
                            </td>
                            <td className="border border-gray-400 px-4 py-2 text-center">
                              {student.disciplinaryRecords.length}
                            </td>
                            <td className="border border-gray-400 px-4 py-2 text-center">
                              {student.completionPercentage}%
                            </td>
                            <td className="custom-cell border border-gray-400 px-4 py-2 text-center">
                              {!student.clearance["Class Adviser"] && (
                                <motion.button
                                  whileHover={{scale: 1.03}}
                                  whileTap={{scale: 0.95}}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleClearStudent(student.uid);
                                  }}
                                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring focus:ring-green-300"
                                >
                                  Clear
                                </motion.button>
                              )}
                            </td>
                            <td className="custom-cell border border-gray-400 px-4 py-2 text-center">
                              <FontAwesomeIcon
                                icon={
                                  expandedStudent === student.uid
                                    ? faAngleUp
                                    : faAngleDown
                                }
                              />
                            </td>
                          </tr>

                          {expandedStudent === student.uid && (
                            <tr className="bg-blue-50">
                              <td colSpan={6} className="border px-4 py-2">
                                <div className="mb-4 p-5">
                                  <div className="bg-blue-300 p-3 flex justify-center items-center mb-2">
                                    <h4 className="font-semibold text-xl ">Clearance</h4>

                                  </div>
                                  <table className="min-w-full">
                                    <thead>
                                      <tr className="bg-blue-200">
                                        <th className=" py-3 px-2 border border-gray-400">
                                          Subject
                                        </th>
                                        <th className=" py-3 px-2 border border-gray-400">
                                          Status
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {Object.entries(student.clearance)
                                        .sort(([a], [b]) => a.localeCompare(b))
                                        .map(([subject, isCleared]) => (
                                          <tr key={subject} className=" bg-blue-100 hover:bg-blue-200">
                                            <td className="border border-gray-400 px-4 py-2">
                                              {subject}
                                            </td>
                                            <td className="border border-gray-400 px-4 py-2 text-center">
                                              {isCleared ? (
                                                <FontAwesomeIcon
                                                  icon={faCheckCircle}
                                                  className="text-green-500"
                                                />
                                              ) : (
                                                <FontAwesomeIcon
                                                  icon={faTimesCircle}
                                                  className="text-red-500"
                                                />
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                    </tbody>
                                  </table>
                                </div>

                                {student.disciplinaryRecords.length > 0 && (
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
                                              {moment(
                                                record.timestamp.toDate()
                                              ).format("YYYY-MM-DD")}
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
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>



            <div className="mt-8 bg-blue-50 p-3">
                <div className="flex justify-center items-center text-center bg-blue-300 p-3 rounded mb-4">
                  <h2 className="text-2xl text-blue-950 font-bold">Clearance Completion</h2>
                </div>

                <div className="flex justify-center">
                  <PieChart width={400} height={300}>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      label
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? "#4CAF50" : "#F44336"}
                        />
                      ))}
                    </Pie>
                    <Legend layout="radial" align="center" verticalAlign="bottom" />
                  </PieChart>

                </div>
            </div>

          </div>
        </div>



        <Modal
          isOpen={isRequirementModalOpen}
          onClose={closeAddRequirementModal}
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Add Requirement</h3>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="requirementName"
              >
                Requirement Name:
              </label>
              <input
                type="text"
                id="requirementName"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={newRequirementName}
                onChange={(e) => setNewRequirementName(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="requirementDescription"
              >
                Description:
              </label>
              <textarea
                id="requirementDescription"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={newRequirementDescription}
                onChange={(e) => setNewRequirementDescription(e.target.value)}
              />
            </div>
            <div className="flex justify-around">
              <motion.button
              whileHover={{scale: 1.03}}
              whileTap={{scale: 0.95}}              
                onClick={closeAddRequirementModal}
                className="w-full mr-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </motion.button>
              <motion.button
              whileHover={{scale: 1.03}}
              whileTap={{scale: 0.95}}              
                onClick={handleAddRequirement}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add
              </motion.button>
            </div>
          </div>
        </Modal>
      </div>
    </Sidebar>
  );
}

export default ClassDetailsForAdviser;
