import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where, doc, updateDoc, arrayRemove, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../components/AuthContext";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import { useNavigate } from "react-router-dom";
import { PlusCircleIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

function ManageRequirements() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [classData, setClassData] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editRequirement, setEditRequirement] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [requirementToDelete, setRequirementToDelete] = useState(null);

  useEffect(() => {
    const fetchClasses = async () => {
      if (!currentUser) return;
      try {
        const allClassesSnapshot = await getDocs(collection(db, "classes"));
        const userClasses = allClassesSnapshot.docs.filter((classDoc) => {
          const subjects = classDoc.data().subjects || [];
          return subjects.some((subject) => subject.teacherUid === currentUser.uid);
        });
        const classesData = userClasses.map((classDoc) => ({
          id: classDoc.id,
          ...classDoc.data(),
        }));
        setClasses(classesData);
      } catch (error) {
        console.error("Error fetching classes: ", error);
      }
    };
    fetchClasses();
  }, [currentUser]);

  useEffect(() => {
    const fetchClassData = async () => {
      if (selectedClass) {
        try {
          const classDocRef = doc(db, "classes", selectedClass);
          const classDocSnapshot = await getDoc(classDocRef);
          if (classDocSnapshot.exists()) {
            setClassData(classDocSnapshot.data());
          } else {
            setClassData(null);
          }
        } catch (error) {
          console.error("Error fetching class data: ", error);
        }
      }
    };
    fetchClassData();
  }, [selectedClass]);

  const handleClassChange = (e) => {
    setSelectedClass(e.target.value);
    setSelectedSubject("");
  };

  const handleSubjectChange = (e) => {
    setSelectedSubject(e.target.value);
  };

  const handleEditRequirement = (requirement) => {
    setEditRequirement({ ...requirement, originalName: requirement.name });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      const classDocRef = doc(db, "classes", selectedClass);
      const subjectRequirements = classData.requirements[selectedSubject];
      const requirementIndex = subjectRequirements.findIndex(
        (req) => req.name === editRequirement.originalName
      );
      if (requirementIndex !== -1) {
        subjectRequirements[requirementIndex] = {
          name: editRequirement.name,
          description: editRequirement.description,
          teacherUid: currentUser.uid,
        };
        await updateDoc(classDocRef, {
          [`requirements.${selectedSubject}`]: subjectRequirements,
        });
        setClassData((prevData) => ({
          ...prevData,
          requirements: {
            ...prevData.requirements,
            [selectedSubject]: subjectRequirements,
          },
        }));
        setIsEditing(false);
        setEditRequirement(null);
      }
    } catch (error) {
      console.error("Error updating requirement:", error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditRequirement(null);
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
      const classDocRef = doc(db, "classes", selectedClass);
      await updateDoc(classDocRef, {
        [`requirements.${selectedSubject}`]: arrayRemove({
          name: requirementToDelete.name,
          description: requirementToDelete.description,
          teacherUid: currentUser.uid,
        }),
      });
      setClassData((prevData) => ({
        ...prevData,
        requirements: {
          ...prevData.requirements,
          [selectedSubject]: prevData.requirements[selectedSubject].filter(
            (req) => req.name !== requirementToDelete.name
          ),
        },
      }));
      closeDeleteModal();
    } catch (error) {
      console.error("Error deleting requirement:", error);
    }
  };

  return (
    <Sidebar>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Manage Requirements</h2>
          <button
            onClick={() => navigate("/add-office-requirement")}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300"
          >
            <PlusCircleIcon className="w-5 h-5 mr-2" />
            Add Requirement
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="classSelect" className="block text-sm font-medium text-gray-700 mb-2">
              Select Class
            </label>
            <select
              id="classSelect"
              value={selectedClass}
              onChange={handleClassChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a class</option>
              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.educationLevel} - {classItem.gradeLevel} - {classItem.sectionName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="subjectSelect" className="block text-sm font-medium text-gray-700 mb-2">
              Select Subject
            </label>
            <select
              id="subjectSelect"
              value={selectedSubject}
              onChange={handleSubjectChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={!selectedClass}
            >
              <option value="">Select a subject</option>
              {selectedClass &&
                classData?.subjects
                  .filter((subject) => subject.teacherUid === currentUser.uid)
                  .map((subject) => (
                    <option key={subject.subject} value={subject.subject}>
                      {subject.subject}
                    </option>
                  ))}
            </select>
          </div>
        </div>

        {selectedClass && selectedSubject && classData && (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">Requirements</h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {(classData.requirements[selectedSubject] || [])
                .filter((requirement) => requirement.teacherUid === currentUser.uid)
                .map((requirement) => (
                  <li key={requirement.name} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{requirement.name}</h4>
                        <p className="text-sm text-gray-500">{requirement.description}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditRequirement(requirement)}
                          className="p-2 text-blue-600 hover:text-blue-800 transition duration-300"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(requirement)}
                          className="p-2 text-red-600 hover:text-red-800 transition duration-300"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        )}

        <Modal isOpen={isEditing} onClose={handleCancelEdit}>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Edit Requirement</h3>
            {editRequirement && (
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Requirement Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={editRequirement.name}
                    onChange={(e) => setEditRequirement({ ...editRequirement, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={editRequirement.description}
                    onChange={(e) => setEditRequirement({ ...editRequirement, description: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>
        </Modal>

        <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal}>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="mb-4">Are you sure you want to delete the requirement "{requirementToDelete?.name}"?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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

export default ManageRequirements;