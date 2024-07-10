import React, { useState, useEffect } from "react";
import { useAuth } from "../components/AuthContext";
import { db, storage } from "../firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Sidebar from "../components/Sidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faTimesCircle,
  faExclamationCircle,
} from "@fortawesome/free-solid-svg-icons";
import Modal from "../components/Modal";

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
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState([]);
  const [clearanceRequests, setClearanceRequests] = useState({});
  const [isResubmitModalOpen, setIsResubmitModalOpen] = useState(false);
  const [subjectToResubmit, setSubjectToResubmit] = useState(null);
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [inquiryRecipient, setInquiryRecipient] = useState(null);
  const [inquirySubject, setInquirySubject] = useState(null);
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [inquiryFiles, setInquiryFiles] = useState([]);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!currentUser) return;

      try {
        const studentsRef = collection(db, "students");
        const q = query(studentsRef, where("uid", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const studentDoc = querySnapshot.docs[0];
          setStudentData(studentDoc.data());
        }
      } catch (error) {
        console.error("Error fetching student data:", error);
      }
    };

    fetchStudentData();
  }, [currentUser]);

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

  useEffect(() => {
    const fetchOfficeRequirements = async () => {
      try {
        const officeReqsRef = collection(db, "officeRequirements");
        const officeReqsQuery = query(
          officeReqsRef,
          where("educationLevels", "array-contains", studentData.educationLevel)
        );
        const officeReqsSnapshot = await getDocs(officeReqsQuery);
        setOfficeRequirements(officeReqsSnapshot.docs.map((doc) => doc.data()));
      } catch (error) {
        console.error("Error fetching office requirements:", error);
      }
    };

    if (studentData) {
      fetchOfficeRequirements();
    }
  }, [studentData]);

  useEffect(() => {
    const fetchClearanceRequests = async () => {
      if (!currentUser) return;

      try {
        const requestsRef = collection(db, "clearanceRequests");
        const q = query(requestsRef, where("studentId", "==", currentUser.uid));
        const requestsSnapshot = await getDocs(q);

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
      } catch (error) {
        console.error("Error fetching clearance requests:", error);
      }
    };

    fetchClearanceRequests();
  }, [currentUser]);

  const handleSubjectClick = (subject) => {
    setSelectedSubject(selectedSubject === subject ? null : subject);
  };

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleRequestClearance = async () => {
    if (!studentData || !selectedSubject) return;

    setIsUploading(true);

    try {
      const fileURLs = [];

      for (const file of files) {
        const storageRef = ref(
          storage,
          `clearance_requests/${currentUser.uid}/${selectedSubject}/${file.name}`
        );
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        fileURLs.push(downloadURL);
      }

      const clearanceRequestsRef = collection(db, "clearanceRequests");
      const officerRequirement = officeRequirements.find(
        (requirement) => requirement.office === selectedSubject
      );
      const officerId = officerRequirement ? officerRequirement.addedBy : null;

      if (SPECIAL_SUBJECTS.includes(selectedSubject)) {
        await addDoc(clearanceRequestsRef, {
          studentId: currentUser.uid,
          studentName: studentData.fullName,
          section: studentData.section,
          subject: selectedSubject,
          officerId: officerId,
          timestamp: serverTimestamp(),
          fileURLs: fileURLs,
          status: "pending",
        });
      } else {
        const subjectRequirements = classRequirements[selectedSubject];
        if (subjectRequirements && subjectRequirements.length > 0) {
          await addDoc(clearanceRequestsRef, {
            studentId: currentUser.uid,
            studentNo: studentData.studentId,
            studentName: studentData.fullName,
            section: studentData.section,
            subject: selectedSubject,
            teacherUid: subjectRequirements[0].teacherUid,
            timestamp: serverTimestamp(),
            fileURLs: fileURLs,
            status: "pending",
          });
        } else {
          alert(
            "No requirements found for this subject. You do not need to request clearance."
          );
          return;
        }
      }

      alert("Clearance requested successfully!");
      setSelectedSubject(null);
      setFiles([]);
    } catch (error) {
      console.error("Error requesting clearance:", error);
      alert("Error requesting clearance. Please try again later.");
    } finally {
      setIsUploading(false);
    }
  };

  const openResubmitModal = (subject) => {
    setSubjectToResubmit(subject);
    setIsResubmitModalOpen(true);
  };

  const closeResubmitModal = () => {
    setSubjectToResubmit(null);
    setIsResubmitModalOpen(false);
  };

  const handleResubmitClearance = async (subject) => {
    closeResubmitModal();

    try {
      const requestToDelete = clearanceRequests[subject];
      if (requestToDelete) {
        await deleteDoc(doc(db, "clearanceRequests", requestToDelete.id));
      }

      await handleRequestClearance();
    } catch (error) {
      console.error("Error resubmitting clearance:", error);
      alert("Error resubmitting clearance request. Please try again later.");
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

  const getOfficeRequirementsForSubject = (office) => {
    if (office === "Office of The Dean" || office === "Student Council") {
      return officeRequirements.filter(
        (req) =>
          req.office === office && req.department === studentData.department
      );
    } else {
      return officeRequirements.filter((req) => req.office === office);
    }
  };

  const handleSendInquiry = async () => {
    try {
      const inquiryFileURLs = [];
      for (const file of inquiryFiles) {
        const storageRef = ref(
          storage,
          `inquiries/${currentUser.uid}/${inquirySubject}/${file.name}`
        );
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        inquiryFileURLs.push(downloadURL);
      }

      const inquiriesRef = collection(db, "inquiries");
      await addDoc(inquiriesRef, {
        studentId: currentUser.uid,
        recipientId: inquiryRecipient,
        subject: inquirySubject,
        message: inquiryMessage,
        fileURLs: inquiryFileURLs,
        timestamp: serverTimestamp(),
      });

      alert("Inquiry sent successfully!");
      setInquiryModalOpen(false);
      setInquiryRecipient(null);
      setInquirySubject(null);
      setInquiryMessage("");
      setInquiryFiles([]);
    } catch (error) {
      console.error("Error sending inquiry:", error);
      alert("Error sending inquiry. Please try again later.");
    }
  };

  const handleOpenInquiryModal = (subject, recipientId) => {
    setSelectedSubject(subject);
    setInquiryRecipient(recipientId);
    setInquirySubject(subject);
    setInquiryModalOpen(true);
  };

  const handleCloseInquiryModal = () => {
    setInquiryModalOpen(false);
    setInquiryRecipient(null);
    setInquirySubject(null);
    setInquiryMessage("");
    setInquiryFiles([]);
  };

  const handleInquiryFileChange = (e) => {
    setInquiryFiles(Array.from(e.target.files));
  };

  return (
    <Sidebar>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">Student Clearance</h2>

        {studentData?.educationLevel !== "college" && (
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr>
                <th className="py-2 border-b border-gray-200">Subject</th>
                <th className="py-2 border-b border-gray-200 text-center">
                  Cleared
                </th>
                <th className="py-2 border-b border-gray-200">Details</th>
              </tr>
            </thead>
            <tbody>
              {regularSubjects.map((subject) => (
                <React.Fragment key={subject}>
                  <tr>
                    <td
                      className="border px-4 py-2 cursor-pointer"
                      onClick={() => handleSubjectClick(subject)}
                    >
                      {subject}
                    </td>
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
                    <td className="border px-4 py-2">
                      <button
                        className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        onClick={() => handleSubjectClick(subject)}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>

                  {selectedSubject === subject &&
                    classRequirements[subject] && (
                      <tr className="bg-gray-100">
                        <td colSpan={3} className="border px-4 py-2">
                          <div className="mb-4">
                            <h4 className="text-md font-semibold">
                              Requirements:
                            </h4>
                            <ul className="list-disc pl-5">
                              {(classRequirements[subject] || []).map(
                                (requirement, index) => (
                                  <li key={index}>
                                    {requirement.name}:{" "}
                                    {requirement.description}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>

                          {clearanceRequests[subject] ? (
                            <div className="mb-4">
                              <div
                                className={`flex items-center p-2 rounded ${
                                  clearanceRequests[subject].status ===
                                  "approved"
                                    ? "bg-green-100 text-green-800"
                                    : clearanceRequests[subject].status ===
                                      "rejected"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                <FontAwesomeIcon
                                  icon={faExclamationCircle}
                                  className="mr-2"
                                />
                                <span>
                                  Your clearance request is currently{" "}
                                  <strong>
                                    {clearanceRequests[subject].status}
                                  </strong>
                                  .
                                </span>
                              </div>

                              {clearanceRequests[subject].fileURLs &&
                                clearanceRequests[subject].fileURLs.length >
                                  0 && (
                                  <div className="mt-2">
                                    <p className="text-sm font-medium text-gray-700">
                                      Submitted Files:
                                    </p>
                                    <ul className="list-disc pl-5">
                                      {clearanceRequests[subject].fileURLs.map(
                                        (url, index) => (
                                          <li key={index}>
                                            <a
                                              href={url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-blue-500 hover:underline"
                                            >
                                              File {index + 1}
                                            </a>
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                )}

                              {clearanceRequests[subject].status !==
                                "approved" && (
                                <button
                                  onClick={() => openResubmitModal(subject)}
                                  className="mt-2 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
                                  disabled={isUploading}
                                >
                                  {isUploading
                                    ? "Resubmitting..."
                                    : "Resubmit Clearance"}
                                </button>
                              )}
                            </div>
                          ) : (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">
                                Optional: Submit Files (e.g., proof of payment,
                                documents)
                              </label>
                              <input
                                type="file"
                                multiple
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 cursor-pointer dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                              />
                              <button
                                onClick={handleRequestClearance}
                                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                                disabled={isUploading}
                              >
                                {isUploading
                                  ? "Requesting..."
                                  : "Request Clearance"}
                              </button>
                            </div>
                          )}

                          <button
                            onClick={() =>
                              handleOpenInquiryModal(
                                subject,
                                classRequirements[subject][0].teacherUid
                              )
                            }
                            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            Send Inquiry
                          </button>
                        </td>
                      </tr>
                    )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}

        {specialSubjects.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Office Requirements</h3>
            <table className="min-w-full bg-white border border-gray-200">
              {" "}
              <thead>
                <tr>
                  <th className="py-2 border-b border-gray-200">
                    Office Names
                  </th>
                  <th className="py-2 border-b border-gray-200 text-center">
                    Cleared
                  </th>
                  <th className="py-2 border-b border-gray-200">Details</th>
                </tr>
              </thead>
              <tbody>
                {specialSubjects.map((office) => (
                  <React.Fragment key={office}>
                    <tr>
                      <td
                        className="border px-4 py-2 cursor-pointer"
                        onClick={() => handleSubjectClick(office)}
                      >
                        {office}
                      </td>
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
                      <td className="border px-4 py-2">
                        <button
                          className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                          onClick={() => handleSubjectClick(office)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>

                    {selectedSubject === office &&
                      getOfficeRequirementsForSubject(office).length > 0 && (
                        <tr className="bg-gray-100">
                          <td colSpan={3} className="border px-4 py-2">
                            <div className="mb-4">
                              <h4 className="text-md font-semibold">
                                Requirements:
                              </h4>
                              <ul className="list-disc pl-5">
                                {getOfficeRequirementsForSubject(office).map(
                                  (requirement, index) => (
                                    <li key={index}>
                                      {requirement.name}:{" "}
                                      {requirement.description}
                                    </li>
                                  )
                                )}
                              </ul>
                            </div>

                            {clearanceRequests[office] ? (
                              <div className="mb-4">
                                <div
                                  className={`flex items-center p-2 rounded ${
                                    clearanceRequests[office].status ===
                                    "approved"
                                      ? "bg-green-100 text-green-800"
                                      : clearanceRequests[office].status ===
                                        "rejected"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  <FontAwesomeIcon
                                    icon={faExclamationCircle}
                                    className="mr-2"
                                  />
                                  <span>
                                    Your clearance request is currently{" "}
                                    <strong>
                                      {clearanceRequests[office].status}
                                    </strong>
                                    .
                                  </span>
                                </div>

                                {clearanceRequests[office].fileURLs &&
                                  clearanceRequests[office].fileURLs.length >
                                    0 && (
                                    <div className="mt-2">
                                      <p className="text-sm font-medium text-gray-700">
                                        Submitted Files:
                                      </p>
                                      <ul className="list-disc pl-5">
                                        {clearanceRequests[office].fileURLs.map(
                                          (url, index) => (
                                            <li key={index}>
                                              <a
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-500 hover:underline"
                                              >
                                                File {index + 1}
                                              </a>
                                            </li>
                                          )
                                        )}
                                      </ul>
                                    </div>
                                  )}

                                {clearanceRequests[office].status !==
                                  "approved" && (
                                  <button
                                    onClick={() => openResubmitModal(office)}
                                    className="mt-2 px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
                                    disabled={isUploading}
                                  >
                                    {isUploading
                                      ? "Resubmitting..."
                                      : "Resubmit Clearance"}
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div>
                                <label className="block text-sm font-medium text-gray-700">
                                  Optional: Submit Files (e.g., proof of
                                  payment, documents)
                                </label>
                                <input
                                  type="file"
                                  multiple
                                  onChange={handleFileChange}
                                  className="block w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 cursor-pointer dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                                />
                                <button
                                  onClick={handleRequestClearance}
                                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                                  disabled={isUploading}
                                >
                                  {isUploading
                                    ? "Requesting..."
                                    : "Request Clearance"}
                                </button>
                              </div>
                            )}
                            <button
                              onClick={() =>
                                handleOpenInquiryModal(
                                  office,
                                  getOfficeRequirementsForSubject(office)[0]
                                    .addedBy
                                )
                              }
                              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                              Send Inquiry
                            </button>
                          </td>
                        </tr>
                      )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal isOpen={inquiryModalOpen} onClose={handleCloseInquiryModal}>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Send Inquiry</h3>
            <p className="mb-2">
              To: <strong>{inquirySubject}</strong>
            </p>
            <textarea
              value={inquiryMessage}
              onChange={(e) => setInquiryMessage(e.target.value)}
              placeholder="Type your message here..."
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            />

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Optional: Attach Files
              </label>
              <input
                type="file"
                multiple
                onChange={handleInquiryFileChange}
                className="block w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 cursor-pointer dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
              />
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleCloseInquiryModal}
                className="mr-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSendInquiry}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Send
              </button>
            </div>
          </div>
        </Modal>
        <Modal isOpen={isResubmitModalOpen} onClose={closeResubmitModal}>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Resubmit Clearance Request
            </h3>
            <p>
              Are you sure you want to resubmit your clearance request for{" "}
              <strong>{subjectToResubmit}</strong>? This will delete your
              previous request.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeResubmitModal}
                className="mr-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResubmitClearance(subjectToResubmit)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Resubmit
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </Sidebar>
  );
};

export default StudentClearance;
