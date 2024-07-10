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
      alert("Please select at least one education level.");
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

      alert("Requirement added successfully!");
    } catch (error) {
      console.error("Error adding requirement: ", error);
      alert("Error adding requirement. Please try again later.");
    } finally {
      setIsAdding(false);
    }
  };

  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
  };

  return (
    <Sidebar>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">Add Office Requirement</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
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

          <div>
            <label className="block text-gray-700">Requirement Name:</label>
            <input
              type="text"
              value={requirementName}
              onChange={(e) => setRequirementName(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>

          <div>
            <label className="block text-gray-700">Description:</label>
            <textarea
              value={requirementDescription}
              onChange={(e) => setRequirementDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>

          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={isAdding}
          >
            {isAdding ? "Adding..." : "Add Requirement"}
          </button>
        </form>

        <Modal isOpen={isConfirmModalOpen} onClose={closeConfirmModal}>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Confirm Requirement Addition
            </h3>
            <p>
              Are you sure you want to add this requirement to the selected
              education levels?
            </p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeConfirmModal}
                className="mr-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={confirmAddRequirement}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Confirm
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </Sidebar>
  );
}

export default AddOfficeRequirement;
