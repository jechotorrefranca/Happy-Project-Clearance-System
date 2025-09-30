import React, { useState, useEffect } from "react";
import { useAuth } from "../components/AuthContext";
import { db, storage } from "../firebaseConfig";
import { motion, AnimatePresence } from "framer-motion";
import ModalSubject from "../components/Modal/index";
import ChatDesign from "../components/Chat/ChatDesign";
import UserChatDesign from "../components/Chat/UserChatDesign";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
  doc,
  deleteDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Sidebar from "../components/Sidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faTimesCircle,
  faExternalLinkAlt,
  faPaperclip,
  faExclamationCircle,
  faComments,
} from "@fortawesome/free-solid-svg-icons";
import { DocumentMagnifyingGlassIcon } from "@heroicons/react/24/solid";
import Modal from "../components/Modal";
import ClearanceContent from "../components/ClearanceContent";
import { ToastContainer, toast, Bounce } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ExclamationTriangleIcon } from "@heroicons/react/24/solid";

const SPECIAL_SUBJECTS = [
  "Librarian",
  "Finance",
  "Director/Principal",
  "Basic Education Registrar",
  "Character Renewal Office",
  "College Library",
  "Guidance Office",
  "Office of The Dean",
  "Office of the Finance Director",
  "Office of the Registrar",
  "Property Custodian",
  "Student Council",
];

const StudentClearance = () => {
  const { currentUser } = useAuth();
  const [studentData, setStudentData] = useState(null);
  const [classRequirements, setClassRequirements] = useState({});
  const [officeRequirements, setOfficeRequirements] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedSubjectOffice, setSelectedSubjectOffice] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState([]);
  const [clearanceRequests, setClearanceRequests] = useState({});
  const [isResubmitModalOpen, setIsResubmitModalOpen] = useState(false);
  const [subjectToResubmit, setSubjectToResubmit] = useState(null);
  const [submitType, setSubmitType] = useState(null);
  const [modalSubject, setModalSubject] = useState(null);
  const [modalSubjectOffice, setModalSubjectOffice] = useState(null);
  const [forOfficeUIDSubject, setForOfficeUIDSubject] = useState(null);
  const [inquiry, setInquiry] = useState(false);
  const [inquiryData, setInquiryData] = useState([]);
  const [subjbectForInquiry, setsubjbectForInquiry] = useState(null);
  const [teacherUID, setTeacherUID] = useState("");
  const [reason, setReason] = useState(null);
  const [notcomplete, setNotcomplete] = useState(false);

  const updateTeacherUID = () => {
    const filteredRequirements = officeRequirements.filter(
      (requirement) => requirement.office === forOfficeUIDSubject
    );

    if (filteredRequirements.length > 0) {
      setTeacherUID(filteredRequirements[0].addedBy);
    }
  };

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

  //Fetch Reject Reason
  useEffect(() => {
    if (!currentUser || !subjbectForInquiry) return;

    const fetchRejectReason = async () => {
      try {
        const studentsRef = collection(db, "studentNotification");
        const q = query(
          studentsRef,
          where("studentId", "==", currentUser.uid),
          where("subject", "==", subjbectForInquiry)
        );

        const querySnapshot = await getDocs(q);

        const documents = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        documents.sort(
          (a, b) => (b.notifTimestamp || 0) - (a.notifTimestamp || 0)
        );

        if (documents.length > 0) {
          setReason(documents[0]);
        } else {
          setReason(null);
        }
      } catch (error) {
        console.error("Error fetching reject reason data:", error);
      }
    };

    fetchRejectReason();
  }, [currentUser, subjbectForInquiry]);

  // Fetch Class Requirement based on section
  useEffect(() => {
    const fetchClassRequirements = async () => {
      if (!studentData || !studentData.section) return;

      try {
        const classesRef = collection(db, "classes");
        const classQuery = query(
          classesRef,
          where("sectionName", "==", studentData.section)
        );
        const classSnapshot = await getDocs(classQuery);

        if (!classSnapshot.empty) {
          const classData = classSnapshot.docs[0].data();
          setClassRequirements(classData.requirements || {});
        }
      } catch (error) {
        console.error("Error fetching class requirements:", error);
      }
    };

    fetchClassRequirements();
  }, [studentData]);

  // Fetch Office Requirements
  useEffect(() => {
    const fetchOfficeRequirements = async () => {
      try {
        const officeReqsRef = collection(db, "officeRequirements");
        const officeReqsSnapshot = await getDocs(officeReqsRef);
        setOfficeRequirements(officeReqsSnapshot.docs.map((doc) => doc.data()));
      } catch (error) {
        console.error("Error fetching office requirements:", error);
      }
    };

    fetchOfficeRequirements();
  }, []);

  // Clearance Requests by Student
  useEffect(() => {
    const unsubscribe = () => {
      if (!currentUser) return;

      try {
        const requestsRef = collection(db, "clearanceRequests");
        const q = query(requestsRef, where("studentId", "==", currentUser.uid));

        const unsubscribe = onSnapshot(q, (requestsSnapshot) => {
          const requestsData = {};
          requestsSnapshot.forEach((doc) => {
            const data = doc.data();
            requestsData[data.subject] = {
              status: data.status,
              id: doc.id,
              fileURLs: data.fileURLs,
            };
          });
          setClearanceRequests(requestsData);
        });

        return unsubscribe;
      } catch (error) {
        console.error("Error fetching clearance requests:", error);
      }
    };

    const unsubscribeFunction = unsubscribe();

    return () => {
      if (unsubscribeFunction) {
        unsubscribeFunction();
      }
    };
  }, [currentUser]);

  const handleSubjectClick = (subject) => {
    setsubjbectForInquiry(subject);
    setSubmitType("submit");
    setModalSubject(subject);
    setSelectedSubject(selectedSubject === subject ? null : subject);
  };

  const handleSubjectClickOffice = (subject) => {
    if (subject == "Finance") {
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
    }

    setsubjbectForInquiry(subject);
    setSubmitType("submit");
    setModalSubjectOffice(subject);
    setSelectedSubjectOffice(selectedSubject === subject ? null : subject);
    setForOfficeUIDSubject(subject);
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const formatText = (text) => {
    return text.replace(/\//g, "/ ");
  };

  const handleRequestClearance = async (subject, type) => {
    if (!studentData || !subject) return;

    setIsUploading(true);

    try {
      const fileURLs = [];

      for (const file of files) {
        const storageRef = ref(
          storage,
          `clearance_requests/${currentUser.uid}/${subject}/${file.name}`
        );
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        fileURLs.push(downloadURL);
      }

      const clearanceRequestsRef = collection(db, "clearanceRequests");

      if (type === "class") {
        const subjectRequirements = classRequirements[subject];
        if (subjectRequirements && subjectRequirements.length > 0) {
          await addDoc(clearanceRequestsRef, {
            studentId: currentUser.uid,
            studentName: studentData.fullName,
            section: studentData.section,
            subject: subject,
            teacherUid: subjectRequirements[0].teacherUid,
            timestamp: serverTimestamp(),
            fileURLs: fileURLs,
            status: "pending",
            studentNo: studentData.studentId,
          });
          showSuccessToast("Clearance Requested Successfully");
        } else {
          showWarningToast(
            "No requirements found for this subject. You do not need to request clearance"
          );
          return;
        }
      } else if (type === "office") {
        const officeRequirement = officeRequirements.find(
          (req) => req.office === subject
        );
        if (officeRequirement) {
          try {
            await addDoc(clearanceRequestsRef, {
              studentId: currentUser.uid,
              studentName: studentData.fullName,
              section: studentData.section,
              subject: subject,
              officerId: officeRequirement.addedBy,
              timestamp: serverTimestamp(),
              fileURLs: fileURLs,
              status: "pending",
              studentNo: studentData.studentId,
            });
            showSuccessToast("Clearance Requested Successfully");
          } catch (error) {
            console.error("Error adding document: ", error);
            showFailedToast(
              "Failed to request clearance. Please try again later"
            );
            return;
          }
        } else {
          showWarningToast(
            "No requirements found for this office. You do not need to request clearance"
          );
          return;
        }
      } else {
        alert("Error Clearance Request");
      }

      // Add to activityLog collection
      const activityLogRef = collection(db, "activityLog");
      await addDoc(activityLogRef, {
        date: serverTimestamp(),
        subject: subject,
        type: submitType,
        studentId: currentUser.uid,
      });

      setSelectedSubject(null);
      setSelectedSubjectOffice(null);
      setFiles([]);
    } catch (error) {
      console.error("Error requesting clearance:", error);
    } finally {
      setIsUploading(false);
      setSubmitType(null);
      setSubjectType(null);
    }
  };

  const [subjectType, setSubjectType] = useState(null);
  const openResubmitModal = (subject, type) => {
    setSubmitType("resubmit");
    setSubjectType(type);
    setSubjectToResubmit(subject);
    setIsResubmitModalOpen(true);
  };

  const closeResubmitModal = () => {
    setSubjectToResubmit(null);
    setIsResubmitModalOpen(false);
  };

  const [teacherUid, setTeacherUid] = useState(null);

  // Update read status function
  const markAsRead = async (subjectInq) => {
    try {
      if (!currentUser || !subjectInq) {
        return;
      }

      const inquiryCollectionRef = collection(db, "inquiries");
      const q = query(
        inquiryCollectionRef,
        where("subject", "==", subjectInq),
        where("recipientId", "==", currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (doc) => {
        const docRef = doc.ref;
        await updateDoc(docRef, {
          read: true,
        });
      });
    } catch (error) {
      console.error("Error marking inquiries as read:", error);
    }
  };

  const setInquiryModal = (uid, inqsub) => {
    updateTeacherUID();
    setTeacherUid(uid);
    setInquiry(!inquiry);
    markAsRead(inqsub);
  };

  const handleResubmitClearance = async (subject, type) => {
    closeResubmitModal();

    try {
      const requestToDelete = clearanceRequests[subject];
      if (requestToDelete) {
        await deleteDoc(doc(db, "clearanceRequests", requestToDelete.id));
      }

      await handleRequestClearance(subject, type);
    } catch (error) {
      showFailedToast("Error resubmitting clearance. Please try again later");
      console.error("Error resubmitting clearance:", error);
    }
  };

  const sortedSubjects = studentData?.clearance
    ? Object.keys(studentData.clearance).sort()
    : [];

  const regularSubjects = sortedSubjects.filter(
    (subject) => !SPECIAL_SUBJECTS.includes(subject)
  );

  const specialSubjects = sortedSubjects.filter((subject) =>
    SPECIAL_SUBJECTS.includes(subject)
  );

  // Inquiry
  useEffect(() => {
    if (!currentUser) return;

    const inboxRef = collection(db, "inquiries");
    const q = query(
      inboxRef,
      where("fixedStudentId", "==", currentUser.uid),
      where("subject", "==", subjbectForInquiry)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inbox = snapshot.docs.map((doc) => {
        const data = doc.data();
        const date = data.timestamp ? data.timestamp.toDate() : null;
        return { id: doc.id, ...data, date };
      });

      inbox.sort((a, b) => (a.date || 0) - (b.date || 0));

      const formattedInbox = inbox.map((inboxes) => ({
        ...inboxes,
      }));

      setInquiryData(formattedInbox);
    });

    return () => unsubscribe();
  }, [currentUser, subjbectForInquiry]);

  const showSuccessToast = (msg) =>
    toast.success(msg, {
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

  const showFailedToast = (msg) =>
    toast.error(msg, {
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

  const showWarningToast = (msg) =>
    toast.warn(msg, {
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
    <Sidebar>
      <ToastContainer />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Clearance</h1>
            <p className="mt-2 text-gray-600">
              View and track your clearance status, submit requirements, and
              stay updated on pending approvals.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="">
            {/* Regular Subs */}
            {studentData?.educationLevel !== "college" && (
              <>
                <div className="mb-4 flex justify-start items-center">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Clearance
                  </h1>
                </div>
                <div className="overflow-hidden rounded-lg shadow-sm">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr>
                        <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-sm sm:text-base font-medium text-gray-700 text-left">
                          Subject
                        </th>
                        <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-sm sm:text-base font-medium text-gray-700 text-center">
                          Status
                        </th>
                        <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-sm sm:text-base font-medium text-gray-700 text-center">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {regularSubjects.map((subject) => (
                        <tr
                          key={subject}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td
                            className="px-4 py-2 text-sm sm:text-base text-gray-900 border-b border-gray-200 text-left"
                            style={{
                              overflowWrap: "break-word",
                              whiteSpace: "normal",
                            }}
                          >
                            {subject}
                          </td>
                          <td className="px-4 py-2 border-b border-gray-200 text-center">
                            <span
                              className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                studentData.clearance[subject]
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {studentData.clearance[subject]
                                ? "Cleared"
                                : "Not Cleared"}
                            </span>
                          </td>
                          <td className="px-4 py-2 border-b border-gray-200 text-center bg-gray-50">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              className="text-blue-600 hover:text-blue-800"
                              onClick={() => handleSubjectClick(subject)}
                              title="View Details"
                            >
                              <FontAwesomeIcon icon={faExternalLinkAlt} />
                            </motion.button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Office reqs*/}
            {specialSubjects.length > 0 && (
              <div className="mt-8">
                <div className="mb-4 flex justify-start items-center">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Office Clearance
                  </h1>
                </div>
                <div className="overflow-hidden rounded-lg shadow-sm">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr>
                        <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-sm sm:text-base font-medium text-gray-700 text-left">
                          Office Names
                        </th>
                        <th className="py-2 px-4 border-b border-gray-200 bg-gray-100 text-sm sm:text-base font-medium text-gray-700 text-center">
                          Status
                        </th>
                        <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 sm:text-base text-sm font-medium text-gray-700 text-center">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {specialSubjects.map((office) => (
                        <tr
                          key={office}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td
                            className="px-4 py-2 text-sm sm:text-base text-gray-900 border-b border-gray-200 text-left"
                            style={{
                              overflowWrap: "break-word",
                              whiteSpace: "normal",
                            }}
                          >
                            {formatText(office)}
                          </td>
                          <td className="px-4 py-2 border-b border-gray-200 text-center">
                            <span
                              className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                studentData.clearance[office]
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {studentData.clearance[office]
                                ? "Cleared"
                                : "Pending"}
                            </span>
                          </td>
                          <td className="px-4 py-2 border-b border-gray-200 text-center bg-gray-50">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              className="text-blue-600 hover:text-blue-800"
                              onClick={() => handleSubjectClickOffice(office)}
                              title="View Details"
                            >
                              <FontAwesomeIcon icon={faExternalLinkAlt} />
                            </motion.button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={isResubmitModalOpen} onClose={closeResubmitModal}>
        <div className="p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Resubmit Clearance Request
          </h3>
          <hr className="border-gray-200" />

          <p className="text-sm text-gray-700 leading-relaxed">
            Are you sure you want to resubmit your clearance request for{" "}
            <span className="font-medium text-gray-900">
              {subjectToResubmit}
            </span>
            ? This action will{" "}
            <span className="font-semibold text-red-600">
              delete your previous request
            </span>
            .
          </p>

          <div className="flex justify-end gap-3 pt-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={closeResubmitModal}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Cancel
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() =>
                handleResubmitClearance(subjectToResubmit, subjectType)
              }
              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors"
            >
              Resubmit
            </motion.button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={notcomplete} onClose={() => setNotcomplete(false)}>
        <div className="p-6 space-y-6 text-center">
          <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 text-gray-800 px-4 py-3 rounded-lg">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm leading-relaxed">
              Please complete all necessary clearances except for{" "}
              <span className="font-semibold text-gray-900">Finance</span> to
              proceed.
            </p>
          </div>
        </div>
      </Modal>

      <AnimatePresence initial={false} mode="wait" onExitComplete={() => null}>
        {/* For Subjects */}
        {selectedSubject && (
          <ModalSubject
            text={selectedSubject}
            modalOpen={selectedSubject}
            handleClose={() => handleSubjectClick(null)}
          >
            {selectedSubject === modalSubject &&
            classRequirements[modalSubject] ? (
              <ClearanceContent
                title={selectedSubject}
                requirements={classRequirements[modalSubject]}
                modalKey={modalSubject}
                clearanceRequests={clearanceRequests}
                reason={reason}
                isUploading={isUploading}
                files={files}
                handleRequestClearance={handleRequestClearance}
                openResubmitModal={openResubmitModal}
                handleFileChange={handleFileChange}
                setInquiryModal={setInquiryModal}
                type="class"
              />
            ) : (
              <p className="text-center">
                Currently, there are no specific requirements for{" "}
                <strong>{selectedSubject}</strong>
              </p>
            )}
          </ModalSubject>
        )}

        {/* For Offices */}
        {selectedSubjectOffice && (
          <ModalSubject
            text={selectedSubjectOffice}
            modalOpen={selectedSubjectOffice}
            handleClose={() => handleSubjectClickOffice(null)}
          >
            {selectedSubjectOffice === modalSubjectOffice &&
            officeRequirements.some(
              (req) => req.office === modalSubjectOffice
            ) ? (
              <ClearanceContent
                title={selectedSubjectOffice}
                requirements={officeRequirements.filter(
                  (req) => req.office === modalSubjectOffice
                )}
                modalKey={modalSubjectOffice}
                clearanceRequests={clearanceRequests}
                reason={reason}
                isUploading={isUploading}
                files={files}
                handleRequestClearance={handleRequestClearance}
                openResubmitModal={openResubmitModal}
                handleFileChange={handleFileChange}
                setInquiryModal={setInquiryModal}
                type="office"
              />
            ) : (
              <p className="text-center">
                Currently, there are no specific requirements for{" "}
                <strong>{selectedSubjectOffice}</strong>
              </p>
            )}
          </ModalSubject>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {inquiry && (
          <>
            {selectedSubject && (
              <ChatDesign
                handleClose={() => setInquiryModal(null, selectedSubject)}
                subject={selectedSubject}
                facultyUid={teacherUid}
                defaultFacultyId={teacherUid}
                studentName={studentData.fullName}
                defaultStudentId={currentUser.uid}
              >
                {inquiryData.map((inquiry) => (
                  <UserChatDesign
                    talkingTo={selectedSubject}
                    key={inquiry.id}
                    userType={
                      inquiry.studentId === currentUser.uid
                        ? "student"
                        : "other"
                    }
                    data={inquiry}
                  >
                    {inquiry.message}
                  </UserChatDesign>
                ))}
              </ChatDesign>
            )}

            {selectedSubjectOffice && (
              <ChatDesign
                handleClose={() => setInquiryModal(null, selectedSubjectOffice)}
                subject={selectedSubjectOffice}
                facultyUid={teacherUID}
                defaultFacultyId={teacherUID}
                studentName={studentData.fullName}
                defaultStudentId={currentUser.uid}
              >
                {inquiryData.map((inquiry) => (
                  <UserChatDesign
                    talkingTo={selectedSubjectOffice}
                    key={inquiry.id}
                    userType={
                      inquiry.studentId === currentUser.uid
                        ? "student"
                        : "other"
                    }
                    data={inquiry}
                  >
                    {inquiry.message}
                  </UserChatDesign>
                ))}
              </ChatDesign>
            )}
          </>
        )}
      </AnimatePresence>
    </Sidebar>
  );
};

export default StudentClearance;
