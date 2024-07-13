import React, { useState } from "react";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
import Sidebar from "../components/Sidebar";
import { motion } from 'framer-motion';
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


function CreateStudent() {
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [csvFile, setCsvFile] = useState(null);
  const navigate = useNavigate();

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


  const handleSubmit = async (e) => {
    e.preventDefault();

    const existingStudentQuery = query(
      collection(db, "students"),
      where("studentId", "==", studentId)
    );
    const existingStudentSnapshot = await getDocs(existingStudentQuery);

    if (!existingStudentSnapshot.empty) {
      showWarnToast("Student ID already exists!");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
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
      });

      await addDoc(collection(db, "users"), {
        uid: user.uid,
        email: user.email,
        role: "student",
      });

      const auditLogsRef = collection(db, "auditLogs");
      await addDoc(auditLogsRef, {
        timestamp: new Date(),
        userId: user.uid,
        actionType: "create_student",
        email: email,
        details: {
          fullName: fullName,
          educationLevel: educationLevel,
          gradeLevel: gradeLevel,
        },
      });

      navigate("/students");
    } catch (error) {
      console.error("Error creating student: ", error);
      showFailedToast("Error creating student");
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
    setCsvFile(e.target.files[0]);
  };

  const handleCsvUpload = async () => {
    if (!csvFile) {
      showWarnToast("Please import a CSV file");
      return;
    }

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        const students = result.data;

        for (const student of students) {
          const {
            studentId,
            fullName,
            email,
            password,
            educationLevel,
            gradeLevel,
          } = student;

          const existingStudentQuery = query(
            collection(db, "students"),
            where("studentId", "==", studentId)
          );
          const existingStudentSnapshot = await getDocs(existingStudentQuery);

          if (!existingStudentSnapshot.empty) {
            showWarnToast(`Student ID ${studentId} already exists! Skipping this student.`)
            continue;
          }

          try {
            const userCredential = await createUserWithEmailAndPassword(
              auth,
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
            });

            await addDoc(collection(db, "users"), {
              uid: user.uid,
              email: user.email,
              role: "student",
            });

            const auditLogsRef = collection(db, "auditLogs");
            await addDoc(auditLogsRef, {
              timestamp: new Date(),
              userId: user.uid,
              actionType: "create_student",
              email: email,
              details: {
                fullName: fullName,
                educationLevel: educationLevel,
                gradeLevel: gradeLevel,
              },
            });
          } catch (error) {
            console.error("Error creating student: ", error);
          }
        }

        navigate("/students");
      },
    });
  };

  return (
    <Sidebar>
      <ToastContainer/>
      <div className="container mx-auto bg-blue-100 rounded pb-10 min-h-[90vh]">
        <div className="bg-blue-300 p-5 rounded flex justify-center items-center mb-10">
          <h2 className="text-3xl font-bold text-blue-950">Create Student</h2>
        </div>

        <div className="p-5">
          <div className="bg-white p-5 rounded-xl overflow-auto">

            <form onSubmit={handleSubmit} className="space-y-4">

            <div className="mb-4 sm:flex gap-4">
              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                <label className="block text-gray-700">Student ID:</label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>

              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                <label className="block text-gray-700">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>

            </div>

            <div className="mb-4 sm:flex gap-4">
              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                <label className="block text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>

              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                <label className="block text-gray-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>
              
            </div>

            <div className="mb-4 sm:flex gap-4">
              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                <label className="block text-gray-700">Education Level</label>
                <select
                  value={educationLevel}
                  onChange={handleEducationLevelChange}
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

            <div className="w-full flex justify-center">
              <div className="sm:w-[50%] w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                <motion.button
                  whileHover={{scale: 1.03}}
                  whileTap={{scale: 0.95}}                
                  type="submit"
                  className="bg-blue-500 text-white p-2 rounded hover:bg-blue-700 w-full"
                >
                  Create Student
                </motion.button>

              </div>

            </div>



            </form>

            <div className="border-b-4 border- border-blue-300 my-5"/>
            
              <div className="mt-6">
                <div className="flex justify-center items-center text-center bg-green-200 p-3 rounded mb-4">
                  <h2 className="text-2xl text-green-950 font-bold">Upload CSV</h2>

                </div>

                <div className="sm:flex justify-center items-center gap-4">
                  <input type="file" accept=".csv" onChange={handleCsvFileChange} className="cursor-pointer w-full rounded p-2 bg-green-300  sm:mb-0 mb-2 flex"/>

                  <motion.button
                    whileHover={{scale: 1.03}}
                    whileTap={{scale: 0.95}}                  
                    onClick={handleCsvUpload}
                    className="sm:w-[30%] w-full bg-green-500 text-white p-2 rounded hover:bg-green-700 "
                  >
                    Upload CSV
                  </motion.button>

                </div>
              </div>

          </div>
        </div>



      </div>
    </Sidebar>
  );
}

export default CreateStudent;
