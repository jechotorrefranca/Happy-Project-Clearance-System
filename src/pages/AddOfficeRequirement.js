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
import { useNavigate, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Select from "react-select";
import Modal from "../components/Modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClipboardList,
  faPlus,
  faGraduationCap,
  faBuilding,
  faInfoCircle,
  faCheckCircle,
  faExclamationTriangle,
  faFileAlt,
  faLayerGroup,
  faSpinner,
  faSchool,
  faUniversity,
  faUserGraduate,
  faBook,
  faSave,
  faArrowLeft,
  faQuestionCircle,
  faLightbulb,
  faPencilAlt,
  faTag,
  faAlignLeft,
  faEye,
  faCheck,
  faTimes,
  faExclamationCircle,
  faClipboardCheck,
  faListCheck,
  faMagic,
} from "@fortawesome/free-solid-svg-icons";

function AddOfficeRequirement() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [educationLevels, setEducationLevels] = useState([]);
  const [selectedEducationLevels, setSelectedEducationLevels] = useState([]);
  const [requirementName, setRequirementName] = useState("");
  const [requirementDescription, setRequirementDescription] = useState("");
  const [officeName, setOfficeName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [userDepartment, setUserDepartment] = useState(null);
  const [isOfficeOfTheDean, setIsOfficeOfTheDean] = useState(false);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      borderColor: state.isFocused ? '#3b82f6' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
      '&:hover': {
        borderColor: '#3b82f6',
      },
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#dbeafe',
      borderRadius: '6px',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#1e40af',
      fontWeight: '500',
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: '#1e40af',
      '&:hover': {
        backgroundColor: '#93c5fd',
        color: '#1e3a8a',
      },
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#eff6ff' : 'white',
      color: state.isSelected ? 'white' : '#111827',
      '&:hover': {
        backgroundColor: state.isSelected ? '#2563eb' : '#eff6ff',
      },
    }),
  };

  useEffect(() => {
    if (location.state?.duplicate) {
      const { name, description, educationLevels: levels } = location.state.duplicate;
      setRequirementName(name);
      setRequirementDescription(description);
      if (levels && levels.length > 0) {
        setSelectedEducationLevels(
          levels.map(level => ({
            value: level,
            label: formatEducationLevel(level)
          }))
        );
      }
    }
  }, [location.state]);

  useEffect(() => {
    fetchEducationLevels();
    fetchUserRole();
  }, [currentUser]);

  const fetchEducationLevels = async () => {
    try {
      const classesSnapshot = await getDocs(collection(db, "classes"));
      const uniqueEducationLevels = [
        ...new Set(
          classesSnapshot.docs.map((doc) => doc.data().educationLevel)
        ),
      ];
      setEducationLevels(
        uniqueEducationLevels.map((level) => ({ 
          value: level, 
          label: formatEducationLevel(level),
          icon: getEducationLevelIcon(level),
        }))
      );
    } catch (error) {
      console.error("Error fetching education levels:", error);
    }
  };

  const fetchUserRole = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const userRef = collection(db, "users");
      const userQuery = query(userRef, where("uid", "==", currentUser.uid));
      const userDoc = await getDocs(userQuery);
      const userData = userDoc.docs[0].data();
      const userRole = userData.role;
      setUserDepartment(userData.department || null);

      const officeMapping = {
        "Librarian": "Librarian",
        "Finance": "Finance",
        "Basic Education Registrar": "Basic Education Registrar",
        "Character Renewal Office": "Character Renewal Office",
        "College Library": "College Library",
        "Guidance Office": "Guidance Office",
        "Office of The Dean": "Office of The Dean",
        "Office of the Finance Director": "Office of the Finance Director",
        "Office of the Registrar": "Office of the Registrar",
        "Property Custodian": "Property Custodian",
        "Student Council": "Student Council",
        "Director/Principal": "Director/Principal",
      };

      const office = officeMapping[userRole] || "Unknown Office";
      setOfficeName(office);

      if (userRole === "Office of The Dean") {
        setIsOfficeOfTheDean(true);
        setSelectedEducationLevels([
          { value: "college", label: "College" },
        ]);
      }

      loadSuggestions(office);
    } catch (error) {
      console.error("Error fetching user role:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = (office) => {
    const suggestionMap = {
      "Librarian": [
        "Return all borrowed books",
        "Clear library fines",
        "Return library ID card",
      ],
      "Finance": [
        "Settle all outstanding fees",
        "Clear tuition balance",
        "Submit payment receipts",
      ],
      "Basic Education Registrar": [
        "Submit all required documents",
        "Complete academic records",
        "Return school ID",
      ],
      "Character Renewal Office": [
        "Complete character assessment",
        "Clear disciplinary records",
        "Submit behavior evaluation",
      ],
      "College Library": [
        "Return all borrowed materials",
        "Clear library dues",
        "Complete library exit survey",
      ],
      "Guidance Office": [
        "Complete exit interview",
        "Submit counseling clearance",
        "Return guidance materials",
      ],
      "Office of The Dean": [
        "Complete academic requirements",
        "Submit final project/thesis",
        "Attend required seminars",
      ],
      "Office of the Finance Director": [
        "Clear all financial obligations",
        "Submit financial clearance form",
        "Settle miscellaneous fees",
      ],
      "Office of the Registrar": [
        "Submit all academic documents",
        "Complete registration requirements",
        "Clear academic holds",
      ],
      "Property Custodian": [
        "Return all borrowed equipment",
        "Clear property accountability",
        "Submit equipment clearance form",
      ],
      "Student Council": [
        "Clear organization dues",
        "Return organization materials",
        "Complete activity requirements",
      ],
    };

    setSuggestions(suggestionMap[office] || []);
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
      elementary: "bg-green-100 text-green-800 border-green-200",
      juniorHighschool: "bg-blue-100 text-blue-800 border-blue-200",
      seniorHighschool: "bg-purple-100 text-purple-800 border-purple-200",
      college: "bg-orange-100 text-orange-800 border-orange-200",
    };
    return colorMap[level] || "bg-gray-100 text-gray-800 border-gray-200";
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

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (selectedEducationLevels.length === 0) {
          newErrors.educationLevels = "Please select at least one education level";
        }
        break;
      case 2:
        if (!requirementName.trim()) {
          newErrors.requirementName = "Requirement name is required";
        }
        if (!requirementDescription.trim()) {
          newErrors.requirementDescription = "Description is required";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(2)) return;

    setShowPreview(true);
  };

  const confirmAddRequirement = async () => {
    setShowPreview(false);
    setIsConfirmModalOpen(true);
  };

  const executeAddRequirement = async () => {
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
        name: requirementName.trim(),
        description: requirementDescription.trim(),
        addedBy: currentUser.uid,
        department: userDepartment,
        createdAt: new Date(),
        isActive: true,
      });

      setSuccessMessage("Requirement added successfully!");
      
      setTimeout(() => {
        setSelectedEducationLevels(
          isOfficeOfTheDean ? [{ value: "college", label: "College" }] : []
        );
        setRequirementName("");
        setRequirementDescription("");
        setCurrentStep(1);
        setSuccessMessage("");
        
        navigate("/manage-office-requirements");
      }, 2000);
    } catch (error) {
      console.error("Error adding requirement: ", error);
      alert("Error adding requirement. Please try again later.");
    } finally {
      setIsAdding(false);
    }
  };

  const applySuggestion = (suggestion) => {
    setRequirementName(suggestion);
    setRequirementDescription(`Students must ${suggestion.toLowerCase()}`);
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center">
        {}
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            currentStep >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'
          }`}>
            {currentStep > 1 ? (
              <FontAwesomeIcon icon={faCheck} />
            ) : (
              '1'
            )}
          </div>
          <span className={`ml-2 text-sm font-medium ${
            currentStep >= 1 ? 'text-gray-900' : 'text-gray-400'
          }`}>
            Education Levels
          </span>
        </div>
        
        {}
        <div className={`w-24 h-1 mx-4 ${
          currentStep > 1 ? 'bg-blue-500' : 'bg-gray-200'
        }`} />
        
        {}
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            currentStep >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400'
          }`}>
            {currentStep > 2 ? (
              <FontAwesomeIcon icon={faCheck} />
            ) : (
              '2'
            )}
          </div>
          <span className={`ml-2 text-sm font-medium ${
            currentStep >= 2 ? 'text-gray-900' : 'text-gray-400'
          }`}>
            Requirement Details
          </span>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <Sidebar>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <FontAwesomeIcon icon={faSpinner} className="text-4xl text-blue-500 animate-spin mb-4" />
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <button
                  onClick={() => navigate("/manage-office-requirements")}
                  className="p-2 hover:bg-gray-100 rounded-lg mr-4 transition-colors"
                >
                  <FontAwesomeIcon icon={faArrowLeft} className="text-gray-600" />
                </button>
                <div className="p-3 bg-blue-100 rounded-lg mr-4">
                  <FontAwesomeIcon icon={getOfficeIcon()} className="text-2xl text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Add New Requirement</h1>
                  <p className="text-gray-600 mt-1">Create a clearance requirement for {officeName}</p>
                </div>
              </div>
            </div>
          </div>

          {}
          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-500 mr-3" />
              <span className="text-green-800">{successMessage}</span>
            </div>
          )}

          {}
          <StepIndicator />

          {}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <form onSubmit={handleSubmit}>
              {}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      Select Education Levels
                    </h2>
                    <p className="text-sm text-gray-600">
                      Choose which education levels this requirement will apply to
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
                      <FontAwesomeIcon icon={faGraduationCap} className="mr-2 text-gray-400" />
                      Education Levels
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    
                    {isOfficeOfTheDean ? (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="flex items-center">
                          <FontAwesomeIcon icon={faInfoCircle} className="text-orange-400 mr-3" />
                          <div>
                            <p className="text-sm font-medium text-orange-800">
                              Office of The Dean - College Level Only
                            </p>
                            <p className="text-xs text-orange-700 mt-1">
                              This office can only add requirements for college-level students
                            </p>
                          </div>
                        </div>
                        <div className="mt-3">
                          <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium ${getEducationLevelColor('college')}`}>
                            <FontAwesomeIcon icon={faUniversity} className="mr-2" />
                            College
                          </span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Select
                          isMulti
                          value={selectedEducationLevels}
                          onChange={setSelectedEducationLevels}
                          options={educationLevels}
                          styles={customSelectStyles}
                          placeholder="Select one or more education levels..."
                          className="w-full"
                        />
                        
                        {}
                        <div className="mt-3">
                          <p className="text-xs text-gray-500 mb-2">Quick select:</p>
                          <div className="flex flex-wrap gap-2">
                            {educationLevels.map((level) => (
                              <button
                                key={level.value}
                                type="button"
                                onClick={() => {
                                  const isSelected = selectedEducationLevels.some(
                                    (selected) => selected.value === level.value
                                  );
                                  if (!isSelected) {
                                    setSelectedEducationLevels([...selectedEducationLevels, level]);
                                  }
                                }}
                                disabled={selectedEducationLevels.some(
                                  (selected) => selected.value === level.value
                                )}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                  selectedEducationLevels.some(
                                    (selected) => selected.value === level.value
                                  )
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                }`}
                              >
                                <FontAwesomeIcon icon={level.icon} className="mr-1" />
                                {level.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                    
                    {errors.educationLevels && (
                      <p className="mt-2 text-sm text-red-600">{errors.educationLevels}</p>
                    )}
                  </div>

                  {}
                  {selectedEducationLevels.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        This requirement will apply to:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedEducationLevels.map((level) => (
                          <span
                            key={level.value}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getEducationLevelColor(level.value)}`}
                          >
                            <FontAwesomeIcon icon={getEducationLevelIcon(level.value)} className="mr-2" />
                            {level.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleNextStep}
                      disabled={selectedEducationLevels.length === 0}
                      className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      Next Step
                      <FontAwesomeIcon icon={faArrowLeft} className="ml-2 rotate-180" />
                    </button>
                  </div>
                </div>
              )}

              {}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      Requirement Details
                    </h2>
                    <p className="text-sm text-gray-600">
                      Provide information about the requirement
                    </p>
                  </div>

                  {}
                  {suggestions.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start">
                        <FontAwesomeIcon icon={faLightbulb} className="text-blue-400 mt-1 mr-3" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-800 mb-2">
                            Suggested requirements for {officeName}:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {suggestions.map((suggestion, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => applySuggestion(suggestion)}
                                className="px-3 py-1 bg-white text-blue-700 rounded-lg text-xs hover:bg-blue-100 transition-colors border border-blue-300"
                              >
                                <FontAwesomeIcon icon={faMagic} className="mr-1" />
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {}
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <FontAwesomeIcon icon={faTag} className="mr-2 text-gray-400" />
                      Requirement Name
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      value={requirementName}
                      onChange={(e) => {
                        setRequirementName(e.target.value);
                        if (errors.requirementName) {
                          setErrors({ ...errors, requirementName: '' });
                        }
                      }}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.requirementName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Return all borrowed books"
                    />
                    {errors.requirementName && (
                      <p className="mt-1 text-sm text-red-600">{errors.requirementName}</p>
                    )}
                  </div>

                  {}
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <FontAwesomeIcon icon={faAlignLeft} className="mr-2 text-gray-400" />
                      Description
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <textarea
                      value={requirementDescription}
                      onChange={(e) => {
                        setRequirementDescription(e.target.value);
                        if (errors.requirementDescription) {
                          setErrors({ ...errors, requirementDescription: '' });
                        }
                      }}
                      rows="4"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.requirementDescription ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Provide a detailed description of what students need to do..."
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {requirementDescription.length}/500 characters
                    </p>
                    {errors.requirementDescription && (
                      <p className="mt-1 text-sm text-red-600">{errors.requirementDescription}</p>
                    )}
                  </div>

                  {}
                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={handlePreviousStep}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                    >
                      <FontAwesomeIcon icon={faArrowLeft} className="mr-2" />
                      Previous
                    </button>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setShowPreview(true)}
                        className="px-6 py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors flex items-center"
                      >
                        <FontAwesomeIcon icon={faEye} className="mr-2" />
                        Preview
                      </button>
                      <button
                        type="submit"
                        disabled={!requirementName.trim() || !requirementDescription.trim()}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        <FontAwesomeIcon icon={faSave} className="mr-2" />
                        Add Requirement
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          {}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <FontAwesomeIcon icon={faQuestionCircle} className="text-blue-400 mt-0.5 mr-3" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Need Help?</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Requirements are tasks students must complete for clearance</li>
                  <li>Each requirement can apply to multiple education levels</li>
                  <li>Students will see these requirements in their clearance checklist</li>
                  <li>Be clear and specific in your requirement descriptions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {}
      <Modal isOpen={showPreview} onClose={() => setShowPreview(false)}>
        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <FontAwesomeIcon icon={faEye} className="text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Preview Requirement</h3>
          </div>

          <div className="space-y-4">
            {}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Office</p>
              <div className="flex items-center">
                <FontAwesomeIcon icon={getOfficeIcon()} className="text-gray-600 mr-2" />
                <span className="text-gray-900">{officeName}</span>
              </div>
            </div>

            {}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Applies to:</p>
              <div className="flex flex-wrap gap-2">
                {selectedEducationLevels.map((level) => (
                  <span
                    key={level.value}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getEducationLevelColor(level.value)}`}
                  >
                    <FontAwesomeIcon icon={getEducationLevelIcon(level.value)} className="mr-2" />
                    {level.label}
                  </span>
                ))}
              </div>
            </div>

            {}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Requirement Name</p>
              <p className="text-gray-900">{requirementName || "Not provided"}</p>
            </div>

            {}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Description</p>
              <p className="text-gray-900">{requirementDescription || "Not provided"}</p>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setShowPreview(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Back to Edit
            </button>
            <button
              onClick={confirmAddRequirement}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
            >
              <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
              Confirm & Add
            </button>
          </div>
        </div>
      </Modal>

      {}
      <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)}>
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full mb-4">
            <FontAwesomeIcon icon={faCheckCircle} className="text-blue-600" />
          </div>
          
          <h3 className="text-lg font-semibold text-center mb-2">Confirm Addition</h3>
          
          <p className="text-gray-600 text-center mb-6">
            Are you sure you want to add this requirement? It will be immediately visible to students in the selected education levels.
          </p>
          
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setIsConfirmModalOpen(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={executeAddRequirement}
              disabled={isAdding}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isAdding ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faPlus} className="mr-2" />
                  Add Requirement
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </Sidebar>
  );
}

export default AddOfficeRequirement;