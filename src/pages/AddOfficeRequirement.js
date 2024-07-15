import React, { useState, useEffect } from "react";
import {
  collection,
  doc,
  getDocs,
  addDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../components/AuthContext";
import Sidebar from "../components/Sidebar";
import Select from "react-select";
import Modal from "../components/Modal";
import { motion } from 'framer-motion';
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AddOfficeRequirement() {
  const { currentUser } = useAuth();
  const [educationLevels, setEducationLevels] = useState([]);
  const [selectedEducationLevels, setSelectedEducationLevels] = useState([]);
  const [requirementName, setRequirementName] = useState("");
  const [requirementDescription, setRequirementDescription] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [userDepartment, setUserDepartment] = useState(null);
  const [isOfficeOfTheDean, setIsOfficeOfTheDean] = useState(false);

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
    const fetchEducationLevels = async () => {
      try {
        const classesSnapshot = await getDocs(collection(db, "classes"));
        const uniqueEducationLevels = [
          ...new Set(
            classesSnapshot.docs.map((doc) => doc.data().educationLevel)
          ),
        ];
        setEducationLevels(
          uniqueEducationLevels.map((level) => ({ value: level, label: level }))
        );
      } catch (error) {
        console.error("Error fetching education levels:", error);
      }
    };

    fetchEducationLevels();
  }, []);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!currentUser) return;

      try {
        const userRef = collection(db, "users");
        const userQuery = query(userRef, where("uid", "==", currentUser.uid));
        const userDoc = await getDocs(userQuery);
        const userData = userDoc.docs[0].data();
        const userRole = userData.role;
        setUserDepartment(userData.department || null);

        // switch (userRole) {
        //   case "librarian":
        //     setOfficeName("Librarian");
        //     break;
        //   case "finance":
        //     setOfficeName("Finance");
        //     break;
        //   case "registrarBasicEd":
        //     setOfficeName("Basic Education Registrar");
        //     break;
        //   case "characterRenewalOfficer":
        //     setOfficeName("Character Renewal Office");
        //     break;
        //   case "College Library":
        //     setOfficeName("College Library");
        //     break;
        //   case "Guidance Office":
        //     setOfficeName("Guidance Office");
        //     break;
        //   case "Office of The Dean":
        //     setOfficeName("Office of The Dean");
        //     setIsOfficeOfTheDean(true);
        //     setSelectedEducationLevels([
        //       { value: "college", label: "College" },
        //     ]);
        //     break;
        //   case "Office of the Finance Director":
        //     setOfficeName("Office of the Finance Director");
        //     break;
        //   case "Office of the Registrar":
        //     setOfficeName("Office of the Registrar");
        //     break;
        //   case "Property Custodian":
        //     setOfficeName("Property Custodian");
        //     break;
        //   case "Student Council":
        //     setOfficeName("Student Council");
        //     break;
        //   default:
        //     setOfficeName("Unknown Office");
        // }

        switch (userRole) {
          case "Librarian":
            setOfficeName("Librarian");
            break;
          case "Finance":
            setOfficeName("Finance");
            break;
          case "Basic Education Registrar":
            setOfficeName("Basic Education Registrar");
            break;
          case "Character Renewal Office":
            setOfficeName("Character Renewal Office");
            break;
          case "College Library":
            setOfficeName("College Library");
            break;
          case "Guidance Office":
            setOfficeName("Guidance Office");
            break;
          case "Office of The Dean":
            setOfficeName("Office of The Dean");
            setIsOfficeOfTheDean(true);
            setSelectedEducationLevels([
              { value: "college", label: "College" },
            ]);
            break;
          case "Office of the Finance Director":
            setOfficeName("Office of the Finance Director");
            break;
          case "Office of the Registrar":
            setOfficeName("Office of the Registrar");
            break;
          case "Property Custodian":
            setOfficeName("Property Custodian");
            break;
          case "Student Council":
            setOfficeName("Student Council");
            break;
          case "Director/Principal":
            setOfficeName("Director/Principal");
            break;
          default:
            setOfficeName("Unknown Office");
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };

    fetchUserRole();
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedEducationLevels.length) {
      showWarnToast("Please select at least one education level");
      return;
    }

    setIsConfirmModalOpen(true);
  };

  const confirmAddRequirement = async () => {
    setIsConfirmModalOpen(false);
    setIsAdding(true);

    try {
      const selectedLevelValues = selectedEducationLevels.map(
        (level) => level.value
      );

      const officeRequirementsRef = collection(db, "officeRequirements");
      await addDoc(officeRequirementsRef, {
        educationLevels: selectedLevelValues,
        office: officeName,
        name: requirementName,
        description: requirementDescription,
        addedBy: currentUser.uid,
        department: userDepartment,
      });

      setSelectedEducationLevels(
        isOfficeOfTheDean ? [{ value: "college", label: "College" }] : []
      );
      setRequirementName("");
      setRequirementDescription("");

      showSuccessToast("Requirement added successfully!");
    } catch (error) {
      console.error("Error adding requirement: ", error);
      showFailedToast("Error adding requirement. Please try again later");
    } finally {
      setIsAdding(false);
    }
  };

  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
  };

  return (
    <Sidebar>
      <ToastContainer/>
      <div className="container mx-auto bg-blue-100 rounded pb-10 min-h-[90vh]">
        <div className="bg-blue-300 p-5 rounded flex justify-center items-center mb-10">
          <h2 className="text-3xl font-bold text-blue-950 text-center">Add Office Requirement</h2>
        </div>

        <div className="p-5">
          <div className="bg-white p-5 rounded-xl overflow-auto">

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                <label className="block text-gray-700">Education Levels:</label>
                <Select
                  isMulti={!isOfficeOfTheDean}
                  value={selectedEducationLevels}
                  onChange={setSelectedEducationLevels}
                  options={
                    isOfficeOfTheDean
                      ? [{ value: "college", label: "College" }]
                      : educationLevels
                  }
                  className="basic-multi-select"
                  classNamePrefix="select"
                  isDisabled={isOfficeOfTheDean}
                />
              </div>

              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                <label className="block text-gray-700">Requirement Name:</label>
                <input
                  type="text"
                  value={requirementName}
                  onChange={(e) => setRequirementName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>

              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                <label className="block text-gray-700">Description:</label>
                <textarea
                  value={requirementDescription}
                  onChange={(e) => setRequirementDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>

              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0 flex justify-center items-center">
                <motion.button
                whileHover={{scale: 1.03}}
                whileTap={{scale: 0.95}}                
                  type="submit"
                  className="w-full sm:w-[50%] bg-blue-500 text-white p-2 rounded hover:bg-blue-700"
                  disabled={isAdding}
                >
                  {isAdding ? "Adding..." : "Add Requirement"}
                </motion.button>

              </div>

            </form>
          </div>
        </div>


        <Modal isOpen={isConfirmModalOpen} onClose={closeConfirmModal}>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Confirm Requirement Addition
            </h3>
            <p>
              Are you sure you want to add this requirement to the selected
              education levels?
            </p>
            <div className="mt-6 flex justify-around gap-2">
              <motion.button
              whileHover={{scale: 1.03}}
              whileTap={{scale: 0.95}}              
                onClick={closeConfirmModal}
                className="w-full mr-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </motion.button>
              <motion.button
              whileHover={{scale: 1.03}}
              whileTap={{scale: 0.95}}              
                onClick={confirmAddRequirement}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Confirm
              </motion.button>
            </div>
          </div>
        </Modal>
      </div>
    </Sidebar>
  );
}

export default AddOfficeRequirement;
