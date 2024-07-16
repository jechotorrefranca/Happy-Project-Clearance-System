import React, { useState, useEffect } from "react";
import { useSignInWithEmailAndPassword } from "react-firebase-hooks/auth";
import { auth, db } from "../firebaseConfig";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail, User, Key } from "lucide-react";
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
  const [signInWithEmailAndPassword, user, loading, error] =
    useSignInWithEmailAndPassword(auth);
  const [localError, setLocalError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserRole = async () => {
      if (user) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("uid", "==", user.user.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();

          switch (userData.role) {
            case "faculty":
              navigate("/approve-clearance-faculty");
              break;
            case "student":
              navigate("/studentdashboard");
              break;
            case "super-admin":
              navigate("/user-management");
              break;
            case "Librarian":
            case "Character Renewal Office":
            case "Finance":
            case "Basic Education Registrar":
            case "College Library":
            case "Guidance Office":
            case "Office of The Dean":
            case "Office of the Finance Director":
            case "Office of the Registrar":
            case "Property Custodian":
            case "Student Council":
            case "Director/Principal":
            case "OSAS":
              navigate("/approve-clearance-office");
              break;
            default:
              navigate("/dashboard");
          }
        } else {
          console.error("No such document!");
        }
      }
    };

    checkUserRole();
  }, [user, navigate]);

  const handleSignIn = async (e) => {
    e.preventDefault();

    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      if (userData.isLocked) {
        setLocalError(
          "Your account is locked due to multiple failed sign-in attempts."
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

        if (failedAttempts >= 2) {
          await updateDoc(doc(db, "users", userDoc.id), {
            failedSignInAttempts: 3,
            isLocked: true,
          });
          setLocalError(
            "Your account is locked due to multiple failed sign-in attempts."
          );
        } else {
          await updateDoc(doc(db, "users", userDoc.id), {
            failedSignInAttempts: failedAttempts + 1,
          });
          setLocalError("Invalid email or password.");
        }

        await addDoc(auditLogsRef, {
          timestamp: serverTimestamp(),
          userId: userDoc.id,
          actionType: "login_failed",
          email: email,
        });
      }
    } else {
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, "users", userDoc.id), {
          failedSignInAttempts: 0,
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 bg-opacity-50" style={{ backgroundImage: "url('https://scontent.fcrk3-2.fna.fbcdn.net/v/t1.6435-9/118802707_4386688541373004_6769550702385255298_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=13d280&_nc_eui2=AeF-UhkeyDDV_sdJ3IGn9Z31duFTBENvhZR24VMEQ2-FlG4q2lIMBjkQuyxWsF0zyP27PjYXLTna5IE5QuYrh9tU&_nc_ohc=Qr-BScnppdYQ7kNvgEqtQig&_nc_ht=scontent.fcrk3-2.fna&oh=00_AYDj0EUB-w8R94RVxK3ToUlIlxjqJUZ-1Rs9cHbLb5VTxQ&oe=66A3743D')", backgroundSize: "cover", backgroundRepeat: "no-repeat", backgroundPosition: "center" }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
        className="bg-[#ffffffe5] p-10 rounded-lg shadow-2xl w-[90%] sm:max-w-md"
      >
        <div className="flex justify-center mb-6">
          <img
            src="https://dyci.edu.ph/img/DYCI.png"
            alt="DYCI Logo"
            className="h-16"
          />
        </div>
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-bold mb-6 text-center text-blue-800"
        >
          Sign In
        </motion.h1>
        <p className="text-gray-600 text-center mb-6">
          Welcome to the DYCIAN Clearance System
        </p>
        <AnimatePresence>
          {(error || localError) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6"
              role="alert"
            >
              <p className="font-bold">Error</p>
              <p>{localError || error.message}</p>
            </motion.div>
          )}
        </AnimatePresence>
        <form onSubmit={handleSignIn} className="space-y-6">
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Email
            </label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="email"
                className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 text-lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="password"
                className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-700 text-lg"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                to="/forgot-password"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Forgot your password?
              </Link>
            </div>
          </div>
          <motion.button
            type="submit"
            className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors text-lg"
            disabled={loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default SignIn;
