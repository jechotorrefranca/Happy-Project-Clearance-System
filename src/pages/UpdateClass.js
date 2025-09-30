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

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faUserGraduate, 
  faChalkboardTeacher, 
  faBook, 
  faTrash, 
  faPlus,
  faSave,
  faArrowLeft,
  faExclamationTriangle,
  faSpinner
} from "@fortawesome/free-solid-svg-icons";

function UpdateClass() {
  const { classId } = useParams();
  const navigate = useNavigate();

  const [educationLevel, setEducationLevel] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [sectionName, setSectionName] = useState("");
  const [adviser, setAdviser] = useState(null);
  const [department, setDepartment] = useState("");
  const [course, setCourse] = useState("");
  const [subjects, setSubjects] = useState([]);
  
  const [teachers, setTeachers] = useState([]);
  const [teacherOptions, setTeacherOptions] = useState([]);
  const [selectedStudentOptions, setSelectedStudentOptions] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [filteredStudentOptions, setFilteredStudentOptions] = useState([]);
  const [originalSelectedStudentIds, setOriginalSelectedStudentIds] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchInitialData();
  }, [classId]);

  useEffect(() => {
    if (gradeLevel && allStudents.length > 0) {
      const filtered = allStudents.filter(student => {
        const isAvailable = !student.section || student.section === sectionName;
        const isSameGrade = student.gradeLevel === gradeLevel;
        return isAvailable && isSameGrade;
      });

      const studentOptions = filtered.map(student => ({
        value: student.id,
        label: `${student.fullName} ${student.studentId ? `(${student.studentId})` : ''}`,
        section: student.section,
        gradeLevel: student.gradeLevel
      }));

      setFilteredStudentOptions(studentOptions);
    }
  }, [gradeLevel, allStudents, sectionName]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchClassData(),
        fetchTeachers(),
        fetchStudents()
      ]);
    } catch (error) {
      console.error("Error fetching initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassData = async () => {
    try {
      const classDocRef = doc(db, "classes", classId);
      const classDocSnapshot = await getDoc(classDocRef);

      if (classDocSnapshot.exists()) {
        const classData = classDocSnapshot.data();
        setEducationLevel(classData.educationLevel);
        setGradeLevel(classData.gradeLevel);
        setSectionName(classData.sectionName);
        setDepartment(classData.department || "");
        setCourse(classData.course || "");
        setSubjects(classData.subjects || []);

        if (classData.adviser && classData.adviserUid) {
          setAdviser({
            value: classData.adviserUid,
            label: classData.adviser
          });
        }
      }
    } catch (error) {
      console.error("Error fetching class data:", error);
    }
  };

  const fetchTeachers = async () => {
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
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      const studentsSnapshot = await getDocs(collection(db, "students"));
      const studentsData = studentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setAllStudents(studentsData);

      const classDocRef = doc(db, "classes", classId);
      const classDocSnapshot = await getDoc(classDocRef);
      
      if (classDocSnapshot.exists()) {
        const classData = classDocSnapshot.data();
        const studentsInClass = studentsData.filter(
          student => student.section === classData.sectionName
        );
        
        const selectedOptions = studentsInClass.map(student => ({
          value: student.id,
          label: `${student.fullName} ${student.studentId ? `(${student.studentId})` : ''}`,
          section: student.section,
          gradeLevel: student.gradeLevel
        }));
        
        setSelectedStudentOptions(selectedOptions);
        setOriginalSelectedStudentIds(selectedOptions.map(s => s.value));
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!educationLevel) newErrors.educationLevel = "Education level is required";
    if (!gradeLevel) newErrors.gradeLevel = "Grade level is required";
    if (!sectionName) newErrors.sectionName = "Section name is required";
    
    if (educationLevel === "college") {
      if (!department) newErrors.department = "Department is required";
      if (!course) newErrors.course = "Course is required";
    } else {
      if (!adviser) newErrors.adviser = "Adviser is required";
      if (subjects.length === 0) newErrors.subjects = "At least one subject is required";
      
      subjects.forEach((subject, index) => {
        if (!subject.subject) {
          newErrors[`subject_${index}`] = "Subject name is required";
        }
        if (!subject.teacherUid) {
          newErrors[`teacher_${index}`] = "Teacher is required";
        }
      });
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const classDocRef = doc(db, "classes", classId);
      
      const updateData = {
        educationLevel,
        gradeLevel,
        sectionName,
        adviser: educationLevel === "college" ? null : adviser?.label || null,
        adviserUid: educationLevel === "college" ? null : adviser?.value || null,
        department: educationLevel === "college" ? department : null,
        course: educationLevel === "college" ? course : null,
        subjects: educationLevel !== "college" ? subjects : [],
      };

      await updateDoc(classDocRef, updateData);

      const currentSelectedStudentIds = selectedStudentOptions.map(
        (option) => option.value
      );

      const generateClearance = () => {
        const clearance = {};

        if (educationLevel === "college") {
          const collegeClearances = [
            "Guidance Office",
            "Office of The Dean",
            "Student Council",
            "Property Custodian",
            "College Library",
            "Office of the Registrar",
            "Office of the Finance Director"
          ];
          collegeClearances.forEach(item => clearance[item] = false);
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

      const studentUpdatePromises = [];
      
      for (const studentId of currentSelectedStudentIds) {
        if (!originalSelectedStudentIds.includes(studentId)) {
          const studentDocRef = doc(db, "students", studentId);
          studentUpdatePromises.push(
            updateDoc(studentDocRef, {
              section: sectionName,
              department: educationLevel === "college" ? department : null,
              clearance: generateClearance(),
            })
          );
        }
      }
      
      for (const studentId of originalSelectedStudentIds) {
        if (!currentSelectedStudentIds.includes(studentId)) {
          const studentDocRef = doc(db, "students", studentId);
          studentUpdatePromises.push(
            updateDoc(studentDocRef, {
              section: null,
              department: null,
              clearance: {},
            })
          );
        }
      }

      await Promise.all(studentUpdatePromises);

      navigate("/classes");
    } catch (error) {
      console.error("Error updating class:", error);
      alert("Error updating class. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
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
      alert("Error deleting class. Please try again.");
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
    
    const newErrors = { ...errors };
    delete newErrors[`subject_${index}`];
    delete newErrors[`teacher_${index}`];
    setErrors(newErrors);
  };

  const addSubject = () => {
    setSubjects([...subjects, { subject: "", teacher: "", teacherUid: "" }]);
  };

  const removeSubject = (index) => {
    const newSubjects = subjects.filter((_, i) => i !== index);
    setSubjects(newSubjects);
  };

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      borderColor: state.isFocused ? '#3B82F6' : '#D1D5DB',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
      '&:hover': {
        borderColor: '#3B82F6'
      }
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#3B82F6' : state.isFocused ? '#EFF6FF' : 'white',
      color: state.isSelected ? 'white' : '#1F2937',
      '&:hover': {
        backgroundColor: state.isSelected ? '#3B82F6' : '#EFF6FF'
      }
    })
  };

  if (loading) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-blue-500 mb-4" />
            <p className="text-gray-600">Loading class data...</p>
          </div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="max-w-6xl mx-auto p-6">
        {}
        <div className="mb-8">
          <button
            onClick={() => navigate("/classes")}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
            Back to Classes
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Update Class</h1>
          <p className="text-gray-600 mt-2">Modify class details and manage enrolled students</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <FontAwesomeIcon icon={faUserGraduate} className="mr-2 text-blue-500" />
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Education Level <span className="text-red-500">*</span>
                </label>
                <select
                  value={educationLevel}
                  onChange={(e) => {
                    setEducationLevel(e.target.value);
                    setGradeLevel("");
                    setErrors({ ...errors, educationLevel: "" });
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.educationLevel ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select education level</option>
                  <option value="elementary">Elementary</option>
                  <option value="junior high school">Junior High School</option>
                  <option value="senior high school">Senior High School</option>
                  <option value="college">College</option>
                </select>
                {errors.educationLevel && (
                  <p className="text-red-500 text-sm mt-1">{errors.educationLevel}</p>
                )}
              </div>

              {}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade Level <span className="text-red-500">*</span>
                </label>
                <select
                  value={gradeLevel}
                  onChange={(e) => {
                    setGradeLevel(e.target.value);
                    setErrors({ ...errors, gradeLevel: "" });
                  }}
                  disabled={!educationLevel}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.gradeLevel ? 'border-red-500' : 'border-gray-300'
                  } ${!educationLevel ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                >
                  <option value="">Select grade level</option>
                  {getGradeLevels().map((level) => (
                    <option key={level} value={level}>
                      {educationLevel === "college" ? `${level} Year` : `Grade ${level}`}
                    </option>
                  ))}
                </select>
                {errors.gradeLevel && (
                  <p className="text-red-500 text-sm mt-1">{errors.gradeLevel}</p>
                )}
              </div>

              {}
              <div className={educationLevel === "college" ? "" : "md:col-span-2"}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={sectionName}
                  onChange={(e) => {
                    setSectionName(e.target.value);
                    setErrors({ ...errors, sectionName: "" });
                  }}
                  placeholder="e.g., Section A, Rose, Diamond"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.sectionName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.sectionName && (
                  <p className="text-red-500 text-sm mt-1">{errors.sectionName}</p>
                )}
              </div>

              {}
              {educationLevel === "college" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => {
                        setDepartment(e.target.value);
                        setErrors({ ...errors, department: "" });
                      }}
                      placeholder="e.g., Computer Science"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors.department ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.department && (
                      <p className="text-red-500 text-sm mt-1">{errors.department}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Course <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={course}
                      onChange={(e) => {
                        setCourse(e.target.value);
                        setErrors({ ...errors, course: "" });
                      }}
                      placeholder="e.g., BSCS, BSIT"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors.course ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.course && (
                      <p className="text-red-500 text-sm mt-1">{errors.course}</p>
                    )}
                  </div>
                </>
              )}

              {}
              {educationLevel !== "college" && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class Adviser <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={adviser}
                    onChange={(selected) => {
                      setAdviser(selected);
                      setErrors({ ...errors, adviser: "" });
                    }}
                    options={teacherOptions}
                    placeholder="Search and select an adviser..."
                    isClearable
                    isSearchable
                    styles={customSelectStyles}
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                  {errors.adviser && (
                    <p className="text-red-500 text-sm mt-1">{errors.adviser}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {}
          {educationLevel !== "college" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <FontAwesomeIcon icon={faBook} className="mr-2 text-blue-500" />
                  Subjects
                </h2>
                <button
                  type="button"
                  onClick={addSubject}
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <FontAwesomeIcon icon={faPlus} className="mr-2" />
                  Add Subject
                </button>
              </div>

              {errors.subjects && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {errors.subjects}
                </div>
              )}

              <div className="space-y-4">
                {subjects.map((subject, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-5">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Subject Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Mathematics, Science"
                          value={subject.subject}
                          onChange={(e) =>
                            handleSubjectChange(index, "subject", e.target.value)
                          }
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            errors[`subject_${index}`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors[`subject_${index}`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`subject_${index}`]}</p>
                        )}
                      </div>
                      
                      <div className="md:col-span-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
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
                          placeholder="Search and select a teacher..."
                          isClearable
                          isSearchable
                          styles={customSelectStyles}
                          className="react-select-container"
                          classNamePrefix="react-select"
                        />
                        {errors[`teacher_${index}`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`teacher_${index}`]}</p>
                        )}
                      </div>
                      
                      <div className="md:col-span-1 flex items-end">
                        <button
                          type="button"
                          onClick={() => removeSubject(index)}
                          className="w-full px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {subjects.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No subjects added yet. Click "Add Subject" to get started.
                  </div>
                )}
              </div>
            </div>
          )}

          {}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
              <FontAwesomeIcon icon={faChalkboardTeacher} className="mr-2 text-blue-500" />
              Students
            </h2>
            
            {!gradeLevel ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Please select a grade level first to manage students</p>
              </div>
            ) : (
              <>
                <div className="mb-2">
                  <p className="text-sm text-gray-600">
                    Only students in {educationLevel === "college" ? `${gradeLevel} Year` : `Grade ${gradeLevel}`} are shown
                  </p>
                </div>
                <Select
                  isMulti
                  value={selectedStudentOptions}
                  onChange={setSelectedStudentOptions}
                  options={filteredStudentOptions}
                  placeholder="Search and select students..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                  styles={customSelectStyles}
                  noOptionsMessage={() => `No available students in ${educationLevel === "college" ? `${gradeLevel} Year` : `Grade ${gradeLevel}`}`}
                />
                <div className="mt-2 text-sm text-gray-600">
                  {selectedStudentOptions.length} student(s) selected
                </div>
              </>
            )}
          </div>

          {}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} className="mr-2" />
                  Save Changes
                </>
              )}
            </button>
            
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faTrash} className="mr-2" />
              Delete Class
            </button>
            
            <button
              type="button"
              onClick={() => navigate("/classes")}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>

        {}
        {deleteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex items-center mb-4 text-red-500">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-2xl mr-3" />
                <h3 className="text-xl font-bold text-gray-900">Delete Class?</h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this class? This action cannot be undone.
                All {selectedStudentOptions.length} student(s) will be removed from this class.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    setDeleteModalOpen(false);
                    await handleDelete();
                  }}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Sidebar>
  );
}

export default UpdateClass;