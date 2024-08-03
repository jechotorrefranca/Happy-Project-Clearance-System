import React, { useState, useEffect, useRef } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebaseConfig";
import Sidebar from "../components/Sidebar";
import moment from "moment";
import { motion } from 'framer-motion';
import ReactToPrint from "react-to-print";
import ExcelJS from 'exceljs';
import Modal from "../components/Modal";

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
  const [modal, setModal] = useState(false);
  const [disabledButton, setDisabledButton] = useState("page");
  const componentRef = useRef(null);
  const reactToPrintRef = useRef();

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sched.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sched.length / itemsPerPage);

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(sched.length / itemsPerPage); i++) {
    pageNumbers.push(i);
  }

  const renderPageNumbers = () => {
    const totalPages = Math.ceil(sched.length / itemsPerPage);
    const maxDisplayedPages = 7;
    const startPage = Math.max(1, currentPage - Math.floor(maxDisplayedPages / 2));
    const endPage = Math.min(totalPages, startPage + maxDisplayedPages - 1);
  
    let pages = [];
  
    if (startPage > 1) {
      pages.push(
        <button
          key="first"
          onClick={() => setCurrentPage(1)}
          className={`mx-1 px-3 py-1 border rounded ${currentPage === 1 ? "bg-blue-400 text-white" : ""}`}
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(<span key="ellipsis1" className="mx-1">...</span>);
      }
    }
  
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`mx-1 px-3 py-1 border rounded ${currentPage === i ? "bg-blue-400 text-white" : ""}`}
        >
          {i}
        </button>
      );
    }
  
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="ellipsis2" className="mx-1">...</span>);
      }
      pages.push(
        <button
          key="last"
          onClick={() => setCurrentPage(totalPages)}
          className={`mx-1 px-3 py-1 border rounded ${currentPage === totalPages ? "bg-blue-400 text-white" : ""}`}
        >
          {totalPages}
        </button>
      );
    }
  
    return pages;
  };
  
  



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
    setCurrentPage(1);
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

  // const handlePrint = () => {
  //   setItemsPerPage(Infinity); // Set itemsPerPage to infinity for printing
  //   setTimeout(() => {
  //     window.print(); // Trigger the print dialog
  //     setItemsPerPage(2); // Restore default itemsPerPage after printing
  //   }, 0);
  // };

  const handleModal = () => {
    setModal(prevState => !prevState);
}

  const handleChoice = (choice) => {
    setDisabledButton(choice);

    if (choice === "page") {
      setItemsPerPage(25);

    } else if (choice === "all") {
      setItemsPerPage(Infinity);
    }
  };

  const handlePrint = () => {
    handleModal();
  };

  const handleAfterPrint = () => {
    setItemsPerPage(25);
    setDisabledButton("page")
  };

  // const handleExportExcel = async () => {
  //   const workbook = new ExcelJS.Workbook();
  //   const worksheet = workbook.addWorksheet('Clearance Status');

  //   const headerStyle = {
  //     font: { bold: true },
  //     fill: {
  //       type: 'pattern',
  //       pattern: 'solid',
  //       fgColor: { argb: 'FFD3D3D3' } 
  //     },
  //     border: {
  //       top: { style: 'thin' },
  //       left: { style: 'thin' },
  //       bottom: { style: 'thin' },
  //       right: { style: 'thin' }
  //     }
  //   };

  //   const dataCellStyle = {
  //     border: {
  //       top: { style: 'thin' },
  //       left: { style: 'thin' },
  //       bottom: { style: 'thin' },
  //       right: { style: 'thin' }
  //     }
  //   };

  //   const clearedCellStyle = {
  //     ...dataCellStyle,
  //     fill: {
  //       type: 'pattern',
  //       pattern: 'solid',
  //       fgColor: { argb: 'FF90EE90' }
  //     }
  //   };

  //   const unclearedCellStyle = {
  //     ...dataCellStyle,
  //     fill: {
  //       type: 'pattern',
  //       pattern: 'solid',
  //       fgColor: { argb: 'FFFFA07A' } 
  //     }
  //   };

  //   worksheet.addRow([`${classData.sectionName} - ${selectedSubject} Clearance Status`]);
  //   worksheet.mergeCells('A1:C1');
  //   const titleCell = worksheet.getCell('A1');
  //   titleCell.font = { size: 16, bold: true, color: { argb: 'FF002060' } };
  //   titleCell.alignment = { horizontal: 'center' };

  //   const headerRow = worksheet.addRow(['Student ID', 'Name', 'Cleared']);
  //   headerRow.eachCell((cell) => {
  //     Object.assign(cell.style, headerStyle);
  //   });

  //   const filteredStudents = getFilteredStudents();
  //   filteredStudents.forEach((student) => {
  //     const row = worksheet.addRow([
  //       student.studentId,
  //       student.fullName,
  //       student.clearance[selectedSubject] ? 'Yes' : 'No'
  //     ]);

  //     row.eachCell((cell, colNumber) => {
  //       if (colNumber === 3) { 
  //         Object.assign(cell.style, student.clearance[selectedSubject] ? clearedCellStyle : unclearedCellStyle);
  //       } else {
  //         Object.assign(cell.style, dataCellStyle);
  //       }
  //     });
  //   });

  //   worksheet.addRow([]);

  //   worksheet.addRow(['', 'Generated On:', new Date().toLocaleDateString()]); 
  //   worksheet.addRow(['', 'Prepared By:', currentUser.email]);

  //   worksheet.columns.forEach(column => {
  //     let maxLength = 0;
  //     column.eachCell((cell) => {
  //       maxLength = Math.max(maxLength, cell.value ? cell.value.toString().length : 0);
  //     });
  //     column.width = maxLength + 2; 
  //   });

  //   const buffer = await workbook.xlsx.writeBuffer();
  //   const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  //   saveAs(blob, `${classData.sectionName}_${selectedSubject}_clearance.xlsx`);
  // };

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

            <div className="mb-4 sm:flex justify-around gap-4">

              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                <motion.button
                  onClick={handleModal}
                  whileHover={{scale: 1.03}}
                  whileTap={{scale: 0.95}}
                  className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                  Print Table
                </motion.button>
                
              </div>


              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                <motion.button
                  whileHover={{scale: 1.03}}
                  whileTap={{scale: 0.95}}                    
                  onClick={() => console.log("dsd")}
                  className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Export to Excel
                </motion.button>

              </div>
            </div>

            {/* TABLE STARTS HERE, ALSO ADD GRAPHS HERE */}

            <div className="w-full overflow-auto" ref={componentRef}>
              <div className="hidden show-on-print">
                <div className="flex justify-center py-3 text-xl font-bold bg-gray-300 mb-2">
                  <p>Guidance Reports</p>

                </div>
              </div>

              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr className="bg-blue-200 border-b border-blue-300 text-gray-500 text-xs header">
                    <th className="py-3 px-4 text-left font-medium uppercase">
                      <button className="flex text-left hover:text-gray-800 items-center gap-2" onClick={toggleSortOrder}>
                        <span>APPOINTMENT DATE</span>
                        <div className="text-lg hide-on-print">
                          {sortOrder === "desc" ? "↓" : "↑"}
                        </div>
                      </button>
                      
                    </th>
                    <th className="py-3 border px-4 text-left font-medium uppercase">Student No.</th>
                    <th className="py-3 border px-4 text-left font-medium uppercase">Student</th>
                    <th className="py-3 border px-4 text-left font-medium uppercase">Department</th>
                    <th className="py-3 border px-4 text-left font-medium uppercase">Grade Level</th>
                    <th className="py-3 border px-4 text-left font-medium uppercase">Section</th>
                    <th className="py-3 border px-4 text-left font-medium uppercase">Status</th>
                    <th className="py-3 border px-4 text-left font-medium uppercase">Counselor</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((sched) => (
                    <tr key={sched.id} className="hover:bg-blue-100 bg-blue-50 row">
                      <td className="py-2 px-4 border border-gray-200">{moment(sched.start.toDate()).format("YYYY-MM-DD")}</td>
                      <td className="py-2 px-4 border border-gray-200">{sched.studentNo}</td>
                      <td className="py-2 px-4 border border-gray-200">{sched.fullName}</td>
                      <td className="py-2 px-4 border border-gray-200">{sched.department || "N/A"}</td>
                      <td className="py-2 px-4 border border-gray-200">{sched.gradeLevel}</td>
                      <td className="py-2 px-4 border border-gray-200">{sched.section}</td>
                      <td className="py-2 px-4 border border-gray-200">{sched.status}</td>
                      <td className="py-2 px-4 border border-gray-200">{sched.counselorName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>


            </div>

            {totalPages > 1 && (
              <div className="flex justify-center mt-4">
                {renderPageNumbers()}
              </div>
            )}

          </div>
        </div>
      </div>

      <Modal isOpen={modal} onClose={handleModal}>
        <div className="p-6">
            <h3 className="text-lg font-bold mb-4 text-center">
              Select a Print Option
            </h3>

            <div className="mt-6 flex justify-around gap-2">
              <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={disabledButton === 'page'}
                  className={`p-3 w-full rounded flex justify-center items-center h-fit ${
                  disabledButton === 'page'
                      ? 'bg-green-500 hover:bg-green-600 cursor-not-allowed text-green-950 font-semibold'
                      : 'bg-gray-400 cursor-pointer text-white'
                  }`}
                  onClick={() => handleChoice("page")}
              >
                  Print Current Page
              </motion.button>

              <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={disabledButton === 'all'}
                  className={`p-3 w-full rounded flex justify-center items-center h-fit ${
                  disabledButton === 'all'
                      ? 'bg-green-500 hover:bg-green-600 cursor-not-allowed text-green-950 font-semibold'
                      : 'bg-gray-400 cursor-pointer text-white'
                  }`}
                  onClick={() => handleChoice("all")}
              >
                  Print All Data
              </motion.button>
            </div>

            <ReactToPrint
              trigger={() => (
                <motion.button
                className="p-3 w-full rounded flex justify-center items-center bg-[#C88CFF] hover:bg-[#b17ce2] mt-3"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePrint}
                >
                  Continue
                </motion.button>
              )}
              content={() => componentRef.current}
              onBeforeGetContent={handlePrint}
              onAfterPrint={handleAfterPrint}
            />

        </div>
        
      </Modal>

    </Sidebar>
  );
}

export default GuidanceReports;
