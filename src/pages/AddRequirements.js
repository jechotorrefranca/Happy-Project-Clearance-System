import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../components/AuthContext";
import Sidebar from "../components/Sidebar";
import Select from "react-select";
import { motion } from 'framer-motion';
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


function AddRequirement() {
  const { currentUser } = useAuth();
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [classes, setClasses] = useState([]);
  const [selectedClassOptions, setSelectedClassOptions] = useState([]);
  const [requirementName, setRequirementName] = useState("");
  const [requirementDescription, setRequirementDescription] = useState("");

  const showSuccessToast = (msg) => toast.success(msg, {
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


  useEffect(() => {
    const fetchAvailableSubjects = async () => {
      if (!currentUser) return;

      try {
        const allClassesSnapshot = await getDocs(
          collection(db, "classes")
        );

        const userSubjects = [];
        allClassesSnapshot.docs.forEach((classDoc) => {
          const subjects = classDoc.data().subjects || [];
          subjects.forEach((subject) => {
            if (
              subject.teacherUid === currentUser.uid &&
              !userSubjects.includes(subject.subject)
            ) {
              userSubjects.push(subject.subject);
            }
          });
        });

        setAvailableSubjects(userSubjects);
      } catch (error) {
        console.error("Error fetching subjects: ", error);
      }
    };

    fetchAvailableSubjects();
  }, [currentUser]);

  useEffect(() => {
    const fetchClassesForSubject = async () => {
      if (!currentUser || !selectedSubject) return;

      try {
        const allClassesSnapshot = await getDocs(
          collection(db, "classes")
        );

        const filteredClasses = allClassesSnapshot.docs.filter(
          (classDoc) => {
            const subjects = classDoc.data().subjects || [];
            return subjects.some(
              (subject) =>
                subject.subject === selectedSubject &&
                subject.teacherUid === currentUser.uid
            );
          }
        );

        const classesData = filteredClasses.map((classDoc) => ({
          id: classDoc.id,
          ...classDoc.data(),
        }));

        const formattedClasses = classesData.map((classItem) => ({
          value: classItem.id,
          label: `${classItem.educationLevel} - ${classItem.gradeLevel} - ${classItem.sectionName}`,
        }));

        setClasses(formattedClasses);
      } catch (error) {
        console.error("Error fetching classes: ", error);
      }
    };

    fetchClassesForSubject();
  }, [currentUser, selectedSubject]);

  const handleSubjectChange = (e) => {
    setSelectedSubject(e.target.value);
    setSelectedClassOptions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedClassOptions.length || !selectedSubject) {
      showWarnToast("Please select at least one class and a subject");
      return;
    }

    try {
      const updatePromises = selectedClassOptions.map(
        async (classOption) => {
          const classDocRef = doc(db, "classes", classOption.value);

          await updateDoc(classDocRef, {
            [`requirements.${selectedSubject}`]: arrayUnion({
              name: requirementName,
              description: requirementDescription,
              teacherUid: currentUser.uid,
            }),
          });
        }
      );

      await Promise.all(updatePromises);

      setSelectedSubject("");
      setSelectedClassOptions([]);
      setRequirementName("");
      setRequirementDescription("");

      showSuccessToast("Requirement added successfully!");
    } catch (error) {
      console.error("Error adding requirement: ", error);
      showFailedToast("Error adding requirement. Please try again later")
    }
  };

  return (
    <Sidebar>
      <ToastContainer/>
      <div className="container mx-auto bg-blue-100 rounded pb-10 min-h-[90vh]">
        <div className="bg-blue-300 p-5 rounded flex justify-center items-center mb-10">
          <h2 className="text-3xl font-bold text-blue-950">Add Requirement</h2>
        </div>

        <div className="p-5">
          <div className="bg-white p-5 rounded-xl overflow-auto">

            <form onSubmit={handleSubmit} className="space-y-4">

              <div className="mb-4 sm:flex gap-4">
                <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                  <label className="block text-gray-700">
                    Select Subject:
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={handleSubjectChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                  >
                    <option value="">Select a subject</option>
                    {availableSubjects.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                  <label className="block text-gray-700">
                    Select Classes:
                  </label>
                  <Select
                    isMulti
                    value={selectedClassOptions}
                    onChange={setSelectedClassOptions}
                    options={classes}
                    className="basic-multi-select"
                    classNamePrefix="select"
                    isDisabled={!selectedSubject}
                  />
                </div>
              
              </div>
  


              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                <label className="block text-gray-700">
                  Requirement Name:
                </label>
                <input
                  type="text"
                  value={requirementName}
                  onChange={(e) =>
                    setRequirementName(e.target.value)
                  }
                  required
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>

              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                <label className="block text-gray-700">
                  Description:
                </label>
                <textarea
                  value={requirementDescription}
                  onChange={(e) =>
                    setRequirementDescription(e.target.value)
                  }
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>

              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0 flex justify-center items-center">
                <motion.button
                  whileHover={{scale: 1.03}}
                  whileTap={{scale: 0.95}}
                  type="submit"
                  className="w-full sm:w-[50%] bg-blue-500 text-white p-2 rounded hover:bg-blue-700"
                >
                  Add Requirement
                </motion.button>

              </div>


            </form>

          </div>
        </div>



      </div>
    </Sidebar>
  );
}

export default AddRequirement;