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
import Sidebar from "../components/Sidebar";

const InfoIcon = () => (
  <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const AlertIcon = () => (
  <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

function CreateClass() {
  const [educationLevel, setEducationLevel] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [sectionName, setSectionName] = useState("");
  const [adviser, setAdviser] = useState(null);
  const [department, setDepartment] = useState("");
  const [course, setCourse] = useState("");
  const [subjects, setSubjects] = useState([
    { subject: "", teacher: "", teacherUid: "" },
  ]);
  const [teachers, setTeachers] = useState([]);
  const [teacherOptions, setTeacherOptions] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudentOptions, setSelectedStudentOptions] = useState([]);
  const [filteredStudentOptions, setFilteredStudentOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

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

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? '#3B82F6' : '#E5E7EB',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
      '&:hover': {
        borderColor: '#3B82F6',
      },
      minHeight: '42px',
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#EBF5FF',
      borderRadius: '6px',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: '#1E40AF',
      fontSize: '14px',
      paddingLeft: '8px',
      paddingRight: '6px',
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: '#1E40AF',
      '&:hover': {
        backgroundColor: '#3B82F6',
        color: 'white',
      },
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#3B82F6' : state.isFocused ? '#EFF6FF' : 'white',
      color: state.isSelected ? 'white' : '#1F2937',
      '&:hover': {
        backgroundColor: state.isSelected ? '#3B82F6' : '#EFF6FF'
      }
    })
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingData(true);
      try {
        const teachersSnapshot = await getDocs(collection(db, "teachers"));
        const teachersData = teachersSnapshot.docs.map((doc) => ({
          uid: doc.data().uid || doc.id,
          name: doc.data().name,
          email: doc.data().email,
          ...doc.data(),
        }));
        setTeachers(teachersData);

        const options = teachersData.map(teacher => ({
          value: teacher.uid,
          label: `${teacher.name} ${teacher.email ? `(${teacher.email})` : ''}`
        }));
        setTeacherOptions(options);

        const studentsSnapshot = await getDocs(collection(db, "students"));
        const studentsData = studentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        setAllStudents(studentsData);
        
        console.log("Fetched teachers:", teachersData.length);
        console.log("Fetched students:", studentsData.length);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (gradeLevel && allStudents.length > 0) {
      const filtered = allStudents.filter(student => {
        const hasNoSection = !student.section || student.section === "";
        
        const isSameGrade = student.gradeLevel === gradeLevel;
        
        const isNotArchived = !student.archived;
        
        return hasNoSection && isSameGrade && isNotArchived;
      });

      const studentOptions = filtered.map(student => ({
        value: student.id,
        label: `${student.fullName || student.name}${student.studentId ? ` (ID: ${student.studentId})` : ''}${student.email ? ` - ${student.email}` : ''}`,
        gradeLevel: student.gradeLevel,
        studentId: student.studentId,
        email: student.email
      }));

      setFilteredStudentOptions(studentOptions);
      
      setSelectedStudentOptions([]);
      
      console.log(`Students in grade ${gradeLevel}:`, studentOptions.length);
    } else {
      setFilteredStudentOptions([]);
      setSelectedStudentOptions([]);
    }
  }, [gradeLevel, allStudents]);

  useEffect(() => {
    setGradeLevel("");
    setSectionName("");
    setAdviser(null);
    setDepartment("");
    setCourse("");
    setSelectedStudentOptions([]);
    setFilteredStudentOptions([]);
    
    if (educationLevel === "college") {
      setSubjects([]);
    } else {
      setSubjects([{ subject: "", teacher: "", teacherUid: "" }]);
    }
  }, [educationLevel]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const classDocRef = await addDoc(collection(db, "classes"), {
        educationLevel,
        gradeLevel,
        sectionName,
        adviser: educationLevel === "college" ? null : adviser?.label || null,
        adviserUid: educationLevel === "college" ? null : adviser?.value || null,
        department: educationLevel === "college" ? department : null,
        course: educationLevel === "college" ? course : null,
        subjects: educationLevel !== "college" ? subjects.map(s => ({
          subject: s.subject,
          teacher: s.teacher,
          teacherUid: s.teacherUid
        })) : [],
        studentCount: selectedStudentOptions.length,
        createdAt: new Date(),
        status: 'active'
      });

      const selectedStudentIds = selectedStudentOptions.map(
        (option) => option.value
      );

      const updatePromises = selectedStudentIds.map(async (studentId) => {
        const studentDocRef = doc(db, "students", studentId);

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
            if (subject.subject) {
              clearance[subject.subject] = false;
            }
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
          section: sectionName,
          department: educationLevel === "college" ? department : null,
          clearance,
        });
      });

      await Promise.all(updatePromises);
      navigate("/classes");
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Error creating class. Please try again.");
    } finally {
      setLoading(false);
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
    
    if (field === "teacherUid") {
      const selectedTeacher = teachers.find(t => t.uid === value.value);
      newSubjects[index] = {
        ...newSubjects[index],
        teacher: selectedTeacher?.name || "",
        teacherUid: value.value
      };
    } else {
      newSubjects[index][field] = value;
    }
    
    setSubjects(newSubjects);
  };

  const addSubject = () => {
    setSubjects([...subjects, { subject: "", teacher: "", teacherUid: "" }]);
  };

  const removeSubject = (index) => {
    const newSubjects = subjects.filter((_, i) => i !== index);
    setSubjects(newSubjects);
  };

  const EducationLevelCard = ({ level, title, description, icon }) => (
    <button
      type="button"
      onClick={() => {
        setEducationLevel(level);
      }}
      className={`p-6 rounded-xl border-2 transition-all ${
        educationLevel === level
          ? "border-blue-500 bg-blue-50 shadow-md transform scale-[1.02]"
          : "border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm"
      }`}
    >
      <div className="flex items-start space-x-4">
        <div className={`p-3 rounded-lg ${
          educationLevel === level ? "bg-blue-100" : "bg-gray-100"
        }`}>
          {icon}
        </div>
        <div className="text-left flex-1">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
        {educationLevel === level && (
          <div className="text-blue-500">
            <CheckIcon />
          </div>
        )}
      </div>
    </button>
  );

  if (isLoadingData) {
    return (
      <Sidebar>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading resources...</p>
          </div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {}
          <div className="mb-8">
            <button
              onClick={() => navigate("/classes")}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ChevronLeftIcon />
              Back to Classes
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Create New Class</h1>
            <p className="mt-2 text-gray-600">Set up a new class with students and subjects</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                  1
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Education Level</h2>
                <span className="text-red-500">*</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EducationLevelCard 
                  level="elementary"
                  title="Elementary"
                  description="Grades 1-6"
                  icon={<span className="text-2xl">🎒</span>}
                />
                <EducationLevelCard 
                  level="junior high school"
                  title="Junior High School"
                  description="Grades 7-10"
                  icon={<span className="text-2xl">📚</span>}
                />
                <EducationLevelCard 
                  level="senior high school"
                  title="Senior High School"
                  description="Grades 11-12"
                  icon={<span className="text-2xl">🎓</span>}
                />
                <EducationLevelCard 
                  level="college"
                  title="College"
                  description="Undergraduate programs"
                  icon={<span className="text-2xl">🏛️</span>}
                />
              </div>
            </div>

            {}
            {educationLevel && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                    2
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Grade Level <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    >
                      <option value="">Select grade level</option>
                      {getGradeLevels().map((level) => (
                        <option key={level} value={level}>
                          {educationLevel === "college" ? `${level} Year` : `Grade ${level}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Section Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={sectionName}
                      onChange={(e) => setSectionName(e.target.value)}
                      placeholder="e.g., Section A, Diamond, etc."
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>

                {}
                {educationLevel === "college" && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Department <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={department}
                          onChange={(e) => {
                            setDepartment(e.target.value);
                            setCourse("");
                          }}
                          required
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        >
                          <option value="">Select department</option>
                          {collegeDepartments.map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Course <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={course}
                          onChange={(e) => setCourse(e.target.value)}
                          required
                          disabled={!department}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                        >
                          <option value="">Select course</option>
                          {coursesByDepartment[department]?.map((courseOption) => (
                            <option key={courseOption} value={courseOption}>
                              {courseOption}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {}
                {educationLevel && educationLevel !== "college" && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="inline-flex items-center gap-2">
                        <UserIcon />
                        Class Adviser <span className="text-red-500">*</span>
                      </span>
                    </label>
                    <Select
                      value={adviser}
                      onChange={setAdviser}
                      options={teacherOptions}
                      styles={customSelectStyles}
                      placeholder="Search and select an adviser..."
                      isClearable
                      isSearchable
                      required
                      noOptionsMessage={() => "No teachers found"}
                      className="basic-single"
                      classNamePrefix="select"
                    />
                    {teachers.length === 0 && (
                      <p className="mt-2 text-sm text-amber-600 flex items-center gap-2">
                        <InfoIcon />
                        No teachers available. Please add teachers first.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {}
            {educationLevel && educationLevel !== "college" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                      3
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Subjects & Teachers</h2>
                    <span className="text-red-500">*</span>
                  </div>
                  <button
                    type="button"
                    onClick={addSubject}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <PlusIcon />
                    Add Subject
                  </button>
                </div>

                <div className="space-y-3">
                  {subjects.map((subject, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div className="md:col-span-5">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Subject Name
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., Mathematics, Science"
                            value={subject.subject}
                            onChange={(e) =>
                              handleSubjectChange(index, "subject", e.target.value)
                            }
                            required
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          />
                        </div>
                        <div className="md:col-span-6">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Teacher
                          </label>
                          <Select
                            value={subject.teacherUid ? {
                              value: subject.teacherUid,
                              label: subject.teacher || teacherOptions.find(t => t.value === subject.teacherUid)?.label
                            } : null}
                            onChange={(selected) =>
                              handleSubjectChange(index, "teacherUid", selected)
                            }
                            options={teacherOptions}
                            styles={customSelectStyles}
                            placeholder="Search and select a teacher..."
                            isClearable
                            isSearchable
                            required
                            noOptionsMessage={() => "No teachers found"}
                            className="basic-single"
                            classNamePrefix="select"
                          />
                        </div>
                        <div className="md:col-span-1 flex items-end">
                          {subjects.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSubject(index)}
                              className="w-full p-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                            >
                              <TrashIcon />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {subjects.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No subjects added yet. Click "Add Subject" to get started.
                  </div>
                )}
              </div>
            )}

            {}
            {educationLevel && gradeLevel && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                    {educationLevel === "college" ? "3" : "4"}
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    <span className="inline-flex items-center gap-2">
                      <UsersIcon />
                      Assign Students
                    </span>
                  </h2>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Students for {educationLevel === "college" ? `${gradeLevel} Year` : `Grade ${gradeLevel}`}
                    <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      {filteredStudentOptions.length} available
                    </span>
                  </label>
                  
                  {filteredStudentOptions.length > 0 ? (
                    <>
                      <Select
                        isMulti
                        value={selectedStudentOptions}
                        onChange={setSelectedStudentOptions}
                        options={filteredStudentOptions}
                        styles={customSelectStyles}
                        placeholder="Search and select students by name or ID..."
                        noOptionsMessage={() => "No students found"}
                        className="basic-multi-select"
                        classNamePrefix="select"
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        Only showing students in {educationLevel === "college" ? `${gradeLevel} Year` : `Grade ${gradeLevel}`} without a section assignment.
                      </p>
                    </>
                  ) : (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertIcon />
                        <div>
                          <p className="text-sm font-medium text-amber-800">
                            No available students
                          </p>
                          <p className="text-sm text-amber-700 mt-1">
                            There are no students in {educationLevel === "college" ? `${gradeLevel} Year` : `Grade ${gradeLevel}`} without a section assignment.
                            You can still create the class and add students later.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedStudentOptions.length > 0 && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-900">
                            {selectedStudentOptions.length} student{selectedStudentOptions.length !== 1 ? 's' : ''} selected
                          </p>
                          <p className="text-xs text-blue-700 mt-1">
                            These students will be assigned to {sectionName || 'this section'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedStudentOptions([])}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {}
            {educationLevel && !gradeLevel && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 font-semibold text-sm">
                    {educationLevel === "college" ? "3" : "4"}
                  </div>
                  <h2 className="text-lg font-semibold text-gray-400">Assign Students</h2>
                </div>
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Please select a grade level first to view available students.
                  </p>
                </div>
              </div>
            )}

            {}
            {educationLevel && gradeLevel && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Education Level:</span>
                    <span className="ml-2 font-medium text-gray-900 capitalize">{educationLevel}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Grade:</span>
                    <span className="ml-2 font-medium text-gray-900">
                      {educationLevel === "college" ? `${gradeLevel} Year` : `Grade ${gradeLevel}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Section:</span>
                    <span className="ml-2 font-medium text-gray-900">{sectionName || "Not set"}</span>
                  </div>
                  {educationLevel !== "college" && (
                    <div>
                      <span className="text-gray-600">Adviser:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {adviser?.label || "Not assigned"}
                      </span>
                    </div>
                  )}
                  {educationLevel === "college" && (
                    <>
                      <div>
                        <span className="text-gray-600">Department:</span>
                        <span className="ml-2 font-medium text-gray-900">{department || "Not set"}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Course:</span>
                        <span className="ml-2 font-medium text-gray-900">{course || "Not set"}</span>
                      </div>
                    </>
                  )}
                  <div>
                    <span className="text-gray-600">Students:</span>
                    <span className="ml-2 font-medium text-gray-900">{selectedStudentOptions.length}</span>
                  </div>
                  {educationLevel !== "college" && (
                    <div>
                      <span className="text-gray-600">Subjects:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {subjects.filter(s => s.subject).length}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {}
            {educationLevel && (
              <div className="flex items-center justify-between pt-6 border-t">
                <button
                  type="button"
                  onClick={() => navigate("/classes")}
                  className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Creating Class...
                    </>
                  ) : (
                    <>
                      <CheckIcon />
                      Create Class
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </Sidebar>
  );
}

export default CreateClass;