import React, { useEffect, useState } from "react";
import { getDocs, collection, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";

function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState("");

  useEffect(() => {
    const fetchTeachers = async () => {
      let q = query(collection(db, "teachers"), where("role", "==", "faculty"));
      if (selectedLevel) {
        q = query(q, where("level", "==", selectedLevel));
      }
      const teachersSnapshot = await getDocs(q);
      const teachersData = teachersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTeachers(teachersData);
    };

    fetchTeachers();
  }, [selectedLevel]);

  return (
    <Sidebar>
      <div>
        <h2 className="text-2xl font-semibold mb-4">Teachers</h2>
        <Link
          to="/create-teacher"
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-700"
        >
          Add Teacher
        </Link>
        <div className="my-4">
          <label htmlFor="level" className="block text-gray-700">
            Filter by Level
          </label>
          <select
            id="level"
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
          >
            <option value="">All Levels</option>
            <option value="elementary">Elementary</option>
            <option value="juniorHighschool">Junior High School</option>
            <option value="seniorHighschool">Senior High School</option>
            <option value="college">College</option>
          </select>
        </div>
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2">Name</th>
              <th className="py-2">Email</th>
              <th className="py-2">Level</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((teacher) => (
              <tr key={teacher.id}>
                <td className="border px-4 py-2">{teacher.name}</td>
                <td className="border px-4 py-2">{teacher.email}</td>
                <td className="border px-4 py-2">{teacher.level}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Sidebar>
  );
}

export default TeachersPage;
