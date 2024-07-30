import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebaseConfig";
import Sidebar from "../components/Sidebar";
import moment from "moment";
import { motion } from 'framer-motion';

function GuidanceReports() {
  const [sched, setSched] = useState([]);
  const [originalSched, setOriginalSched] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCounselor, setFilterCounselor] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterGradeLevel, setFilterGradeLevel] = useState("all");
  const [filterSection, setFilterSection] = useState("all");
  const [searchName, setSearchName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [availableStatus, setAvailableStatus] = useState([]);
  const [availableCounselor, setAvailableCounselor] = useState([]);
  const [availableDepartment, setAvailableDepartment] = useState([]);
  const [availableGradeLevel, setAvailableGradeLevel] = useState([]);
  const [availableSection, setAvailableSection] = useState([]);

  useEffect(() => {
    const fetchSched = async () => {
      try {
        const schedRef = collection(db, "guidanceAppointments");
        const q = query(schedRef, orderBy("start", sortOrder));

        const schedSnapshot = await getDocs(q);
        const schedData = schedSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSched(schedData);
        setOriginalSched(schedData);

      } catch (error) {
        console.error("Error fetching appointment schedules:", error);
      }
    };

    fetchSched();
  }, [sortOrder]);

  // Filter Reports 
  useEffect(() => {
    let filteredSched = [...originalSched];

    if (filterStatus !== "all") {
      filteredSched = filteredSched.filter(
        (sched) => sched.status === filterStatus
      );
    }

    if (filterCounselor !== "all") {
      filteredSched = filteredSched.filter(
        (sched) => sched.counselorName === filterCounselor
      );
    }

    if (filterDepartment !== "all") {
      filteredSched = filteredSched.filter(
        (sched) => sched.department === filterDepartment
      );
    }

    if (filterGradeLevel !== "all") {
      filteredSched = filteredSched.filter(
        (sched) => sched.gradeLevel === filterGradeLevel
      );
    }

    if (filterSection !== "all") {
      filteredSched = filteredSched.filter(
        (sched) => sched.section === filterSection
      );
    }

    if (searchName) {
      filteredSched = filteredSched.filter((sched) =>
        sched.fullName.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    if (startDate) {
      filteredSched = filteredSched.filter(
        (sched) => moment(sched.start.toDate()).format("YYYY-MM-DD") >= startDate
      );
    }

    if (endDate) {
      filteredSched = filteredSched.filter(
        (sched) => moment(sched.start.toDate()).format("YYYY-MM-DD") <= endDate
      );
    }

    setSched(filteredSched);
  }, [filterStatus, searchName, startDate, endDate, originalSched, filterCounselor, filterDepartment, filterGradeLevel, filterSection]);

  useEffect(() => {
    const updateFilteredOptions = () => {
      let filtered = [...sched];

      const uniqueStatus = [...new Set(filtered.map((sched) => sched.status))];
      setAvailableStatus(uniqueStatus);

      const uniqueCounselor = [...new Set(filtered.map((sched) => sched.counselorName))];
      setAvailableCounselor(uniqueCounselor);

      const uniqueDepartment = [...new Set(filtered
        .map((sched) => sched.department)
        .filter((department) => department !== null)
      )];
      setAvailableDepartment(uniqueDepartment);

      const uniqueGradeLevel = [...new Set(filtered.map((sched) => sched.gradeLevel))];
      setAvailableGradeLevel(uniqueGradeLevel);

      const uniqueSection = [...new Set(filtered.map((sched) => sched.section))];
      setAvailableSection(uniqueSection);
    };

    updateFilteredOptions();
  },[sched])

  const handleReset = () => {
    setFilterStatus("all");
    setFilterCounselor("all");
    setFilterDepartment("all");
    setFilterGradeLevel("all");
    setFilterSection("all");
    setSearchName("");
    setStartDate("");
    setEndDate("");
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "desc" ? "asc" : "desc");
  };

  return (
    <Sidebar>
      <div className="container mx-auto bg-blue-100 rounded pb-10 min-h-[90vh]">
        <div className="bg-blue-300 p-5 rounded flex justify-center items-center mb-10">
          <h2 className="text-3xl font-bold text-blue-950">Guidance Reports</h2>
        </div>

        <div className="p-5">
          <div className="bg-white p-5 rounded-xl overflow-auto">

            <div className="sm:mb-4 sm:flex gap-4">

              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                <label htmlFor="filterCounselor" className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Counselor
                </label>
                <select
                  id="filterCounselor"
                  value={filterCounselor}
                  onChange={(e) => setFilterCounselor(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                >
                  <option value="all">All Counselors</option>
                    {availableCounselor.map(counselor => (
                        <option key={counselor} value={counselor}>
                            {counselor}
                        </option>
                    ))}
                </select>
              </div>

              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                <label htmlFor="searchName" className="block text-sm font-medium text-gray-700 mb-1">
                  Search by Student
                </label>
                <input
                  type="text"
                  id="searchName"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="Enter Name"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>

              <div className="sm:min-w-[25%] bg-blue-100 p-5 rounded mb-2 sm:mb-0 flex items-center">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReset}
                  className="px-4 py-2 bg-[#fff9e5] hover:bg-[#f1ead0] text-gray-800 rounded focus:outline-none focus:ring focus:border-blue-300 w-full"
                >
                  Reset Filters
                </motion.button>
              </div>

            </div>

            <div className="sm:mb-4 sm:flex gap-4">

              
            <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                <label htmlFor="filterStatus" className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Status
                </label>
                <select
                  id="filterStatus"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                >
                  <option value="all">All Status</option>
                    {availableStatus.map(status => (
                        <option key={status} value={status}>
                            {status}
                        </option>
                    ))}
                </select>
              </div>

              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                <label htmlFor="filterDepartment" className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Department
                </label>
                <select
                  id="filterDepartment"
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                >
                  <option value="all">All Departments</option>
                    {availableDepartment.map(dept => (
                        <option key={dept} value={dept}>
                            {dept}
                        </option>
                    ))}
                </select>
              </div>

              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                <label htmlFor="filterGradeLvl" className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Grade Level
                </label>
                <select
                  id="filterGradeLvl"
                  value={filterGradeLevel}
                  onChange={(e) => setFilterGradeLevel(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                >
                  <option value="all">All Grade Levels</option>
                    {availableGradeLevel.map(gradelvl => (
                        <option key={gradelvl} value={gradelvl}>
                            {gradelvl}
                        </option>
                    ))}
                </select>
              </div>

              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                <label htmlFor="filterSection" className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Section
                </label>
                <select
                  id="filterSection"
                  value={filterSection}
                  onChange={(e) => setFilterSection(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                >
                  <option value="all">All Sections</option>
                    {availableSection.map(section => (
                        <option key={section} value={section}>
                            {section}
                        </option>
                    ))}
                </select>
              </div>

            </div>

            <div className="sm:mb-4 sm:flex gap-4">



              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Appointment Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>

              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Appointment End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>

            </div>

            <div className="w-full overflow-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr>
                    <th className="py-3 px-4 border-b border-blue-300 bg-blue-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Appointment Date
                      <button
                        onClick={toggleSortOrder}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        {sortOrder === "desc" ? "↓" : "↑"}
                      </button>
                    </th>
                    <th className="py-3 px-4 border-b border-blue-300 bg-blue-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student No.</th>
                    <th className="py-3 px-4 border-b border-blue-300 bg-blue-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="py-3 px-4 border-b border-blue-300 bg-blue-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="py-3 px-4 border-b border-blue-300 bg-blue-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade Level</th>
                    <th className="py-3 px-4 border-b border-blue-300 bg-blue-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                    <th className="py-3 px-4 border-b border-blue-300 bg-blue-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="py-3 px-4 border-b border-blue-300 bg-blue-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Counselor</th>
                  </tr>
                </thead>
                <tbody>
                  {sched.map((sched) => (
                    <tr key={sched.id} className="hover:bg-blue-100 bg-blue-50">
                      <td className="py-2 px-4 border-b border-gray-200">{moment(sched.start.toDate()).format("YYYY-MM-DD")}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{sched.studentNo}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{sched.fullName}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{sched.department || "N/A"}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{sched.gradeLevel}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{sched.section}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{sched.status}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{sched.counselorName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>

          </div>
        </div>
      </div>
    </Sidebar>
  );
}

export default GuidanceReports;
