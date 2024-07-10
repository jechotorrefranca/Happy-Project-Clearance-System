import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../components/AuthContext";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import { PlusCircleIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

function ManageOfficeRequirements() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [officeRequirements, setOfficeRequirements] = useState([]);
  const [educationLevels, setEducationLevels] = useState([]);
  const [selectedEducationLevels, setSelectedEducationLevels] = useState([]);
  const [officeName, setOfficeName] = useState("");
  const [userDepartment, setUserDepartment] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [requirementToEdit, setRequirementToEdit] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [requirementToDelete, setRequirementToDelete] = useState(null);

  useEffect(() => {
    const fetchOfficeRequirements = async () => {
      if (!currentUser) return;
      try {
        const requirementsRef = collection(db, "officeRequirements");
        const q = query(requirementsRef, where("addedBy", "==", currentUser.uid));
        const snapshot = await getDocs(q);
        const requirementsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOfficeRequirements(requirementsData);
      } catch (error) {
        console.error("Error fetching office requirements:", error);
      }
    };
    fetchOfficeRequirements();
  }, [currentUser]);

  useEffect(() => {
    const fetchEducationLevels = async () => {
      try {
        const classesSnapshot = await getDocs(collection(db, "classes"));
        const uniqueEducationLevels = [...new Set(classesSnapshot.docs.map((doc) => doc.data().educationLevel))];
        setEducationLevels(uniqueEducationLevels.map((level) => ({ value: level, label: level })));
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
        setOfficeName(getOfficeNameByRole(userRole));
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };
    fetchUserRole();
  }, [currentUser]);

  const getOfficeNameByRole = (role) => {
    const officeNames = {
      librarian: "Librarian",
      finance: "Finance",
      registrarBasicEd: "Basic Education Registrar",
      characterRenewalOfficer: "Character Renewal Office",
      "College Library": "College Library",
      "Guidance Office": "Guidance Office",
      "Office of The Dean": "Office of The Dean",
      "Office of the Finance Director": "Office of the Finance Director",
      "Office of the Registrar": "Office of the Registrar",
      "Property Custodian": "Property Custodian",
      "Student Council": "Student Council",
    };
    return officeNames[role] || "Unknown Office";
  };

  const handleOpenEditModal = (requirement) => {
    setRequirementToEdit({
      ...requirement,
      originalEducationLevels: requirement.educationLevels,
    });
    setSelectedEducationLevels(
      requirement.educationLevels.map((level) => ({
        value: level,
        label: level,
      }))
    );
    setIsEditing(true);
  };

  const handleCloseEditModal = () => {
    setIsEditing(false);
    setRequirementToEdit(null);
    setSelectedEducationLevels([]);
  };

  const handleSaveEdit = async (event) => {
    event.preventDefault();
    try {
      if (!requirementToEdit) return;
      const updatedEducationLevels = selectedEducationLevels.map((level) => level.value);
      await updateDoc(doc(db, "officeRequirements", requirementToEdit.id), {
        educationLevels: updatedEducationLevels,
        name: requirementToEdit.name,
        description: requirementToEdit.description,
      });
      setOfficeRequirements((prevRequirements) =>
        prevRequirements.map((req) =>
          req.id === requirementToEdit.id
            ? {
                ...req,
                educationLevels: updatedEducationLevels,
                name: requirementToEdit.name,
                description: requirementToEdit.description,
              }
            : req
        )
      );
      handleCloseEditModal();
    } catch (error) {
      console.error("Error updating office requirement:", error);
    }
  };

  const openDeleteModal = (requirement) => {
    setRequirementToDelete(requirement);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setRequirementToDelete(null);
    setIsDeleteModalOpen(false);
  };

  const handleDeleteRequirement = async () => {
    try {
      if (!requirementToDelete) return;
      await deleteDoc(doc(db, "officeRequirements", requirementToDelete.id));
      setOfficeRequirements((prevRequirements) =>
        prevRequirements.filter((req) => req.id !== requirementToDelete.id)
      );
      closeDeleteModal();
    } catch (error) {
      console.error("Error deleting office requirement:", error);
    }
  };

  return (
    <Sidebar>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Manage Office Requirements</h2>
          <button
            onClick={() => navigate("/add-office-requirement")}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300"
          >
            <PlusCircleIcon className="w-5 h-5 mr-2" />
            Add Requirement
          </button>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800">{officeName} Requirements</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requirement Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Education Levels
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {officeRequirements.map((requirement) => (
                  <tr key={requirement.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{requirement.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{requirement.educationLevels.join(", ")}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleOpenEditModal(requirement)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(requirement)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Modal isOpen={isEditing} onClose={handleCloseEditModal}>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Edit Office Requirement</h3>
            {requirementToEdit && (
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Education Levels</label>
                  <Select
                    isMulti
                    value={selectedEducationLevels}
                    onChange={setSelectedEducationLevels}
                    options={educationLevels}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label htmlFor="requirementName" className="block text-sm font-medium text-gray-700">
                    Requirement Name
                  </label>
                  <input
                    type="text"
                    id="requirementName"
                    value={requirementToEdit.name}
                    onChange={(e) => setRequirementToEdit({ ...requirementToEdit, name: e.target.value })}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="requirementDescription" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="requirementDescription"
                    value={requirementToEdit.description}
                    onChange={(e) => setRequirementToEdit({ ...requirementToEdit, description: e.target.value })}
                    rows="3"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>
        </Modal>

        <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal}>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete this requirement? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteRequirement}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </Sidebar>
  );
}

export default ManageOfficeRequirements;