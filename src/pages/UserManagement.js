import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import Sidebar from "../components/Sidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLock,
  faUnlock,
  faSort,
  faCirclePlus,
  faSearch,
  faFilter,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import Modal from "../components/Modal";
import { Link } from "react-router-dom";
import { motion } from 'framer-motion';
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


function UserManagement() {
  const [users, setUsers] = useState([]);
  const [originalUsers, setOriginalUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [availableRoles, setAvailableRoles] = useState([]);
  const [sortStatusAsc, setSortStatusAsc] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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


  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersData = usersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersData);
        setOriginalUsers(usersData);

        const uniqueRoles = [...new Set(usersData.map((user) => user.role))];
        setAvailableRoles(uniqueRoles);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    let filteredUsers = [...originalUsers];

    if (selectedRole) {
      filteredUsers = filteredUsers.filter(
        (user) => user.role === selectedRole
      );
    }

    if (searchQuery) {
      filteredUsers = filteredUsers.filter((user) =>
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (sortStatusAsc !== null) {
      filteredUsers.sort((a, b) => {
        const statusA = a.isLocked ? 1 : 0;
        const statusB = b.isLocked ? 1 : 0;

        return sortStatusAsc ? statusA - statusB : statusB - statusA;
      });
    }

    setUsers(filteredUsers);
  }, [selectedRole, searchQuery, sortStatusAsc, originalUsers]);

  const handleLockUnlock = async (userId, currentStatus) => {
    try {
      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, {
        isLocked: !currentStatus,
      });

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, isLocked: !currentStatus } : user
        )
      );

      showSuccessToast(`User account ${!currentStatus ? "locked" : "unlocked"} successfully!`);
    } catch (error) {
      console.error("Error updating user status:", error);
      showFailedToast("Error updating user status. Please try again later");
    }
  };

  const handleSelectAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((user) => user.id));
    }
  };

  const handleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleBulkLockUnlock = (action) => {
    setBulkAction(action);
    setIsConfirmModalOpen(true);
  };

  const confirmBulkAction = async () => {
    setIsConfirmModalOpen(false);

    try {
      const updatePromises = selectedUsers.map(async (userId) => {
        const userDocRef = doc(db, "users", userId);
        await updateDoc(userDocRef, {
          isLocked: bulkAction === "lock",
        });
      });

      await Promise.all(updatePromises);

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          selectedUsers.includes(user.id)
            ? { ...user, isLocked: bulkAction === "lock" }
            : user
        )
      );

      setSelectedUsers([]);
      showSuccessToast(`Selected accounts ${bulkAction}ed successfully!`);
    } catch (error) {
      console.error(`Error during bulk ${bulkAction}:`, error);
      alert(`Error during bulk action. Please try again later.`);
    }
  };

  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setBulkAction(null);
  };

  const handleSortStatus = () => {
    setSortStatusAsc((prevSort) => !prevSort);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedRole("");
    setSortStatusAsc(null);
  };

  return (
    <Sidebar>
      <ToastContainer/>
      <div className="container mx-auto bg-blue-100 rounded pb-10 min-h-[90vh]">
        <div className="bg-blue-300 p-5 rounded flex justify-center items-center mb-10">
          <h2 className="text-3xl font-bold text-blue-950">User Management</h2>
        </div>

        <div className="p-5">
          <div className="bg-white p-5 rounded-xl overflow-auto">

            <div className="mb-4 sm:flex gap-4">

              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0 flex justify-center items-center">
                <div className="relative w-full">
                  <FontAwesomeIcon
                    icon={faSearch}
                    className="absolute left-3 top-3 text-gray-400"
                  />

                  <input
                    type="text"
                    placeholder="Search by email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
                  />
                </div>

              </div>

              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0 flex justify-center items-center">
                <div className="relative w-full">
                  <FontAwesomeIcon
                    icon={faFilter}
                    className="absolute left-3 top-3 text-gray-400"
                  />
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-300 focus:border-blue-300"
                  >
                    <option value="">All Roles</option>
                    {availableRoles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

              </div>



              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0 flex gap-4 justify-center">
                <motion.button
                whileHover={{scale: 1.03}}
                whileTap={{scale: 0.95}}                
                  onClick={handleClearFilters}
                  className="w-full bg-[#fff9e5] hover:bg-[#f1ead0] text-gray-800 px-4 py-2 rounded-md"
                >
                  Clear Filters
                </motion.button>

                <Link to="/create-user" className="w-full">
                  <motion.button
                  whileHover={{scale: 1.03}}
                  whileTap={{scale: 0.95}}                  
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md flex gap-1 justify-center items-center">
                    <FontAwesomeIcon icon={faCirclePlus} className="text-xl"/>
                    Create User
                  </motion.button>
                </Link>

              </div>

            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <FontAwesomeIcon
                  icon={faSpinner}
                  spin
                  size="3x"
                  className="text-blue-500"
                />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg">
                  No users found matching your criteria.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 border-gray-300">
                  <thead className="bg-blue-200 border">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider "
                      >
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === users.length}
                          onChange={handleSelectAllUsers}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                      >
                        Email
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                      >
                        Role
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer"
                        onClick={handleSortStatus}
                      >
                        Status{" "}
                        <FontAwesomeIcon
                          icon={faSort}
                          className={`ml-1 ${
                            sortStatusAsc !== null
                              ? sortStatusAsc
                                ? "transform rotate-180"
                                : ""
                              : ""
                          }`}
                        />
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="bg-blue-50 hover:bg-blue-100">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleSelectUser(user.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{user.role}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.isLocked
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {user.isLocked ? "Locked" : "Unlocked"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <motion.button
                          whileHover={{scale: 1.03}}
                          whileTap={{scale: 0.95}}                          
                            onClick={() => handleLockUnlock(user.id, user.isLocked)}
                            className={`px-3 py-1 rounded-md ${
                              user.isLocked
                                ? "bg-green-500 hover:bg-green-600 text-white"
                                : "bg-red-500 hover:bg-red-600 text-white"
                            }`}
                          >
                            <FontAwesomeIcon
                              icon={user.isLocked ? faUnlock : faLock}
                              className="mr-1"
                            />
                            {user.isLocked ? "Unlock" : "Lock"}
                          </motion.button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex justify-between items-center">
              <div className="flex w-full gap-4">

                <motion.button
                whileHover={{scale: 1.03}}
                whileTap={{scale: 0.95}}                
                  onClick={() => handleBulkLockUnlock("lock")}
                  className="flex justify-center items-center bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md mr-2 disabled:opacity-50 disabled:cursor-not-allowed w-full"
                  disabled={selectedUsers.length === 0}
                >
                  <FontAwesomeIcon icon={faLock} className="mr-2" /> 
                  <p>
                    Lock Selected
                  </p>
                </motion.button>

                <motion.button
                whileHover={{scale: 1.03}}
                whileTap={{scale: 0.95}}                
                  onClick={() => handleBulkLockUnlock("unlock")}
                  className="flex justify-center items-center bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed w-full"
                  disabled={selectedUsers.length === 0}
                >
                  <FontAwesomeIcon icon={faUnlock} className="mr-2" />
                  <p>
                    Unlock Selected
                  </p>
                </motion.button>

              </div>

              <div>{/* Pagination dito mamaya */}</div>
            </div>

          </div>
        </div>



        <Modal isOpen={isConfirmModalOpen} onClose={closeConfirmModal}>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Confirm Bulk Action</h3>
            <p>
              Are you sure you want to <strong>{bulkAction}</strong> the
              selected accounts?
            </p>

            <div className="mt-6 flex justify-around">
              <motion.button
              whileHover={{scale: 1.03}}
              whileTap={{scale: 0.95}}
                onClick={closeConfirmModal}
                className="mr-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 w-full"
              >
                Cancel
              </motion.button>

              <motion.button
              whileHover={{scale: 1.03}}
              whileTap={{scale: 0.95}}              
                onClick={confirmBulkAction}
                className={`px-4 py-2 text-white rounded w-full ${
                  bulkAction === "lock"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-green-500 hover:bg-green-600"
                }`}
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

export default UserManagement;
