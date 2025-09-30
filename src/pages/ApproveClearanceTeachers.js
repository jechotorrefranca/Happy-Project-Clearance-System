import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  orderBy,
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
  faSearch,
  faFilter,
  faFileAlt,
  faExclamationTriangle,
  faInfoCircle,
  faThLarge,
  faListUl,
  faUsers,
  faClock,
  faGraduationCap,
  faBook,
  faIdCard,
  faLayerGroup,
  faSpinner,
  faDownload,
  faEye,
  faCheckDouble,
  faInbox,
  faHourglassHalf,
  faUserGraduate,
  faCalendarAlt,
  faCommentDots,
  faFileUpload,
  faHistory,
  faBan,
  faExclamationCircle,
  faClipboardCheck,
  faClipboardList,
  faTasks,
  faChartLine,
  faUserCheck,
  faFileImage,
  faFilePdf,
  faFileWord,
  faFileExcel,
  faFile,
  faExternalLinkAlt,
  faCheckSquare,
  faEnvelope,
  faPercentage,
  faWindowClose,
  faCalendarCheck,
  faChevronRight,
  faUndo,
} from "@fortawesome/free-solid-svg-icons";

function ApproveClearanceTeachers() {
  const { currentUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState("requests");
  
  const [clearanceRequests, setClearanceRequests] = useState([]);
  const [originalRequests, setOriginalRequests] = useState([]);
  const [expandedRequestId, setExpandedRequestId] = useState(null);
  const [requestToReject, setRequestToReject] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isFileViewModalOpen, setIsFileViewModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  const [students, setStudents] = useState([]);
  const [originalStudents, setOriginalStudents] = useState([]);
  const [expandedStudentId, setExpandedStudentId] = useState(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [studentsToClear, setStudentsToClear] = useState([]);
  const [selectedSubjectToClear, setSelectedSubjectToClear] = useState(null);
  const [showSubjectSelectModal, setShowSubjectSelectModal] = useState(false);
  const [pendingClearanceAction, setPendingClearanceAction] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSection, setFilterSection] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [availableSections, setAvailableSections] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [isConfirmBatchModalOpen, setIsConfirmBatchModalOpen] = useState(false);
  const [batchAction, setBatchAction] = useState("");
  
  const [statistics, setStatistics] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    withDisciplinary: 0,
    withFiles: 0,
    directCleared: 0,
    directPending: 0,
    directRejected: 0,
    clearanceRate: 0,
  });

  useEffect(() => {
    fetchTeacherData();
  }, [currentUser]);

  const fetchTeacherData = async () => {
    if (!currentUser) return;

    setLoading(true);
    try {
      const classesRef = collection(db, "classes");
      const classesSnapshot = await getDocs(classesRef);
      
      const teacherClassesData = [];
      const uniqueSubjects = new Set();
      const uniqueSections = new Set();
      
      classesSnapshot.docs.forEach((doc) => {
        const classData = doc.data();
        const teacherSubjectsInClass = classData.subjects?.filter(
          (subject) => subject.teacherUid === currentUser.uid
        ) || [];
        
        if (teacherSubjectsInClass.length > 0) {
          teacherClassesData.push({
            id: doc.id,
            ...classData,
            teacherSubjects: teacherSubjectsInClass.map(s => s.subject)
          });
          
          teacherSubjectsInClass.forEach(subject => {
            uniqueSubjects.add(subject.subject);
          });
          uniqueSections.add(classData.sectionName);
        }
      });
      
      const subjectsArray = Array.from(uniqueSubjects);
      setTeacherSubjects(subjectsArray);
      setTeacherClasses(teacherClassesData);
      setAvailableSubjects(subjectsArray);
      
      await Promise.all([
        fetchClearanceRequests(),
        fetchStudentsForTeacher(teacherClassesData, subjectsArray)
      ]);
    } catch (error) {
      console.error("Error fetching teacher data:", error);
    } finally {
      setLoading(false);
    }
  };

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

          const disciplinaryRecordsRef = collection(db, "disciplinaryRecords");
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
            submittedAt: requestData.timestamp?.toDate() || new Date(),
          };
        })
      );

      const uniqueRequests = requestsData.filter((request, index, self) =>
        index === self.findIndex((r) => r.id === request.id)
      );

      setClearanceRequests(uniqueRequests);
      setOriginalRequests(uniqueRequests);

      const uniqueSections = [
        ...new Set(uniqueRequests.map((req) => req.section).filter(Boolean)),
      ];
      setAvailableSections(prevSections => [
        ...new Set([...prevSections, ...uniqueSections])
      ]);

      return uniqueRequests;
    } catch (error) {
      console.error("Error fetching clearance requests:", error);
      return [];
    }
  };

  const fetchStudentsForTeacher = async (teacherClasses, subjects) => {
    if (!teacherClasses || teacherClasses.length === 0) return;

    try {
      const teacherSections = teacherClasses.map(c => c.sectionName);
      
      const studentsRef = collection(db, "students");
      const studentsPromises = teacherSections.map(section => 
        getDocs(query(studentsRef, where("section", "==", section)))
      );
      
      const studentsSnapshots = await Promise.all(studentsPromises);
      const allStudentsData = [];
      
      const requestsRef = collection(db, "clearanceRequests");
      const rejectedRequestsQuery = query(
        requestsRef, 
        where("teacherUid", "==", currentUser.uid),
        where("status", "==", "rejected")
      );
      const rejectedSnapshot = await getDocs(rejectedRequestsQuery);
      const rejectedRequests = {};
      
      rejectedSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!rejectedRequests[data.studentId]) {
          rejectedRequests[data.studentId] = {};
        }
        rejectedRequests[data.studentId][data.subject] = {
          status: "rejected",
          reason: data.rejectionReason,
          rejectedAt: data.rejectedAt
        };
      });
      
      studentsSnapshots.forEach(snapshot => {
        snapshot.docs.forEach(doc => {
          const studentData = doc.data();
          const clearance = studentData.clearance || {};
          
          const studentClass = teacherClasses.find(c => c.sectionName === studentData.section);
          const relevantSubjects = studentClass ? studentClass.teacherSubjects : [];
          
          const subjectStatuses = {};
          const rejectedSubjects = rejectedRequests[studentData.uid] || {};
          
          relevantSubjects.forEach(subject => {
            if (rejectedSubjects[subject]) {
              subjectStatuses[subject] = rejectedSubjects[subject];
            } else {
              subjectStatuses[subject] = {
                status: clearance[subject] ? "cleared" : "pending",
                cleared: clearance[subject] || false
              };
            }
          });
          
          const totalSubjects = relevantSubjects.length;
          const clearedSubjects = relevantSubjects.filter(subject => 
            subjectStatuses[subject].status === "cleared" || subjectStatuses[subject].cleared === true
          ).length;
          const rejectedSubjectsCount = relevantSubjects.filter(subject =>
            subjectStatuses[subject].status === "rejected"
          ).length;
          
          const completionPercentage = totalSubjects > 0
            ? Math.round((clearedSubjects / totalSubjects) * 100)
            : 0;
          
          allStudentsData.push({
            ...studentData,
            id: doc.id,
            uid: studentData.uid || doc.id,
            clearance,
            subjectStatuses,
            completionPercentage,
            totalSubjects,
            clearedSubjects,
            rejectedSubjectsCount,
            relevantSubjects,
            isFullyCleared: totalSubjects > 0 && clearedSubjects === totalSubjects,
            hasRejectedSubjects: rejectedSubjectsCount > 0,
          });
        });
      });

      const uniqueStudents = allStudentsData.filter((student, index, self) =>
        index === self.findIndex((s) => s.uid === student.uid)
      );

      const uniqueSections = [
        ...new Set(uniqueStudents.map((student) => student.section).filter(Boolean))
      ];
      setAvailableSections(prevSections => [
        ...new Set([...prevSections, ...uniqueSections])
      ]);

      setStudents(uniqueStudents);
      setOriginalStudents(uniqueStudents);
      
      return uniqueStudents;
    } catch (error) {
      console.error("Error fetching students:", error);
      return [];
    }
  };

  useEffect(() => {
    calculateStatistics();
  }, [clearanceRequests, students]);

  const calculateStatistics = () => {
    const stats = {
      total: clearanceRequests.length,
      pending: clearanceRequests.filter(r => r.status === "pending").length,
      approved: clearanceRequests.filter(r => r.status === "approved").length,
      rejected: clearanceRequests.filter(r => r.status === "rejected").length,
      withDisciplinary: clearanceRequests.filter(r => r.disciplinaryRecords?.length > 0).length,
      withFiles: clearanceRequests.filter(r => r.fileURLs?.length > 0).length,
      directCleared: students.filter(s => s.isFullyCleared).length,
      directPending: students.filter(s => !s.isFullyCleared && !s.hasRejectedSubjects).length,
      directRejected: students.filter(s => s.hasRejectedSubjects).length,
      clearanceRate: students.length > 0 
        ? Math.round((students.filter(s => s.isFullyCleared).length / students.length) * 100)
        : 0,
    };
    setStatistics(stats);
  };

  useEffect(() => {
    let filteredRequests = [...originalRequests];

    if (filterSection !== "all") {
      filteredRequests = filteredRequests.filter(
        (request) => request.section === filterSection
      );
    }

    if (filterSubject !== "all") {
      filteredRequests = filteredRequests.filter(
        (request) => request.subject === filterSubject
      );
    }

    if (filterStatus !== "all") {
      filteredRequests = filteredRequests.filter(
        (request) => request.status === filterStatus
      );
    }

    if (searchQuery) {
      filteredRequests = filteredRequests.filter((request) =>
        request.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.studentNo?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setClearanceRequests(filteredRequests);
  }, [filterSection, filterSubject, filterStatus, searchQuery, originalRequests]);

  useEffect(() => {
    let filteredStudents = [...originalStudents];

    if (filterSection !== "all") {
      filteredStudents = filteredStudents.filter(
        (student) => student.section === filterSection
      );
    }

    if (filterSubject !== "all") {
      filteredStudents = filteredStudents.filter(
        (student) => student.relevantSubjects?.includes(filterSubject)
      );
    }

    if (filterStatus !== "all") {
      if (filterStatus === "cleared") {
        filteredStudents = filteredStudents.filter((student) => {
          if (filterSubject === "all") {
            return student.isFullyCleared;
          } else {
            const status = student.subjectStatuses?.[filterSubject];
            return status?.status === "cleared" || status?.cleared === true;
          }
        });
      } else if (filterStatus === "pending") {
        filteredStudents = filteredStudents.filter((student) => {
          if (filterSubject === "all") {
            return !student.isFullyCleared && !student.hasRejectedSubjects;
          } else {
            const status = student.subjectStatuses?.[filterSubject];
            return status?.status === "pending";
          }
        });
      } else if (filterStatus === "rejected") {
        filteredStudents = filteredStudents.filter((student) => {
          if (filterSubject === "all") {
            return student.hasRejectedSubjects;
          } else {
            const status = student.subjectStatuses?.[filterSubject];
            return status?.status === "rejected";
          }
        });
      }
    }

    if (searchQuery) {
      filteredStudents = filteredStudents.filter((student) =>
        student.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setStudents(filteredStudents);
  }, [filterSection, filterSubject, filterStatus, searchQuery, originalStudents]);

  const handleClearStudentSubject = async (studentId, subject) => {
    try {
      const q = query(collection(db, "students"), where("uid", "==", studentId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.error("No student found with uid:", studentId);
        alert("Error: Student not found.");
        return false;
      }

      const studentDocRef = doc(db, "students", querySnapshot.docs[0].id);
      
      await updateDoc(studentDocRef, {
        [`clearance.${subject}`]: true,
      });

      const requestsRef = collection(db, "clearanceRequests");
      const rejectedQuery = query(
        requestsRef,
        where("studentId", "==", studentId),
        where("subject", "==", subject),
        where("status", "==", "rejected")
      );
      const rejectedSnapshot = await getDocs(rejectedQuery);
      
      for (const doc of rejectedSnapshot.docs) {
        await updateDoc(doc.ref, {
          status: "approved",
          approvedAt: serverTimestamp(),
          previousStatus: "rejected",
        });
      }

      setStudents((prevStudents) =>
        prevStudents.map((student) => {
          if (student.uid === studentId) {
            const updatedStatuses = { ...student.subjectStatuses };
            updatedStatuses[subject] = {
              status: "cleared",
              cleared: true
            };
            
            const clearedSubjects = student.relevantSubjects.filter(
              subj => updatedStatuses[subj]?.status === "cleared" || updatedStatuses[subj]?.cleared === true
            ).length;
            const rejectedSubjectsCount = student.relevantSubjects.filter(
              subj => updatedStatuses[subj]?.status === "rejected"
            ).length;
            const totalSubjects = student.relevantSubjects.length;
            
            return {
              ...student,
              subjectStatuses: updatedStatuses,
              clearedSubjects,
              rejectedSubjectsCount,
              completionPercentage: Math.round((clearedSubjects / totalSubjects) * 100),
              isFullyCleared: clearedSubjects === totalSubjects,
              hasRejectedSubjects: rejectedSubjectsCount > 0,
            };
          }
          return student;
        })
      );

      setOriginalStudents((prevStudents) =>
        prevStudents.map((student) => {
          if (student.uid === studentId) {
            const updatedStatuses = { ...student.subjectStatuses };
            updatedStatuses[subject] = {
              status: "cleared",
              cleared: true
            };
            
            const clearedSubjects = student.relevantSubjects.filter(
              subj => updatedStatuses[subj]?.status === "cleared" || updatedStatuses[subj]?.cleared === true
            ).length;
            const rejectedSubjectsCount = student.relevantSubjects.filter(
              subj => updatedStatuses[subj]?.status === "rejected"
            ).length;
            const totalSubjects = student.relevantSubjects.length;
            
            return {
              ...student,
              subjectStatuses: updatedStatuses,
              clearedSubjects,
              rejectedSubjectsCount,
              completionPercentage: Math.round((clearedSubjects / totalSubjects) * 100),
              isFullyCleared: clearedSubjects === totalSubjects,
              hasRejectedSubjects: rejectedSubjectsCount > 0,
            };
          }
          return student;
        })
      );

      return true;
    } catch (error) {
      console.error("Error updating student clearance: ", error);
      return false;
    }
  };

  const handleOpenSubjectSelection = (studentId) => {
    setPendingClearanceAction({ type: 'single', studentId });
    setShowSubjectSelectModal(true);
  };

  const handleConfirmClearSubject = async () => {
    if (!selectedSubjectToClear || !pendingClearanceAction) return;

    setShowSubjectSelectModal(false);
    
    if (pendingClearanceAction.type === 'single') {
      const success = await handleClearStudentSubject(
        pendingClearanceAction.studentId, 
        selectedSubjectToClear
      );
      if (success) {
        alert(`Successfully cleared ${selectedSubjectToClear} for the student.`);
      }
    } else if (pendingClearanceAction.type === 'bulk') {
      await confirmClearSelectedStudents();
    }
    
    setSelectedSubjectToClear(null);
    setPendingClearanceAction(null);
  };

  const handleApprove = async (requestId, studentId, subject) => {
    try {
      await updateDoc(doc(db, "clearanceRequests", requestId), {
        status: "approved",
        approvedAt: serverTimestamp(),
      });

      const studentsRef = collection(db, "students");
      const q = query(studentsRef, where("uid", "==", studentId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const studentDoc = querySnapshot.docs[0];
        await updateDoc(studentDoc.ref, {
          [`clearance.${subject}`]: true,
        });
      }

      setClearanceRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === requestId ? { ...req, status: "approved" } : req
        )
      );

      setOriginalRequests((prevRequests) =>
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
        message: `Your clearance request for ${subject} has been approved.`,
      });

      calculateStatistics();
      alert("Clearance request approved successfully!");
    } catch (error) {
      console.error("Error approving clearance:", error);
      alert("Error approving clearance. Please try again later.");
    }
  };

  const handleReject = async () => {
    if (!requestToReject || !rejectionReason.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }

    try {
      await updateDoc(doc(db, "clearanceRequests", requestToReject.id), {
        status: "rejected",
        rejectedAt: serverTimestamp(),
        rejectionReason: rejectionReason,
      });

      setClearanceRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === requestToReject.id 
            ? { ...req, status: "rejected", rejectionReason } 
            : req
        )
      );

      setOriginalRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === requestToReject.id 
            ? { ...req, status: "rejected", rejectionReason } 
            : req
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
        message: `Your clearance request for ${requestToReject.subject} has been rejected. Reason: ${rejectionReason}`,
      });

      closeRejectModal();
      calculateStatistics();
      
      await fetchTeacherData();
      
      alert("Clearance request rejected.");
    } catch (error) {
      console.error("Error rejecting clearance:", error);
      alert("Error rejecting clearance. Please try again later.");
    }
  };

    const openRejectModal = (request) => {
    setRequestToReject(request);
    setRejectionReason("");
    setIsRejectModalOpen(true);
  };

  const closeRejectModal = () => {
    setRequestToReject(null);
    setRejectionReason("");
    setIsRejectModalOpen(false);
  };

  const handleViewFiles = (files, studentName) => {
    setSelectedFiles(files || []);
    setSelectedStudent(studentName);
    setIsFileViewModalOpen(true);
  };

  const handleSelectRequest = (requestId) => {
    if (selectedRequests.includes(requestId)) {
      setSelectedRequests(selectedRequests.filter(id => id !== requestId));
    } else {
      setSelectedRequests([...selectedRequests, requestId]);
    }
  };

  const handleSelectAllRequests = () => {
    const pendingRequests = clearanceRequests
      .filter(r => r.status === "pending")
      .map(r => r.id);
    
    if (selectedRequests.length === pendingRequests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(pendingRequests);
    }
  };

  const handleSelectAllStudents = () => {
    const eligibleStudents = students.filter((student) => {
      return student.relevantSubjects.some(subject => {
        const status = student.subjectStatuses?.[subject];
        return status?.status === "pending" || status?.status === "rejected";
      });
    });

    const allSelected = selectedStudentIds.length === eligibleStudents.length;

    if (allSelected) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(eligibleStudents.map((student) => student.uid));
    }
  };

  const handleSelectStudent = (studentId) => {
    if (selectedStudentIds.includes(studentId)) {
      setSelectedStudentIds(
        selectedStudentIds.filter((id) => id !== studentId)
      );
    } else {
      setSelectedStudentIds([...selectedStudentIds, studentId]);
    }
  };

  const handleClearSelectedStudents = async () => {
    if (selectedStudentIds.length === 0) return;

    const selectedStudentNames = students
      .filter(s => selectedStudentIds.includes(s.uid))
      .map(s => s.fullName);

    setStudentsToClear(selectedStudentNames);
    setPendingClearanceAction({ type: 'bulk', studentIds: selectedStudentIds });
    setShowSubjectSelectModal(true);
  };

  const confirmClearSelectedStudents = async () => {
    if (!selectedSubjectToClear) return;
    
    setIsConfirmModalOpen(false);
    setLoading(true);

    try {
      let successCount = 0;
      
      for (const studentId of selectedStudentIds) {
        const success = await handleClearStudentSubject(studentId, selectedSubjectToClear);
        if (success) successCount++;
      }

      alert(`Successfully cleared ${selectedSubjectToClear} for ${successCount} student(s).`);
      setSelectedStudentIds([]);
      calculateStatistics();
    } catch (error) {
      console.error("Error clearing selected students: ", error);
      alert("Error clearing students. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleBatchAction = (action) => {
    if (selectedRequests.length === 0) {
      alert("Please select at least one request.");
      return;
    }
    setBatchAction(action);
    setIsConfirmBatchModalOpen(true);
  };

  const executeBatchAction = async () => {
    if (batchAction === "approve") {
      for (const requestId of selectedRequests) {
        const request = clearanceRequests.find(r => r.id === requestId);
        if (request && request.status === "pending") {
          await handleApprove(request.id, request.studentId, request.subject);
        }
      }
    }
    setSelectedRequests([]);
    setIsConfirmBatchModalOpen(false);
    setBatchAction("");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
      case "cleared": return "bg-green-100 text-green-800 border-green-200";
      case "rejected": return "bg-red-100 text-red-800 border-red-200";
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
      case "cleared": return faCheckCircle;
      case "rejected": return faTimesCircle;
      case "pending": return faHourglassHalf;
      default: return faInfoCircle;
    }
  };

  const getFileIcon = (url) => {
    const extension = url.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf': return faFilePdf;
      case 'doc':
      case 'docx': return faFileWord;
      case 'xls':
      case 'xlsx': return faFileExcel;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif': return faFileImage;
      default: return faFile;
    }
  };

  const StatCard = ({ icon, title, value, color, subtitle }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <FontAwesomeIcon icon={icon} className="text-xl" />
        </div>
      </div>
    </div>
  );

  const RequestCard = ({ request }) => {
    const isSelected = selectedRequests.includes(request.id);

    return (
      <div className={`bg-white rounded-xl shadow-sm border ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
      } overflow-hidden hover:shadow-md transition-all duration-200`}>
        <div className="p-6">
          {}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start">
              {request.status === "pending" && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleSelectRequest(request.id)}
                  className="mt-1 mr-3 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{request.studentName}</h3>
                <p className="text-sm text-gray-500">{request.studentNo}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
              <FontAwesomeIcon icon={getStatusIcon(request.status)} className="mr-1" />
              {request.status}
            </span>
          </div>

          {}
          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm">
              <FontAwesomeIcon icon={faBook} className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-gray-600">Subject:</span>
              <span className="ml-2 font-medium text-gray-900">{request.subject}</span>
            </div>
            <div className="flex items-center text-sm">
              <FontAwesomeIcon icon={faLayerGroup} className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-gray-600">Section:</span>
              <span className="ml-2 font-medium text-gray-900">{request.section}</span>
            </div>
            <div className="flex items-center text-sm">
              <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-gray-600">Submitted:</span>
              <span className="ml-2 font-medium text-gray-900">
                {moment(request.submittedAt).format("MMM DD, YYYY h:mm A")}
              </span>
            </div>
          </div>

          {}
          <div className="flex gap-4 mb-4 pb-4 border-b border-gray-100">
            <div className="flex items-center">
              <FontAwesomeIcon 
                icon={faExclamationTriangle} 
                className={`w-4 h-4 mr-2 ${
                  request.disciplinaryRecords?.length > 0 ? 'text-yellow-500' : 'text-gray-300'
                }`} 
              />
              <span className="text-sm text-gray-600">
                {request.disciplinaryRecords?.length || 0} Records
              </span>
            </div>
            <div className="flex items-center">
              <FontAwesomeIcon 
                icon={faFileAlt} 
                className={`w-4 h-4 mr-2 ${
                  request.fileURLs?.length > 0 ? 'text-blue-500' : 'text-gray-300'
                }`} 
              />
              <span className="text-sm text-gray-600">
                {request.fileURLs?.length || 0} Files
              </span>
            </div>
          </div>

          {}
          {request.status === "pending" ? (
            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(request.id, request.studentId, request.subject)}
                className="flex-1 py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faCheckCircle} className="mr-2" />
                Approve
              </button>
              <button
                onClick={() => openRejectModal(request)}
                className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faTimesCircle} className="mr-2" />
                Reject
              </button>
            </div>
          ) : (
            <div className={`py-2 px-4 rounded-lg text-center ${
              request.status === "approved" 
                ? "bg-green-50 text-green-700" 
                : "bg-red-50 text-red-700"
            }`}>
              <FontAwesomeIcon icon={getStatusIcon(request.status)} className="mr-2" />
              {request.status === "approved" ? "Approved" : "Rejected"}
              {request.rejectionReason && (
                <p className="text-xs mt-1">Reason: {request.rejectionReason}</p>
              )}
            </div>
          )}

          {}
          <div className="mt-4 flex gap-2">
            {request.fileURLs?.length > 0 && (
              <button
                onClick={() => handleViewFiles(request.fileURLs, request.studentName)}
                className="flex-1 py-2 px-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faEye} className="mr-2" />
                View Files
              </button>
            )}
            <button
              onClick={() => setExpandedRequestId(expandedRequestId === request.id ? null : request.id)}
              className="flex-1 py-2 px-3 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-sm flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faHistory} className="mr-2" />
              Records
              <FontAwesomeIcon 
                icon={expandedRequestId === request.id ? faAngleUp : faAngleDown} 
                className="ml-2" 
              />
            </button>
          </div>
        </div>

        {}
        {expandedRequestId === request.id && (
          <div className="border-t border-gray-200 bg-gray-50 p-6">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
              <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2 text-yellow-500" />
              Disciplinary Records
            </h4>
            {request.disciplinaryRecords && request.disciplinaryRecords.length > 0 ? (
              <div className="space-y-2">
                {request.disciplinaryRecords.map((record, index) => (
                  <div key={`${request.id}-record-${index}`} className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {moment(record.timestamp?.toDate()).format("MMMM DD, YYYY")}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Violations:</span> {record.violations?.join(", ")}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Sanctions:</span> {record.sanctions?.join(", ")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <FontAwesomeIcon icon={faCheckCircle} className="text-3xl text-green-500 mb-2" />
                <p className="text-gray-600">No disciplinary records found</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const StudentCard = ({ student }) => {
    const hasUncleared = student.relevantSubjects?.some(subject => {
      const status = student.subjectStatuses?.[subject];
      return status?.status === "pending" || status?.status === "rejected";
    });

    return (
      <div className={`bg-white rounded-xl shadow-sm border ${
        student.isFullyCleared ? 'border-green-200' : 
        student.hasRejectedSubjects ? 'border-red-200' : 'border-gray-200'
      } overflow-hidden hover:shadow-md transition-all duration-200`}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              {hasUncleared && (
                <input
                  type="checkbox"
                  checked={selectedStudentIds.includes(student.uid)}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleSelectStudent(student.uid);
                  }}
                  className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{student.fullName}</h3>
                <p className="text-sm text-gray-500">{student.studentId}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              student.isFullyCleared 
                ? 'bg-green-100 text-green-800' 
                : student.hasRejectedSubjects
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {student.isFullyCleared ? 'All Cleared' : 
               student.hasRejectedSubjects ? 'Has Rejected' : 'Pending'}
            </span>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 mr-2 text-gray-400" />
              {student.email}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <FontAwesomeIcon icon={faLayerGroup} className="w-4 h-4 mr-2 text-gray-400" />
              {student.section || 'No Section'}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <FontAwesomeIcon icon={faGraduationCap} className="w-4 h-4 mr-2 text-gray-400" />
              {student.gradeLevel} - {student.educationLevel}
            </div>
          </div>

          {}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Subject Progress</span>
              <span className="text-sm font-bold text-gray-900">{student.completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  student.completionPercentage === 100 ? 'bg-green-500' :
                  student.completionPercentage >= 75 ? 'bg-blue-500' :
                  student.completionPercentage >= 50 ? 'bg-yellow-500' :
                  student.completionPercentage >= 25 ? 'bg-orange-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${student.completionPercentage}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {student.clearedSubjects} cleared, {student.rejectedSubjectsCount} rejected of {student.totalSubjects} subjects
            </p>
          </div>

          {}
          {student.relevantSubjects?.length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase">Subject Status</h4>
              <div className="space-y-1">
                {student.relevantSubjects.map((subject) => {
                  const status = student.subjectStatuses?.[subject];
                  return (
                    <div key={`${student.uid}-${subject}`} className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">{subject}</span>
                      <span className={`flex items-center ${
                        status?.status === "cleared" || status?.cleared ? 'text-green-500' :
                        status?.status === "rejected" ? 'text-red-500' :
                        'text-gray-400'
                      }`}>
                        <FontAwesomeIcon 
                          icon={
                            status?.status === "cleared" || status?.cleared ? faCheckCircle :
                            status?.status === "rejected" ? faTimesCircle :
                            faHourglassHalf
                          } 
                        />
                        {status?.status === "rejected" && (
                          <span className="ml-1 text-red-600">(Rejected)</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {}
          {expandedStudentId === student.uid ? (
            <div className="border-t pt-4 space-y-2">
              <p className="text-sm font-medium text-gray-700 mb-2">Clear specific subject:</p>
              {student.relevantSubjects.map((subject) => {
                const status = student.subjectStatuses?.[subject];
                const isCleared = status?.status === "cleared" || status?.cleared;
                const isRejected = status?.status === "rejected";
                
                return (
                  <button
                    key={`${student.uid}-btn-${subject}`}
                    onClick={() => !isCleared && handleClearStudentSubject(student.uid, subject)}
                    disabled={isCleared}
                    className={`w-full py-2 px-3 rounded-lg text-sm transition-colors flex items-center justify-between ${
                      isCleared 
                        ? 'bg-green-50 text-green-700 cursor-default' 
                        : isRejected
                        ? 'bg-red-50 text-red-700 hover:bg-red-100'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>{subject}</span>
                    <span className="flex items-center">
                      {isCleared ? (
                        <>
                          <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                          Cleared
                        </>
                      ) : isRejected ? (
                        <>
                          <FontAwesomeIcon icon={faUndo} className="mr-1" />
                          Clear (Was Rejected)
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faCheckCircle} className="mr-1" />
                          Clear
                        </>
                      )}
                    </span>
                  </button>
                );
              })}
              <button
                onClick={() => setExpandedStudentId(null)}
                className="w-full py-2 px-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 text-sm"
              >
                Close
              </button>
            </div>
          ) : (
            <button
              onClick={() => setExpandedStudentId(student.uid)}
              className="w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
            >
              <FontAwesomeIcon icon={faChevronRight} className="mr-2" />
              Select Subject to Clear
            </button>
          )}
        </div>
      </div>
    );
  };

  const EmptyState = ({ message, icon = faInbox }) => (
    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
      <FontAwesomeIcon icon={icon} className="text-5xl text-gray-300 mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No data found</h3>
      <p className="text-gray-500">{message}</p>
    </div>
  );

  if (loading) {
    return (
      <Sidebar>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <FontAwesomeIcon icon={faSpinner} className="text-4xl text-blue-500 animate-spin mb-4" />
            <p className="text-gray-600">Loading clearance data...</p>
          </div>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg mr-4">
                  <FontAwesomeIcon icon={faClipboardCheck} className="text-2xl text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Teacher Clearance Management</h1>
                  <p className="text-gray-600 mt-1">
                    Manage clearance requests and approve students
                  </p>
                  {teacherSubjects.length > 0 && (
                    <p className="text-sm text-blue-600 mt-2">
                      <FontAwesomeIcon icon={faBook} className="mr-2" />
                      Subjects: {teacherSubjects.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <StatCard
              icon={faUsers}
              title="Total Students"
              value={originalStudents.length}
              color="bg-blue-100 text-blue-600"
            />
            <StatCard
              icon={faClock}
              title="Pending Requests"
              value={statistics.pending}
              subtitle="Awaiting review"
              color="bg-yellow-100 text-yellow-600"
            />
            <StatCard
              icon={faCheckCircle}
              title="Cleared Students"
              value={statistics.directCleared}
              subtitle={`${statistics.clearanceRate}% completion`}
              color="bg-green-100 text-green-600"
            />
            <StatCard
              icon={faTimesCircle}
              title="Rejected"
              value={statistics.rejected + statistics.directRejected}
              subtitle="Needs re-submission"
              color="bg-red-100 text-red-600"
            />
            <StatCard
              icon={faHourglassHalf}
              title="In Progress"
              value={statistics.directPending}
              subtitle="Partially cleared"
              color="bg-orange-100 text-orange-600"
            />
          </div>

          {}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="flex border-b">
              <button
                onClick={() => {
                  setActiveTab("requests");
                  setFilterStatus("all");
                  setSelectedStudentIds([]);
                }}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === "requests"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <FontAwesomeIcon icon={faInbox} className="mr-2" />
                Clearance Requests
                {statistics.pending > 0 && (
                  <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                    {statistics.pending}
                  </span>
                )}
              </button>
              <button
                onClick={() => {
                  setActiveTab("direct");
                  setFilterStatus("all");
                  setSelectedRequests([]);
                  setExpandedStudentId(null);
                }}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === "direct"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <FontAwesomeIcon icon={faCheckSquare} className="mr-2" />
                Direct Clearance
                {originalStudents.length > 0 && (
                  <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                    {originalStudents.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {}
              <div className="flex-1">
                <div className="relative">
                  <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={activeTab === "requests" ? "Search by student name or ID..." : "Search by name, ID, or email..."}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {}
              <div className="flex gap-2 flex-wrap">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  {activeTab === "requests" ? (
                    <>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </>
                  ) : (
                    <>
                      <option value="cleared">Fully Cleared</option>
                      <option value="rejected">Has Rejected</option>
                    </>
                  )}
                </select>

                <select
                  value={filterSection}
                  onChange={(e) => setFilterSection(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Sections</option>
                  {availableSections.map((section) => (
                    <option key={section} value={section}>
                      {section}
                    </option>
                  ))}
                </select>

                <select
                  value={filterSubject}
                  onChange={(e) => setFilterSubject(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Subjects</option>
                  {teacherSubjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>

                {}
                <div className="flex bg-gray-100 rounded-lg p-1 ml-auto">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded ${viewMode === "grid" ? "bg-white shadow-sm" : ""}`}
                  >
                    <FontAwesomeIcon icon={faThLarge} />
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`p-2 rounded ${viewMode === "table" ? "bg-white shadow-sm" : ""}`}
                  >
                    <FontAwesomeIcon icon={faListUl} />
                  </button>
                </div>
              </div>
            </div>

            {}
            {activeTab === "requests" && clearanceRequests.filter(r => r.status === "pending").length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                <label className="flex items-center text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedRequests.length === clearanceRequests.filter(r => r.status === "pending").length}
                    onChange={handleSelectAllRequests}
                    className="mr-2 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  Select all pending requests ({clearanceRequests.filter(r => r.status === "pending").length})
                </label>
                {selectedRequests.length > 0 && (
                  <button
                    onClick={() => handleBatchAction("approve")}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
                  >
                    <FontAwesomeIcon icon={faCheckDouble} className="mr-2" />
                    Approve {selectedRequests.length} Selected
                  </button>
                )}
              </div>
            )}

            {activeTab === "direct" && students.some(s => s.relevantSubjects?.some(subj => {
              const status = s.subjectStatuses?.[subj];
              return status?.status === "pending" || status?.status === "rejected";
            })) && (
              <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                <label className="flex items-center text-sm text-gray-600 hover:text-gray-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.length > 0 && selectedStudentIds.length === students.filter(s => 
                      s.relevantSubjects?.some(subj => {
                        const status = s.subjectStatuses?.[subj];
                        return status?.status === "pending" || status?.status === "rejected";
                      })
                    ).length}
                    onChange={handleSelectAllStudents}
                    className="mr-2 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  Select all with pending/rejected subjects
                </label>
                {selectedStudentIds.length > 0 && (
                  <button
                    onClick={handleClearSelectedStudents}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
                  >
                    <FontAwesomeIcon icon={faCheckDouble} className="mr-2" />
                    Clear {selectedStudentIds.length} Selected
                  </button>
                )}
              </div>
            )}
          </div>

          {}
          {activeTab === "requests" ? (
            clearanceRequests.length === 0 ? (
              <EmptyState 
                message="You haven't received any clearance requests yet."
                icon={faInbox}
              />
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clearanceRequests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {clearanceRequests.some(r => r.status === "pending") && (
                          <th className="px-6 py-3 text-left">
                            <input
                              type="checkbox"
                              checked={selectedRequests.length === clearanceRequests.filter(r => r.status === "pending").length}
                              onChange={handleSelectAllRequests}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                          </th>
                        )}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Subject
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Section
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Records
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Files
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Submitted
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {clearanceRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50">
                          {clearanceRequests.some(r => r.status === "pending") && (
                            <td className="px-6 py-4">
                              {request.status === "pending" && (
                                <input
                                  type="checkbox"
                                  checked={selectedRequests.includes(request.id)}
                                  onChange={() => handleSelectRequest(request.id)}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                              )}
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {request.studentName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.studentNo}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {request.subject}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {request.section}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                              <FontAwesomeIcon icon={getStatusIcon(request.status)} className="mr-1" />
                              {request.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm ${
                              request.disciplinaryRecords?.length > 0 
                                ? 'text-yellow-600 font-medium' 
                                : 'text-gray-500'
                            }`}>
                              {request.disciplinaryRecords?.length || 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {request.fileURLs?.length > 0 ? (
                              <button
                                onClick={() => handleViewFiles(request.fileURLs, request.studentName)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                <FontAwesomeIcon icon={faEye} className="mr-1" />
                                {request.fileURLs.length}
                              </button>
                            ) : (
                              <span className="text-gray-500">0</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {moment(request.submittedAt).format("MMM DD, YYYY")}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {request.status === "pending" ? (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleApprove(request.id, request.studentId, request.subject)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Approve"
                                >
                                  <FontAwesomeIcon icon={faCheckCircle} />
                                </button>
                                <button
                                  onClick={() => openRejectModal(request)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Reject"
                                >
                                  <FontAwesomeIcon icon={faTimesCircle} />
                                </button>
                              </div>
                            ) : (
                              <span className={`text-sm ${
                                request.status === "approved" 
                                  ? "text-green-600" 
                                  : "text-red-600"
                              }`}>
                                {request.status}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : (
            students.length === 0 ? (
              <EmptyState 
                message="No students found for your subjects and classes."
                icon={faUserGraduate}
              />
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {students.map((student) => (
                  <StudentCard key={student.uid || student.id} student={student} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          {students.filter(s => 
                            s.relevantSubjects?.some(subj => {
                              const status = s.subjectStatuses?.[subj];
                              return status?.status === "pending" || status?.status === "rejected";
                            })
                          ).length > 0 && (
                            <input
                              type="checkbox"
                              checked={selectedStudentIds.length === students.filter(s => 
                                s.relevantSubjects?.some(subj => {
                                  const status = s.subjectStatuses?.[subj];
                                  return status?.status === "pending" || status?.status === "rejected";
                                })
                              ).length}
                              onChange={handleSelectAllStudents}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                          )}
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Section
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Level
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Progress
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {students.map((student) => {
                        const hasUncleared = student.relevantSubjects?.some(subject => {
                          const status = student.subjectStatuses?.[subject];
                          return status?.status === "pending" || status?.status === "rejected";
                        });
                        
                        return (
                          <tr key={student.uid || student.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              {hasUncleared && (
                                <input
                                  type="checkbox"
                                  checked={selectedStudentIds.includes(student.uid)}
                                  onChange={() => handleSelectStudent(student.uid)}
                                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {student.fullName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {student.studentId}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{student.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{student.section || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm text-gray-900">{student.gradeLevel}</div>
                                <div className="text-xs text-gray-500">{student.educationLevel}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-1">
                                  <div className="flex items-center">
                                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                                      <div
                                        className={`h-2 rounded-full ${
                                          student.completionPercentage === 100 ? 'bg-green-500' :
                                          student.completionPercentage >= 75 ? 'bg-blue-500' :
                                          student.completionPercentage >= 50 ? 'bg-yellow-500' :
                                          'bg-red-500'
                                        }`}
                                        style={{ width: `${student.completionPercentage}%` }}
                                      />
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">
                                      {student.completionPercentage}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                student.isFullyCleared 
                                  ? 'bg-green-100 text-green-800' 
                                  : student.hasRejectedSubjects
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {student.isFullyCleared ? 'All Cleared' : 
                                 student.hasRejectedSubjects ? 'Has Rejected' : 'Pending'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <button
                                onClick={() => setExpandedStudentId(expandedStudentId === student.uid ? null : student.uid)}
                                className="text-blue-600 hover:text-blue-900"
                                title="View/Clear Subjects"
                              >
                                <FontAwesomeIcon icon={faChevronRight} />
                              </button>
                            </td>
                          </tr>
                                                  );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}

          {}
          {((activeTab === "requests" && clearanceRequests.length > 0) || 
            (activeTab === "direct" && students.length > 0)) && (
            <div className="mt-6 text-center text-sm text-gray-500">
              {activeTab === "requests" 
                ? `Showing ${clearanceRequests.length} of ${originalRequests.length} requests`
                : `Showing ${students.length} of ${originalStudents.length} students`
              }
            </div>
          )}
        </div>
      </div>

      {}
      <Modal isOpen={showSubjectSelectModal} onClose={() => {
        setShowSubjectSelectModal(false);
        setSelectedSubjectToClear(null);
        setPendingClearanceAction(null);
      }}>
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full mb-4">
            <FontAwesomeIcon icon={faBook} className="text-blue-600" />
          </div>
          
          <h3 className="text-lg font-semibold text-center mb-2">Select Subject to Clear</h3>
          
          <p className="text-gray-600 text-center mb-4">
            Choose which subject you want to clear for the selected student(s)
          </p>

          {pendingClearanceAction?.type === 'bulk' && studentsToClear.length > 0 && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
              <p className="text-xs font-medium text-gray-700 mb-2">Selected Students:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                {studentsToClear.map((name, index) => (
                  <li key={index}>• {name}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-2 mb-6">
            {teacherSubjects.map((subject) => (
              <button
                key={subject}
                onClick={() => setSelectedSubjectToClear(subject)}
                className={`w-full py-3 px-4 rounded-lg border-2 transition-all ${
                  selectedSubjectToClear === subject
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                <FontAwesomeIcon icon={faBook} className="mr-2" />
                {subject}
              </button>
            ))}
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                setShowSubjectSelectModal(false);
                setSelectedSubjectToClear(null);
                setPendingClearanceAction(null);
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmClearSubject}
              disabled={!selectedSubjectToClear}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear Selected Subject
            </button>
          </div>
        </div>
      </Modal>

      {}
      <Modal isOpen={isRejectModalOpen} onClose={closeRejectModal}>
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
            <FontAwesomeIcon icon={faTimesCircle} className="text-red-600" />
          </div>
          
          <h3 className="text-lg font-semibold text-center mb-2">Reject Clearance Request</h3>
          
          <p className="text-gray-600 text-center mb-4">
            You are about to reject the clearance request from{" "}
            <strong>{requestToReject?.studentName}</strong> for{" "}
            <strong>{requestToReject?.subject}</strong>
          </p>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FontAwesomeIcon icon={faCommentDots} className="mr-2 text-gray-400" />
              Reason for Rejection
              <span className="text-red-500 ml-1">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="4"
              placeholder="Please provide a clear reason for rejection..."
            />
          </div>

          <div className="flex justify-center gap-3">
            <button
              onClick={closeRejectModal}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reject Request
            </button>
          </div>
        </div>
      </Modal>

      {}
      <Modal isOpen={isFileViewModalOpen} onClose={() => setIsFileViewModalOpen(false)}>
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 bg-blue-100 rounded-lg mr-3">
              <FontAwesomeIcon icon={faFileAlt} className="text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              Submitted Files - {selectedStudent}
            </h3>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {selectedFiles.length > 0 ? (
              selectedFiles.map((url, index) => (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <FontAwesomeIcon icon={getFileIcon(url)} className="text-2xl text-gray-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">File {index + 1}</p>
                      <p className="text-xs text-gray-500">Click to view</p>
                    </div>
                  </div>
                  <FontAwesomeIcon icon={faExternalLinkAlt} className="text-gray-400" />
                </a>
              ))
            ) : (
              <p className="text-center text-gray-500">No files submitted</p>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setIsFileViewModalOpen(false)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {}
      <Modal isOpen={isConfirmBatchModalOpen} onClose={() => setIsConfirmBatchModalOpen(false)}>
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full mb-4">
            <FontAwesomeIcon icon={faCheckDouble} className="text-green-600" />
          </div>
          
          <h3 className="text-lg font-semibold text-center mb-2">Confirm Batch Approval</h3>
          
          <p className="text-gray-600 text-center mb-6">
            Are you sure you want to approve {selectedRequests.length} selected request(s)?
          </p>

          <div className="mb-4 p-3 bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
            <p className="text-xs font-medium text-gray-700 mb-2">Requests to approve:</p>
            <ul className="text-xs text-gray-600 space-y-1">
              {selectedRequests.map((requestId) => {
                const request = clearanceRequests.find(r => r.id === requestId);
                return request ? (
                  <li key={requestId}>
                    • {request.studentName} - {request.subject}
                  </li>
                ) : null;
              })}
            </ul>
          </div>
          
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setIsConfirmBatchModalOpen(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={executeBatchAction}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              <FontAwesomeIcon icon={faCheckDouble} className="mr-2" />
              Approve All
            </button>
          </div>
        </div>
      </Modal>

      {}
      <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)}>
        <div className="p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-100 rounded-full mb-4">
            <FontAwesomeIcon icon={faCheckDouble} className="text-green-600" />
          </div>
          
          <h3 className="text-lg font-semibold text-center mb-2">Confirm Bulk Clearance</h3>
          
          <p className="text-gray-600 text-center mb-4">
            Are you sure you want to clear the following {studentsToClear.length} student(s)?
            {selectedSubjectToClear && (
              <span className="block mt-2 font-medium text-blue-600">
                For subject: {selectedSubjectToClear}
              </span>
            )}
          </p>
          
          <div className="max-h-40 overflow-y-auto mb-6 bg-gray-50 rounded-lg p-3">
            <ul className="text-sm text-gray-700 space-y-1">
              {studentsToClear.map((name, index) => (
                <li key={index}>• {name}</li>
              ))}
            </ul>
          </div>
          
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setIsConfirmModalOpen(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={confirmClearSelectedStudents}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Confirm Clear All
            </button>
          </div>
        </div>
      </Modal>
    </Sidebar>
  );
}

export default ApproveClearanceTeachers;