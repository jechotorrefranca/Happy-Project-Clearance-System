import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebaseConfig";
import { useAuth } from "../components/AuthContext";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import moment from "moment";
import Select from "react-select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faAngleDown,
  faAngleUp,
  faPlus,
  faSearch,
  faFilter,
  faExclamationTriangle,
  faUserShield,
  faCalendarAlt,
  faMapMarkerAlt,
  faUsers,
  faFileAlt,
  faGavel,
  faAlertCircle,
  faCheckCircle,
  faTimesCircle,
  faClipboardList,
  faChartBar,
  faBan,
  faUserGraduate,
  faUpload,
  faEye,
} from "@fortawesome/free-solid-svg-icons";

const VIOLATIONS = {
  "Sec. 1 Academic Integrity": [
    {
      label: "a. Cheating (Class D)",
      value: "Cheating (Class D)",
    },
    {
      label: "b. Plagiarism (Class D)",
      value: "Plagiarism (Class D)",
    },
    {
      label:
        "c. Falsification of academic records by altering, forging, or misrepresenting official scores, grade, or result of any graded assessment (Class D)",
      value: "Falsification of academic records (Class D)",
    },
    {
      label:
        "d. Academic dishonesty in research projects involves the intentional misrepresentation or falsification of research data, findings, results or methodologies in order to deceive or manipulate the academic community (Class D/E)",
      value: "Academic dishonesty in research projects (Class D/E)",
    },
  ],
  "Sec. 2 Attendance and Punctuality": [
    {
      label:
        "a. Frequent tardiness by consistently arriving late to classes without a valid reason (Class A)",
      value: "Frequent tardiness (Class A)",
    },
    {
      label:
        "b. Unexcused absences that may exceed 20% of the total class hours required (Class A)",
      value: "Unexcused absences (Class A)",
    },
    {
      label:
        "c. Leaving classes without permission by exiting the classroom during instructional time without authorization from the teacher (Class A)",
      value: "Leaving classes without permission (Class A)",
    },
  ],
  "Sec. 3 Dress Code": [
    {
      label:
        "a. Non-conformity to the prescribed uniform of the respective college including any violation of I.D. and proper hair cut requirements (Class A)",
      value: "Non-conformity to prescribed uniform (Class A)",
    },
    {
      label:
        "b. Misuse of school uniform by going to indecent places or engaging in unbecoming conduct while in uniform. (Class C)",
      value: "Misuse of school uniform (Class C)",
    },
  ],
  "Sec. 4 Conduct": [
    {
      label:
        "a. Any form of disorderly conduct such as shouting, unruly behavior, frequent insolence towards teachers and disseminating unauthorized publications within school premises (Class B)",
      value: "Disorderly conduct (Class B)",
    },
    {
      label:
        "b. Creation and/or distribution of unauthorized ID or school publications, illustrations/caricatures etc., distorting or injuring the image of the school, its faculty, and personnel (Class D)",
      value:
        "Creation/distribution of unauthorized ID or publications (Class D)",
    },
    {
      label:
        "c. Using indecent or obscene language within the school premises or engaging in immoral conduct and/or sexual advances. (Class C/D)",
      value: "Indecent language/immoral conduct (Class C/D)",
    },
    {
      label:
        "d. Willful disobedience, general misbehavior, rowdiness, reckless behavior or horseplay within school premises (Class B/C)",
      value: "Willful disobedience/misbehavior (Class B/C)",
    },
  ],
  "Sec. 5 Cyber Offenses": [
    {
      label:
        "a. Unauthorized access to the school computer systems or internet facilities (Class D/E)",
      value: "Unauthorized access to school computer systems (Class D/E)",
    },
    {
      label:
        "b. Introduction of viruses or malicious programs into the school systems (Class D/E)",
      value: "Introduction of viruses or malicious programs (Class D/E)",
    },
    {
      label:
        "c. Damaging or any attempt to damage computer systems, peripherals or networks belonging to the school (Class D/E)",
      value: "Damaging school computer systems (Class D/E)",
    },
    {
      label:
        "d. Misuse of school computer systems such as browsing unauthorized sites, downloading unauthorized files or using the system for personal gains. (Class D)",
      value: "Misuse of school computer systems (Class D)",
    },
    {
      label:
        "e. Hacking into an email, social networking or any electronic account to that will cause harm to any member of the academic community or damage the name and reputation of the school (Class D)",
      value: "Hacking into accounts (Class D)",
    },
    {
      label:
        "f. Cyber voyeurism and Cyber bullying including but not limited to text messages and messages posted on social networking sites such as Facebook, Twitter and the likes (Class D/E)",
      value: "Cyber voyeurism/bullying (Class D/E)",
    },
  ],
  "Sec. 6 Substance Abuse": [
    {
      label: "a. Smoking within the school premises. (Class A)",
      value: "Smoking (Class A)",
    },
    {
      label:
        "b. Possession of alcoholic beverage and/or drunkenness within the school premises. (Class B/C)",
      value: "Possession of alcohol/drunkenness (Class B/C)",
    },
    {
      label: "c. Gambling in any form even without money involved. (Class B)",
      value: "Gambling (Class B)",
    },
    {
      label:
        "d. Possession and/or distribution of prohibited drugs and narcotics within school premises. (Class F)",
      value: "Possession/distribution of drugs (Class F)",
    },
  ],
  "Sec. 7 Property Damage/Theft": [
    {
      label: "a. Improper use of school facilities (Class A)",
      value: "Improper use of school facilities (Class A)",
    },
    {
      label:
        "b. Spitting, littering, or scattering trash within school premises. (Class A)",
      value: "Spitting/littering (Class A)",
    },
    {
      label:
        "c. Unauthorized picking of fruits or flowers, cutting of trees or plants and raising of animals within school premises. (Class A)",
      value: "Unauthorized picking/cutting/raising animals (Class A)",
    },
    {
      label:
        "d. Identity theft by using the school ID, library card, or any personal ID of a fellow student (Class B)",
      value: "Identity theft (Class B)",
    },
    {
      label: "e. Violation of legally posted signs (Class B)",
      value: "Violation of legally posted signs (Class B)",
    },
    {
      label:
        "f. Connecting or disconnecting electrical wires and plumbing devices (Class B/C)",
      value: "Connecting/disconnecting electrical wires/plumbing (Class B/C)",
    },
    {
      label:
        "g. Any form of vandalism such as removing or damaging legally posted signs and notices (Class B), destroying another person or school property, either willfully or through negligence. (Class C/D)",
      value: "Vandalism (Class B/C/D)",
    },
    {
      label:
        "h. Stealing or attempting to steal any property of the school or of any person in school. (Class D/E)",
      value: "Stealing (Class D/E)",
    },
  ],
  "Sec. 8 Safety and Security": [
    {
      label:
        "a. Causing undue noise or disturbance in classrooms, library, corridors, quarters, public places or gatherings. (Class A)",
      value: "Causing undue noise or disturbance (Class A)",
    },
    {
      label:
        "b. Scandalous disturbance of peace and order within the school premises by tampering the fire alarm and smoke detectors (Class C)",
      value: "Scandalous disturbance of peace and order (Class C)",
    },
    {
      label:
        "c. Deliberately giving fictitious names to misrepresent facts. (Class D)",
      value: "Deliberately giving fictitious names (Class D)",
    },
    {
      label:
        "d. Possession of deadly weapons such as but not limited to knives, guns, ice picks and the like. (Class D/E)",
      value: "Possession of deadly weapons (Class D/E)",
    },
    {
      label:
        "e. Organizing and recruiting members for and joining any fraternity, sorority and other organization/s not approved by the school. (Class E)",
      value: "Organizing/joining unapproved organizations (Class E)",
    },
    {
      label:
        "f. Participating in whatever capacity, in the hazing activities of any fraternity, sorority and other organization/s not approved by the school. (Class E)",
      value: "Participating in hazing activities (Class E)",
    },
    {
      label:
        "g. Inciting or joining any form of group action (i.e. rallies, demonstrations, etc.) which create disorder or which impede or prevent the other students from attending their classes. (Class E)",
      value: "Inciting/joining disruptive group action (Class E)",
    },
    {
      label:
        "h. Any act of subversion or affiliation/participation in any subversive movement. (Class F)",
      value: "Subversion (Class F)",
    },
  ],
};

function DisciplinaryRecords() {
  const { currentUser } = useAuth();
  const [records, setRecords] = useState([]);
  const [originalRecords, setOriginalRecords] = useState([]);
  const [isAddRecordModalOpen, setIsAddRecordModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    total: 0,
    thisMonth: 0,
    pending: 0,
    resolved: 0,
  });

  const [studentOptions, setStudentOptions] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [witnessOptions, setWitnessOptions] = useState([]);
  const [selectedWitnesses, setSelectedWitnesses] = useState([]);
  const [expandedRecordId, setExpandedRecordId] = useState(null);

  const [newRecord, setNewRecord] = useState({
    studentId: "",
    studentNo: "",
    studentSection: "",
    studentFullName: "",
    studentGradeLevel: "",
    date: "",
    offense: "",
    description: "",
    location: "",
    witnesses: [],
    evidence: null,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedViolations, setSelectedViolations] = useState([]);
  const [selectedOffense, setSelectedOffense] = useState(null);
  const [offenseOptions, setOffenseOptions] = useState([]);
  const [dateFilter, setDateFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  useEffect(() => {
    const allOffenses = Object.values(VIOLATIONS).flatMap((violationGroup) =>
      violationGroup.map((violation) => ({
        value: violation.value,
        label: violation.value,
      }))
    );
    setOffenseOptions([
      { value: "all", label: "All Offenses" },
      ...allOffenses,
    ]);
  }, []);

  useEffect(() => {
    const fetchStudentsAndTeachers = async () => {
      try {
        const studentsSnapshot = await getDocs(collection(db, "students"));
        const studentsData = studentsSnapshot.docs.map((doc) => ({
          value: doc.id,
          label: `${doc.data().fullName} - ${doc.data().gradeLevel} - ${
            doc.data().section
          }`,
          fullName: doc.data().fullName,
          section: doc.data().section,
          gradeLevel: doc.data().gradeLevel,
          uid: doc.data().uid,
          studentNo: doc.data().studentId,
        }));
        setStudentOptions(studentsData);

        const teachersSnapshot = await getDocs(collection(db, "teachers"));
        const teachersData = teachersSnapshot.docs.map((doc) => ({
          value: doc.id,
          label: doc.data().name,
          fullName: doc.data().name,
          type: "teacher",
        }));

        setWitnessOptions([...teachersData, ...studentsData]);
      } catch (error) {
        console.error("Error fetching students/teachers: ", error);
      }
    };

    fetchStudentsAndTeachers();
  }, []);

  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      try {
        const recordsRef = collection(db, "disciplinaryRecords");
        let q = query(recordsRef, orderBy("date", "desc"));

        const recordsSnapshot = await getDocs(q);
        const recordsData = await Promise.all(
          recordsSnapshot.docs.map(async (doc) => {
            const recordData = doc.data();
            const studentId = recordData.studentId;

            const studentsRef = collection(db, "students");
            const studentQuery = query(
              studentsRef,
              where("uid", "==", studentId)
            );
            const studentSnapshot = await getDocs(studentQuery);
            let fullName = "";
            if (!studentSnapshot.empty) {
              fullName = studentSnapshot.docs[0].data().fullName;
            }

            let evidenceURL = null;
            if (recordData.evidence) {
              try {
                const evidenceRef = ref(storage, recordData.evidence);
                evidenceURL = await getDownloadURL(evidenceRef);
              } catch (error) {
                console.error("Error getting evidence URL:", error);
              }
            }

            return {
              id: doc.id,
              ...recordData,
              fullName,
              evidenceURL,
            };
          })
        );

        const recordsWithWitnessNames = await Promise.all(
          recordsData.map(async (record) => {
            const witnessNames = await Promise.all(
              (record.witnesses || []).map(async (witness) => {
                const collectionName =
                  witness.type === "teacher" ? "teachers" : "students";
                try {
                  const witnessDoc = await getDoc(
                    doc(db, collectionName, witness.id)
                  );
                  const witnessData = witnessDoc.data();
                  const witnessName =
                    witness.type === "teacher"
                      ? witnessData?.name
                      : witnessData?.fullName;
                  return witnessName;
                } catch (error) {
                  console.error("Error fetching witness:", error);
                  return "Unknown";
                }
              })
            );

            return {
              ...record,
              witnessNames: witnessNames.join(", "),
            };
          })
        );

        const now = new Date();
        const thisMonth = recordsWithWitnessNames.filter((record) => {
          const recordDate =
            record.date instanceof Date ? record.date : new Date(record.date);
          return (
            recordDate.getMonth() === now.getMonth() &&
            recordDate.getFullYear() === now.getFullYear()
          );
        }).length;

        setStatistics({
          total: recordsWithWitnessNames.length,
          thisMonth,
          pending: recordsWithWitnessNames.filter((r) => !r.resolved).length,
          resolved: recordsWithWitnessNames.filter((r) => r.resolved).length,
        });

        setRecords(recordsWithWitnessNames);
        setOriginalRecords(recordsWithWitnessNames);
      } catch (error) {
        console.error("Error fetching disciplinary records:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, []);

  const getSeverityColor = (violations) => {
    if (!violations || violations.length === 0)
      return "bg-gray-100 text-gray-800";

    const classes = violations
      .map((v) => {
        const match = v.match(/Class ([A-F])/);
        return match ? match[1] : null;
      })
      .filter(Boolean);

    if (classes.includes("F")) return "bg-red-100 text-red-800";
    if (classes.includes("E")) return "bg-orange-100 text-orange-800";
    if (classes.includes("D")) return "bg-yellow-100 text-yellow-800";
    if (classes.includes("C")) return "bg-blue-100 text-blue-800";
    if (classes.includes("B")) return "bg-indigo-100 text-indigo-800";
    return "bg-green-100 text-green-800";
  };

  const getSeverityLabel = (violations) => {
    if (!violations || violations.length === 0) return "Unknown";

    const classes = violations
      .map((v) => {
        const match = v.match(/Class ([A-F])/);
        return match ? match[1] : null;
      })
      .filter(Boolean);

    if (classes.includes("F")) return "Critical";
    if (classes.includes("E")) return "Severe";
    if (classes.includes("D")) return "Major";
    if (classes.includes("C")) return "Moderate";
    if (classes.includes("B")) return "Minor";
    return "Low";
  };

  const handleAddRecord = async (event) => {
    event.preventDefault();
    try {
      let evidenceFileURL = null;
      if (newRecord.evidence) {
        const storageRef = ref(
          storage,
          `disciplinary/${newRecord.studentId}/${Date.now()}_${
            newRecord.evidence.name
          }`
        );
        await uploadBytes(storageRef, newRecord.evidence);
        evidenceFileURL = storageRef.fullPath;
      }

      const witnesses = selectedWitnesses.map((witness) => ({
        id: witness.value,
        type: witness.type || "student",
        fullName: witness.fullName,
      }));

      const newRecordRef = await addDoc(collection(db, "disciplinaryRecords"), {
        ...newRecord,
        violations: selectedViolations.map((violation) => violation.value),
        witnesses: witnesses,
        evidence: evidenceFileURL,
        timestamp: serverTimestamp(),
        createdBy: currentUser.uid,
        resolved: false,
      });

      const auditLogsRef = collection(db, "auditLogs");
      await addDoc(auditLogsRef, {
        timestamp: serverTimestamp(),
        userId: currentUser.uid,
        actionType: "add_disciplinary_record",
        email: currentUser.email,
        details: {
          recordId: newRecordRef.id,
          studentId: newRecord.studentId,
          studentFullName: newRecord.studentFullName,
        },
      });

      setIsAddRecordModalOpen(false);
      setNewRecord({
        studentId: "",
        studentNo: "",
        studentSection: "",
        studentFullName: "",
        studentGradeLevel: "",
        date: "",
        offense: "",
        description: "",
        location: "",
        witnesses: [],
        evidence: null,
      });
      setSelectedStudent(null);
      setSelectedWitnesses([]);
      setSelectedViolations([]);

      alert("Disciplinary record added successfully!");
      window.location.reload();
    } catch (error) {
      console.error("Error adding disciplinary record:", error);
      alert("Error adding record. Please try again later.");
    }
  };

  const filteredRecords = originalRecords.filter((record) => {
    const offenseMatch =
      !selectedOffense ||
      selectedOffense.value === "all" ||
      record.violations?.some(
        (violation) => violation === selectedOffense.value
      );

    const searchMatch =
      record.studentFullName
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      record.studentNo?.toLowerCase().includes(searchQuery.toLowerCase());

    const dateMatch = (() => {
      if (dateFilter === "all") return true;
      const recordDate =
        record.date instanceof Date ? record.date : new Date(record.date);
      const now = new Date();

      switch (dateFilter) {
        case "today":
          return recordDate.toDateString() === now.toDateString();
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return recordDate >= weekAgo;
        case "month":
          return (
            recordDate.getMonth() === now.getMonth() &&
            recordDate.getFullYear() === now.getFullYear()
          );
        case "year":
          return recordDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    })();

    const severityMatch = (() => {
      if (severityFilter === "all") return true;
      const severity = getSeverityLabel(record.violations);
      return severity.toLowerCase() === severityFilter.toLowerCase();
    })();

    return offenseMatch && searchMatch && dateMatch && severityMatch;
  });

  const handleStudentChange = (selectedOption) => {
    setSelectedStudent(selectedOption);
    setNewRecord({
      ...newRecord,
      studentId: selectedOption?.uid || "",
      studentNo: selectedOption?.studentNo || "",
      studentFullName: selectedOption?.fullName || "",
      studentSection: selectedOption?.section || "Not specified",
      studentGradeLevel: selectedOption?.gradeLevel || "",
    });
  };

  const handleWitnessChange = (selectedOptions) => {
    setSelectedWitnesses(selectedOptions);
  };

  const handleExpandRow = (recordId) => {
    setExpandedRecordId((prevId) => (prevId === recordId ? null : recordId));
  };

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? "#3B82F6" : "#E5E7EB",
      boxShadow: state.isFocused ? "0 0 0 3px rgba(59, 130, 246, 0.1)" : "none",
      "&:hover": {
        borderColor: "#3B82F6",
      },
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: "#EBF5FF",
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: "#1E40AF",
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: "#1E40AF",
      "&:hover": {
        backgroundColor: "#3B82F6",
        color: "white",
      },
    }),
  };

  const StatCard = ({ icon, title, value, color, trend }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && <p className="text-xs text-gray-500 mt-1">{trend}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <FontAwesomeIcon icon={icon} className="text-xl" />
        </div>
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <FontAwesomeIcon
          icon={faClipboardList}
          className="text-3xl text-gray-400"
        />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        No records found
      </h3>
      <p className="text-gray-500 text-center max-w-sm">
        {searchQuery || selectedOffense?.value !== "all"
          ? "Try adjusting your filters or search query."
          : "No disciplinary records have been added yet."}
      </p>
    </div>
  );

  if (loading) {
    return (
      <Sidebar>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading records...</p>
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
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Disciplinary Records
                </h1>
                <p className="mt-2 text-gray-600">
                  Track and manage student disciplinary incidents
                </p>
              </div>
              <button
                onClick={() => setIsAddRecordModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <FontAwesomeIcon icon={faPlus} />
                Add Record
              </button>
            </div>
          </div>

          {}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={faClipboardList}
              title="Total Records"
              value={statistics.total}
              color="bg-blue-100 text-blue-600"
            />
            <StatCard
              icon={faCalendarAlt}
              title="This Month"
              value={statistics.thisMonth}
              trend={`${statistics.thisMonth > 0 ? "+" : ""}${
                statistics.thisMonth
              } new`}
              color="bg-green-100 text-green-600"
            />
            <StatCard
              icon={faExclamationTriangle}
              title="Pending Cases"
              value={statistics.pending}
              color="bg-yellow-100 text-yellow-600"
            />
            <StatCard
              icon={faCheckCircle}
              title="Resolved"
              value={statistics.resolved}
              color="bg-purple-100 text-purple-600"
            />
          </div>

          {}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Student
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FontAwesomeIcon
                      icon={faSearch}
                      className="text-gray-400"
                    />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or ID..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Offense Type
                </label>
                <Select
                  options={offenseOptions}
                  value={selectedOffense}
                  onChange={setSelectedOffense}
                  placeholder="All offenses"
                  styles={customSelectStyles}
                  isClearable
                />
              </div>

              {}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Period
                </label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>

              {}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Severity
                </label>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="severe">Severe</option>
                  <option value="major">Major</option>
                  <option value="moderate">Moderate</option>
                  <option value="minor">Minor</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>

            {}
            {(searchQuery ||
              selectedOffense?.value !== "all" ||
              dateFilter !== "all" ||
              severityFilter !== "all") && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                <span className="text-sm text-gray-500">Active filters:</span>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedOffense(null);
                    setDateFilter("all");
                    setSeverityFilter("all");
                  }}
                  className="ml-auto text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {}
          {filteredRecords.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Violations
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Severity
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRecords.map((record) => (
                      <React.Fragment key={record.id}>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {record.studentFullName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {record.studentNo} • {record.studentSection} •{" "}
                                {record.studentGradeLevel}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {moment(
                                record.date instanceof Date
                                  ? record.date
                                  : new Date(record.date)
                              ).format("MMM DD, YYYY")}
                            </div>
                            <div className="text-xs text-gray-500">
                              {moment(
                                record.date instanceof Date
                                  ? record.date
                                  : new Date(record.date)
                              ).fromNow()}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {record.violations
                                ?.slice(0, 2)
                                .map((violation, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                  >
                                    {violation.split("(")[0].trim()}
                                  </span>
                                ))}
                              {record.violations?.length > 2 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  +{record.violations.length - 2} more
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getSeverityColor(
                                record.violations
                              )}`}
                            >
                              {getSeverityLabel(record.violations)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleExpandRow(record.id)}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                            >
                              <FontAwesomeIcon
                                icon={
                                  expandedRecordId === record.id
                                    ? faAngleUp
                                    : faAngleDown
                                }
                              />
                            </button>
                          </td>
                        </tr>

                        {expandedRecordId === record.id && (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 bg-gray-50">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <FontAwesomeIcon
                                      icon={faMapMarkerAlt}
                                      className="text-gray-400"
                                    />
                                    Location
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    {record.location || "Not specified"}
                                  </p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <FontAwesomeIcon
                                      icon={faUsers}
                                      className="text-gray-400"
                                    />
                                    Witnesses
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    {record.witnessNames || "None"}
                                  </p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                    <FontAwesomeIcon
                                      icon={faFileAlt}
                                      className="text-gray-400"
                                    />
                                    Evidence
                                  </h4>
                                  {record.evidenceURL ? (
                                    <a
                                      href={record.evidenceURL}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                                    >
                                      <FontAwesomeIcon icon={faEye} />
                                      View Evidence
                                    </a>
                                  ) : (
                                    <p className="text-sm text-gray-600">
                                      No evidence attached
                                    </p>
                                  )}
                                </div>
                              </div>
                              {record.violations &&
                                record.violations.length > 0 && (
                                  <div className="mt-4 pt-4 border-t border-gray-200">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-2">
                                      All Violations
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                      {record.violations.map(
                                        (violation, idx) => (
                                          <span
                                            key={idx}
                                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                          >
                                            {violation}
                                          </span>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {}
          {filteredRecords.length > 0 && (
            <div className="mt-6 text-center text-sm text-gray-500">
              Showing {filteredRecords.length} of {originalRecords.length}{" "}
              records
            </div>
          )}
        </div>
      </div>

      {}
      <Modal
        isOpen={isAddRecordModalOpen}
        onClose={() => {
          setIsAddRecordModalOpen(false);
          setSelectedStudent(null);
          setSelectedWitnesses([]);
          setSelectedViolations([]);
        }}
      >
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900">
              Add Disciplinary Record
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Document a disciplinary incident
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleAddRecord}>
            {}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student <span className="text-red-500">*</span>
              </label>
              <Select
                value={selectedStudent}
                onChange={handleStudentChange}
                options={studentOptions}
                styles={customSelectStyles}
                placeholder="Search and select student..."
                isClearable
                required
              />
            </div>

            {}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Incident <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={newRecord.date}
                  onChange={(e) =>
                    setNewRecord({ ...newRecord, date: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={newRecord.location}
                  onChange={(e) =>
                    setNewRecord({ ...newRecord, location: e.target.value })
                  }
                  placeholder="e.g., Main Building, Room 101"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Violations <span className="text-red-500">*</span>
              </label>
              <Select
                isMulti
                value={selectedViolations}
                onChange={setSelectedViolations}
                options={Object.entries(VIOLATIONS).map(
                  ([section, violations]) => ({
                    label: section,
                    options: violations,
                  })
                )}
                styles={customSelectStyles}
                placeholder="Select violations..."
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Select all applicable violations
              </p>
            </div>

            {}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Witnesses
              </label>
              <Select
                isMulti
                value={selectedWitnesses}
                onChange={handleWitnessChange}
                options={witnessOptions}
                styles={customSelectStyles}
                placeholder="Select witnesses (teachers or students)..."
              />
            </div>

            {}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evidence
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
                <div className="space-y-1 text-center">
                  <FontAwesomeIcon
                    icon={faUpload}
                    className="mx-auto h-12 w-12 text-gray-400"
                  />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        onChange={(e) =>
                          setNewRecord({
                            ...newRecord,
                            evidence: e.target.files[0],
                          })
                        }
                        accept="image/*,.pdf,.doc,.docx"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, PDF up to 10MB
                  </p>
                  {newRecord.evidence && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ {newRecord.evidence.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {}
            <div className="flex justify-end gap-3 pt-6 border-t">
              <button
                type="button"
                onClick={() => {
                  setIsAddRecordModalOpen(false);
                  setSelectedStudent(null);
                  setSelectedWitnesses([]);
                  setSelectedViolations([]);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Record
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </Sidebar>
  );
}

export default DisciplinaryRecords;
