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
  faPlus,
  faSearch,
  faFilter,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import Modal from "../components/Modal";
import { Link } from "react-router-dom";

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

      alert(
        `User account ${!currentStatus ? "locked" : "unlocked"} successfully!`
      );
    } catch (error) {
      console.error("Error updating user status:", error);
      alert("Error updating user status. Please try again later.");
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
      alert(`Selected accounts ${bulkAction}ed successfully!`);
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
      <div className="bg-gray-50 min-h-screen p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          User Management
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
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
          <div className="relative">
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
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleClearFilters}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md transition duration-300 ease-in-out"
            >
              Clear Filters
            </button>
            <Link to="/create-user">
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition duration-300 ease-in-out">
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Create User
              </button>
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
              <thead className="bg-gray-200 border">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
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
                  <tr key={user.id} className="hover:bg-gray-50">
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
                      <button
                        onClick={() => handleLockUnlock(user.id, user.isLocked)}
                        className={`px-3 py-1 rounded-md transition duration-300 ease-in-out ${
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
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex justify-between items-center">
          <div>
            <button
              onClick={() => handleBulkLockUnlock("lock")}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md mr-2 transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={selectedUsers.length === 0}
            >
              <FontAwesomeIcon icon={faLock} className="mr-2" /> Lock Selected
            </button>
            <button
              onClick={() => handleBulkLockUnlock("unlock")}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={selectedUsers.length === 0}
            >
              <FontAwesomeIcon icon={faUnlock} className="mr-2" /> Unlock
              Selected
            </button>
          </div>
          <div>{/* Pagination dito mamaya */}</div>
        </div>

        <Modal isOpen={isConfirmModalOpen} onClose={closeConfirmModal}>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Confirm Bulk Action</h3>
            <p>
              Are you sure you want to <strong>{bulkAction}</strong> the
              selected accounts?
            </p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeConfirmModal}
                className="mr-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition duration-300 ease-in-out"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkAction}
                className={`px-4 py-2 text-white rounded transition duration-300 ease-in-out ${
                  bulkAction === "lock"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-green-500 hover:bg-green-600"
                }`}
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

export default UserManagement;
