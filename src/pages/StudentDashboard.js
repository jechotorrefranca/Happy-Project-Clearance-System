import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../components/AuthContext";
import { db } from "../firebaseConfig";
import {
  getStorage,
  ref,
  uploadString,
  getDownloadURL,
} from "firebase/storage";
import { motion } from "framer-motion";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import Sidebar from "../components/Sidebar";
import SidebarStudent from "../components/SidebarStudent";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faTimesCircle,
} from "@fortawesome/free-solid-svg-icons";
import Modal from "../components/Modal";
import "./pdf.css";
import html2pdf from "html2pdf.js";
import { ToastContainer, toast, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { XMarkIcon } from "@heroicons/react/24/solid";

const SPECIAL_SUBJECTS = [
  "Librarian",
  "Finance",
  "Director/Principal",
  "Basic Education Registrar",
  "Class Adviser",
  "Character Renewal Office",
];

const StudentDashboard = () => {
  const { currentUser } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [greetings, setGreetings] = useState(null);
  const [loading, setLoading] = useState(false);
  const componentRef = useRef(null);
  const [hidden, setHidden] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [notcomplete, setNotcomplete] = useState(false);

  useEffect(() => {
    const updateGreeting = () => {
      const currentHour = new Date().getHours();
      if (currentHour < 12) {
        setGreetings("Good Morning");
      } else if (currentHour < 18) {
        setGreetings("Good Afternoon");
      } else {
        setGreetings("Good Evening");
      }
    };

    updateGreeting();
  }, []);

  // Fetch Student Data
  useEffect(() => {
    if (!currentUser) return;

    const fetchStudentData = async () => {
      try {
        const studentsRef = collection(db, "students");
        const q = query(studentsRef, where("uid", "==", currentUser.uid));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          querySnapshot.forEach((doc) => {
            setStudentData(doc.data());
          });
        });

        return () => {
          unsubscribe();
        };
      } catch (error) {
        console.error("Error fetching student data:", error);
      }
    };

    fetchStudentData();
  }, [currentUser, setStudentData]);

  const sortedSubjects = studentData?.clearance
    ? Object.keys(studentData.clearance).sort()
    : [];

  const regularSubjects = sortedSubjects.filter(
    (subject) => !SPECIAL_SUBJECTS.includes(subject)
  );

  const specialSubjects = sortedSubjects.filter((subject) =>
    SPECIAL_SUBJECTS.includes(subject)
  );

  const handleDownloadPDF = async () => {
    const incompleteClearance = Object.entries(
      studentData?.clearance || {}
    ).some(([subject, status]) => {
      if (subject === "Finance") {
        return false;
      }
      return !status;
    });

    if (incompleteClearance) {
      setNotcomplete(true);
      return;
    }

    setHidden(true);

    setTimeout(async () => {
      setLoading(true);

      const input = componentRef.current;

      try {
        const opt = {
          margin: 0,
          filename: `${currentUser.uid}_clearance.pdf`,
          image: { type: "jpeg", quality: 1.0 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
          pagebreak: { mode: "avoid-all" },
          html2pdf: { width: input.offsetWidth, height: input.offsetHeight },
        };

        const pdfDataUri = await html2pdf()
          .set(opt)
          .from(input)
          .toPdf()
          .output("datauristring");

        const storage = getStorage();
        const storageRef = ref(
          storage,
          `generatedPdf/${currentUser.uid}/${currentUser.uid}_clearance.pdf`
        );

        await uploadString(storageRef, pdfDataUri, "data_url");

        const downloadURL = await getDownloadURL(storageRef);

        setPdfUrl(downloadURL);

        showSuccessToast();
      } catch (error) {
        console.error("Error generating or uploading PDF:", error);
        showFailedToast();
      } finally {
        setLoading(false);
        setHidden(false);
      }
    }, 100);
  };

  const showSuccessToast = () =>
    toast.success("PDF Generated Successfully!", {
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

  const showFailedToast = () =>
    toast.error("PDF Generation Failed", {
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

  return (
    <SidebarStudent>
      <div className="container mx-auto bg-blue-100 rounded pb-10">
        <ToastContainer />

        <div className="bg-blue-300 p-5 rounded flex justify-center items-center mb-10">
          <h2 className="text-3xl font-bold text-blue-950">Dashboard</h2>
        </div>
        <div className="pb-10">
          <div className="flex justify-center items-center">
            <h2 className="text-2xl font-semibold mb-4 text-center p-3">
              {greetings}, {studentData?.fullName}!
            </h2>
          </div>

          <div className="flex justify-center">
            <div className="">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                className="mb-5 p-3 px-5 rounded-full text-base font-semibold bg-[#ffeeaa] text-[#494124] hover:bg-[#fce27c] shadow-md"
                onClick={handleDownloadPDF}
                disabled={loading}
              >
                {loading
                  ? "Generating Clearance PDF..."
                  : "Generate Clearance PDF"}
              </motion.button>

              {pdfUrl && (
                <motion.a
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:cursor-pointer p-3 px-5 rounded-full text-base font-semibold bg-[#aaffbf] text-[#24492c] hover:bg-[#7cfc82] shadow-md flex justify-center"
                >
                  Download PDF
                </motion.a>
              )}
            </div>
          </div>
        </div>

        {/* On Screen Page */}
        <div className="p-5 m-4 bg-[#ffffff] rounded-2xl">
          <div className="pb-5 sm:text-xl">
            <div className="flex print-layout justify-between">
              <div className="sm:flex">
                <p className="">Name:</p>
                <p className=" pl-1">
                  <strong>{studentData?.fullName}</strong>
                </p>
              </div>

              <div className="sm:flex">
                <p className="">Section:</p>
                <p className="pl-1">
                  <strong>{studentData?.section}</strong>
                </p>
              </div>
            </div>

            <div className="flex print-layout justify-between">
              {studentData?.department && (
                <div className="sm:flex">
                  <p className="">Department:</p>
                  <p className=" font pl-1">
                    <strong>{studentData?.department}</strong>
                  </p>
                </div>
              )}

              <div className="sm:flex">
                <p className="">Grade Level:</p>
                <p className=" pl-1">
                  <strong>{studentData?.gradeLevel}</strong>
                </p>
              </div>
            </div>

            <div className="flex print-layout justify-between">
              <div className="sm:flex">
                <p className="">
                  Student Number: <strong>{studentData?.studentId}</strong>
                </p>
              </div>
            </div>

            <div className="border-2 border-[#ebcd60] mt-6" />
          </div>

          {/* Regular Subjects Table */}
          <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center bg-gray-300 p-5">
            Student Clearance
          </h2>
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="py-5 px-2 border border-gray-400 bg-blue-300 sm:text-base text-sm">
                  Subject
                </th>
                <th className="py-5 px-2 border border-gray-400 text-center bg-[#fff2c1] sm:text-base text-sm">
                  Cleared
                </th>
              </tr>
            </thead>
            <tbody>
              {regularSubjects.map((subject) => (
                <React.Fragment key={subject}>
                  <tr>
                    <td className="border border-gray-400 px-4 py-2 bg-blue-100 text-sm  sm:text-base">
                      {subject}
                    </td>
                    <td className="border border-gray-400 px-4 py-2 text-center bg-[#fffcf2]">
                      {studentData.clearance[subject] ? (
                        <FontAwesomeIcon
                          icon={faCheckCircle}
                          className="text-green-500"
                        />
                      ) : (
                        <FontAwesomeIcon
                          icon={faTimesCircle}
                          className="text-red-500"
                        />
                      )}
                    </td>
                  </tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {/* Office Requirements Table */}
          {specialSubjects.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl sm:text-2xl font-bold mb-4 text-center bg-gray-300 p-5">
                Office Requirements
              </h3>
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr>
                    <th className="py-5 px-2 border border-gray-400 bg-blue-300 sm:text-base text-sm">
                      Office Names
                    </th>
                    <th className="py-5 px-2 border border-gray-400 text-center bg-[#fff2c1] sm:text-base text-sm">
                      Cleared
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {specialSubjects.map((office) => (
                    <React.Fragment key={office}>
                      <tr>
                        <td className="border border-gray-400 px-4 py-2 bg-blue-100 text-sm  sm:text-base">
                          {office}
                        </td>
                        <td className="border border-gray-400 px-4 py-2 text-center bg-[#fffcf2]">
                          {studentData.clearance[office] ? (
                            <FontAwesomeIcon
                              icon={faCheckCircle}
                              className="text-green-500"
                            />
                          ) : (
                            <FontAwesomeIcon
                              icon={faTimesCircle}
                              className="text-red-500"
                            />
                          )}
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {hidden && (
          <>
            {/* PDF Generate Page */}
            <div
              className="print-container px-20 pb-20 pt-10 text-xs"
              ref={componentRef}
            >
              <div className="flex justify-center pb-5 items-center gap-3 font-medium">
                <img src="/DYCI.png" className="w-16 h-16" />
                <div className="mb-3">
                  <p>Dr. Yanga's Colleges, Inc.</p>
                  <p>Wakas, Bocaue, Bulacan</p>
                </div>
              </div>
              <div className="text-base pb-5">
                <div className="flex print-layout justify-between">
                  <div className="flex">
                    <p className="font">Name:</p>
                    <p className="font pl-1">
                      <strong>{studentData?.fullName}</strong>
                    </p>
                  </div>

                  <div className="flex">
                    <p className="">Section:</p>
                    <p className="pl-1">
                      <strong>{studentData?.section}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex print-layout justify-between">
                  {studentData?.department && (
                    <div className="flex">
                      <p className="">Department:</p>
                      <p className="font pl-1">
                        <strong>{studentData?.department}</strong>
                      </p>
                    </div>
                  )}

                  <div className="flex">
                    <p className="">Grade Level:</p>
                    <p className="pl-1">
                      <strong>{studentData?.gradeLevel}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex print-layout justify-between">
                  <div className="flex">
                    <p className="font">
                      Student Number: <strong>{studentData?.studentId}</strong>
                    </p>
                  </div>
                </div>

                <div className="border-2 border-green-300 mt-6" />
              </div>

              {/* Regular Subjects Table */}
              <h2 className="font-semibold mb-4">Student Clearance</h2>
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr>
                    <th className="py-2 border-b border-gray-200">Subject</th>
                    <th className="py-2 border-b border-gray-200 text-center">
                      Cleared
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {regularSubjects.map((subject) => (
                    <React.Fragment key={subject}>
                      <tr>
                        <td className="border px-4 py-2">{subject}</td>
                        <td className="border px-4 py-2 text-center">
                          {studentData.clearance[subject] ? (
                            <FontAwesomeIcon
                              icon={faCheckCircle}
                              className="text-green-500"
                            />
                          ) : (
                            <FontAwesomeIcon
                              icon={faTimesCircle}
                              className="text-red-500"
                            />
                          )}
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>

              {/* Office Requirements Table */}
              {specialSubjects.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-semibold mb-4">Office Requirements</h3>
                  <table className="min-w-full bg-white border border-gray-200">
                    <thead>
                      <tr>
                        <th className="py-2 border-b border-gray-200">
                          Office Names
                        </th>
                        <th className="py-2 border-b border-gray-200 text-center">
                          Cleared
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {specialSubjects.map((office) => (
                        <React.Fragment key={office}>
                          <tr>
                            <td className="border px-4 py-2">{office}</td>
                            <td className="border px-4 py-2 text-center">
                              {studentData.clearance[office] ? (
                                <FontAwesomeIcon
                                  icon={faCheckCircle}
                                  className="text-green-500"
                                />
                              ) : (
                                <FontAwesomeIcon
                                  icon={faTimesCircle}
                                  className="text-red-500"
                                />
                              )}
                            </td>
                          </tr>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        <Modal
          isOpen={notcomplete}
          onClose={() => setNotcomplete(!notcomplete)}
        >
          <div className="p-5 m-3 bg-[#fff2c1] flex items-center justify-center text-center font-semibold ">
            <p>
              Please complete all necessary clearances except for Finance to
              proceed.
            </p>
          </div>
          <div className="flex justify-center items-center mb-4">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setNotcomplete(!notcomplete);
              }}
              className="bg-red-400 p-2 z-50 rounded-full mt-5 shadow-red-950 shadow-sm"
            >
              <XMarkIcon className="w-5 h-5 text-red-900" />
            </motion.button>
          </div>
        </Modal>
      </div>
    </SidebarStudent>
  );
};

export default StudentDashboard;
