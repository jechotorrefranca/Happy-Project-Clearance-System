import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../components/AuthContext";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClipboardList,
  faPlus,
  faEdit,
  faTrash,
  faSearch,
  faFilter,
  faGraduationCap,
  faBuilding,
  faInfoCircle,
  faCheckCircle,
  faExclamationTriangle,
  faFileAlt,
  faLayerGroup,
  faThLarge,
  faListUl,
  faChevronDown,
  faChevronUp,
  faTimes,
  faSpinner,
  faClipboardCheck,
  faSchool,
  faUniversity,
  faUserGraduate,
  faBook,
  faCopy,
  faArchive,
  faEye,
  faQuestionCircle,
  faSave,
  faUndo,
  faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";

function ManageOfficeRequirements() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [officeRequirements, setOfficeRequirements] = useState([]);
  const [filteredRequirements, setFilteredRequirements] = useState([]);
  const [educationLevels, setEducationLevels] = useState([]);
  const [selectedEducationLevels, setSelectedEducationLevels] = useState([]);
  const [officeName, setOfficeName] = useState("");
  const [userDepartment, setUserDepartment] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [requirementToEdit, setRequirementToEdit] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [requirementToDelete, setRequirementToDelete] = useState(null);
  const [expandedRequirement, setExpandedRequirement] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    levels: {},
  });

  const customSelectStyles = {
    control: (base) => ({
      ...base,
      borderColor: '#d1d5db',
      '&:hover': {
        borderColor: '#3b82f6',
      },
      boxShadow: 'none',
      '&:focus': {
        borderColor: '#3b82f6',
        ring: '2px',
        ringColor: '#3b82f6',
      },
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#dbeafe',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#1e40af',
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: '#1e40af',
      '&:hover': {
        backgroundColor: '#93c5fd',
        color: '#1e3a8a',
      },
    }),
  };

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

  useEffect(() => {
    fetchOfficeRequirements();
    fetchEducationLevels();
  }, [currentUser]);

  useEffect(() => {
    filterRequirements();
  }, [searchQuery, filterLevel, officeRequirements]);

  const fetchOfficeRequirements = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const requirementsRef = collection(db, "officeRequirements");
      const q = query(requirementsRef, where("addedBy", "==", currentUser.uid));
      const snapshot = await getDocs(q);
      const requirementsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt || new Date(),
      }));
      
      setOfficeRequirements(requirementsData);
      setFilteredRequirements(requirementsData);
      calculateStatistics(requirementsData);
    } catch (error) {
      console.error("Error fetching office requirements:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEducationLevels = async () => {
    try {
      const classesSnapshot = await getDocs(collection(db, "classes"));
      const uniqueEducationLevels = [...new Set(classesSnapshot.docs.map((doc) => doc.data().educationLevel))];
      setEducationLevels(uniqueEducationLevels.map((level) => ({ 
        value: level, 
        label: formatEducationLevel(level) 
      })));
    } catch (error) {
      console.error("Error fetching education levels:", error);
    }
  };

  const calculateStatistics = (requirements) => {
    const stats = {
      total: requirements.length,
      active: requirements.filter(r => r.isActive !== false).length,
      levels: {},
    };

    requirements.forEach(req => {
      req.educationLevels?.forEach(level => {
        stats.levels[level] = (stats.levels[level] || 0) + 1;
      });
    });

    setStatistics(stats);
  };

  const filterRequirements = () => {
    let filtered = [...officeRequirements];

    if (searchQuery) {
      filtered = filtered.filter(req =>
        req.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterLevel !== "all") {
      filtered = filtered.filter(req =>
        req.educationLevels?.includes(filterLevel)
      );
    }

    setFilteredRequirements(filtered);
  };

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

  const formatEducationLevel = (level) => {
    const levelMap = {
      elementary: "Elementary",
      juniorHighschool: "Junior High School",
      seniorHighschool: "Senior High School",
      college: "College",
    };
    return levelMap[level] || level;
  };

  const getEducationLevelIcon = (level) => {
    const iconMap = {
      elementary: faSchool,
      juniorHighschool: faBook,
      seniorHighschool: faGraduationCap,
      college: faUniversity,
    };
    return iconMap[level] || faLayerGroup;
  };

  const getEducationLevelColor = (level) => {
    const colorMap = {
      elementary: "bg-green-100 text-green-800",
      juniorHighschool: "bg-blue-100 text-blue-800",
      seniorHighschool: "bg-purple-100 text-purple-800",
      college: "bg-orange-100 text-orange-800",
    };
    return colorMap[level] || "bg-gray-100 text-gray-800";
  };

  const getOfficeIcon = () => {
    const iconMap = {
      "Librarian": faBook,
      "Finance": faFileAlt,
      "Basic Education Registrar": faGraduationCap,
      "Character Renewal Office": faClipboardCheck,
      "College Library": faBook,
      "Guidance Office": faUserGraduate,
      "Office of The Dean": faBuilding,
      "Office of the Finance Director": faFileAlt,
      "Office of the Registrar": faFileAlt,
      "Property Custodian": faClipboardCheck,
      "Student Council": faUserGraduate,
    };
    return iconMap[officeName] || faBuilding;
  };

  const handleOpenEditModal = (requirement) => {
    setRequirementToEdit({
      ...requirement,
      originalEducationLevels: requirement.educationLevels,
    });
    setSelectedEducationLevels(
      requirement.educationLevels.map((level) => ({
        value: level,
        label: formatEducationLevel(level),
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
    
    if (!requirementToEdit.name?.trim()) {
      alert("Requirement name is required");
      return;
    }

    if (selectedEducationLevels.length === 0) {
      alert("Please select at least one education level");
      return;
    }

    setLoading(true);
    try {
      const updatedEducationLevels = selectedEducationLevels.map((level) => level.value);
      
      await updateDoc(doc(db, "officeRequirements", requirementToEdit.id), {
        educationLevels: updatedEducationLevels,
        name: requirementToEdit.name.trim(),
        description: requirementToEdit.description?.trim() || "",
        updatedAt: new Date(),
      });
      
      const updatedRequirements = officeRequirements.map((req) =>
        req.id === requirementToEdit.id
          ? {
              ...req,
              educationLevels: updatedEducationLevels,
              name: requirementToEdit.name.trim(),
              description: requirementToEdit.description?.trim() || "",
              updatedAt: new Date(),
            }
          : req
      );
      
      setOfficeRequirements(updatedRequirements);
      calculateStatistics(updatedRequirements);
      handleCloseEditModal();
      alert("Requirement updated successfully!");
    } catch (error) {
      console.error("Error updating office requirement:", error);
      alert("Error updating requirement. Please try again.");
    } finally {
      setLoading(false);
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
    if (!requirementToDelete) return;
    
    setLoading(true);
    try {
      await deleteDoc(doc(db, "officeRequirements", requirementToDelete.id));
      
      const updatedRequirements = officeRequirements.filter(
        (req) => req.id !== requirementToDelete.id
      );
      
      setOfficeRequirements(updatedRequirements);
      calculateStatistics(updatedRequirements);
      closeDeleteModal();
      alert("Requirement deleted successfully!");
    } catch (error) {
      console.error("Error deleting office requirement:", error);
      alert("Error deleting requirement. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateRequirement = (requirement) => {
    navigate("/add-office-requirement", { 
      state: { 
        duplicate: {
          name: `${requirement.name} (Copy)`,
          description: requirement.description,
          educationLevels: requirement.educationLevels,
        }
      } 
    });
  };

  const StatCard = ({ icon, title, value, color, subtitle }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <FontAwesomeIcon icon={icon} className="text-xl" />
        </div>
      </div>
    </div>
  );

  const RequirementCard = ({ requirement }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200">
      <div className="p-6">
        {}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{requirement.name}</h3>
            {requirement.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{requirement.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => handleOpenEditModal(requirement)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit"
            >
              <FontAwesomeIcon icon={faEdit} />
            </button>
            <button
              onClick={() => handleDuplicateRequirement(requirement)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Duplicate"
            >
              <FontAwesomeIcon icon={faCopy} />
            </button>
            <button
              onClick={() => openDeleteModal(requirement)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        </div>

        {}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Applies to:</p>
          <div className="flex flex-wrap gap-2">
            {requirement.educationLevels?.map((level) => (
              <span
                key={level}
                className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getEducationLevelColor(level)}`}
              >
                <FontAwesomeIcon icon={getEducationLevelIcon(level)} className="text-xs" />
                {formatEducationLevel(level)}
              </span>
            ))}
          </div>
        </div>

        {}
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Added by: {officeName}</span>
            {requirement.updatedAt && (
              <span>Updated: {new Date(requirement.updatedAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>

        {}
        <button
          onClick={() => setExpandedRequirement(expandedRequirement === requirement.id ? null : requirement.id)}
          className="w-full mt-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center justify-center gap-2"
        >
          <span>View Details</span>
          <FontAwesomeIcon icon={expandedRequirement === requirement.id ? faChevronUp : faChevronDown} />
        </button>
      </div>

      {}
      {expandedRequirement === requirement.id && (
        <div className="px-6 pb-6 border-t border-gray-200 bg-gray-50">
          <div className="mt-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Full Description:</p>
              <p className="text-sm text-gray-600">
                {requirement.description || "No description provided"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Requirement ID:</p>
              <p className="text-xs text-gray-500 font-mono">{requirement.id}</p>
            </div>
            {requirement.createdAt && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Created:</p>
                <p className="text-sm text-gray-600">
                  {new Date(requirement.createdAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <FontAwesomeIcon icon={faClipboardList} className="text-3xl text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No requirements found</h3>
      <p className="text-gray-500 text-center max-w-sm mb-6">
        {searchQuery || filterLevel !== "all"
          ? "Try adjusting your filters or search query."
          : "Start by adding your first office requirement."}
      </p>
      <button
        onClick={() => navigate("/add-office-requirement")}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
      >
        <FontAwesomeIcon icon={faPlus} />
        Add First Requirement
      </button>
    </div>
  );

  if (loading) {
    return (
      <Sidebar>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <FontAwesomeIcon icon={faSpinner} className="text-4xl text-blue-500 animate-spin mb-4" />
            <p className="text-gray-600">Loading requirements...</p>
          </div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg mr-4">
                  <FontAwesomeIcon icon={getOfficeIcon()} className="text-2xl text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Office Requirements</h1>
                  <p className="text-gray-600 mt-1">Manage clearance requirements for {officeName}</p>
                </div>
              </div>
              <button
                onClick={() => navigate("/add-office-requirement")}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faPlus} />
                Add Requirement
              </button>
            </div>
          </div>

          {}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={faClipboardList}
              title="Total Requirements"
              value={statistics.total}
              color="bg-blue-100 text-blue-600"
            />
            <StatCard
              icon={faCheckCircle}
              title="Active Requirements"
              value={statistics.active}
              subtitle={`${statistics.total > 0 ? Math.round((statistics.active / statistics.total) * 100) : 0}% of total`}
              color="bg-green-100 text-green-600"
            />
            <StatCard
              icon={faGraduationCap}
              title="Education Levels"
              value={Object.keys(statistics.levels).length}
              subtitle="Covered levels"
              color="bg-purple-100 text-purple-600"
            />
            <StatCard
              icon={faLayerGroup}
              title="Average Coverage"
              value={statistics.total > 0 ? Math.round(Object.values(statistics.levels).reduce((a, b) => a + b, 0) / statistics.total) : 0}
              subtitle="Levels per requirement"
              color="bg-orange-100 text-orange-600"
            />
          </div>

          {}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {}
              <div className="flex-1">
                <div className="relative">
                  <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search requirements by name or description..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {}
              <div className="flex gap-2 flex-wrap">
                <select
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Levels</option>
                  {educationLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>

                {}
                <div className="flex bg-gray-100 rounded-lg p-1 ml-auto">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded ${viewMode === "grid" ? "bg-white shadow-sm" : ""}`}
                    title="Grid View"
                  >
                    <FontAwesomeIcon icon={faThLarge} />
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`p-2 rounded ${viewMode === "table" ? "bg-white shadow-sm" : ""}`}
                    title="Table View"
                  >
                    <FontAwesomeIcon icon={faListUl} />
                  </button>
                </div>
              </div>
            </div>

            {}
            {(searchQuery || filterLevel !== "all") && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                <span className="text-sm text-gray-500">Active filters:</span>
                <div className="flex flex-wrap gap-2">
                  {searchQuery && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      Search: {searchQuery}
                    </span>
                  )}
                  {filterLevel !== "all" && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      Level: {formatEducationLevel(filterLevel)}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilterLevel("all");
                  }}
                  className="ml-auto text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <FontAwesomeIcon icon={faInfoCircle} className="text-blue-400 mt-0.5 mr-3" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Managing Office Requirements</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Requirements define what students need to complete for clearance</li>
                  <li>Assign requirements to specific education levels</li>
                  <li>Students in those levels will see these requirements in their clearance checklist</li>
                  <li>You can edit or delete requirements at any time</li>
                </ul>
              </div>
            </div>
          </div>

          {}
          {filteredRequirements.length === 0 ? (
            <EmptyState />
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRequirements.map((requirement) => (
                <RequirementCard key={requirement.id} requirement={requirement} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Requirement Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Education Levels
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRequirements.map((requirement) => (
                      <tr key={requirement.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{requirement.name}</div>
                          <div className="text-xs text-gray-500">ID: {requirement.id.substring(0, 8)}...</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {requirement.description || "No description"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {requirement.educationLevels?.map((level) => (
                              <span
                                key={level}
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getEducationLevelColor(level)}`}
                              >
                                {formatEducationLevel(level)}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEditModal(requirement)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                              title="Edit"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button
                              onClick={() => handleDuplicateRequirement(requirement)}
                              className="text-green-600 hover:text-green-900 transition-colors"
                              title="Duplicate"
                            >
                              <FontAwesomeIcon icon={faCopy} />
                            </button>
                            <button
                              onClick={() => openDeleteModal(requirement)}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Delete"
                            >
                              <FontAwesomeIcon icon={faTrash} />
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
          {filteredRequirements.length > 0 && (
            <div className="mt-6 text-center text-sm text-gray-500">
              Showing {filteredRequirements.length} of {officeRequirements.length} requirements
            </div>
          )}
        </div>
      </div>

      {}
      <Modal isOpen={isEditing} onClose={handleCloseEditModal}>
        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <FontAwesomeIcon icon={faEdit} className="text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Edit Requirement</h3>
          </div>

          {requirementToEdit && (
            <form onSubmit={handleSaveEdit} className="space-y-6">
              {}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faClipboardList} className="mr-2 text-gray-400" />
                  Requirement Name
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={requirementToEdit.name}
                  onChange={(e) => setRequirementToEdit({ ...requirementToEdit, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Library Clearance"
                />
              </div>

              {}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faFileAlt} className="mr-2 text-gray-400" />
                  Description
                </label>
                <textarea
                  value={requirementToEdit.description}
                  onChange={(e) => setRequirementToEdit({ ...requirementToEdit, description: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Provide a brief description of this requirement..."
                />
              </div>

              {}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faGraduationCap} className="mr-2 text-gray-400" />
                  Education Levels
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <Select
                  isMulti
                  value={selectedEducationLevels}
                  onChange={setSelectedEducationLevels}
                  options={educationLevels}
                  styles={customSelectStyles}
                  placeholder="Select education levels..."
                  className="w-full"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Select all education levels where this requirement applies
                </p>
              </div>

              {}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-400 mt-0.5 mr-2" />
                  <div className="text-xs text-amber-800">
                    <p className="font-medium">Important:</p>
                    <p>Changes will apply immediately to all students in the selected education levels.</p>
                  </div>
                </div>
              </div>

              {}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faSave} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {}
      <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal}>
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <FontAwesomeIcon icon={faExclamationCircle} className="text-red-600" />
          </div>
          
          <h3 className="text-lg font-semibold text-center mb-2">Delete Requirement</h3>
          
          <p className="text-gray-600 text-center mb-6">
            Are you sure you want to delete <strong>{requirementToDelete?.name}</strong>? 
            This action cannot be undone and will affect all students with this requirement.
          </p>
          
          {requirementToDelete && (
            <div className="bg-gray-50 rounded-lg p-3 mb-6">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Affects:</span>{" "}
                {requirementToDelete.educationLevels?.map(level => formatEducationLevel(level)).join(", ")}
              </p>
            </div>
          )}
          
          <div className="flex justify-center gap-3">
            <button
              onClick={closeDeleteModal}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteRequirement}
              disabled={loading}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faTrash} />
                  Delete Requirement
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </Sidebar>
  );
}

export default ManageOfficeRequirements;