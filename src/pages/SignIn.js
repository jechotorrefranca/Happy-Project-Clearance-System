import React, { useState, useEffect } from "react";
import { useSignInWithEmailAndPassword } from "react-firebase-hooks/auth";
import { auth, db } from "../firebaseConfig";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Shield,
  LogIn,
  ChevronRight,
  Info,
  X,
  Loader2,
  KeyRound,
  UserCheck,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [signInWithEmailAndPassword, user, loading, error] =
    useSignInWithEmailAndPassword(auth);
  const [localError, setLocalError] = useState(null);
  const [attemptsRemaining, setAttemptsRemaining] = useState(null);
  const [isValidEmail, setIsValidEmail] = useState(true);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();

  const schoolImages = [
    "https://dyci.edu.ph/assets/slideshow/0.webp",
    "https://dyci.edu.ph/assets/slideshow/2.webp",
    "https://dyci.edu.ph/assets/slideshow/3.webp",
    "https://dyci.edu.ph/assets/slideshow/8.webp",
    "https://dyci.edu.ph/assets/slideshow/9.webp",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex(
        (prevIndex) => (prevIndex + 1) % schoolImages.length
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [schoolImages.length]);

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    const checkUserRole = async () => {
      if (user) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("uid", "==", user.user.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();
          const userRole = userData.role;

          if (rememberMe) {
            localStorage.setItem("rememberedEmail", email);
          } else {
            localStorage.removeItem("rememberedEmail");
          }

          if (userRole === "faculty") {
            navigate("/approve-clearance-faculty");
          } else if (
            userRole !== "super-admin" && 
            userRole !== "admin" && 
            userRole !== "student" && 
            userRole !== "faculty"
          ) {
            navigate("/approve-clearance-office");
          } else {
            navigate("/dashboard");
          }
        } else {
          console.error("No such document!");
        }
      }
    };

    checkUserRole();
  }, [user, navigate, email, rememberMe]);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (emailTouched) {
      setIsValidEmail(validateEmail(value));
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);

    let strength = 0;
    if (value.length >= 8) strength++;
    if (value.match(/[a-z]/) && value.match(/[A-Z]/)) strength++;
    if (value.match(/[0-9]/)) strength++;
    if (value.match(/[^a-zA-Z0-9]/)) strength++;
    setPasswordStrength(strength);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setAttemptsRemaining(null);

    if (!validateEmail(email)) {
      setIsValidEmail(false);
      setLocalError("Please enter a valid email address.");
      return;
    }

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      if (userData.isLocked) {
        setLocalError(
          "Your account has been locked for security reasons. Please contact support to unlock your account."
        );
        return;
      }
    }

    await signInWithEmailAndPassword(email, password);

    const auditLogsRef = collection(db, "auditLogs");

    if (error) {
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        const failedAttempts = userData.failedSignInAttempts || 0;
        const remainingAttempts = 2 - failedAttempts;

        if (failedAttempts >= 2) {
          await updateDoc(doc(db, "users", userDoc.id), {
            failedSignInAttempts: 3,
            isLocked: true,
          });
          setLocalError(
            "Your account has been locked due to multiple failed sign-in attempts. Please contact support."
          );
        } else {
          await updateDoc(doc(db, "users", userDoc.id), {
            failedSignInAttempts: failedAttempts + 1,
          });
          setAttemptsRemaining(remainingAttempts);
          setLocalError("Invalid email or password.");
        }

        await addDoc(auditLogsRef, {
          timestamp: serverTimestamp(),
          userId: userDoc.id,
          actionType: "login_failed",
          email: email,
        });
      } else {
        setLocalError("Invalid email or password.");
      }
    } else {
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, "users", userDoc.id), {
          failedSignInAttempts: 0,
          lastLogin: serverTimestamp(),
        });

        await addDoc(auditLogsRef, {
          timestamp: serverTimestamp(),
          userId: userDoc.id,
          actionType: "login_success",
          email: email,
        });
      }
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

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {}
        <div className="absolute inset-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <img
                src={schoolImages[currentImageIndex]}
                alt="DYCI Campus"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/90 to-indigo-700/90"></div>

        {}
        <div className="relative z-10 w-full p-12 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-white text-3xl font-bold">iClear</h2>
                <p className="text-blue-100 text-sm">
                  Clearance Management System
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {
}
          </div>

          <div>
            <div className="flex justify-center gap-2 mt-6">
              {schoolImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentImageIndex
                      ? "w-8 bg-white"
                      : "w-2 bg-white/40 hover:bg-white/60"
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
            <p className="text-blue-100 text-sm">
              © 2024 Dr. Yanga's Colleges Inc. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl mb-6"
            >
              <img
                src="https://dyci.edu.ph/assets/logo/dyci-logo.webp"
                alt="DYCI Logo"
                className="h-20 w-auto"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600">Sign in to your iClear account</p>
            </motion.div>
          </div>

          <AnimatePresence>
            {(error || localError) && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mb-6"
              >
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start">
                    <ShieldAlert className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800">
                        {localError || error.message}
                      </p>
                      {attemptsRemaining !== null && attemptsRemaining > 0 && (
                        <p className="text-xs text-red-600 mt-1">
                          {attemptsRemaining} attempt
                          {attemptsRemaining !== 1 ? "s" : ""} remaining before
                          account lock
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSignIn} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail
                    className={`h-5 w-5 ${
                      emailTouched && !isValidEmail
                        ? "text-red-500"
                        : "text-gray-400"
                    }`}
                  />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={() => setEmailTouched(true)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:outline-none transition-colors ${
                    emailTouched && !isValidEmail
                      ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                      : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                  }`}
                  placeholder="you@example.com"
                  required
                />
                {emailTouched && !isValidEmail && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                )}
              </div>
              {emailTouched && !isValidEmail && (
                <p className="mt-1 text-sm text-red-600">
                  Please enter a valid email address
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-blue-600 hover:text-blue-500"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handlePasswordChange}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-500 focus:outline-none transition-colors"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>

              {password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          passwordStrength >= level
                            ? getPasswordStrengthColor()
                            : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Remember me</span>
              </label>
              <div className="flex items-center text-sm text-gray-500">
                <Shield className="h-4 w-4 mr-1" />
                Secure Login
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading || !email || !password}
              className={`w-full py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                loading || !email || !password
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl"
              }`}
              whileHover={!loading && email && password ? { scale: 1.02 } : {}}
              whileTap={!loading && email && password ? { scale: 0.98 } : {}}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  <span>Sign In</span>
                </>
              )}
            </motion.button>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100"
          >
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Security Notice</p>
                <p className="text-xs">
                  Your account will be locked after 3 failed login attempts. For
                  assistance, contact the IT support team.
                </p>
              </div>
            </div>
          </motion.div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Need help?{" "}
              <a
                href="#"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Contact Support
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SignIn;