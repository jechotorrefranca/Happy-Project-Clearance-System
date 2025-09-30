import React, { useState, useEffect, useMemo } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  arrayRemove,
  getDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../components/AuthContext";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faEdit,
  faTrash,
  faSearch,
  faFilter,
  faUserCheck,
  faMoneyBill,
  faBook,
  faClipboardList,
  faGraduationCap,
  faLayerGroup,
  faCheckCircle,
  faTimesCircle,
  faExclamationTriangle,
  faInfoCircle,
  faSpinner,
  faTimes,
  faChevronDown,
  faChevronRight,
  faFolder,
  faFolderOpen,
  faCopy,
  faDownload,
  faUpload,
  faHistory,
  faClock,
  faUser,
  faUsers,
  faChalkboardTeacher,
  faSchool,
  faTasks,
  faClipboardCheck,
  faStar,
  faTag,
  faThLarge,
  faListUl,
  faArrowUp,
  faArrowDown,
  faSync,
  faFileExport,
  faFileImport,
  faPalette,
  faShapes,
  faLightbulb,
  faFlag,
  faCalendarAlt,
  faCheckDouble,
  faUndo,
  faRedo,
  faSave,
  faExclamationCircle,
  faCheckSquare,
  faSquare,
  faMinusSquare,
  faBell,
  faBookOpen,
  faUserGraduate,
  faAward,
  faChartLine,
  faPercentage,
  faListCheck,
  faClipboard,
  faFileAlt,
  faCog,
  faEye,
  faEyeSlash,
  faLock,
  faUnlock,
  faShieldAlt,
  faKey,
} from "@fortawesome/free-solid-svg-icons";

function ManageRequirements() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [classData, setClassData] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [selectedRequirements, setSelectedRequirements] = useState([]);
  const [expandedSubjects, setExpandedSubjects] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editRequirement, setEditRequirement] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [requirementToDelete, setRequirementToDelete] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [requirementToDuplicate, setRequirementToDuplicate] = useState(null);

  const [newRequirement, setNewRequirement] = useState({
    name: "",
    description: "",
    category: "academic",
    dueDate: "",
    attachments: [],
  });

  useEffect(() => {
    fetchClasses();
  }, [currentUser]);

  useEffect(() => {
    if (selectedClass) {
      fetchClassData();
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const allClassesSnapshot = await getDocs(collection(db, "classes"));
      const userClasses = allClassesSnapshot.docs.filter((classDoc) => {
        const subjects = classDoc.data().subjects || [];
        return subjects.some(
          (subject) => subject.teacherUid === currentUser.uid
        );
      });
      const classesData = userClasses.map((classDoc) => ({
        id: classDoc.id,
        ...classDoc.data(),
      }));
      setClasses(classesData);
    } catch (error) {
      console.error("Error fetching classes: ", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassData = async () => {
    if (!selectedClass) return;

    try {
      const classDocRef = doc(db, "classes", selectedClass);
      const classDocSnapshot = await getDoc(classDocRef);
      if (classDocSnapshot.exists()) {
        const data = classDocSnapshot.data();
        const enhancedData = {
          ...data,
          requirements: Object.entries(data.requirements || {}).reduce(
            (acc, [subject, reqs]) => {
              acc[subject] = reqs.map((req) => ({
                ...req,
                id: req.id || `${subject}-${req.name}`,
                category: req.category || "academic",
                createdAt: req.createdAt || new Date().toISOString(),
              }));
              return acc;
            },
            {}
          ),
        };
        setClassData(enhancedData);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Error fetching class data: ", error);
    }
  };

  const statistics = useMemo(() => {
    if (!classData || !selectedSubject) {
      return {
        total: 0,
        categories: {},
      };
    }

    const requirements = classData.requirements[selectedSubject] || [];
    const stats = {
      total: requirements.length,
      categories: {},
    };

    requirements.forEach((req) => {
      stats.categories[req.category] =
        (stats.categories[req.category] || 0) + 1;
    });

    return stats;
  }, [classData, selectedSubject]);

  const filteredRequirements = useMemo(() => {
    if (!classData || !selectedSubject) return [];

    let requirements = [...(classData.requirements[selectedSubject] || [])];

    requirements = requirements.filter(
      (req) => req.teacherUid === currentUser.uid
    );

    if (searchQuery) {
      requirements = requirements.filter(
        (req) =>
          req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          req.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterCategory !== "all") {
      requirements = requirements.filter(
        (req) => req.category === filterCategory
      );
    }

    requirements.sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case "name":
          compareValue = a.name.localeCompare(b.name);
          break;
        case "category":
          compareValue = (a.category || "").localeCompare(b.category || "");
          break;
        case "date":
          compareValue = new Date(a.createdAt) - new Date(b.createdAt);
          break;
        default:
          compareValue = 0;
      }

      return sortOrder === "asc" ? compareValue : -compareValue;
    });

    return requirements;
  }, [
    classData,
    selectedSubject,
    searchQuery,
    filterCategory,
    sortBy,
    sortOrder,
    currentUser.uid,
  ]);

  const allRequirements = useMemo(() => {
    if (!classData) return [];

    const allReqs = [];
    Object.entries(classData.requirements || {}).forEach(([subject, reqs]) => {
      reqs.forEach((req) => {
        if (req.teacherUid === currentUser.uid) {
          allReqs.push({ ...req, subject });
        }
      });
    });
    return allReqs;
  }, [classData, currentUser.uid]);

  const handleClassChange = (classId) => {
    setSelectedClass(classId);
    setSelectedSubject("");
    setSelectedRequirements([]);
  };

  const handleSubjectChange = (subject) => {
    setSelectedSubject(subject);
    setSelectedRequirements([]);
  };

  const handleEditRequirement = (requirement) => {
    setEditRequirement({ ...requirement, originalName: requirement.name });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editRequirement) return;

    try {
      const classDocRef = doc(db, "classes", selectedClass);
      const subjectRequirements = [...classData.requirements[selectedSubject]];
      const requirementIndex = subjectRequirements.findIndex(
        (req) => req.name === editRequirement.originalName
      );

      if (requirementIndex !== -1) {
        subjectRequirements[requirementIndex] = {
          ...editRequirement,
          modifiedAt: new Date().toISOString(),
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

  const handleDeleteRequirement = async () => {
    if (!requirementToDelete) return;

    try {
      const classDocRef = doc(db, "classes", selectedClass);
      await updateDoc(classDocRef, {
        [`requirements.${selectedSubject}`]: arrayRemove(requirementToDelete),
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

  const handleAddRequirement = async () => {
    if (!newRequirement.name.trim()) return;

    try {
      const classDocRef = doc(db, "classes", selectedClass);
      const requirementData = {
        ...newRequirement,
        id: Date.now().toString(),
        teacherUid: currentUser.uid,
        createdAt: new Date().toISOString(),
      };

      await updateDoc(classDocRef, {
        [`requirements.${selectedSubject}`]: arrayUnion(requirementData),
      });

      setClassData((prevData) => ({
        ...prevData,
        requirements: {
          ...prevData.requirements,
          [selectedSubject]: [
            ...(prevData.requirements[selectedSubject] || []),
            requirementData,
          ],
        },
      }));

      closeAddModal();
    } catch (error) {
      console.error("Error adding requirement:", error);
    }
  };

  const handleDuplicateRequirement = async () => {
    if (!requirementToDuplicate) return;

    try {
      const classDocRef = doc(db, "classes", selectedClass);
      const duplicatedReq = {
        ...requirementToDuplicate,
        name: `${requirementToDuplicate.name} (Copy)`,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };

      await updateDoc(classDocRef, {
        [`requirements.${selectedSubject}`]: arrayUnion(duplicatedReq),
      });

      setClassData((prevData) => ({
        ...prevData,
        requirements: {
          ...prevData.requirements,
          [selectedSubject]: [
            ...prevData.requirements[selectedSubject],
            duplicatedReq,
          ],
        },
      }));

      setIsDuplicateModalOpen(false);
      setRequirementToDuplicate(null);
    } catch (error) {
      console.error("Error duplicating requirement:", error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRequirements.length === 0) return;

    try {
      const classDocRef = doc(db, "classes", selectedClass);
      const remainingRequirements = classData.requirements[
        selectedSubject
      ].filter((req) => !selectedRequirements.includes(req.id));

      await updateDoc(classDocRef, {
        [`requirements.${selectedSubject}`]: remainingRequirements,
      });

      setClassData((prevData) => ({
        ...prevData,
        requirements: {
          ...prevData.requirements,
          [selectedSubject]: remainingRequirements,
        },
      }));

      setSelectedRequirements([]);
      setIsBulkDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting requirements:", error);
    }
  };

  const handleSelectRequirement = (requirementId) => {
    if (selectedRequirements.includes(requirementId)) {
      setSelectedRequirements(
        selectedRequirements.filter((id) => id !== requirementId)
      );
    } else {
      setSelectedRequirements([...selectedRequirements, requirementId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedRequirements.length === filteredRequirements.length) {
      setSelectedRequirements([]);
    } else {
      setSelectedRequirements(filteredRequirements.map((req) => req.id));
    }
  };

  const toggleSubjectExpansion = (subject) => {
    if (expandedSubjects.includes(subject)) {
      setExpandedSubjects(expandedSubjects.filter((s) => s !== subject));
    } else {
      setExpandedSubjects([...expandedSubjects, subject]);
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

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setNewRequirement({
      name: "",
      description: "",
      category: "academic",
      dueDate: "",
      attachments: [],
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      academic: { bg: "bg-blue-100", text: "text-blue-800", icon: faBook },
      behavioral: {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: faUserCheck,
      },
      financial: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        icon: faMoneyBill,
      },
      administrative: {
        bg: "bg-purple-100",
        text: "text-purple-800",
        icon: faClipboardList,
      },
      extracurricular: {
        bg: "bg-pink-100",
        text: "text-pink-800",
        icon: faStar,
      },
    };
    return (
      colors[category] || {
        bg: "bg-gray-100",
        text: "text-gray-800",
        icon: faClipboard,
      }
    );
  };

  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-gray-200 rounded-xl h-48"></div>
        ))}
      </div>
    </div>
  );

  const EmptyState = ({ message, icon = faFolder, actionText, onAction }) => (
    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
      <FontAwesomeIcon icon={icon} className="text-6xl text-gray-300 mb-4" />
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        No Requirements Found
      </h3>
      <p className="text-gray-500 mb-6">{message}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );

  const StatCard = ({ icon, title, value, subtitle, color = "blue" }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-2">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <FontAwesomeIcon
            icon={icon}
            className={`text-xl text-${color}-600`}
          />
        </div>
      </div>
    </div>
  );

  const RequirementCard = ({ requirement }) => {
    const categoryStyle = getCategoryColor(requirement.category);
    const isSelected = selectedRequirements.includes(requirement.id);

    return (
      <div
        className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden hover:shadow-lg transition-all duration-300 ${
          isSelected
            ? "border-blue-500 ring-2 ring-blue-200"
            : "border-gray-200"
        }`}
      >
        <div className="p-6">
          {}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleSelectRequirement(requirement.id)}
                className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {requirement.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {requirement.description}
                </p>
              </div>
            </div>
          </div>

          {}
          <div className="flex flex-wrap gap-2 mb-4">
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${categoryStyle.bg} ${categoryStyle.text}`}
            >
              <FontAwesomeIcon icon={categoryStyle.icon} className="w-3 h-3" />
              {requirement.category}
            </span>
          </div>

          {}
          <div className="flex gap-2">
            <button
              onClick={() => handleEditRequirement(requirement)}
              className="flex-1 py-2 px-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
            >
              <FontAwesomeIcon icon={faEdit} className="mr-2" />
              Edit
            </button>
            <button
              onClick={() => {
                setRequirementToDuplicate(requirement);
                setIsDuplicateModalOpen(true);
              }}
              className="flex-1 py-2 px-3 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
            >
              <FontAwesomeIcon icon={faCopy} className="mr-2" />
              Duplicate
            </button>
            <button
              onClick={() => openDeleteModal(requirement)}
              className="py-2 px-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const SubjectOverviewCard = ({ subject, requirements }) => {
    const myRequirements = requirements.filter(
      (r) => r.teacherUid === currentUser.uid
    );
    const isExpanded = expandedSubjects.includes(subject);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
          onClick={() => toggleSubjectExpansion(subject)}
        >
          <div className="flex items-center gap-3">
            <FontAwesomeIcon
              icon={isExpanded ? faFolderOpen : faFolder}
              className="text-blue-500"
            />
            <div>
              <h3 className="font-semibold text-gray-900">{subject}</h3>
              <p className="text-sm text-gray-500">
                {myRequirements.length} requirement(s)
              </p>
            </div>
          </div>
          <FontAwesomeIcon
            icon={isExpanded ? faChevronDown : faChevronRight}
            className="text-gray-400"
          />
        </div>

        {isExpanded && (
          <div className="border-t border-gray-200 p-4">
            <div className="space-y-2">
              {myRequirements.map((req) => (
                <div
                  key={req.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm text-gray-700">{req.name}</span>
                  <div className="flex gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        getCategoryColor(req.category).bg
                      } ${getCategoryColor(req.category).text}`}
                    >
                      {req.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSubjectChange(subject);
              }}
              className="mt-3 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Manage Requirements
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Sidebar>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900">
                  Manage Requirements
                </h1>
                <p className="text-lg text-gray-600 mt-2">
                  Create and manage clearance requirements for your classes
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={fetchClassData}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <FontAwesomeIcon icon={faSync} className="mr-2" />
                  Refresh
                </button>
              </div>
            </div>
            {lastUpdated && (
              <p className="text-sm text-gray-500 mt-2 flex items-center gap-2">
                <FontAwesomeIcon icon={faClock} />
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>

          {loading ? (
            <LoadingSkeleton />
          ) : (
            <>
              {}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Class
                    </label>
                    <select
                      value={selectedClass}
                      onChange={(e) => handleClassChange(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Choose a class...</option>
                      {classes.map((classItem) => (
                        <option key={classItem.id} value={classItem.id}>
                          {classItem.educationLevel} - {classItem.gradeLevel} -{" "}
                          {classItem.sectionName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Subject
                    </label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => handleSubjectChange(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={!selectedClass}
                    >
                      <option value="">Choose a subject...</option>
                      {selectedClass &&
                        classData?.subjects
                          ?.filter(
                            (subject) => subject.teacherUid === currentUser.uid
                          )
                          .map((subject) => (
                            <option
                              key={subject.subject}
                              value={subject.subject}
                            >
                              {subject.subject}
                            </option>
                          ))}
                    </select>
                  </div>
                </div>

                {}
                {selectedSubject && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-blue-600">Total</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {statistics.total}
                          </p>
                        </div>
                        <FontAwesomeIcon
                          icon={faClipboardList}
                          className="text-blue-500"
                        />
                      </div>
                    </div>
                    {Object.entries(statistics.categories).map(([category, count]) => (
                      <div key={category} className={`${getCategoryColor(category).bg.replace('100', '50')} rounded-lg p-4`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className={`text-xs ${getCategoryColor(category).text}`}>
                              {category}
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                              {count}
                            </p>
                          </div>
                          <FontAwesomeIcon
                            icon={getCategoryColor(category).icon}
                            className={getCategoryColor(category).text}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {}
              {selectedClass && !selectedSubject && classData && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">
                    Subjects Overview
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classData.subjects
                      ?.filter(
                        (subject) => subject.teacherUid === currentUser.uid
                      )
                      .map((subject) => (
                        <SubjectOverviewCard
                          key={subject.subject}
                          subject={subject.subject}
                          requirements={
                            classData.requirements[subject.subject] || []
                          }
                        />
                      ))}
                  </div>
                </div>
              )}

              {}
              {selectedClass && selectedSubject && (
                <>
                  {}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                      {}
                      <div className="flex-1 relative">
                        <FontAwesomeIcon
                          icon={faSearch}
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                        />
                        <input
                          type="text"
                          placeholder="Search requirements..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      {}
                      <div className="flex gap-2">
                        <select
                          value={filterCategory}
                          onChange={(e) => setFilterCategory(e.target.value)}
                          className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="all">All Categories</option>
                          <option value="academic">Academic</option>
                          <option value="behavioral">Behavioral</option>
                          <option value="financial">Financial</option>
                          <option value="administrative">Administrative</option>
                          <option value="extracurricular">
                            Extracurricular
                          </option>
                        </select>

                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="name">Sort by Name</option>
                          <option value="category">Sort by Category</option>
                          <option value="date">Sort by Date</option>
                        </select>

                        <button
                          onClick={() =>
                            setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                          }
                          className="px-3 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          <FontAwesomeIcon
                            icon={sortOrder === "asc" ? faArrowUp : faArrowDown}
                          />
                        </button>

                        <div className="flex bg-gray-100 rounded-lg p-1">
                          <button
                            onClick={() => setViewMode("grid")}
                            className={`p-2 rounded ${
                              viewMode === "grid" ? "bg-white shadow-sm" : ""
                            }`}
                          >
                            <FontAwesomeIcon icon={faThLarge} />
                          </button>
                          <button
                            onClick={() => setViewMode("list")}
                            className={`p-2 rounded ${
                              viewMode === "list" ? "bg-white shadow-sm" : ""
                            }`}
                          >
                            <FontAwesomeIcon icon={faListUl} />
                          </button>
                        </div>
                      </div>

                      {}
                      <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <FontAwesomeIcon icon={faPlus} className="mr-2" />
                        Add New
                      </button>
                    </div>

                    {}
                    {selectedRequirements.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {selectedRequirements.length} requirement(s) selected
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedRequirements([])}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                          >
                            Clear Selection
                          </button>
                          <button
                            onClick={() => setIsBulkDeleteModalOpen(true)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <FontAwesomeIcon icon={faTrash} className="mr-2" />
                            Delete Selected
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {}
                  {filteredRequirements.length === 0 ? (
                    <EmptyState
                      message="No requirements found. Add your first requirement to get started."
                      icon={faClipboardList}
                      actionText="Add Requirement"
                      onAction={() => setIsAddModalOpen(true)}
                    />
                  ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredRequirements.map((requirement) => (
                        <RequirementCard
                          key={requirement.id}
                          requirement={requirement}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-4 text-left">
                                <input
                                  type="checkbox"
                                  checked={
                                    selectedRequirements.length ===
                                      filteredRequirements.length &&
                                    filteredRequirements.length > 0
                                  }
                                  onChange={handleSelectAll}
                                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                />
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Category
                              </th>
                              <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredRequirements.map((requirement) => {
                              const categoryStyle = getCategoryColor(
                                requirement.category
                              );
                              const isSelected = selectedRequirements.includes(
                                requirement.id
                              );

                              return (
                                <tr
                                  key={requirement.id}
                                  className={`hover:bg-gray-50 ${
                                    isSelected ? "bg-blue-50" : ""
                                  }`}
                                >
                                  <td className="px-6 py-4">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() =>
                                        handleSelectRequirement(requirement.id)
                                      }
                                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                    />
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">
                                        {requirement.name}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {requirement.description}
                                      </p>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${categoryStyle.bg} ${categoryStyle.text}`}
                                    >
                                      <FontAwesomeIcon
                                        icon={categoryStyle.icon}
                                        className="w-3 h-3"
                                      />
                                      {requirement.category}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <div className="flex items-center justify-center gap-2">
                                      <button
                                        onClick={() =>
                                          handleEditRequirement(requirement)
                                        }
                                        className="text-blue-600 hover:text-blue-900"
                                        title="Edit"
                                      >
                                        <FontAwesomeIcon icon={faEdit} />
                                      </button>
                                      <button
                                        onClick={() => {
                                          setRequirementToDuplicate(
                                            requirement
                                          );
                                          setIsDuplicateModalOpen(true);
                                        }}
                                        className="text-gray-600 hover:text-gray-900"
                                        title="Duplicate"
                                      >
                                        <FontAwesomeIcon icon={faCopy} />
                                      </button>
                                      <button
                                        onClick={() =>
                                          openDeleteModal(requirement)
                                        }
                                        className="text-red-600 hover:text-red-900"
                                        title="Delete"
                                      >
                                        <FontAwesomeIcon icon={faTrash} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {}
      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)}>
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Edit Requirement
          </h3>
          {editRequirement && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requirement Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editRequirement.name}
                  onChange={(e) =>
                    setEditRequirement({
                      ...editRequirement,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editRequirement.description}
                  onChange={(e) =>
                    setEditRequirement({
                      ...editRequirement,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={editRequirement.category}
                  onChange={(e) =>
                    setEditRequirement({
                      ...editRequirement,
                      category: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="academic">Academic</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="financial">Financial</option>
                  <option value="administrative">Administrative</option>
                  <option value="extracurricular">Extracurricular</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {}
      <Modal isOpen={isAddModalOpen} onClose={closeAddModal}>
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            Add New Requirement
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requirement Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newRequirement.name}
                onChange={(e) =>
                  setNewRequirement({ ...newRequirement, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter requirement name..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={newRequirement.description}
                onChange={(e) =>
                  setNewRequirement({
                    ...newRequirement,
                    description: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                placeholder="Enter requirement description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={newRequirement.category}
                onChange={(e) =>
                  setNewRequirement({
                    ...newRequirement,
                    category: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="academic">Academic</option>
                <option value="behavioral">Behavioral</option>
                <option value="financial">Financial</option>
                <option value="administrative">Administrative</option>
                <option value="extracurricular">Extracurricular</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={closeAddModal}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRequirement}
                disabled={!newRequirement.name.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Requirement
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {}
      <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal}>
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <FontAwesomeIcon
              icon={faExclamationTriangle}
              className="text-red-600 text-xl"
            />
          </div>

          <h3 className="text-lg font-semibold text-center mb-2">
            Delete Requirement
          </h3>

          <p className="text-gray-600 text-center mb-6">
            Are you sure you want to delete{" "}
            <strong>"{requirementToDelete?.name}"</strong>? This action cannot
            be undone.
          </p>

          <div className="flex justify-center gap-3">
            <button
              onClick={closeDeleteModal}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteRequirement}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {}
      <Modal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
      >
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <FontAwesomeIcon icon={faTrash} className="text-red-600 text-xl" />
          </div>

          <h3 className="text-lg font-semibold text-center mb-2">
            Delete Multiple Requirements
          </h3>

          <p className="text-gray-600 text-center mb-6">
            Are you sure you want to delete {selectedRequirements.length}{" "}
            selected requirement(s)? This action cannot be undone.
          </p>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => setIsBulkDeleteModalOpen(false)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Delete All
            </button>
          </div>
        </div>
      </Modal>

      {}
      <Modal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
      >
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full mb-4">
            <FontAwesomeIcon icon={faCopy} className="text-blue-600 text-xl" />
          </div>

          <h3 className="text-lg font-semibold text-center mb-2">
            Duplicate Requirement
          </h3>

          <p className="text-gray-600 text-center mb-6">
            Create a copy of <strong>"{requirementToDuplicate?.name}"</strong>?
          </p>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => setIsDuplicateModalOpen(false)}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDuplicateRequirement}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Duplicate
            </button>
          </div>
        </div>
      </Modal>
    </Sidebar>
  );
}

export default ManageRequirements;