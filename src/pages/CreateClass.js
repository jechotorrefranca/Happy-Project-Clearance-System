import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import { motion } from 'framer-motion';
import Sidebar from "../components/Sidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faPlus } from "@fortawesome/free-solid-svg-icons";

function CreateClass() {
  const [educationLevel, setEducationLevel] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [sectionName, setSectionName] = useState("");
  const [adviser, setAdviser] = useState("");
  const [department, setDepartment] = useState("");
  const [course, setCourse] = useState("");
  const [subjects, setSubjects] = useState([
    { subject: "", teacher: "", teacherUid: "" },
  ]);
  
  const [teachers, setTeachers] = useState([]);
  const [selectedStudentOptions, setSelectedStudentOptions] = useState([]);
  const [allStudentOptions, setAllStudentOptions] = useState([]);

  const navigate = useNavigate();

  const collegeDepartments = [
    "College of Health Sciences",
    "College of Business Administration",
    "College of Computer Studies",
    "College of Accountancy",
    "College of Education",
    "College of Arts and Sciences",
    "College of Hospitality Management and Tourism",
    "College of Maritime Education",
    "School of Mechanical Engineering",
  ];

  const coursesByDepartment = {
    "College of Health Sciences": ["BS Health Sciences"],
    "College of Business Administration": [
      "BS Business Administration Major in Human Resource Development",
      "BS Business Administration Major in Management",
      "BS Business Administration Major in Financial Management",
      "BS Business Administration Major in Operations Management",
      "BS Business Administration Major in Marketing Management",
    ],
    "College of Computer Studies": [
      "BS Computer Science",
      "BS Information Technology",
      "BS Computer Engineering",
    ],
    "College of Accountancy": [
      "BS Accountancy (5 years)",
      "BS in Accounting Information System",
    ],
    "College of Education": [
      "Bachelor of Elementary Education",
      "Bachelor of Secondary Education - Major in Mathematics",
      "Bachelor of Secondary Education - Major in English",
      "Bachelor of Secondary Education - Major in Biology",
    ],
    "College of Arts and Sciences": [
      "Bachelor of Arts in Psychology",
      "Bachelor of Arts in Political Science",
    ],
    "College of Hospitality Management and Tourism": [
      "BS Hotel and Restaurant Management",
      "BS Tourism",
    ],
    "College of Maritime Education": [
      "BS Marine Transportation",
      "BS Marine Engineering",
    ],
    "School of Mechanical Engineering": ["BS Mechanical Engineering"],
  };

  useEffect(() => {
    const fetchTeachers = async () => {
      const teachersSnapshot = await getDocs(collection(db, "teachers"));
      const teachersData = teachersSnapshot.docs.map((doc) => ({
        uid: doc.data().uid,
        ...doc.data(),
      }));
      setTeachers(teachersData);
    };

    const fetchStudents = async () => {
      const studentsSnapshot = await getDocs(collection(db, "students"));
      const studentsData = studentsSnapshot.docs
        .map((doc) => ({
          value: doc.id,
          label: doc.data().fullName,
          section: doc.data().section,
        }))
        .filter((student) => !student.section);
      setAllStudentOptions(studentsData);
    };

    fetchTeachers();
    fetchStudents();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const selectedAdviser = teachers.find(
        (teacher) => teacher.name === adviser
      );
      const adviserUid = selectedAdviser ? selectedAdviser.uid : null;

      const classDocRef = await addDoc(collection(db, "classes"), {
        educationLevel,
        gradeLevel,
        sectionName,
        adviser: educationLevel === "college" ? null : adviser,
        adviserUid: educationLevel === "college" ? null : adviserUid,
        department: educationLevel === "college" ? department : null,
        course: educationLevel === "college" ? course : null,
        subjects,
      });

      const selectedStudentIds = selectedStudentOptions.map(
        (option) => option.value
      );

      const updatePromises = selectedStudentIds.map(async (studentId) => {
        const studentDocRef = doc(db, "students", studentId);

        await updateDoc(studentDocRef, {
          section: sectionName,
          department: educationLevel === "college" ? department : null,
        });

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

        await updateDoc(studentDocRef, {
          clearance,
        });
      });

      await Promise.all(updatePromises);

      navigate("/classes");
    } catch (error) {
      console.error("Error adding document: ", error);
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
          <h2 className="text-3xl font-bold text-blue-950">Create Class</h2>
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

              <div className="sm:flex gap-4 justify-around">
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
                  <>
                    <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                      <label className="block text-gray-700">Department</label>
                      <select
                        value={department}
                        onChange={(e) => {
                          setDepartment(e.target.value);
                          setCourse("");
                        }}
                        required
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                      >
                        <option value="">Select Department</option>
                        {collegeDepartments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                      <label className="block text-gray-700">Course</label>
                      <select
                        value={course}
                        onChange={(e) => setCourse(e.target.value)}
                        required
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                      >
                        <option value="">Select Course</option>
                        {coursesByDepartment[department]?.map((courseOption) => (
                          <option key={courseOption} value={courseOption}>
                            {courseOption}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
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

              <div className="flex justify-center">
                <motion.button
                  whileHover={{scale: 1.03}}
                  whileTap={{scale: 0.95}}                  
                  type="submit"
                  className="bg-blue-500 text-white p-2 rounded hover:bg-blue-700"
                >
                  Create Class
                </motion.button>

              </div>

            </form>

          </div>
        </div>


        
      </div>
    </Sidebar>
  );
}

export default CreateClass;
