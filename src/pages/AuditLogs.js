import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebaseConfig";
import Sidebar from "../components/Sidebar";
import moment from "moment";
import { motion } from 'framer-motion';

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [originalLogs, setOriginalLogs] = useState([]);
  const [filterAction, setFilterAction] = useState("all");
  const [searchEmail, setSearchEmail] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = logs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(logs.length / itemsPerPage);

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(logs.length / itemsPerPage); i++) {
    pageNumbers.push(i);
  }

  const renderPageNumbers = () => {
    const totalPages = Math.ceil(logs.length / itemsPerPage);
    const maxDisplayedPages = 6;
    const startPage = Math.max(1, currentPage - Math.floor(maxDisplayedPages / 2));
    const endPage = Math.min(totalPages, startPage + maxDisplayedPages - 1);
  
    let pages = [];
  
    if (startPage > 1) {
      pages.push(
        <button
          key="first"
          onClick={() => setCurrentPage(1)}
          className={`mx-1 px-3 py-1 border border-blue-300 rounded ${currentPage === 1 ? "bg-blue-400 text-white" : ""}`}
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
          className={`mx-1 px-3 py-1 border border-blue-300 rounded ${currentPage === i ? "bg-blue-400 text-white" : ""}`}
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
          className={`mx-1 px-3 py-1 border border-blue-300 rounded ${currentPage === totalPages ? "bg-blue-400 text-white" : ""}`}
        >
          {totalPages}
        </button>
      );
    }
  
    return pages;
  };

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const logsRef = collection(db, "auditLogs");
        const q = query(logsRef, orderBy("timestamp", "desc"));

        const logsSnapshot = await getDocs(q);
        const logsData = logsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLogs(logsData);
        setOriginalLogs(logsData);
      } catch (error) {
        console.error("Error fetching audit logs:", error);
      }
    };

    fetchLogs();
  }, []);

  useEffect(() => {
    let filteredLogs = [...originalLogs];

    if (filterAction !== "all") {
      filteredLogs = filteredLogs.filter(
        (log) => log.actionType === filterAction
      );
    }

    if (searchEmail) {
      filteredLogs = filteredLogs.filter((log) =>
        log.email.toLowerCase().includes(searchEmail.toLowerCase())
      );
    }

    if (startDate) {
      filteredLogs = filteredLogs.filter(
        (log) => moment(log.timestamp.toDate()).format("YYYY-MM-DD") >= startDate
      );
    }

    if (endDate) {
      filteredLogs = filteredLogs.filter(
        (log) => moment(log.timestamp.toDate()).format("YYYY-MM-DD") <= endDate
      );
    }

    setLogs(filteredLogs);
  }, [filterAction, searchEmail, startDate, endDate, originalLogs]);

  const handleReset = () => {
    setFilterAction("all");
    setSearchEmail("");
    setStartDate("");
    setEndDate("");
  };

  return (
    <Sidebar>
      <div className="container mx-auto bg-blue-100 rounded pb-10 min-h-[90vh]">
        <div className="bg-blue-300 p-5 rounded flex justify-center items-center mb-10">
          <h2 className="text-3xl font-bold text-blue-950">Audit Logs</h2>
        </div>

        <div className="p-5">
          <div className="bg-white p-5 rounded-xl overflow-auto">

            <div className="sm:mb-4 sm:flex gap-4">

              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                <label htmlFor="filterAction" className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by Action
                </label>
                <select
                  id="filterAction"
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                >
                  <option value="all">All Actions</option>
                  <option value="login_success">Successful Login</option>
                  <option value="login_failed">Failed Login</option>
                </select>
              </div>

              <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
                <label htmlFor="searchEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Search by Email
                </label>
                <input
                  type="text"
                  id="searchEmail"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="Enter email"
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                />
              </div>

              <div className="sm:min-w-[25%] bg-blue-100 p-5 rounded mb-2 sm:mb-0 flex items-center">
                <motion.button
                  whileHover={{scale: 1.03}}
                  whileTap={{scale: 0.95}}                
                  onClick={handleReset}
                  className="px-4 py-2 bg-[#fff9e5] hover:bg-[#f1ead0] text-gray-800 rounded focus:outline-none focus:ring focus:border-blue-300 w-full"
                >
                  Reset Filters
                </motion.button>
              </div>


            </div>

            <div className="sm:mb-4 sm:flex gap-4">

             <div className="w-full bg-blue-100 p-5 rounded mb-2 sm:mb-0">
               <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                 Start Date
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
                 End Date
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
                    <th className="py-3 px-4 border-b border-blue-300 bg-blue-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th className="py-3 px-4 border-b border-blue-300 bg-blue-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                    <th className="py-3 px-4 border-b border-blue-300 bg-blue-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action Type</th>
                    <th className="py-3 px-4 border-b border-blue-300 bg-blue-200 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((log) => (
                    <tr key={log.id} className="hover:bg-blue-100 bg-blue-50">
                      <td className="py-2 px-4 border-b border-gray-200">{moment(log.timestamp.toDate()).format("YYYY-MM-DD HH:mm:ss")}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{log.userId}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{log.actionType}</td>
                      <td className="py-2 px-4 border-b border-gray-200">{log.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>



          </div>
            {totalPages > 1 && (
              <div className="flex justify-center mt-4">
                {renderPageNumbers()}
              </div>
            )}
        </div>


      </div>
    </Sidebar>
  );
}

export default AuditLogs;