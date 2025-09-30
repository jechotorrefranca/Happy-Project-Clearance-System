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
  faCheckCircle,
  faTimesCircle,
  faAngleDown,
  faAngleUp,
} from "@fortawesome/free-solid-svg-icons";

function ApproveClearanceOffice() {
  const { currentUser, userRole } = useAuth();
  const [clearanceRequests, setClearanceRequests] = useState([]);
  const [originalRequests, setOriginalRequests] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [requestToReject, setRequestToReject] = useState(null);
  const [filterSection, setFilterSection] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [availableSections, setAvailableSections] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [expandedRequestId, setExpandedRequestId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("Debug - Auth values:", {
      currentUser: currentUser,
      userRole: userRole,
      currentUserId: currentUser?.uid
    });
  }, [currentUser, userRole]);

  useEffect(() => {
    const fetchClearanceRequests = async () => {
      console.log("Debug - Starting fetchClearanceRequests");
      
      if (!currentUser) {
        console.log("Debug - No currentUser, returning early");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        console.log("Debug - Fetching with officerId:", currentUser.uid);
        
        const requestsRef = collection(db, "clearanceRequests");
        const q = query(requestsRef, where("officerId", "==", currentUser.uid));

        console.log("Debug - Executing query...");
        const requestsSnapshot = await getDocs(q);
        console.log("Debug - Query returned", requestsSnapshot.size, "documents");

        const requestsData = await Promise.all(
          requestsSnapshot.docs.map(async (doc) => {
            const requestData = doc.data();
            console.log("Debug - Processing request:", doc.id, requestData);

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

            let eventsAttended = 0;
            if (userRole === "Office of The Dean") {
              console.log("Debug - Fetching events for Office of The Dean");
              const eventsRef = collection(db, "events");
              const eventsSnapshot = await getDocs(eventsRef);
              eventsSnapshot.forEach((eventDoc) => {
                const eventData = eventDoc.data();
                const attendeesArray = Object.values(eventData.attendees || {});
                if (
                  attendeesArray.some(
                    (attendee) => attendee.studentNo === requestData.studentNo
                  )
                ) {
                  eventsAttended++;
                }
              });
            }

            let disciplinaryRecordsCount = 0;
            if (userRole === "Character Renewal Office") {
              disciplinaryRecordsCount = disciplinaryRecords.length;
            }

            return {
              id: doc.id,
              ...requestData,
              disciplinaryRecords,
              eventsAttended,
              disciplinaryRecordsCount,
            };
          })
        );

        console.log("Debug - Processed all requests:", requestsData);
        
        setClearanceRequests(requestsData);
        setOriginalRequests(requestsData);

        const uniqueSections = [
          ...new Set(requestsData.map((req) => req.section)),
        ];
        const uniqueSubjects = [
          ...new Set(requestsData.map((req) => req.subject)),
        ];
        setAvailableSections(uniqueSections);
        setAvailableSubjects(uniqueSubjects);
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching clearance requests:", error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    fetchClearanceRequests();
  }, [currentUser, userRole]);

  useEffect(() => {
    let filteredRequests = [...originalRequests];

    if (filterSection) {
      filteredRequests = filteredRequests.filter(
        (request) => request.section === filterSection
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
  }, [filterSection, filterSubject, searchQuery, originalRequests]);

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

      alert("Clearance approved!");
    } catch (error) {
      console.error("Error approving clearance:", error);
      alert("Error approving clearance. Please try again later.");
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
      alert("Please provide a reason for rejection.");
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
      alert("Clearance request rejected.");
    } catch (error) {
      console.error("Error rejecting clearance:", error);
      alert("Error rejecting clearance. Please try again later.");
    }
  };

  const handleExpandRow = (requestId) => {
    setExpandedRequestId((prevId) => (prevId === requestId ? null : requestId));
  };

  if (isLoading) {
    return (
      <Sidebar>
        <div className="container mx-auto p-4">
          <h2 className="text-2xl font-semibold mb-4">Loading clearance data...</h2>
          <p>Current user: {currentUser ? currentUser.uid : "Not logged in"}</p>
          <p>User role: {userRole || "No role assigned"}</p>
        </div>
      </Sidebar>
    );
  }

  if (error) {
    return (
      <Sidebar>
        <div className="container mx-auto p-4">
          <h2 className="text-2xl font-semibold mb-4 text-red-600">Error loading data</h2>
          <p>{error}</p>
          <p>Current user: {currentUser ? currentUser.uid : "Not logged in"}</p>
          <p>User role: {userRole || "No role assigned"}</p>
        </div>
      </Sidebar>
    );
  }

  if (!currentUser) {
    return (
      <Sidebar>
        <div className="container mx-auto p-4">
          <h2 className="text-2xl font-semibold mb-4">Not authenticated</h2>
          <p>Please log in to view clearance requests.</p>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">
          Approve Clearance Requests
        </h2>

        {}
        <div className="mb-4 p-2 bg-gray-100 text-sm">
          <p>Debug: Found {clearanceRequests.length} clearance requests</p>
          <p>User Role: {userRole}</p>
          <p>User ID: {currentUser.uid}</p>
        </div>

        <div className="mb-4 flex space-x-4">
          <div>
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

          <div>
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

          <div>
            <label className="block text-gray-700 mb-1">
              Search by Student Name:
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter student name"
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>
        </div>

        {clearanceRequests.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No clearance requests found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b">Student Name</th>
                  <th className="py-2 px-4 border-b">Section</th>
                  <th className="py-2 px-4 border-b">Subject</th>
                  <th className="py-2 px-4 border-b">Date Submitted</th>
                  <th className="py-2 px-4 border-b">Status</th>
                  {userRole === "Character Renewal Office" && (
                    <th className="py-2 px-4 border-b">Disciplinary Records</th>
                  )}
                  {userRole === "Office of The Dean" && (
                    <th className="py-2 px-4 border-b">Events Attended</th>
                  )}
                  <th className="py-2 px-4 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {clearanceRequests.map((request) => (
                  <React.Fragment key={request.id}>
                    <tr>
                      <td className="py-2 px-4 border-b">{request.studentName}</td>
                      <td className="py-2 px-4 border-b">{request.section}</td>
                      <td className="py-2 px-4 border-b">{request.subject}</td>
                      <td className="py-2 px-4 border-b">
                        {request.timestamp && request.timestamp.toDate ? 
                          moment(request.timestamp.toDate()).format(
                            "MMMM Do YYYY, h:mm:ss a"
                          ) : "N/A"}
                      </td>
                      <td className="py-2 px-4 border-b">{request.status}</td>
                      {userRole === "Character Renewal Office" && (
                        <td className="py-2 px-4 border-b">
                          {request.disciplinaryRecordsCount}
                        </td>
                      )}
                      {userRole === "Office of The Dean" && (
                        <td className="py-2 px-4 border-b">
                          {request.eventsAttended}
                        </td>
                      )}
                      <td className="py-2 px-4 border-b flex space-x-2">
                        {request.status === "pending" && (
                          <>
                            <button
                              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-2 rounded focus:outline-none focus:ring"
                              onClick={() =>
                                handleApprove(
                                  request.id,
                                  request.studentId,
                                  request.subject
                                )
                              }
                            >
                              Approve
                            </button>
                            <button
                              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-2 rounded focus:outline-none focus:ring"
                              onClick={() => openRejectModal(request)}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-1 px-2 rounded focus:outline-none focus:ring"
                          onClick={() => handleExpandRow(request.id)}
                        >
                          {expandedRequestId === request.id ? (
                            <FontAwesomeIcon icon={faAngleUp} />
                          ) : (
                            <FontAwesomeIcon icon={faAngleDown} />
                          )}
                        </button>
                      </td>
                    </tr>
                    {expandedRequestId === request.id && (
                      <tr>
                        <td colSpan="8" className="py-2 px-4 border-b bg-gray-100">
                          <div className="p-4">
                            <h3 className="text-lg font-semibold mb-2">
                              Disciplinary Records
                            </h3>
                            {request.disciplinaryRecords.length > 0 ? (
                              <ul>
                                {request.disciplinaryRecords.map((record, index) => (
                                  <li key={index} className="mb-2">
                                    <strong>Violation:</strong> {record.violation}
                                    <br />
                                    <strong>Date:</strong>{" "}
                                    {record.date && record.date.toDate ? 
                                      moment(record.date.toDate()).format(
                                        "MMMM Do YYYY"
                                      ) : "N/A"}
                                    <br />
                                    <strong>Description:</strong> {record.description}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p>No disciplinary records found.</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal isOpen={isModalOpen} onClose={closeRejectModal}>
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">
              Reject Clearance Request
            </h3>
            <label className="block text-gray-700 mb-2">Reason for rejection:</label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300 mb-4"
              rows="4"
            />
            <div className="flex justify-end space-x-2">
              <button
                className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-1 px-4 rounded focus:outline-none focus:ring"
                onClick={closeRejectModal}
              >
                Cancel
              </button>
              <button
                className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-4 rounded focus:outline-none focus:ring"
                onClick={handleReject}
              >
                Reject
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </Sidebar>
  );
}

export default ApproveClearanceOffice;