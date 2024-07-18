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
import { faAngleDown, faAngleUp, faCirclePlus } from "@fortawesome/free-solid-svg-icons";
import { motion } from 'framer-motion';
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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

const SANCTIONS = {
  "Class A": [
    { label: "1st Offense: Oral Warning", value: "Oral Warning" },
    { label: "2nd Offense: Written Reprimand", value: "Written Reprimand" },
    { label: "3rd Offense: Suspension (2 days)", value: "Suspension (2 days)" },
    { label: "4th Offense: Suspension (3 days)", value: "Suspension (3 days)" },
    { label: "5th Offense: Exclusion", value: "Exclusion" },
  ],
  "Class B": [
    { label: "1st Offense: Written Reprimand", value: "Written Reprimand" },
    { label: "2nd Offense: Suspension (3 days)", value: "Suspension (3 days)" },
    { label: "3rd Offense: Suspension (5 days)", value: "Suspension (5 days)" },
    { label: "4th Offense: Exclusion", value: "Exclusion" },
  ],
  "Class C": [
    { label: "1st Offense: Suspension (3 days)", value: "Suspension (3 days)" },
    { label: "2nd Offense: Suspension (5 days)", value: "Suspension (5 days)" },
    { label: "3rd Offense: Exclusion", value: "Exclusion" },
  ],
  "Class D": [
    { label: "1st Offense: Suspension (5 days)", value: "Suspension (5 days)" },
    { label: "2nd Offense: Exclusion", value: "Exclusion" },
  ],
  "Class E": [{ label: "1st Offense: Exclusion", value: "Exclusion" }],
  "Class F": [{ label: "1st Offense: Expulsion", value: "Expulsion" }],
};

function DisciplinaryRecords() {
  const { currentUser } = useAuth();
  const [records, setRecords] = useState([]);
  const [originalRecords, setOriginalRecords] = useState([]);
  const [isAddRecordModalOpen, setIsAddRecordModalOpen] = useState(false);

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

  const [filterOffense, setFilterOffense] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [availableOffenses, setAvailableOffenses] = useState([]);

  const [selectedViolations, setSelectedViolations] = useState([]);
  const [selectedSanctions, setSelectedSanctions] = useState([]);

  const [offenseOptions, setOffenseOptions] = useState([]);
  const [selectedOffense, setSelectedOffense] = useState(null);

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
      try {
        const recordsRef = collection(db, "disciplinaryRecords");
        let q = query(recordsRef, orderBy("date", "desc"));

        if (filterOffense !== "all") {
          q = query(q, where("offense", "==", filterOffense));
        }

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
              const evidenceRef = ref(storage, recordData.evidence);
              evidenceURL = await getDownloadURL(evidenceRef);
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
              record.witnesses.map(async (witness) => {
                const collectionName =
                  witness.type === "teacher" ? "teachers" : "students";
                const witnessDoc = await getDoc(
                  doc(db, collectionName, witness.id)
                );
                const witnessData = witnessDoc.data();
                const witnessName =
                  witness.type === "teacher"
                    ? witnessData.name
                    : witnessData.fullName;
                return witnessName;
              })
            );

            return {
              ...record,
              witnessNames: witnessNames.join(", "),
            };
          })
        );

        setRecords(recordsWithWitnessNames);
        setOriginalRecords(recordsWithWitnessNames);

        const uniqueOffenses = [
          ...new Set(recordsData.map((record) => record.offense)),
        ];
        setAvailableOffenses(uniqueOffenses);
      } catch (error) {
        console.error("Error fetching disciplinary records:", error);
      }
    };

    fetchRecords();
  }, [filterOffense]);

  const getApplicableSanctions = () => {
    const selectedViolationClasses = selectedViolations.map((violation) =>
      violation.value.split(" (")[1].replace(")", "")
    );

    let applicableSanctions = [];
    selectedViolationClasses.forEach((classes) => {
      classes.split("/").forEach((classKey) => {
        classKey = classKey.trim();
        if (SANCTIONS[classKey]) {
          const previousOffensesCount = originalRecords.filter(
            (record) =>
              record.studentId === newRecord.studentId &&
              record.violations.some((v) => v.includes(classKey))
          ).length;

          const nextOffenseIndex = previousOffensesCount;
          const nextSanction = SANCTIONS[classKey][nextOffenseIndex];

          if (nextSanction) {
            applicableSanctions.push(nextSanction);
          }
        }
      });
    });

    return applicableSanctions;
  };

  const handleViolationChange = (selectedOptions) => {
    setSelectedViolations(selectedOptions);
  };

  const handleSanctionChange = (selectedOptions) => {
    setSelectedSanctions(selectedOptions);
  };

  const handleAddRecord = async (event) => {
    event.preventDefault();
    try {
      let evidenceFileURL = null;
      if (newRecord.evidence) {
        const storageRef = ref(
          storage,
          `disciplinary/${newRecord.studentId}/${newRecord.evidence.name}`
        );
        await uploadBytes(storageRef, newRecord.evidence);
        evidenceFileURL = await getDownloadURL(storageRef);
      }

      const witnesses = selectedWitnesses.map((witness) => ({
        id: witness.value,
        type: witness.type || "student",
        fullName: witness.fullName,
      }));

      const newRecordRef = await addDoc(collection(db, "disciplinaryRecords"), {
        ...newRecord,
        violations: selectedViolations.map((violation) => violation.value),
        sanctions: selectedSanctions.map((sanction) => sanction.value),
        witnesses: witnesses,
        evidence: evidenceFileURL,
        timestamp: serverTimestamp(),
        createdBy: currentUser.uid,
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
        date: "",
        offense: "",
        description: "",
        location: "",
        witnesses: [],
        evidence: null,
        violations: [],
        sanctions: [],
      });

      showSuccessToast("Disciplinary record added successfully!");
    } catch (error) {
      console.error("Error adding disciplinary record:", error);
      showFailedToast("Error adding record. Please try again later");
    }
  };

  const handleOffenseFilterChange = (selectedOption) => {
    setSelectedOffense(selectedOption);
  };

  const handleSearchQueryChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredRecords = originalRecords.filter((record) => {
    const offenseMatch =
      !selectedOffense ||
      selectedOffense.value === "all" ||
      record.violations.some(
        (violation) => violation === selectedOffense.value
      );

    const searchMatch =
      record.studentFullName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      record.studentNo.toLowerCase().includes(searchQuery.toLowerCase());

    return offenseMatch && searchMatch;
  });

  const handleStudentChange = (selectedOption) => {
    setSelectedStudent(selectedOption);
    console.log("Student ID: ", selectedOption);
    setNewRecord({
      ...newRecord,
      studentId: selectedOption ? selectedOption.uid : "",
      studentNo: selectedOption ? selectedOption.studentNo : "",
      studentFullName: selectedOption ? selectedOption.fullName : "",
      studentSection: selectedOption ? selectedOption.section : "",
      studentGradeLevel: selectedOption ? selectedOption.gradeLevel : "",
    });
  };

  const handleWitnessChange = (selectedOptions) => {
    setSelectedWitnesses(selectedOptions);

    const witnessFullNames = selectedOptions.map((option) => ({
      id: option.value,
      type: option.type || "student",
      fullName: option.fullName,
    }));

    setNewRecord({
      ...newRecord,
      witnesses: witnessFullNames,
    });
  };

  const handleExpandRow = (recordId) => {
    setExpandedRecordId((prevId) => (prevId === recordId ? null : recordId));
  };


  return (
    <Sidebar>
      <ToastContainer/>
      <div className="container mx-auto bg-blue-100 rounded pb-10 min-h-[90vh]">
        <div className="bg-blue-300 p-5 rounded flex justify-center items-center mb-10">
          <h2 className="text-3xl font-bold text-blue-950">Disciplinary Records</h2>
        </div>

        <div className="p-5">
          <div className="bg-white p-5 rounded-xl">

            <div className="mb-4 sm:flex gap-4 justify-around">

              <div className="sm:flex gap-4 w-full">

                <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                <label htmlFor="offenseFilter" className="block text-gray-700 mb-1">
                  Filter by Offense:
                </label>
                <Select
                  id="offenseFilter"
                  options={offenseOptions}
                  value={selectedOffense}
                  onChange={setSelectedOffense}
                  isClearable
                  isSearchable
                  placeholder="Select or search for an offense"
                  className="basic-single"
                  classNamePrefix="select"
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      minWidth: "200px",
                    }),
                    menu: (provided) => ({
                      ...provided,
                      minWidth: "200px",
                    }),
                    container: (provided) => ({
                      ...provided,
                      width: "100%",
                    }),
                  }}
                />
                </div>

                <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                  <label htmlFor="searchQuery" className="block text-gray-700 mb-1">
                    Search by Name:
                  </label>
                  <input
                    type="text"
                    id="searchQuery"
                    value={searchQuery}
                    onChange={handleSearchQueryChange}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                  />
                </div>

              </div>

              <div className="sm:w-[20%] justify-center flex items-center bg-blue-100 rounded p-5">
                <motion.button
                    whileHover={{scale: 1.03}}
                    whileTap={{scale: 0.95}}
                    onClick={() => setIsAddRecordModalOpen(true)}
                    className="px-4 py-3 flex items-center justify-center gap-1 bg-blue-500 text-white rounded hover:bg-blue-600 w-full"
                  >
                  <FontAwesomeIcon icon={faCirclePlus} className="text-xl"/>
                  <span>Add Record</span>

                </motion.button>

              </div>

            </div>

            <div className="w-full overflow-auto">
              <table className="min-w-full bg-white border border-gray-300 shadow-sm rounded-lg">
                <thead className="">
                  <tr className="bg-red-200">
                    <th className="py-3 px-4 border-b border-gray-300 text-left text-gray-700 font-semibold">
                      Student ID
                    </th>
                    <th className="py-3 px-4 border-b border-gray-300 text-left text-gray-700 font-semibold">
                      Name
                    </th>
                    <th className="py-3 px-4 border-b border-gray-300 text-left text-gray-700 font-semibold">
                      Section
                    </th>
                    <th className="py-3 px-4 border-b border-gray-300 text-left text-gray-700 font-semibold">
                      Grade Level
                    </th>
                    <th className="py-3 px-4 border-b border-gray-300 text-left text-gray-700 font-semibold">
                      Date
                    </th>
                    <th className="py-3 px-4 border-b border-gray-300 text-left text-gray-700 font-semibold">
                      Violations
                    </th>
                    <th className="py-3 px-4 border-b border-gray-300 text-left text-gray-700 font-semibold">
                      Sanctions
                    </th>
                    <th className="py-3 px-4 border-b border-gray-300"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <React.Fragment key={record.id}>
                      <tr
                        onClick={() => handleExpandRow(record.id)}
                        className="cursor-pointer bg-red-50 hover:bg-red-100 transition duration-150 ease-in-out"
                      >
                        <td className="border-t border-gray-300 px-4 py-3">
                          {record.studentNo}
                        </td>
                        <td className="border-t border-gray-300 px-4 py-3">
                          {record.studentFullName}
                        </td>
                        <td className="border-t border-gray-300 px-4 py-3">
                          {record.studentSection}
                        </td>
                        <td className="border-t border-gray-300 px-4 py-3">
                          {record.studentGradeLevel}
                        </td>
                        <td className="border-t border-gray-300 px-4 py-3">
                          {record.date instanceof Date
                            ? moment(record.date).format("YYYY-MM-DD")
                            : moment(new Date(record.date)).format("YYYY-MM-DD")}
                        </td>
                        <td className="border-t border-gray-300 px-4 py-3">
                          {record.violations.join(", ")}
                        </td>
                        <td className="border-t border-gray-300 px-4 py-3">
                          {record.sanctions.join(", ")}
                        </td>
                        <td className="border-t border-gray-300 px-4 py-3 text-center">
                          <FontAwesomeIcon
                            icon={
                              expandedRecordId === record.id ? faAngleUp : faAngleDown
                            }
                          />
                        </td>
                      </tr>

                      {expandedRecordId === record.id && (
                        <tr className="bg-red-100">
                          <td
                            colSpan={8}
                            className="border-t border-gray-300 px-4 py-3"
                          >
                            <div className="p-3">

                              <div className="mb-3">
                                <label className="block text-gray-600 text-sm font-semibold">
                                  Location:
                                </label>
                                <p>{record.location || "N/A"}</p>
                              </div>
                              <div className="mb-3">
                                <label className="block text-gray-600 text-sm font-semibold">
                                  Witnesses:
                                </label>
                                <p>{record.witnessNames}</p>
                              </div>
                              <div>
                                <label className="block text-gray-600 text-sm font-semibold">
                                  Evidence:
                                </label>
                                {record.evidenceURL ? (
                                  <a
                                    href={record.evidenceURL}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline"
                                  >
                                    View Evidence
                                  </a>
                                ) : (
                                  "No Evidence"
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>

            </div>




          </div>
        </div>



        <Modal
          isOpen={isAddRecordModalOpen}
          onClose={() => setIsAddRecordModalOpen(false)}
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Add Disciplinary Record
            </h3>
            <form className="space-y-4" onSubmit={handleAddRecord}>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Student Name:
                </label>
                <Select
                  value={selectedStudent}
                  onChange={handleStudentChange}
                  options={studentOptions}
                  className="basic-single"
                  classNamePrefix="select"
                />
              </div>

              <div>
                <label
                  htmlFor="date"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Date of Incident:
                </label>
                <input
                  type="date"
                  id="date"
                  value={newRecord.date}
                  onChange={(e) =>
                    setNewRecord({ ...newRecord, date: e.target.value })
                  }
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Violations:
                </label>
                <Select
                  isMulti
                  value={selectedViolations}
                  onChange={handleViolationChange}
                  options={Object.entries(VIOLATIONS).map(
                    ([section, violations]) => ({
                      label: section,
                      options: violations,
                    })
                  )}
                  className="basic-multi-select"
                  classNamePrefix="select"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Sanctions:
                </label>
                <Select
                  isMulti
                  value={selectedSanctions}
                  onChange={handleSanctionChange}
                  options={getApplicableSanctions()}
                  className="basic-multi-select"
                  classNamePrefix="select"
                />
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Location:
                </label>
                <input
                  type="text"
                  id="location"
                  value={newRecord.location}
                  onChange={(e) =>
                    setNewRecord({ ...newRecord, location: e.target.value })
                  }
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Witnesses:
                </label>
                <Select
                  isMulti
                  value={selectedWitnesses}
                  onChange={handleWitnessChange}
                  options={witnessOptions}
                  className="basic-multi-select"
                  classNamePrefix="select"
                />
              </div>

              <div>
                <label
                  htmlFor="evidence"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Evidence:
                </label>
                <input
                  type="file"
                  id="evidence"
                  onChange={(e) =>
                    setNewRecord({ ...newRecord, evidence: e.target.files[0] })
                  }
                  className="bg-[#fff2c1] shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>

              <div className="flex justify-around">

                <motion.button
                whileHover={{scale: 1.03}}
                whileTap={{scale: 0.95}}
                
                  type="button"
                  onClick={() => setIsAddRecordModalOpen(false)}
                  className="mr-2 px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 w-full"
                >
                  Cancel
                </motion.button>

                <motion.button
                  whileHover={{scale: 1.03}}
                  whileTap={{scale: 0.95}}
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full"
                >
                  Add Record
                </motion.button>

              </div>
            </form>
          </div>
        </Modal>
      </div>
    </Sidebar>
  );
}

export default DisciplinaryRecords;
