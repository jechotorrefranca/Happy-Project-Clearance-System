import React, { useState } from "react";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
import Sidebar from "../components/Sidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faIdCard,
  faEnvelope,
  faLock,
  faGraduationCap,
  faLayerGroup,
  faUpload,
  faFileCsv,
  faCheckCircle,
  faExclamationTriangle,
  faInfoCircle,
  faDownload,
  faSpinner,
  faTimes,
  faEye,
  faEyeSlash,
  faUserPlus,
  faUsers,
  faCloudUploadAlt,
  faCheck,
  faFileDownload,
} from "@fortawesome/free-solid-svg-icons";

import { firebaseConfig } from "../firebaseConfig";

const secondaryApp = initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

function CreateStudent() {
  const [activeTab, setActiveTab] = useState("single");
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [educationLevel, setEducationLevel] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [uploadResults, setUploadResults] = useState({ success: [], failed: [] });
  const navigate = useNavigate();

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, text: "", color: "" };
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;

    const strengthLevels = [
      { strength: 0, text: "Too weak", color: "text-red-500" },
      { strength: 1, text: "Weak", color: "text-orange-500" },
      { strength: 2, text: "Fair", color: "text-yellow-500" },
      { strength: 3, text: "Good", color: "text-blue-500" },
      { strength: 4, text: "Strong", color: "text-green-500" },
    ];

    return strengthLevels[strength];
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!fullName.trim()) newErrors.fullName = "Full name is required";
    if (!studentId.trim()) newErrors.studentId = "Student ID is required";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Email is invalid";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (!educationLevel) newErrors.educationLevel = "Education level is required";
    if (!gradeLevel) newErrors.gradeLevel = "Grade level is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setUploading(true);
    setErrors({});
    setSuccessMessage("");

    const adminUser = auth.currentUser;

    try {
      const existingStudentQuery = query(
        collection(db, "students"),
        where("studentId", "==", studentId)
      );
      const existingStudentSnapshot = await getDocs(existingStudentQuery);

      if (!existingStudentSnapshot.empty) {
        setErrors({ studentId: "This Student ID already exists!" });
        setUploading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        password
      );
      const user = userCredential.user;

      await addDoc(collection(db, "students"), {
        uid: user.uid,
        studentId: studentId,
        fullName,
        email,
        educationLevel,
        gradeLevel,
        createdAt: new Date(),
      });

      await addDoc(collection(db, "users"), {
        uid: user.uid,
        email: user.email,
        role: "student",
      });

      await addDoc(collection(db, "auditLogs"), {
        timestamp: new Date(),
        userId: user.uid,
        actionType: "create_student",
        createdBy: adminUser?.uid || "system",
        createdByEmail: adminUser?.email || "system",
        email: email,
        details: {
          fullName: fullName,
          educationLevel: educationLevel,
          gradeLevel: gradeLevel,
        },
      });

      await signOut(secondaryAuth);

      setSuccessMessage("Student created successfully! Redirecting...");
      
      setTimeout(() => {
        navigate("/student-master-list");
      }, 2000);
      
    } catch (error) {
      console.error("Error creating student: ", error);
      if (error.code === 'auth/email-already-in-use') {
        setErrors({ email: "This email is already registered" });
      } else if (error.code === 'auth/weak-password') {
        setErrors({ password: "Password is too weak" });
      } else {
        setErrors({ general: "An error occurred. Please try again." });
      }
    } finally {
      setUploading(false);
    }
  };

  const handleEducationLevelChange = (e) => {
    setEducationLevel(e.target.value);
    setGradeLevel("");
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

  const handleCsvFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCsvFile(file);
      
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        preview: 5,
        complete: (result) => {
          setCsvData(result.data);
        },
      });
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) {
      setErrors({ csv: "Please select a CSV file" });
      return;
    }

    setUploading(true);
    setUploadResults({ success: [], failed: [] });

    const adminUser = auth.currentUser;

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        const students = result.data;
        setUploadProgress({ current: 0, total: students.length });

        const results = { success: [], failed: [] };

        for (let i = 0; i < students.length; i++) {
          const student = students[i];
          setUploadProgress({ current: i + 1, total: students.length });

          const {
            studentId,
            fullName,
            email,
            password,
            educationLevel,
            gradeLevel,
          } = student;

          if (!studentId || !fullName || !email || !password || !educationLevel || !gradeLevel) {
            results.failed.push({
              ...student,
              reason: "Missing required fields",
            });
            continue;
          }

          const existingStudentQuery = query(
            collection(db, "students"),
            where("studentId", "==", studentId)
          );
          const existingStudentSnapshot = await getDocs(existingStudentQuery);

          if (!existingStudentSnapshot.empty) {
            results.failed.push({
              ...student,
              reason: "Student ID already exists",
            });
            continue;
          }

          try {
            const userCredential = await createUserWithEmailAndPassword(
              secondaryAuth,
              email,
              password
            );
            const user = userCredential.user;

            await addDoc(collection(db, "students"), {
              uid: user.uid,
              studentId: studentId,
              fullName,
              email,
              educationLevel,
              gradeLevel,
              createdAt: new Date(),
            });

            await addDoc(collection(db, "users"), {
              uid: user.uid,
              email: user.email,
              role: "student",
            });

            await addDoc(collection(db, "auditLogs"), {
              timestamp: new Date(),
              userId: user.uid,
              actionType: "create_student_bulk",
              createdBy: adminUser?.uid || "system",
              createdByEmail: adminUser?.email || "system",
              email: email,
              details: {
                fullName: fullName,
                educationLevel: educationLevel,
                gradeLevel: gradeLevel,
              },
            });

            await signOut(secondaryAuth);

            results.success.push(student);
          } catch (error) {
            console.error("Error creating student: ", error);
            results.failed.push({
              ...student,
              reason: error.message || "Failed to create account",
            });
          }
        }

        setUploadResults(results);
        setUploading(false);
        
        if (results.success.length > 0 && results.failed.length === 0) {
          setSuccessMessage(`Successfully uploaded ${results.success.length} students! Redirecting...`);
          setTimeout(() => navigate("/student-master-list"), 3000);
        }
      },
    });
  };

  const downloadSampleCsv = () => {
    const sampleData = [
      {
        studentId: "2024001",
        fullName: "John Doe",
        email: "john.doe@example.com",
        password: "SecurePass123!",
        educationLevel: "junior high school",
        gradeLevel: "7",
      },
      {
        studentId: "2024002",
        fullName: "Jane Smith",
        email: "jane.smith@example.com",
        password: "AnotherPass456!",
        educationLevel: "senior high school",
        gradeLevel: "11",
      },
    ];

    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_import_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const passwordStrength = getPasswordStrength(password);

  return (
    <Sidebar>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Add New Students</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Create student accounts individually or import multiple students via CSV
                </p>
              </div>
              <div className="hidden sm:block">
                <FontAwesomeIcon icon={faUserPlus} className="text-3xl text-blue-500" />
              </div>
            </div>
          </div>

          {}
          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 mr-3" />
              <span className="text-green-800">{successMessage}</span>
            </div>
          )}

          {}
          {errors.general && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 mr-3" />
              <span className="text-red-800">{errors.general}</span>
            </div>
          )}

          {}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("single")}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === "single"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <FontAwesomeIcon icon={faUser} className="mr-2" />
                Single Student
              </button>
              <button
                onClick={() => setActiveTab("bulk")}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === "bulk"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <FontAwesomeIcon icon={faUsers} className="mr-2" />
                Bulk Import
              </button>
            </div>
          </div>

          {}
          {activeTab === "single" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {}
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <FontAwesomeIcon icon={faIdCard} className="mr-2 text-gray-400" />
                      Student ID
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.studentId ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="e.g., 2024001"
                    />
                    {errors.studentId && (
                      <p className="mt-1 text-sm text-red-500">{errors.studentId}</p>
                    )}
                  </div>

                  {}
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <FontAwesomeIcon icon={faUser} className="mr-2 text-gray-400" />
                      Full Name
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.fullName ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="e.g., John Doe"
                    />
                    {errors.fullName && (
                      <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>
                    )}
                  </div>

                  {}
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <FontAwesomeIcon icon={faEnvelope} className="mr-2 text-gray-400" />
                      Email Address
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.email ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="e.g., john.doe@example.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>

                  {}
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <FontAwesomeIcon icon={faLock} className="mr-2 text-gray-400" />
                      Password
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                          errors.password ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="Enter secure password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                      </button>
                    </div>
                    {password && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Password strength:</span>
                          <span className={`text-xs font-medium ${passwordStrength.color}`}>
                            {passwordStrength.text}
                          </span>
                        </div>
                        <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              passwordStrength.strength === 4 ? "bg-green-500" :
                              passwordStrength.strength === 3 ? "bg-blue-500" :
                              passwordStrength.strength === 2 ? "bg-yellow-500" :
                              passwordStrength.strength === 1 ? "bg-orange-500" :
                              "bg-red-500"
                            }`}
                            style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                    )}
                  </div>

                  {}
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <FontAwesomeIcon icon={faGraduationCap} className="mr-2 text-gray-400" />
                      Education Level
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      value={educationLevel}
                      onChange={handleEducationLevelChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.educationLevel ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select education level</option>
                      <option value="elementary">Elementary</option>
                      <option value="junior high school">Junior High School</option>
                      <option value="senior high school">Senior High School</option>
                      <option value="college">College</option>
                    </select>
                    {errors.educationLevel && (
                      <p className="mt-1 text-sm text-red-500">{errors.educationLevel}</p>
                    )}
                  </div>

                  {}
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <FontAwesomeIcon icon={faLayerGroup} className="mr-2 text-gray-400" />
                      Grade Level
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value)}
                      disabled={!educationLevel}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.gradeLevel ? "border-red-500" : "border-gray-300"
                      } ${!educationLevel ? "bg-gray-50 cursor-not-allowed" : ""}`}
                    >
                      <option value="">
                        {educationLevel ? "Select grade level" : "Select education level first"}
                      </option>
                      {getGradeLevels().map((level) => (
                        <option key={level} value={level}>
                          {educationLevel === "college" ? level : `Grade ${level}`}
                        </option>
                      ))}
                    </select>
                    {errors.gradeLevel && (
                      <p className="mt-1 text-sm text-red-500">{errors.gradeLevel}</p>
                    )}
                  </div>
                </div>

                {}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <FontAwesomeIcon icon={faInfoCircle} className="text-blue-400 mt-0.5 mr-3" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Important Notes:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Student ID must be unique across the system</li>
                        <li>Email address will be used for student login</li>
                        <li>Password must be at least 6 characters long</li>
                        <li>Students can be assigned to sections after creation</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => navigate("/student-master-list")}
                    className="mr-3 px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {uploading ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                        Create Student
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {}
          {activeTab === "bulk" && (
            <div className="space-y-6">
              {}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Import Students</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      1
                    </span>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">Download the template</p>
                      <p className="text-sm text-gray-500">Get our CSV template with the correct format</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      2
                    </span>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">Fill in student data</p>
                      <p className="text-sm text-gray-500">Add your students' information to the CSV file</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      3
                    </span>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">Upload and import</p>
                      <p className="text-sm text-gray-500">Select your file and click import to add all students</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={downloadSampleCsv}
                  className="mt-6 w-full px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center"
                >
                  <FontAwesomeIcon icon={faFileDownload} className="mr-2" />
                  Download CSV Template
                </button>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload CSV File</h3>
                
                {!csvFile ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                    <div className="text-center">
                      <FontAwesomeIcon icon={faCloudUploadAlt} className="text-4xl text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-2">Drag and drop your CSV file here, or</p>
                      <label className="cursor-pointer">
                        <span className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors inline-block">
                          Browse Files
                        </span>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleCsvFileChange}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-gray-500 mt-2">CSV files only, max 5MB</p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faFileCsv} className="text-green-500 mr-3" />
                          <div>
                            <p className="font-medium text-gray-900">{csvFile.name}</p>
                            <p className="text-sm text-gray-500">
                              {(csvFile.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setCsvFile(null);
                            setCsvData([]);
                            setUploadResults({ success: [], failed: [] });
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </div>
                    </div>

                    {csvData.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Preview (first 5 rows):</p>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                {Object.keys(csvData[0]).map((key) => (
                                  <th key={key} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                    {key}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {csvData.map((row, index) => (
                                <tr key={index}>
                                  {Object.values(row).map((value, i) => (
                                    <td key={i} className="px-3 py-2 text-gray-900">
                                      {value}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {uploading && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Importing students...</span>
                          <span className="text-gray-900 font-medium">
                            {uploadProgress.current} / {uploadProgress.total}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${
                                uploadProgress.total > 0
                                  ? (uploadProgress.current / uploadProgress.total) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {(uploadResults.success.length > 0 || uploadResults.failed.length > 0) && (
                      <div className="space-y-3 mb-4">
                        {uploadResults.success.length > 0 && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-sm font-medium text-green-800">
                              <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                              Successfully imported {uploadResults.success.length} student(s)
                            </p>
                          </div>
                        )}
                        {uploadResults.failed.length > 0 && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm font-medium text-red-800 mb-2">
                              <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                              Failed to import {uploadResults.failed.length} student(s)
                            </p>
                            <ul className="text-xs text-red-700 space-y-1">
                              {uploadResults.failed.slice(0, 3).map((student, index) => (
                                <li key={index}>
                                  {student.fullName || student.studentId}: {student.reason}
                                </li>
                              ))}
                              {uploadResults.failed.length > 3 && (
                                <li>...and {uploadResults.failed.length - 3} more</li>
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => {
                          setCsvFile(null);
                          setCsvData([]);
                          setUploadResults({ success: [], failed: [] });
                        }}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Clear
                      </button>
                      <button
                        onClick={handleCsvUpload}
                        disabled={uploading}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {uploading ? (
                          <>
                            <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faUpload} className="mr-2" />
                            Import Students
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {errors.csv && (
                  <p className="mt-2 text-sm text-red-500">{errors.csv}</p>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-400 mt-0.5 mr-3" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium mb-1">CSV Format Requirements:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Headers must be: studentId, fullName, email, password, educationLevel, gradeLevel</li>
                      <li>Education levels: elementary, junior high school, senior high school, college</li>
                      <li>Grade levels must match the education level (e.g., 1-6 for elementary)</li>
                      <li>All fields are required for each student</li>
                      <li>Student IDs and emails must be unique</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Sidebar>
  );
}

export default CreateStudent;