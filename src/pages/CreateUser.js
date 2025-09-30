import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  collection,
  addDoc,
  setDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

import { getApp, getApps, initializeApp, deleteApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from "firebase/auth";

import Sidebar from "../components/Sidebar";
import { useAuth } from "../components/AuthContext";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faEnvelope,
  faLock,
  faUserShield,
  faGraduationCap,
  faBuilding,
  faCheck,
  faTimes,
  faExclamationTriangle,
  faInfoCircle,
  faEye,
  faEyeSlash,
  faChevronLeft,
  faCheckCircle,
  faSpinner,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";

const InputField = React.memo(function InputField({
  label,
  icon,
  error,
  required = false,
  children,
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        <FontAwesomeIcon icon={icon} className="mr-2 text-gray-400" />
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" />
          {error}
        </p>
      )}
    </div>
  );
});

function CreateUser() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [errors, setErrors] = useState({});
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const collegeRoles = [
    { value: "College Library", label: "College Library", icon: "📚" },
    { value: "Guidance Office", label: "Guidance Office", icon: "🧭" },
    { value: "Office of The Dean", label: "Office of The Dean", icon: "🎓" },
    {
      value: "Office of the Finance Director",
      label: "Office of the Finance Director",
      icon: "💰",
    },
    {
      value: "Office of the Registrar",
      label: "Office of the Registrar",
      icon: "📋",
    },
    { value: "Property Custodian", label: "Property Custodian", icon: "🏢" },
    { value: "Student Council", label: "Student Council", icon: "👥" },
    { value: "OSAS", label: "OSAS", icon: "🎯" },
  ];

  const otherRoles = [
    { value: "Librarian", label: "Librarian", icon: "📚" },
    {
      value: "Character Renewal Office",
      label: "Character Renewal Office",
      icon: "✨",
    },
    { value: "Finance", label: "Finance", icon: "💰" },
    {
      value: "Basic Education Registrar",
      label: "Basic Education Registrar",
      icon: "📋",
    },
    { value: "Director/Principal", label: "Director/Principal", icon: "👔" },
    { value: "OSAS", label: "OSAS", icon: "🎯" },
  ];

  const collegeDepartments = [
    "College of Health Sciences",
    "College of Business Administration",
    "College of Computer Studies",
    "College of Accountancy",
    "College of Education",
    "College of Arts and Sciences",
    "College of Hospitality Management and Tourism",
    "College of Maritime Education",
    "School of Mechanical Engineering",
  ];

  const educationLevels = [
    {
      value: "elementary",
      label: "Elementary",
      icon: "🎒",
      color: "bg-green-100 text-green-700",
    },
    {
      value: "junior high school",
      label: "Junior High School",
      icon: "📖",
      color: "bg-blue-100 text-blue-700",
    },
    {
      value: "senior high school",
      label: "Senior High School",
      icon: "🎓",
      color: "bg-purple-100 text-purple-700",
    },
    {
      value: "college",
      label: "College",
      icon: "🏛️",
      color: "bg-orange-100 text-orange-700",
    },
  ];

  const checkPasswordStrength = (pass) => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (pass.match(/[a-z]/) && pass.match(/[A-Z]/)) strength++;
    if (pass.match(/[0-9]/)) strength++;
    if (pass.match(/[^a-zA-Z0-9]/)) strength++;
    setPasswordStrength(strength);
    return strength;
  };

  const validateForm = () => {
    const newErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!educationLevel) {
      newErrors.educationLevel = "Education level is required";
    }

    if (!role) {
      newErrors.role = "Role is required";
    }

    if (
      educationLevel === "college" &&
      (role === "Office of The Dean" || role === "Student Council") &&
      !department
    ) {
      newErrors.department = "Department is required for this role";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const primaryApp = getApp();
      const SECONDARY_NAME = "ADMIN_HELPER";
      const secondaryApp =
        getApps().find((a) => a.name === SECONDARY_NAME) ||
        initializeApp(primaryApp.options, SECONDARY_NAME);

      const secondaryAuth = getAuth(secondaryApp);

      const userCred = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        password
      );
      const newUser = userCred.user;

      try {
        await sendEmailVerification(newUser);
      } catch (e) {
        console.warn("Could not send verification email:", e);
      }

      const userData = {
        uid: newUser.uid,
        email,
        role,
        educationLevel,
        department:
          educationLevel === "college" &&
          (role === "Office of The Dean" || role === "Student Council")
            ? department
            : null,
        createdAt: serverTimestamp(),
        createdBy: currentUser?.uid || null,
        active: true,
      };

      await setDoc(doc(db, "users", newUser.uid), userData);

      await addDoc(collection(db, "auditLogs"), {
        timestamp: serverTimestamp(),
        userId: currentUser?.uid || null,
        actionType: "create_user",
        email: currentUser?.email || null,
        details: {
          createdUserUid: newUser.uid,
          createdUserEmail: email,
          createdUserRole: role,
          educationLevel,
          department,
        },
      });

      try {
        await signOut(secondaryAuth);
      } catch {}
      try {
        await deleteApp(secondaryApp);
      } catch {}

      setShowSuccessMessage(true);
      setTimeout(() => {
        navigate("/user-management");
      }, 2000);
    } catch (error) {
      console.error("Error creating user: ", error);
      const messageMap = {
        "auth/email-already-in-use": "That email is already registered.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/weak-password": "Password is too weak. Try a stronger one.",
        "auth/network-request-failed":
          "Network error. Check your connection or ad blocker.",
        "auth/operation-not-allowed":
          "Email/Password sign-in is not enabled in Firebase Console.",
      };
      const code = error?.code;
      setErrors({
        submit:
          messageMap[code] ||
          error.message ||
          "Error creating user. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 1:
        return "bg-red-500";
      case 2:
        return "bg-yellow-500";
      case 3:
        return "bg-blue-500";
      case 4:
        return "bg-green-500";
      default:
        return "bg-gray-300";
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 1:
        return "Weak";
      case 2:
        return "Fair";
      case 3:
        return "Good";
      case 4:
        return "Strong";
      default:
        return "";
    }
  };

  return (
    <Sidebar>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {}
          <div className="mb-8">
            <button
              onClick={() => navigate("/user-management")}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
              Back to User Management
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Create New User
            </h1>
            <p className="mt-2 text-gray-600">
              Add a new user account to the system
            </p>
          </div>

          {}
          {showSuccessMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center">
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  className="text-green-600 text-xl mr-3"
                />
                <div>
                  <h3 className="text-sm font-medium text-green-800">
                    User created successfully!
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    Redirecting to user management...
                  </p>
                </div>
              </div>
            </div>
          )}

          {}
          <form onSubmit={handleSubmit} className="space-y-8">
            {}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faUser}
                    className="text-blue-600 text-sm"
                  />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Account Information
                </h2>
              </div>

              <div className="space-y-6">
                {}
                <InputField
                  label="Email Address"
                  icon={faEnvelope}
                  error={errors.email}
                  required
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors((prev) => ({ ...prev, email: "" }));
                    }}
                    placeholder="user@example.com"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                      errors.email ? "border-red-300" : "border-gray-300"
                    }`}
                  />
                </InputField>

                {}
                <InputField
                  label="Password"
                  icon={faLock}
                  error={errors.password}
                  required
                >
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        checkPasswordStrength(e.target.value);
                        setErrors((prev) => ({ ...prev, password: "" }));
                      }}
                      placeholder="Enter a strong password"
                      className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.password ? "border-red-300" : "border-gray-300"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <FontAwesomeIcon
                        icon={showPassword ? faEyeSlash : faEye}
                      />
                    </button>
                  </div>
                  {password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">
                          Password Strength:
                        </span>
                        <span
                          className={`text-xs font-medium ${
                            passwordStrength === 4
                              ? "text-green-600"
                              : passwordStrength === 3
                              ? "text-blue-600"
                              : passwordStrength === 2
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                          style={{ width: `${(passwordStrength / 4) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </InputField>

                {}
                <InputField
                  label="Confirm Password"
                  icon={faLock}
                  error={errors.confirmPassword}
                  required
                >
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                      }}
                      placeholder="Re-enter password"
                      className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                        errors.confirmPassword
                          ? "border-red-300"
                          : "border-gray-300"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <FontAwesomeIcon
                        icon={showConfirmPassword ? faEyeSlash : faEye}
                      />
                    </button>
                  </div>
                  {confirmPassword && password === confirmPassword && (
                    <p className="mt-1 text-sm text-green-600 flex items-center">
                      <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                      Passwords match
                    </p>
                  )}
                </InputField>
              </div>
            </div>

            {}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faUserShield}
                    className="text-purple-600 text-sm"
                  />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Role Configuration
                </h2>
              </div>

              <div className="space-y-6">
                {}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <FontAwesomeIcon
                      icon={faGraduationCap}
                      className="mr-2 text-gray-400"
                    />
                    Education Level <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {educationLevels.map((level) => (
                      <button
                        key={level.value}
                        type="button"
                        onClick={() => {
                          setEducationLevel(level.value);
                          setRole("");
                          setDepartment("");
                          setErrors((prev) => ({
                            ...prev,
                            educationLevel: "",
                          }));
                        }}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          educationLevel === level.value
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{level.icon}</span>
                          <div className="text-left">
                            <p className="font-medium text-gray-900">
                              {level.label}
                            </p>
                          </div>
                          {educationLevel === level.value && (
                            <FontAwesomeIcon
                              icon={faCheckCircle}
                              className="text-blue-500 ml-auto"
                            />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  {errors.educationLevel && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <FontAwesomeIcon
                        icon={faExclamationTriangle}
                        className="mr-1"
                      />
                      {errors.educationLevel}
                    </p>
                  )}
                </div>

                {}
                {educationLevel && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <FontAwesomeIcon
                        icon={faUserShield}
                        className="mr-2 text-gray-400"
                      />
                      User Role <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(educationLevel === "college"
                        ? collegeRoles
                        : otherRoles
                      ).map((roleOption) => (
                        <button
                          key={roleOption.value}
                          type="button"
                          onClick={() => {
                            setRole(roleOption.value);
                            setErrors((prev) => ({ ...prev, role: "" }));
                          }}
                          className={`p-3 rounded-lg border-2 transition-all text-left ${
                            role === roleOption.value
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300 bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{roleOption.icon}</span>
                            <span className="text-sm font-medium text-gray-900">
                              {roleOption.label}
                            </span>
                            {role === roleOption.value && (
                              <FontAwesomeIcon
                                icon={faCheckCircle}
                                className="text-blue-500 ml-auto"
                              />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                    {errors.role && (
                      <p className="mt-2 text-sm text-red-600 flex items-center">
                        <FontAwesomeIcon
                          icon={faExclamationTriangle}
                          className="mr-1"
                        />
                        {errors.role}
                      </p>
                    )}
                  </div>
                )}

                {}
                {educationLevel === "college" &&
                  (role === "Office of The Dean" ||
                    role === "Student Council") && (
                    <InputField
                      label="Department"
                      icon={faBuilding}
                      error={errors.department}
                      required
                    >
                      <select
                        value={department}
                        onChange={(e) => {
                          setDepartment(e.target.value);
                          setErrors((prev) => ({ ...prev, department: "" }));
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                          errors.department
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                      >
                        <option value="">Select Department</option>
                        {collegeDepartments.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-gray-500 flex items-center">
                        <FontAwesomeIcon icon={faInfoCircle} className="mr-1" />
                        Department is required for Dean's Office and Student
                        Council roles
                      </p>
                    </InputField>
                  )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigate("/user-management")}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} spin />
                    Creating User...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faUserPlus} />
                    Create User
                  </>
                )}
              </button>
            </div>

            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center">
                  <FontAwesomeIcon
                    icon={faExclamationTriangle}
                    className="text-red-600 mr-3"
                  />
                  <p className="text-sm text-red-800">{errors.submit}</p>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </Sidebar>
  );
}

export default CreateUser;
