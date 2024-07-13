import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import Sidebar from "../components/Sidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faTimesCircle,
  faAngleDown,
  faAngleUp,
} from "@fortawesome/free-solid-svg-icons";
import "./table.css"

function StudentsMasterList() {
  const [students, setStudents] = useState([]);
  const [originalStudents, setOriginalStudents] = useState([]);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [educationLevelFilter, setEducationLevelFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [availableSections, setAvailableSections] = useState([]);
  const [availableEducationLevels, setAvailableEducationLevels] = useState([]);

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

        studentsData = studentsData.filter((student) => student.section);

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
      }    };

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

  return (
    <Sidebar>
      <div className="container mx-auto bg-blue-100 rounded pb-10 min-h-[90vh]">
        <div className="bg-blue-300 p-5 rounded flex justify-center items-center mb-10">
          <h2 className="text-3xl font-bold text-blue-950">Students Master List</h2>
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

            <div className="w-full bg-red-300 overflow-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-blue-300">
                    <th className="py-3 border border-gray-400">Student ID</th>
                    <th className="py-3 border border-gray-400">Name</th>
                    <th className="py-3 border border-gray-400">Email</th>
                    <th className="py-3 border border-gray-400">Section</th>
                    <th className="py-3 border border-gray-400">Grade Level</th>
                    <th className="py-3 border border-gray-400">Education Level</th>
                    <th className="py-3 border-b border-t border-gray-400 text-center bg-[#fff2c1]">
                      Completion (%)
                    </th>
                    <th className="py-3 border-b border-t border-r border-gray-400 text-center bg-[#fff2c1]"></th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <React.Fragment key={student.uid}>
                      <tr
                        key={student.uid}
                        onClick={() => handleStudentClick(student.uid)}
                        className="custom-row cursor-pointer bg-blue-100 hover:bg-blue-200"
                      >
                        <td className="border border-gray-400 px-4 py-2">{student.studentId}</td>
                        <td className="border border-gray-400 px-4 py-2">{student.fullName}</td>
                        <td className="border border-gray-400 px-4 py-2">{student.email}</td>
                        <td className="border border-gray-400 px-4 py-2">{student.section}</td>
                        <td className="border border-gray-400 px-4 py-2">{student.gradeLevel}</td>
                        <td className="border border-gray-400 px-4 py-2">{student.educationLevel}</td>
                        <td className="custom-cell border border-gray-400 px-4 py-2 text-center">
                          {student.completionPercentage}%
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
                        <tr className="bg-green-100">
                          <td colSpan={8} className="border px-4 py-2">
                            <div className="p-5">
                              <table className="min-w-full">
                                <thead>
                                  <tr className="bg-green-300">
                                    <th className="py-2 border border-gray-400">
                                      Subject/Office
                                    </th>
                                    <th className="py-2 border border-gray-400 text-center">
                                      Status
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {Object.entries(student.clearance)
                                    .sort(([subjectA], [subjectB]) =>
                                      subjectA.localeCompare(subjectB)
                                    )
                                    .map(([subject, isCleared]) => (
                                      <tr key={subject}>
                                        <td className="border border-gray-400 px-4 py-2">{subject}</td>
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
                          </td>
                        </tr>
                      )}
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

export default StudentsMasterList;
