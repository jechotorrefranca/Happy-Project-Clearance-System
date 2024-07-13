import React, { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";
import { motion } from 'framer-motion';

import Sidebar from "../components/Sidebar";

function CreateTeacherPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [level, setLevel] = useState("elementary");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleCreateTeacher = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !level) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
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
      });

      setName("");
      setEmail("");
      setPassword("");
      setLevel("elementary");
      setError(null);
      navigate("/teachers");
    } catch (err) {
      setError("Error creating teacher. Please try again.");
      console.error("Error creating teacher: ", err);
    }
  };
  return (
    <Sidebar>
      <div className="container mx-auto bg-blue-100 rounded pb-10 min-h-[90vh]">
        <div className="bg-blue-300 p-5 rounded flex justify-center items-center mb-10">
          <h2 className="text-3xl font-bold text-blue-950">Create Teacher</h2>
        </div>

        <div className="p-5">
          <div className="bg-white p-5 rounded-xl overflow-auto">
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

            <form onSubmit={handleCreateTeacher} className="space-y-4">

              <div className="mb-4 sm:flex gap-4">
                <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                  <label htmlFor="name" className="block text-gray-700">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                  />
                </div>

                <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                  <label htmlFor="email" className="block text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                  />
                </div>

              </div>

              <div className="mb-4 sm:flex gap-4">
                <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                  <label htmlFor="password" className="block text-gray-700">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                  />
                </div>

                <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                  <label htmlFor="level" className="block text-gray-700">
                    Level
                  </label>
                  <select
                    id="level"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                  >
                    <option value="elementary">Elementary</option>
                    <option value="juniorHighschool">Junior High School</option>
                    <option value="seniorHighschool">Senior High School</option>
                    <option value="college">College</option>
                  </select>
                </div>

              </div>


              <div className="w-full flex justify-center">
                <motion.button
                  whileHover={{scale: 1.03}}
                  whileTap={{scale: 0.95}}
                  type="submit"
                  className="sm:w-[50%] w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  Create Teacher
                </motion.button>

              </div>
            </form>

          </div>
        </div>


      </div>
    </Sidebar>
  );
}

export default CreateTeacherPage;
