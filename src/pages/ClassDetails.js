import React, { useState, useEffect, useRef } from "react";
import {
  collection,
  getDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../components/AuthContext";
import Sidebar from "../components/Sidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import { useParams } from "react-router-dom";
import { PieChart, Pie, Cell, Legend } from "recharts";
import ReactToPrint from "react-to-print";
import * as XLSX from "xlsx";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

function ClassDetails() {
  const { currentUser } = useAuth();
  const { classId } = useParams();
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [clearanceFilter, setClearanceFilter] = useState("all");
  const componentRef = useRef(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  useEffect(() => {
    const fetchClassData = async () => {
      if (!classId || !currentUser) return;

      try {
        const classDocRef = doc(db, "classes", classId);
        const classDocSnapshot = await getDoc(classDocRef);

        if (classDocSnapshot.exists()) {
          const data = classDocSnapshot.data();
          setClassData(data);

          const firstSubject = data.subjects.find(
            (s) => s.teacherUid === currentUser.uid
          )?.subject;
          setSelectedSubject(firstSubject);
        }
      } catch (error) {
        console.error("Error fetching class data: ", error);
      }
    };

    fetchClassData();
  }, [classId, currentUser]);

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
        setStudents(studentsSnapshot.docs.map((doc) => doc.data()));
      } catch (error) {
        console.error("Error fetching students: ", error);
        setStudents([]);
      }
    };

    fetchStudents();
  }, [classData]);

  const getFilteredStudents = () => {
    return students.filter((student) => {
      const nameMatch = student.fullName
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      if (clearanceFilter === "all") {
        return nameMatch;
      } else {
        const isCleared = student.clearance[selectedSubject];
        return clearanceFilter === "cleared"
          ? isCleared && nameMatch
          : !isCleared && nameMatch;
      }
    });
  };

  const handleSubjectChange = (subjectName) => {
    setSelectedSubject(subjectName);
    setSelectedStudentIds([]); 
  };

  const handleClearanceFilterChange = (e) => {
    setClearanceFilter(e.target.value);
    setSelectedStudentIds([]);
  };

  const chartData = [
    {
      name: "Cleared",
      value: students.filter((student) => student.clearance[selectedSubject])
        .length,
    },
    {
      name: "Uncleared",
      value: students.filter((student) => !student.clearance[selectedSubject])
        .length,
    },
  ];

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Clearance Status');

    const headerStyle = {
      font: { bold: true },
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' } 
      },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    };

    const dataCellStyle = {
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    };

    const clearedCellStyle = {
      ...dataCellStyle,
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF90EE90' }
      }
    };

    const unclearedCellStyle = {
      ...dataCellStyle,
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFA07A' } 
      }
    };

    worksheet.addRow([`${classData.sectionName} - ${selectedSubject} Clearance Status`]);
    worksheet.mergeCells('A1:C1');
    const titleCell = worksheet.getCell('A1');
    titleCell.font = { size: 16, bold: true, color: { argb: 'FF002060' } };
    titleCell.alignment = { horizontal: 'center' };

    const headerRow = worksheet.addRow(['Student ID', 'Name', 'Cleared']);
    headerRow.eachCell((cell) => {
      Object.assign(cell.style, headerStyle);
    });

    const filteredStudents = getFilteredStudents();
    filteredStudents.forEach((student) => {
      const row = worksheet.addRow([
        student.studentId,
        student.fullName,
        student.clearance[selectedSubject] ? 'Yes' : 'No'
      ]);

      row.eachCell((cell, colNumber) => {
        if (colNumber === 3) { 
          Object.assign(cell.style, student.clearance[selectedSubject] ? clearedCellStyle : unclearedCellStyle);
        } else {
          Object.assign(cell.style, dataCellStyle);
        }
      });
    });

    worksheet.addRow([]);

    worksheet.addRow(['', 'Generated On:', new Date().toLocaleDateString()]); 
    worksheet.addRow(['', 'Prepared By:', currentUser.email]);

    worksheet.columns.forEach(column => {
      let maxLength = 0;
      column.eachCell((cell) => {
        maxLength = Math.max(maxLength, cell.value ? cell.value.toString().length : 0);
      });
      column.width = maxLength + 2; 
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${classData.sectionName}_${selectedSubject}_clearance.xlsx`);
  };  

  const handleClearStudent = async (studentId) => {
    if (!selectedSubject) return;

    try {
      const q = query(collection(db, "students"), where("uid", "==", studentId));
      
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        querySnapshot.forEach(async (doc) => {
          await updateDoc(doc.ref, {
            [`clearance.${selectedSubject}`]: true,
          });
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

        alert("Student clearance updated successfully!");
      } else {
        console.error("No student found with the given ID");
        alert("No student found with the given ID");
      }
    } catch (error) {
      console.error("Error updating student clearance: ", error);
      alert("Error updating clearance. Please try again later.");
    }
  };

  const handleSelectAllStudents = () => {
    if (selectedStudentIds.length === getFilteredStudents().length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(
        getFilteredStudents().map((student) => student.uid)
      );
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
      alert("Please select students to clear.");
      return;
    }

    if (!selectedSubject) {
      alert("Please select a subject.");
      return;
    }

    try {
      const updatePromises = selectedStudentIds.map(async (studentId) => {
        await handleClearStudent(studentId);
      });
      await Promise.all(updatePromises);

      alert("Selected students cleared successfully!");
      setSelectedStudentIds([]);
    } catch (error) {
      console.error("Error clearing selected students: ", error);
      alert("Error clearing students. Please try again later.");
    }
  };

  if (!classData) {
    return <div>Loading class details...</div>; 
  }

  return (
    <Sidebar>
      <div className="container mx-auto bg-blue-100 rounded pb-10 min-h-[90vh]">
        <div className="bg-blue-300 p-5 rounded flex justify-center items-center mb-10">
          <h2 className="text-3xl font-bold text-blue-950">Class Details: {classData.sectionName}</h2>
        </div>

        <div className="p-5">
          <div className="bg-white p-5 rounded-xl overflow-auto">

            <div className="mb-4 sm:flex gap-4">
              <div className="w-full bg-blue-100 p-5 rounded mb-2">
                <label htmlFor="subjectSelect" className="block text-gray-700">
                  Select Subject:
                </label>
                <select
                  id="subjectSelect"
                  value={selectedSubject || ""}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                  disabled={!classData}
                >
                  <option value="">Select a subject</option>
                  {classData &&
                    classData.subjects
                      .filter((subject) => subject.teacherUid === currentUser.uid)
                      .map((subject) => (
                        <option key={subject.subject} value={subject.subject}>
                          {subject.subject}
                        </option>
                      ))}
                </select>
              </div>

              <div className="w-full bg-blue-100 p-5 rounded mb-2">
                  <label htmlFor="search" className="block text-gray-700">
                    Search:
                  </label>
                  <input
                    id="search"
                    type="text"
                    placeholder="Search by student name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                  />

              </div>
              
            </div>

              <div className="w-full bg-blue-100 p-5 rounded mb-2">
                <label htmlFor="clearanceFilter" className="block text-gray-700">
                  Filter by Clearance:
                </label>
                <select
                  id="clearanceFilter"
                  value={clearanceFilter}
                  onChange={handleClearanceFilterChange}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                >
                  <option value="all">All Students</option>
                  <option value="cleared">Cleared</option>
                  <option value="uncleared">Uncleared</option>
                </select>
              </div>

              
              <div className="mb-4 sm:flex justify-around gap-4">
                  <ReactToPrint
                    trigger={() => (
                      <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                        <button className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                          Print Table
                        </button>
                        
                      </div>
                    )}
                    content={() => componentRef.current}
                  />

                  <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                    <button
                      onClick={handleExportExcel}
                      className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Export to Excel
                    </button>

                  </div>
                </div>

            {selectedSubject && (
              <div ref={componentRef}>
                <div className="flex justify-center items-center text-center bg-blue-300 p-3 rounded mb-4">
                  <h2 className="text-2xl text-blue-950 font-bold">Students - {selectedSubject}</h2>
                </div>

                {getFilteredStudents().length === 0 ? (
                  <p>No students found.</p>
                ) : (
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                      <tr className="bg-blue-300">
                        <th className="py-3 px-2 border border-gray-400">
                          <input
                            type="checkbox"
                            checked={
                              selectedStudentIds.length ===
                              getFilteredStudents().length
                            }
                            onChange={handleSelectAllStudents}
                          />
                        </th>
                        <th className="py-3 px-2 border border-gray-400">Student ID</th>
                        <th className="py-3 px-2 border border-gray-400">Name</th>
                        <th className="py-3 px-2 border border-gray-400 text-center">
                          Cleared
                        </th>
                        <th className="py-3 px-2 border border-gray-400 text-center bg-[#fff2c1]">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {getFilteredStudents().map((student) => (
                        <tr key={student.uid} className="custom-row bg-blue-100 hover:bg-blue-200">
                          <td className="border border-gray-400 px-4 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={selectedStudentIds.includes(student.uid)}
                              onChange={() => handleSelectStudent(student.uid)}
                            />
                          </td>
                          <td className="border border-gray-400 px-4 py-2">
                            {student.studentId}
                          </td>
                          <td className="border border-gray-400 px-4 py-2">
                            {student.fullName}
                          </td>
                          <td className="border border-gray-400 px-4 py-2 text-center">
                            {student.clearance[selectedSubject] ? (
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
                          <td className="custom-cell border border-gray-400 px-4 py-2 text-center">
                            {!student.clearance[selectedSubject] && (
                              <button
                                onClick={() => handleClearStudent(student.uid)}
                                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                              >
                                Mark Cleared
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <div className="mt-4">
                  <button
                    onClick={handleClearSelectedStudents}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                    disabled={selectedStudentIds.length === 0}
                  >
                    Clear Selected Students
                  </button>
                </div>
              </div>
            )}


            {selectedSubject && students.length > 0 && (
              <div className="mt-8">
                <div className="flex justify-center items-center text-center bg-blue-300 p-3 rounded mb-4">
                  <h2 className="text-2xl text-blue-950 font-bold">Clearance Progress - {selectedSubject}</h2>
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
                    <Legend />
                  </PieChart>

                </div>
              
              </div>
            )}

          </div>
        </div>

      </div>
    </Sidebar>
  );
}

export default ClassDetails;