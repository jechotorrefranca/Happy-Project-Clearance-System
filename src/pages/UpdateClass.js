import React, { useState, useEffect } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useNavigate, useParams } from "react-router-dom";
import Select from "react-select";

import Sidebar from "../components/Sidebar";
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faPlus } from "@fortawesome/free-solid-svg-icons";


function UpdateClass() {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [educationLevel, setEducationLevel] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [sectionName, setSectionName] = useState("");
  const [adviser, setAdviser] = useState("");
  const [department, setDepartment] = useState("");
  const [course, setCourse] = useState("");
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedStudentOptions, setSelectedStudentOptions] = useState([]);
  const [allStudentOptions, setAllStudentOptions] = useState([]);
  const [originalSelectedStudentIds, setOriginalSelectedStudentIds] = useState([]);

  useEffect(() => {
    const fetchClassData = async () => {
      try {
        const classDocRef = doc(db, "classes", classId);
        const classDocSnapshot = await getDoc(classDocRef);

        if (classDocSnapshot.exists()) {
          const classData = classDocSnapshot.data();
          setEducationLevel(classData.educationLevel);
          setGradeLevel(classData.gradeLevel);
          setSectionName(classData.sectionName);
          setAdviser(classData.adviser);
          setDepartment(classData.department || "");
          setCourse(classData.course || "");
          setSubjects(classData.subjects);

          const studentsSnapshot = await getDocs(collection(db, "students"));
          const studentsData = studentsSnapshot.docs.map((doc) => ({
            value: doc.id,
            label: doc.data().fullName,
            section: doc.data().section,
          }));

          const filteredStudents = studentsData.filter(
            (student) =>
              !student.section || student.section === classData.sectionName
          );

          setAllStudentOptions(filteredStudents);
          const selectedStudents = filteredStudents.filter(
            (student) => student.section === classData.sectionName
          );
          setSelectedStudentOptions(selectedStudents);
          setOriginalSelectedStudentIds(
            selectedStudents.map((student) => student.value)
          );
        }
      } catch (error) {
        console.error("Error fetching class data:", error);
      }
    };

    const fetchTeachers = async () => {
      const teachersSnapshot = await getDocs(collection(db, "teachers"));
      const teachersData = teachersSnapshot.docs.map((doc) => ({
        uid: doc.data().uid,
        ...doc.data(),
      }));
      setTeachers(teachersData);
    };

    fetchClassData();
    fetchTeachers();
  }, [classId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const selectedAdviser = teachers.find(
        (teacher) => teacher.name === adviser
      );
      const adviserUid = selectedAdviser ? selectedAdviser.uid : null;

      const classDocRef = doc(db, "classes", classId);
      await updateDoc(classDocRef, {
        educationLevel,
        gradeLevel,
        sectionName,
        adviser: educationLevel === "college" ? null : adviser,
        adviserUid: educationLevel === "college" ? null : adviserUid,
        department: educationLevel === "college" ? department : null,
        course: educationLevel === "college" ? course : null,
        subjects,
      });

      const currentSelectedStudentIds = selectedStudentOptions.map(
        (option) => option.value
      );

      const generateClearance = () => {
        const clearance = {};

        if (educationLevel === "college") {
          clearance["Guidance Office"] = false;
          clearance["Office of The Dean"] = false;
          clearance["Student Council"] = false;
          clearance["Property Custodian"] = false;
          clearance["College Library"] = false;
          clearance["Office of the Registrar"] = false;
          clearance["Office of the Finance Director"] = false;
        } else {
          subjects.forEach((subject) => {
            clearance[subject.subject] = false;
          });

          const additionalClearances = [
            "Librarian",
            "Character Renewal Office",
            "Finance",
            "Basic Education Registrar",
            "Class Adviser",
            "Director/Principal",
          ];

          additionalClearances.forEach((role) => {
            clearance[role] = false;
          });
        }
        return clearance;
      };

      const studentUpdatePromises = allStudentOptions.map(async (student) => {
        const studentDocRef = doc(db, "students", student.value);
        const studentDoc = await getDoc(studentDocRef);
        const currentStudentData = studentDoc.data();

        if (currentSelectedStudentIds.includes(student.value)) {
          if (student.section !== sectionName) {
            await updateDoc(studentDocRef, {
              section: sectionName,
              department: educationLevel === "college" ? department : null,
              clearance: generateClearance(),
            });
          } else {
            await updateDoc(studentDocRef, {
              section: sectionName,
              department: educationLevel === "college" ? department : null,
              clearance: currentStudentData.clearance || {},
            });
          }
        } else if (
          originalSelectedStudentIds.includes(student.value) &&
          student.section === sectionName
        ) {
          await updateDoc(studentDocRef, {
            section: null,
            department: null,
            clearance: {},
          });
        }
      });

      await Promise.all(studentUpdatePromises);

      navigate("/classes");
    } catch (error) {
      console.error("Error updating class:", error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this class?")) {
      try {
        const classDocRef = doc(db, "classes", classId);

        const resetStudentPromises = selectedStudentOptions.map((student) => {
          const studentDocRef = doc(db, "students", student.value);
          return updateDoc(studentDocRef, {
            section: null,
            department: null,
            clearance: {},
          });
        });

        await Promise.all(resetStudentPromises);
        await deleteDoc(classDocRef);

        navigate("/classes");
      } catch (error) {
        console.error("Error deleting class:", error);
      }
    }
  };

  const getGradeLevels = () => {
    switch (educationLevel) {
      case "elementary":
        return ["1", "2", "3", "4", "5", "6"];
      case "junior high school":
        return ["7", "8", "9", "10"];
      case "senior high school":
        return ["11", "12"];
      case "college":
        return ["Freshman", "Sophomore", "Junior", "Senior"];
      default:
        return [];
    }
  };

  const handleSubjectChange = (index, field, value) => {
    const newSubjects = [...subjects];
    newSubjects[index][field] = value;
    setSubjects(newSubjects);
  };

  const addSubject = () => {
    setSubjects([...subjects, { subject: "", teacher: "", teacherUid: "" }]);
  };

  const removeSubject = (index) => {
    const newSubjects = subjects.filter((_, i) => i !== index);
    setSubjects(newSubjects);
  };

  const handleTeacherChange = (index, value) => {
    const selectedTeacher = teachers.find((teacher) => teacher.uid === value);
    const newSubjects = [...subjects];
    newSubjects[index].teacher = selectedTeacher.name;
    newSubjects[index].teacherUid = selectedTeacher.uid;
    setSubjects(newSubjects);
  };

  return (
    <Sidebar>

      <div className="container mx-auto bg-blue-100 rounded pb-10 min-h-[90vh]">
        <div className="bg-blue-300 p-5 rounded flex justify-center items-center mb-10">
          <h2 className="text-3xl font-bold text-blue-950">Update Class</h2>
        </div>

        <div className="p-5">
          <div className="bg-white p-5 rounded-xl overflow-auto">
            <form onSubmit={handleSubmit} className="space-y-4">

              <div className="sm:flex justify-around gap-4">

                <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                  <label className="block text-gray-700">Education Level</label>
                  <select
                    value={educationLevel}
                    onChange={(e) => {
                      setEducationLevel(e.target.value);
                      setGradeLevel("");
                    }}
                    required
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                  >
                    <option value="" disabled>
                      Select education level
                    </option>
                    <option value="elementary">Elementary</option>
                    <option value="junior high school">Junior High School</option>
                    <option value="senior high school">Senior High School</option>
                    <option value="college">College</option>
                  </select>
                </div>

                <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                  <label className="block text-gray-700">Grade Level</label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                    disabled={!educationLevel}
                  >
                    <option value="" disabled>
                      Select grade level
                    </option>
                    {getGradeLevels().map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              <div className="sm:flex justify-around gap-4">
                <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                  <label className="block text-gray-700">Section Name</label>
                  <input
                    type="text"
                    value={sectionName}
                    onChange={(e) => setSectionName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                  />
                </div>

                {educationLevel === "college" && (
                  <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                    <label className="block text-gray-700">Department</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      required
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                    />
                  </div>
                )}

                {educationLevel === "college" && (
                  <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                    <label className="block text-gray-700">Course</label>
                    <input
                      type="text"
                      value={course}
                      onChange={(e) => setCourse(e.target.value)}
                      required
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                    />
                  </div>
                )}

                {educationLevel !== "college" && (
                  <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                    <label className="block text-gray-700">Adviser</label>
                    <select
                      value={adviser}
                      onChange={(e) => setAdviser(e.target.value)}
                      required
                      className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                    >
                      <option value="" disabled>
                        Select an adviser
                      </option>
                      {teachers.map((teacher) => (
                        <option key={teacher.uid} value={teacher.name}>
                          {teacher.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

              </div>

              <div className="sm:flex justify-around gap-4">

              </div>



              {educationLevel !== "college" && (
                <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                  <label className="block text-gray-700">Subjects</label>
                  {subjects.map((subject, index) => (
                    <div key={index} className="flex space-x-2 mb-2">
                      <input
                        type="text"
                        placeholder="Subject Name"
                        value={subject.subject}
                        onChange={(e) =>
                          handleSubjectChange(index, "subject", e.target.value)
                        }
                        required
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                      />
                      <select
                        value={subject.teacherUid}
                        onChange={(e) => handleTeacherChange(index, e.target.value)}
                        required
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                      >
                        <option value="" disabled>
                          Select a teacher
                        </option>
                        {teachers.map((teacher) => (
                          <option key={teacher.uid} value={teacher.uid}>
                            {teacher.name}
                          </option>
                        ))}
                      </select>

                      <motion.button
                        whileHover={{scale: 1.03}}
                        whileTap={{scale: 0.95}}                        
                        type="button"
                        onClick={() => removeSubject(index)}
                        className="bg-red-500 text-white p-2 sm:rounded rounded-full hover:bg-red-700 flex items-center justify-center sm:min-w-min min-w-[2.5rem] min-h-[2.5rem]"
                      >
                        <span className="hidden sm:inline">Remove</span>
                        <FontAwesomeIcon icon={faXmark} className="sm:hidden"/>
                      </motion.button>
                    </div>

                  ))}

                  <div className="flex justify-center mt-5">
                    <motion.button
                      whileHover={{scale: 1.03}}
                      whileTap={{scale: 0.95}}
                      type="button"
                      onClick={addSubject}
                      className="bg-green-500 text-white p-2 sm:rounded rounded-full hover:bg-green-700 flex items-center justify-center sm:min-w-min min-w-[2.5rem] min-h-[2.5rem]"
                    >
                      <span className="hidden sm:inline">Add Subject</span>
                      <FontAwesomeIcon icon={faPlus} className="sm:hidden"/>
                    </motion.button>

                  </div>
                </div>
              )}

              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                <label className="block text-gray-700 mb-2">Students</label>
                <Select
                  isMulti
                  value={selectedStudentOptions}
                  onChange={setSelectedStudentOptions}
                  options={allStudentOptions}
                  className="basic-multi-select"
                  classNamePrefix="select"
                />
              </div> 

              <div className="sm:flex gap-4">
                <motion.button
                whileHover={{scale: 1.03}}
                whileTap={{scale: 0.95}}                           
                  type="submit"
                  className="bg-blue-500 text-white p-2 rounded hover:bg-blue-700 w-full mb-2 sm:mb-0"
                >
                  Update Class
                </motion.button>

                <motion.button
                whileHover={{scale: 1.03}}
                whileTap={{scale: 0.95}}                            
                  type="button"
                  onClick={handleDelete}
                  className="bg-red-500 text-white p-2 rounded hover:bg-red-700 w-full"
                >
                  Delete Class
                </motion.button>
              </div>

            </form>

          </div>
        </div>


      </div>
    </Sidebar>
  );
}

export default UpdateClass;
