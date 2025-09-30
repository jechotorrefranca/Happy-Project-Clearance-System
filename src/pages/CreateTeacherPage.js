import React, { useState } from "react";
import { addDoc, collection, query, where, getDocs } from "firebase/firestore";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { db, auth, firebaseConfig } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
import Sidebar from "../components/Sidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChalkboardTeacher,
  faUser,
  faEnvelope,
  faLock,
  faGraduationCap,
  faCheckCircle,
  faExclamationTriangle,
  faInfoCircle,
  faSpinner,
  faEye,
  faEyeSlash,
  faUserPlus,
  faTimes,
  faUsers,
  faUpload,
  faFileCsv,
  faCloudUploadAlt,
  faFileDownload,
} from "@fortawesome/free-solid-svg-icons";

const secondaryApp = initializeApp(firebaseConfig, "SecondaryTeacher");
const secondaryAuth = getAuth(secondaryApp);

function CreateTeacherPage() {
  const [activeTab, setActiveTab] = useState("single");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    level: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [uploadResults, setUploadResults] = useState({ success: [], failed: [] });
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (!formData.level) newErrors.level = "Education level is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});
    setSuccessMessage("");

    const adminUser = auth.currentUser;

    try {
      const existingTeacherQuery = query(
        collection(db, "teachers"),
        where("email", "==", formData.email)
      );
      const existingTeacherSnapshot = await getDocs(existingTeacherQuery);

      if (!existingTeacherSnapshot.empty) {
        setErrors({ email: "A teacher with this email already exists!" });
        setLoading(false);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      await addDoc(collection(db, "users"), {
        uid: user.uid,
        email: formData.email,
        role: "faculty",
      });

      await addDoc(collection(db, "teachers"), {
        uid: user.uid,
        name: formData.name,
        email: formData.email,
        level: formData.level,
        role: "faculty",
        createdAt: new Date(),
        createdBy: adminUser?.uid || "system",
      });

      await signOut(secondaryAuth);

      setSuccessMessage("Teacher created successfully! Redirecting...");
      setTimeout(() => navigate("/teachers"), 2000);
    } catch (error) {
      console.error("Error creating teacher: ", error);
      if (error.code === 'auth/email-already-in-use') {
        setErrors({ email: "This email is already registered" });
      } else if (error.code === 'auth/weak-password') {
        setErrors({ password: "Password is too weak" });
      } else {
        setErrors({ general: "An error occurred. Please try again." });
      }
    } finally {
      setLoading(false);
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

    setLoading(true);
    setUploadResults({ success: [], failed: [] });

    const adminUser = auth.currentUser;

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        const teachers = result.data;
        setUploadProgress({ current: 0, total: teachers.length });

        const results = { success: [], failed: [] };

        for (let i = 0; i < teachers.length; i++) {
          const teacher = teachers[i];
          setUploadProgress({ current: i + 1, total: teachers.length });

          const {
            name,
            email,
            password,
            level,
          } = teacher;

          if (!name || !email || !password || !level) {
            results.failed.push({
              ...teacher,
              reason: "Missing required fields",
            });
            continue;
          }

          const existingTeacherQuery = query(
            collection(db, "teachers"),
            where("email", "==", email)
          );
          const existingTeacherSnapshot = await getDocs(existingTeacherQuery);

          if (!existingTeacherSnapshot.empty) {
            results.failed.push({
              ...teacher,
              reason: "Email already exists",
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

            await addDoc(collection(db, "users"), {
              uid: user.uid,
              email,
              role: "faculty",
            });

            await addDoc(collection(db, "teachers"), {
              uid: user.uid,
              name,
              email,
              level,
              role: "faculty",
              createdAt: new Date(),
              createdBy: adminUser?.uid || "system",
            });

            await signOut(secondaryAuth);

            results.success.push(teacher);
          } catch (error) {
            console.error("Error creating teacher: ", error);
            results.failed.push({
              ...teacher,
              reason: error.message || "Failed to create account",
            });
          }
        }

        setUploadResults(results);
        setLoading(false);
        
        if (results.success.length > 0 && results.failed.length === 0) {
          setSuccessMessage(`Successfully uploaded ${results.success.length} teachers! Redirecting...`);
          setTimeout(() => navigate("/teachers"), 3000);
        }
      },
    });
  };

  const downloadSampleCsv = () => {
    const sampleData = [
      {
        name: "John Smith",
        email: "john.smith@school.edu",
        password: "SecurePass123!",
        level: "juniorHighschool",
      },
      {
        name: "Jane Doe",
        email: "jane.doe@school.edu",
        password: "AnotherPass456!",
        level: "seniorHighschool",
      },
      {
        name: "Robert Johnson",
        email: "robert.j@school.edu",
        password: "TeacherPass789!",
        level: "elementary",
      },
    ];

    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "teacher_import_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Sidebar>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Add New Teacher</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Create teacher accounts individually or import multiple teachers via CSV
                </p>
              </div>
              <div className="hidden sm:block">
                <FontAwesomeIcon icon={faChalkboardTeacher} className="text-3xl text-blue-500" />
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
                Single Teacher
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
                {}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {}
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <FontAwesomeIcon icon={faUser} className="mr-2 text-gray-400" />
                      Full Name
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.name ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="e.g., John Smith"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-500">{errors.name}</p>
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
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.email ? "border-red-500" : "border-gray-300"
                      }`}
                      placeholder="e.g., teacher@school.edu"
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
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.password ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="Minimum 6 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                      </button>
                    </div>
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
                      name="level"
                      value={formData.level}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.level ? "border-red-500" : "border-gray-300"
                      }`}
                    >
                      <option value="">Select education level</option>
                      <option value="elementary">Elementary</option>
                      <option value="juniorHighschool">Junior High School</option>
                      <option value="seniorHighschool">Senior High School</option>
                      <option value="college">College</option>
                    </select>
                    {errors.level && (
                      <p className="mt-1 text-sm text-red-500">{errors.level}</p>
                    )}
                  </div>
                </div>

                {}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <FontAwesomeIcon icon={faInfoCircle} className="text-blue-400 mt-0.5 mr-3" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Quick Notes:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Teachers will use their email to log in</li>
                        <li>Teachers can be assigned as class advisers</li>
                        <li>Teachers can approve student clearances</li>
                        <li>Password must be at least 6 characters long</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {}
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("/teachers")}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {loading ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faUserPlus} className="mr-2" />
                        Create Teacher
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Import Teachers</h3>
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
                      <p className="text-sm font-medium text-gray-900">Fill in teacher data</p>
                      <p className="text-sm text-gray-500">Add your teachers' information to the CSV file</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      3
                    </span>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">Upload and import</p>
                      <p className="text-sm text-gray-500">Select your file and click import to add all teachers</p>
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

                    {loading && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Importing teachers...</span>
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
                              Successfully imported {uploadResults.success.length} teacher(s)
                            </p>
                          </div>
                        )}
                        {uploadResults.failed.length > 0 && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm font-medium text-red-800 mb-2">
                              <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" />
                              Failed to import {uploadResults.failed.length} teacher(s)
                            </p>
                            <ul className="text-xs text-red-700 space-y-1">
                              {uploadResults.failed.slice(0, 3).map((teacher, index) => (
                                <li key={index}>
                                  {teacher.name}: {teacher.reason}
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
                        disabled={loading}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {loading ? (
                          <>
                            <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faUpload} className="mr-2" />
                            Import Teachers
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
                      <li>Headers must be: name, email, password, level</li>
                      <li>Education levels: elementary, juniorHighschool, seniorHighschool, college</li>
                      <li>All fields are required</li>
                      <li>Emails must be unique</li>
                      <li>Password must be at least 6 characters long</li>
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

export default CreateTeacherPage;