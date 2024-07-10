import React, { useState } from "react";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Papa from "papaparse";
import Sidebar from "../components/Sidebar";

function CreateStudent() {
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [csvFile, setCsvFile] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const existingStudentQuery = query(
      collection(db, "students"),
      where("studentId", "==", studentId)
    );
    const existingStudentSnapshot = await getDocs(existingStudentQuery);

    if (!existingStudentSnapshot.empty) {
      alert("Student ID already exists!");
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
    if (!csvFile) return;

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
            alert(
              `Student ID ${studentId} already exists! Skipping this student.`
            );
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
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">Create Student</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700">Student ID:</label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>
          <div>
            <label className="block text-gray-700">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>
          <div>
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>
          <div>
            <label className="block text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>
          <div>
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
          <div>
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
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-700"
          >
            Create Student
          </button>
        </form>
        <div className="mt-6">
          <h2 className="text-2xl font-semibold mb-4">Upload CSV</h2>
          <input type="file" accept=".csv" onChange={handleCsvFileChange} />
          <button
            onClick={handleCsvUpload}
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-700 mt-2"
          >
            Upload CSV
          </button>
        </div>
      </div>
    </Sidebar>
  );
}

export default CreateStudent;
