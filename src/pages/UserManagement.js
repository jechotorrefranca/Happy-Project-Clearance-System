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
  faUsers,
  faUserShield,
  faUserCheck,
  faUserTimes,
  faChevronDown,
  faChevronUp,
  faEllipsisV,
  faUserCircle,
  faShieldAlt,
  faExclamationTriangle,
  faCheckCircle,
  faTimes,
  faUsersCog,
  faChartBar,
  faEdit,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import Modal from "../components/Modal";
import { Link } from "react-router-dom";

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [originalUsers, setOriginalUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [availableRoles, setAvailableRoles] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    locked: 0,
    admins: 0,
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
        
        const stats = {
          total: usersData.length,
          active: usersData.filter(u => !u.isLocked).length,
          locked: usersData.filter(u => u.isLocked).length,
          admins: usersData.filter(u => 
            u.role && (u.role.toLowerCase() === "admin" || u.role.toLowerCase() === "super-admin")
          ).length,
        };
        
        setStatistics(stats);
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
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filteredUsers = filteredUsers.filter((user) => {
        if (statusFilter === "active") return !user.isLocked;
        if (statusFilter === "locked") return user.isLocked;
        return true;
      });
    }

    if (sortConfig.key) {
      filteredUsers.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === "status") {
          aValue = a.isLocked ? 1 : 0;
          bValue = b.isLocked ? 1 : 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    setUsers(filteredUsers);
  }, [selectedRole, searchQuery, statusFilter, sortConfig, originalUsers]);

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

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

      setOriginalUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, isLocked: !currentStatus } : user
        )
      );

      setStatistics(prev => ({
        ...prev,
        active: !currentStatus ? prev.active - 1 : prev.active + 1,
        locked: !currentStatus ? prev.locked + 1 : prev.locked - 1,
      }));

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

      setOriginalUsers((prevUsers) =>
        prevUsers.map((user) =>
          selectedUsers.includes(user.id)
            ? { ...user, isLocked: bulkAction === "lock" }
            : user
        )
      );

      const affectedCount = selectedUsers.length;
      if (bulkAction === "lock") {
        setStatistics(prev => ({
          ...prev,
          active: prev.active - affectedCount,
          locked: prev.locked + affectedCount,
        }));
      } else {
        setStatistics(prev => ({
          ...prev,
          active: prev.active + affectedCount,
          locked: prev.locked - affectedCount,
        }));
      }

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

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedRole("");
    setStatusFilter("all");
    setSortConfig({ key: null, direction: null });
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      'Admin': 'bg-purple-100 text-purple-800',
      'admin': 'bg-purple-100 text-purple-800',
      'super-admin': 'bg-purple-100 text-purple-800',
      'Teacher': 'bg-blue-100 text-blue-800',
      'Student': 'bg-green-100 text-green-800',
      'Registrar': 'bg-yellow-100 text-yellow-800',
      'Finance': 'bg-orange-100 text-orange-800',
      'Librarian': 'bg-pink-100 text-pink-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getUserInitials = (email) => {
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const getRandomColor = (email) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
    ];
    const index = email.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const formatDate = (dateField) => {
    if (!dateField) return 'N/A';
    
    if (dateField && typeof dateField.toDate === 'function') {
      return dateField.toDate().toLocaleDateString();
    }
    
    const date = new Date(dateField);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString();
    }
    
    if (typeof dateField === 'number') {
      const date = new Date(dateField * 1000);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString();
      }
    }
    
    return 'N/A';
  };

  const StatCard = ({ icon, title, value, color, percentage }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {percentage !== undefined && (
            <p className="text-xs text-gray-500 mt-1">{percentage}% of total</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <FontAwesomeIcon icon={icon} className="text-xl" />
        </div>
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <FontAwesomeIcon icon={faUsers} className="text-3xl text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No users found</h3>
      <p className="text-gray-500 text-center max-w-sm">
        {searchQuery || selectedRole || statusFilter !== "all"
          ? "Try adjusting your filters or search query."
          : "No users have been added to the system yet."}
      </p>
      {!searchQuery && !selectedRole && statusFilter === "all" && (
        <Link to="/create-user">
          <button className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <FontAwesomeIcon icon={faPlus} />
            Create First User
          </button>
        </Link>
      )}
    </div>
  );

  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <FontAwesomeIcon
        icon={faSpinner}
        spin
        size="3x"
        className="text-blue-600 mb-4"
      />
      <p className="text-gray-600">Loading users...</p>
    </div>
  );

  return (
    <Sidebar>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                <p className="mt-2 text-gray-600">Manage user accounts and permissions</p>
              </div>
              <Link to="/create-user">
                <button className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                  <FontAwesomeIcon icon={faPlus} />
                  Create User
                </button>
              </Link>
            </div>
          </div>

          {}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard 
              icon={faUsers} 
              title="Total Users" 
              value={statistics.total}
              color="bg-blue-100 text-blue-600"
            />
            <StatCard 
              icon={faUserCheck} 
              title="Active Users" 
              value={statistics.active}
              percentage={statistics.total ? Math.round((statistics.active / statistics.total) * 100) : 0}
              color="bg-green-100 text-green-600"
            />
            <StatCard 
              icon={faUserTimes} 
              title="Locked Users" 
              value={statistics.locked}
              percentage={statistics.total ? Math.round((statistics.locked / statistics.total) * 100) : 0}
              color="bg-red-100 text-red-600"
            />
            <StatCard 
              icon={faUserShield} 
              title="Administrators" 
              value={statistics.admins}
              color="bg-purple-100 text-purple-600"
            />
          </div>

          {}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Users
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon icon={faSearch} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by email or role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Roles</option>
                  {availableRoles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>

              {}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="locked">Locked</option>
                </select>
              </div>
            </div>

            {}
            {(searchQuery || selectedRole || statusFilter !== "all") && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                <span className="text-sm text-gray-500">Active filters:</span>
                <div className="flex flex-wrap gap-2">
                  {searchQuery && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      Search: {searchQuery}
                    </span>
                  )}
                  {selectedRole && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      Role: {selectedRole}
                    </span>
                  )}
                  {statusFilter !== "all" && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      Status: {statusFilter}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleClearFilters}
                  className="ml-auto text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {}
          {selectedUsers.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBulkLockUnlock("lock")}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <FontAwesomeIcon icon={faLock} />
                    Lock Selected
                  </button>
                  <button
                    onClick={() => handleBulkLockUnlock("unlock")}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FontAwesomeIcon icon={faUnlock} />
                    Unlock Selected
                  </button>
                  <button
                    onClick={() => setSelectedUsers([])}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            </div>
          )}

          {}
          {isLoading ? (
            <LoadingState />
          ) : users.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === users.length && users.length > 0}
                          onChange={handleSelectAllUsers}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                        onClick={() => handleSort('role')}
                      >
                        <div className="flex items-center gap-1">
                          Role
                          <FontAwesomeIcon 
                            icon={faSort} 
                            className={`text-xs ${
                              sortConfig.key === 'role' 
                                ? sortConfig.direction === 'asc' 
                                  ? 'text-blue-600' 
                                  : 'text-blue-600 rotate-180' 
                                : ''
                            }`}
                          />
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center gap-1">
                          Status
                          <FontAwesomeIcon 
                            icon={faSort} 
                            className={`text-xs ${
                              sortConfig.key === 'status' 
                                ? sortConfig.direction === 'asc' 
                                  ? 'text-blue-600' 
                                  : 'text-blue-600 rotate-180' 
                                : ''
                            }`}
                          />
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleSelectUser(user.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`h-10 w-10 rounded-full ${getRandomColor(user.email)} flex items-center justify-center text-white font-medium`}>
                              {getUserInitials(user.email)}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.email}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {user.id.substring(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                            <FontAwesomeIcon icon={faShieldAlt} className="mr-1" />
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.isLocked
                              ? "bg-red-100 text-red-800"
                              : "bg-green-100 text-green-800"
                          }`}>
                            <FontAwesomeIcon 
                              icon={user.isLocked ? faLock : faCheckCircle} 
                              className="mr-1"
                            />
                            {user.isLocked ? "Locked" : "Active"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleLockUnlock(user.id, user.isLocked)}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                user.isLocked
                                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                                  : "bg-red-100 text-red-700 hover:bg-red-200"
                              }`}
                            >
                              <FontAwesomeIcon
                                icon={user.isLocked ? faUnlock : faLock}
                              />
                              {user.isLocked ? "Unlock" : "Lock"}
                            </button>
                            <button className="p-1.5 text-gray-400 hover:text-gray-600">
                              <FontAwesomeIcon icon={faEllipsisV} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {}
          {!isLoading && users.length > 0 && (
            <div className="mt-6 text-center text-sm text-gray-500">
              Showing {users.length} of {originalUsers.length} users
            </div>
          )}
        </div>
      </div>

      {}
      <Modal isOpen={isConfirmModalOpen} onClose={closeConfirmModal}>
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className={`p-3 rounded-full ${
              bulkAction === "lock" 
                ? "bg-red-100 text-red-600" 
                : "bg-green-100 text-green-600"
            }`}>
              <FontAwesomeIcon 
                icon={bulkAction === "lock" ? faLock : faUnlock} 
                className="text-xl"
              />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Confirm Bulk {bulkAction === "lock" ? "Lock" : "Unlock"}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                This action will affect {selectedUsers.length} user account{selectedUsers.length !== 1 ? 's' : ''}.
              </p>
            </div>
          </div>
          
          <div className={`p-4 rounded-lg mb-6 ${
            bulkAction === "lock" 
              ? "bg-red-50 border border-red-200" 
              : "bg-green-50 border border-green-200"
          }`}>
            <div className="flex items-start">
              <FontAwesomeIcon 
                icon={faExclamationTriangle} 
                className={`mt-0.5 ${
                  bulkAction === "lock" ? "text-red-600" : "text-green-600"
                }`}
              />
              <div className="ml-3">
                <p className={`text-sm ${
                  bulkAction === "lock" ? "text-red-800" : "text-green-800"
                }`}>
                  {bulkAction === "lock" 
                    ? "Locked users will not be able to access the system until unlocked."
                    : "Unlocked users will regain access to the system immediately."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={closeConfirmModal}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={confirmBulkAction}
              className={`px-4 py-2 text-white rounded-lg transition-colors ${
                bulkAction === "lock"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              Confirm {bulkAction === "lock" ? "Lock" : "Unlock"}
            </button>
          </div>
        </div>
      </Modal>
    </Sidebar>
  );
}

export default UserManagement;