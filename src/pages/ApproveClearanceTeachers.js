import React, { useState, useEffect } from "react";
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
import { db } from "../firebaseConfig";
import { useAuth } from "../components/AuthContext";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import moment from "moment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAngleDown,
  faAngleUp,
} from "@fortawesome/free-solid-svg-icons";
import { motion } from 'framer-motion';
import "./table.css"
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


function ApproveClearanceTeachers() {
  const { currentUser } = useAuth();
  const [clearanceRequests, setClearanceRequests] = useState([]);
  const [originalRequests, setOriginalRequests] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestToReject, setRequestToReject] = useState(null);
  const [filterSection, setFilterSection] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [availableSections, setAvailableSections] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableStatus, setAvailableStatus] = useState([]);
  const [expandedRequestId, setExpandedRequestId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const showSuccessToast = (msg) => toast.success(msg, {
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

    const showFailedToast = (msg) => toast.error(msg, {
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

    const showWarningToast = (msg) => toast.warn(msg, {
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


  useEffect(() => {
    const fetchClearanceRequests = async () => {
      if (!currentUser) return;

      try {
        const requestsRef = collection(db, "clearanceRequests");
        const q = query(
          requestsRef,
          where("teacherUid", "==", currentUser.uid)
        );

        const requestsSnapshot = await getDocs(q);
        const requestsData = await Promise.all(
          requestsSnapshot.docs.map(async (doc) => {
            const requestData = doc.data();

            const disciplinaryRecordsRef = collection(
              db,
              "disciplinaryRecords"
            );
            const disciplinaryQuery = query(
              disciplinaryRecordsRef,
              where("studentId", "==", requestData.studentId)
            );
            const disciplinarySnapshot = await getDocs(disciplinaryQuery);
            const disciplinaryRecords = disciplinarySnapshot.docs.map(
              (recordDoc) => recordDoc.data()
            );

            return {
              id: doc.id,
              ...requestData,
              disciplinaryRecords,
            };
          })
        );

        setClearanceRequests(requestsData);
        setOriginalRequests(requestsData);

        const uniqueSections = [
          ...new Set(requestsData.map((req) => req.section)),
        ];
        const uniqueSubjects = [
          ...new Set(requestsData.map((req) => req.subject)),
        ];
        const uniqueStatus = [
          ...new Set(requestsData.map((req) => req.status)),
        ];
        setAvailableSections(uniqueSections);
        setAvailableSubjects(uniqueSubjects);
        setAvailableStatus(uniqueStatus);
      } catch (error) {
        console.error("Error fetching clearance requests:", error);
      }
    };

    fetchClearanceRequests();
  }, [currentUser]);

  useEffect(() => {
    let filteredRequests = [...originalRequests];

    if (filterSection) {
      filteredRequests = filteredRequests.filter(
        (request) => request.section === filterSection
      );
    }

    if (filterStatus) {
      filteredRequests = filteredRequests.filter(
        (request) => request.status === filterStatus
      );
    }

    if (filterSubject) {
      filteredRequests = filteredRequests.filter(
        (request) => request.subject === filterSubject
      );
    }

    if (searchQuery) {
      filteredRequests = filteredRequests.filter((request) =>
        request.studentName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setClearanceRequests(filteredRequests);
  }, [filterSection, filterSubject, searchQuery, originalRequests, filterStatus]);

  const handleApprove = async (requestId, studentId, subject) => {
    try {
      await updateDoc(doc(db, "clearanceRequests", requestId), {
        status: "approved",
      });

      const studentsRef = collection(db, "students");
      const q = query(studentsRef, where("uid", "==", studentId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const studentDoc = querySnapshot.docs[0];
        await updateDoc(studentDoc.ref, {
          [`clearance.${subject}`]: true,
        });

        console.log(`Student clearance for ${subject} updated successfully.`);
      } else {
        console.log(`No student found with uid ${studentId}.`);
      }

      setClearanceRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === requestId ? { ...req, status: "approved" } : req
        )
      );

      const notificationsRef = collection(db, "studentNotification");
      await addDoc(notificationsRef, {
        isRead: false,
        notifTimestamp: serverTimestamp(),
        status: "approved",
        studentId: studentId,
        subject: subject,
      });

      showSuccessToast("Clearance approved!");
    } catch (error) {
      console.error("Error approving clearance:", error);
      showFailedToast("Error approving clearance. Please try again later");
    }
  };

  const openRejectModal = (request) => {
    setRequestToReject(request);
    setRejectionReason("");
    setIsModalOpen(true);
  };

  const closeRejectModal = () => {
    setRequestToReject(null);
    setRejectionReason("");
    setIsModalOpen(false);
  };

  const handleReject = async () => {
    if (!requestToReject || !rejectionReason) {
      showWarningToast("Please provide a reason for rejection");
      return;
    }

    try {
      await updateDoc(doc(db, "clearanceRequests", requestToReject.id), {
        status: "rejected",
      });

      setClearanceRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === requestToReject.id ? { ...req, status: "rejected" } : req
        )
      );

      const notificationsRef = collection(db, "studentNotification");
      await addDoc(notificationsRef, {
        isRead: false,
        notifTimestamp: serverTimestamp(),
        status: "rejected",
        reason: rejectionReason,
        studentId: requestToReject.studentId,
        subject: requestToReject.subject,
      });

      closeRejectModal();
      showSuccessToast("Clearance request rejected");
    } catch (error) {
      console.error("Error rejecting clearance:", error);
      showFailedToast("Error rejecting clearance. Please try again later");
    }
  };

  const handleExpandRow = (requestId) => {
    setExpandedRequestId((prevId) => (prevId === requestId ? null : requestId));
  };

  return (
    <Sidebar>
      <ToastContainer/>
      <div className="container mx-auto bg-blue-100 rounded pb-10 min-h-[90vh]">
        <div className="bg-blue-300 p-5 rounded flex justify-center items-center mb-10">
          <h2 className="text-3xl font-bold text-blue-950 text-center">Approve Clearance Requests</h2>
        </div>

        <div className="p-5">
          <div className="bg-white p-5 rounded-xl ">

            <div className="mb-4 sm:flex sm:gap-2 gap-y-2">

              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                <label className="block text-gray-700 mb-1">
                  Filter by Section:
                </label>
                <select
                  value={filterSection}
                  onChange={(e) => setFilterSection(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                >
                  <option value="">All Sections</option>
                  {availableSections.map((section) => (
                    <option key={section} value={section}>
                      {section}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                <label className="block text-gray-700 mb-1">
                  Filter by Subject:
                </label>
                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                >
                  <option value="">All Subjects</option>
                  {availableSubjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                <label className="block text-gray-700 mb-1">
                  Filter by Status:
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                >
                  <option value="">All Status</option>
                  {availableStatus.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                <label className="block text-gray-700 mb-1">
                  Search by Student Name:
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>
            </div>

            <div className="w-full overflow-auto">
              {clearanceRequests.length === 0 ? (
                <p>No clearance requests found.</p>
              ) : (
                <table className="min-w-full bg-white border border-gray-200">
                  <thead>
                    <tr className="bg-blue-300">
                      <th className="py-3 px-2 border border-gray-400">Student ID</th>
                      <th className="py-3 px-2 border border-gray-400">Student Name</th>
                      <th className="py-3 px-2 border border-gray-400">Subject</th>
                      <th className="py-3 px-2 border border-gray-400">Section</th>
                      <th className="py-3 px-2 border border-gray-400">Status</th>
                      <th className="py-3 px-2 border border-gray-400">
                        Disciplinary Records
                      </th>
                      <th className="py-3 px-2 border border-gray-400">Files</th>
                      <th className="py-3 px-2 border border-gray-400 text-center bg-[#fff2c1]">Actions</th>
                      <th className="py-3 px-2 border border-gray-400 text-center bg-[#fff2c1]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {clearanceRequests.map((request) => (
                      <React.Fragment key={request.id}>
                        <tr
                          key={request.id}
                          onClick={() => handleExpandRow(request.id)}
                          className="custom-row cursor-pointer bg-blue-100 hover:bg-blue-200"
                        >
                          <td className="border border-gray-400 px-4 py-2">{request.studentNo}</td>
                          <td className="border border-gray-400 px-4 py-2">{request.studentName}</td>
                          <td className="border border-gray-400 px-4 py-2">{request.subject}</td>
                          <td className="border border-gray-400 px-4 py-2">{request.section}</td>
                          <td className="border border-gray-400 px-4 py-2">{request.status}</td>
                          <td className="border border-gray-400 px-4 py-2">{request.disciplinaryRecords.length}</td>
                          <td className="border border-gray-400 px-4 py-2">
                            {request.fileURLs && request.fileURLs.length > 0 ? (
                              <ul>
                                {request.fileURLs.map((url, index) => (
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
                                ))}
                              </ul>
                            ) : (
                              "No files submitted"
                            )}
                          </td>
                          <td className="custom-cell border border-gray-400 px-4 py-2 text-center">
                            {request.status === "pending" && (
                              <>
                              <div className="gap-2 flex flex-wrap justify-center">
                                <motion.button
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() =>
                                    handleApprove(request.id, request.studentId, request.subject)
                                  }
                                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                >
                                  Approve
                                </motion.button>

                                <motion.button
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => openRejectModal(request)}
                                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                                >
                                  Reject
                                </motion.button>

                              </div>
                              </>
                            )}
                          </td>
                          <td className="custom-cell border border-gray-400 px-4 py-2 text-center">
                            <FontAwesomeIcon
                              icon={expandedRequestId === request.id ? faAngleUp : faAngleDown}
                            />
                          </td>
                        </tr>

                        {expandedRequestId === request.id && (
                          <tr className="bg-red-100">
                            <td colSpan={9} className="border px-4 py-2">
                              {request.disciplinaryRecords && request.disciplinaryRecords.length > 0 ? (
                                <div className="p-5">
                                  <h4 className="font-bold mb-2 text-center bg-red-200 p-3 text-red-950">
                                    Disciplinary Records:
                                  </h4>
                                  <table className="min-w-full">
                                    <thead>
                                      <tr className="bg-red-300">
                                        <th className="py-2 border border-gray-400">Date</th>
                                        <th className="py-2 border border-gray-400">Violations</th>
                                        <th className="py-2 border border-gray-400">Sanctions</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {request.disciplinaryRecords.map((record) => (
                                        <tr key={record.timestamp} className="">
                                          <td className="border border-gray-400 px-4 py-2">
                                            {moment(record.timestamp.toDate()).format("YYYY-MM-DD")}
                                          </td>
                                          <td className="border border-gray-400 px-4 py-2">
                                            {record.violations.join(", ")}
                                          </td>
                                          <td className="border border-gray-400 px-4 py-2">
                                            {record.sanctions.join(", ")}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p>No disciplinary records found.</p>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              )}

            </div>


          </div>
        </div>


      </div>

      <Modal isOpen={isModalOpen} onClose={closeRejectModal}>
        <div className="p-6">
          <h3 className="text-lg font-bold mb-4 text-center">
            Reject Clearance Request
          </h3>
          <p>
            Are you sure you want to reject this clearance request from{" "}
            <strong>{requestToReject?.studentName}</strong> for{" "}
            <strong>{requestToReject?.subject}</strong>?
          </p>

          <div className="mt-4">
            <label
              htmlFor="rejectionReason"
              className="block text-gray-700 mb-1"
            >
              Reason for Rejection:
            </label>
            <textarea
              id="rejectionReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              required
            />
          </div>

          <div className="mt-6 flex justify-around">
            <motion.button
            whileHover={{scale: 1.03}}
            whileTap={{scale: 0.95}}
            
              onClick={closeRejectModal}
              className="mr-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 w-full"
            >
              Cancel
            </motion.button>
            <motion.button
            whileHover={{scale: 1.03}}
            whileTap={{scale: 0.95}}
            
              onClick={handleReject}
              className={`px-4 py-2 rounded  text-white w-full ${
                !rejectionReason
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-red-500 hover:bg-red-600"
              }`}
              disabled={!rejectionReason}
            >
              Reject
            </motion.button>
          </div>
        </div>
      </Modal>
    </Sidebar>
  );
}

export default ApproveClearanceTeachers;
