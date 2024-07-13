import React, { useEffect, useState } from "react";
import { getDocs, collection, query, where } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCirclePlus } from "@fortawesome/free-solid-svg-icons";
import { motion } from 'framer-motion';


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
      <div className="container mx-auto bg-blue-100 rounded pb-10 min-h-[90vh]">
        <div className="bg-blue-300 p-5 rounded flex justify-center items-center mb-10">
          <h2 className="text-3xl font-bold text-blue-950">Approve Clearance Requests</h2>
        </div>

        <div className="p-5">
          <div className="bg-white p-5 rounded-xl overflow-auto">

            <div className="mb-4 sm:flex gap-4">
              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
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

              <div className="min-w-[30%] bg-blue-100 p-5 rounded mb-2 sm:mb-0 flex justify-center items-center">
                <motion.div
                  whileHover={{scale: 1.03}}
                  whileTap={{scale: 0.95}}
                  className="w-full"
                >
                  <Link
                    to="/create-teacher"
                    className="bg-blue-500 text-white p-2 rounded hover:bg-blue-700 flex gap-1 justify-center items-center w-full"
                  >
                    <FontAwesomeIcon icon={faCirclePlus} className="text-xl"/>
                    <span>
                      Add Teacher

                    </span>
                  </Link>

                </motion.div>

              </div>


            </div>

            <div className="w-full overflow-auto">
              <table className="min-w-full bg-white">
                <thead>
                  <tr className="bg-blue-300">
                    <th className="py-3 px-2 border border-gray-400">Name</th>
                    <th className="py-3 px-2 border border-gray-400">Email</th>
                    <th className="py-3 px-2 border border-gray-400">Level</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((teacher) => (
                    <tr key={teacher.id} className="bg-blue-100 hover:bg-blue-200">
                      <td className="border border-gray-400 px-4 py-2">{teacher.name}</td>
                      <td className="border border-gray-400 px-4 py-2">{teacher.email}</td>
                      <td className="border border-gray-400 px-4 py-2">{teacher.level}</td>
                    </tr>
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

export default TeachersPage;
