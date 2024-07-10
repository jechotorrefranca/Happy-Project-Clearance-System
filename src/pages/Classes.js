import React, { useEffect, useState } from "react";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { Link } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import { motion } from 'framer-motion';
import "./table.css"


function Classes() {
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");


  useEffect(() => {
    const fetchClasses = async () => {
      const classesSnapshot = await getDocs(collection(db, "classes"));
      const classesData = classesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setClasses(classesData);
    };

    fetchClasses();
  }, []);

  const filteredClasses = classes.filter((cls) => {
    const gradeLevel = cls.gradeLevel ? cls.gradeLevel.toLowerCase() : "";
    const sectionName = cls.sectionName ? cls.sectionName.toLowerCase() : "";
    const adviser = cls.adviser ? cls.adviser.toLowerCase() : "";
    const educationLevel = cls.educationLevel ? cls.educationLevel.toLowerCase() : "";

    return (
      gradeLevel.includes(searchTerm.toLowerCase()) ||
      sectionName.includes(searchTerm.toLowerCase()) ||
      adviser.includes(searchTerm.toLowerCase()) ||
      educationLevel.includes(searchTerm.toLowerCase())
    );
  });

  return (
    <Sidebar>
      <div className="container mx-auto bg-blue-100 rounded pb-10 min-h-[90vh]">
        <div className="bg-blue-300 p-5 rounded flex justify-center items-center mb-10">
          <h2 className="text-3xl font-bold text-blue-950">Classes</h2>
        </div>

        <div className="p-5">
          <div className="bg-white p-5 rounded-xl overflow-auto">

            <div className="sm:flex justify-around gap-4 mb-4">

              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                <input
                  type="text"
                  placeholder="Search by grade level, section name, adviser, or education level"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>

              <div className="sm:w-[20%] justify-center flex items-center bg-blue-100 rounded p-5">
                  <Link
                    to="/create-class"
                    className="w-full"
                    >
                    <motion.div 
                    whileHover={{scale: 1.03}}
                    whileTap={{scale: 0.95}}                    
                    className="bg-blue-500 text-white p-2 rounded hover:bg-blue-700 w-full flex justify-center">
                      <p>
                        Add Class

                      </p>
                    </motion.div>

                  </Link>


              </div>


            </div>

            <div className="w-full overflow-auto">
              <table className="min-w-full bg-white border border-gray-300">
                <thead>
                  <tr className="bg-blue-300">
                    <th className="py-3 px-4 border border-gray-400  font-semibold">Grade Level</th>
                    <th className="py-3 px-4 border border-gray-400  font-semibold">Section Name</th>
                    <th className="py-3 px-4 border border-gray-400  font-semibold">Adviser</th>
                    <th className="py-3 px-4 border border-gray-400  font-semibold">Education Level</th>
                    <th className="py-3 px-4 border border-gray-400 text-center bg-[#fff2c1]  font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClasses.map((cls) => (
                    <tr key={cls.id} className="bg-blue-100 hover:bg-blue-200 custom-row">
                      <td className="border border-gray-400 px-4 py-2">{cls.gradeLevel}</td>
                      <td className="border border-gray-400 px-4 py-2">{cls.sectionName}</td>
                      <td className="border border-gray-400 px-4 py-2">
                        {cls.adviser ? cls.adviser : "N/A"} 
                      </td>
                      <td className="border border-gray-400 px-4 py-2">{cls.educationLevel}</td>
                      <td className="border border-gray-400 px-4 py-2 custom-cell text-center">
                        <Link to={`/update-class/${cls.id}`}>
                          <motion.button
                            whileHover={{scale: 1.03}}
                            whileTap={{scale: 0.95}}                          
                           className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                            Update
                          </motion.button>
                        </Link>
                      </td>
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

export default Classes;