import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebaseConfig";
import Sidebar from "../components/Sidebar";
import moment from "moment";

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [originalLogs, setOriginalLogs] = useState([]);
  const [filterAction, setFilterAction] = useState("all");
  const [searchEmail, setSearchEmail] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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
      <div className="container mx-auto p-6">
        <h2 className="text-3xl font-bold mb-6">Audit Logs</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
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

          <div>
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

          <div>
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

          <div>
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

        <div className="mb-6">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 focus:outline-none focus:ring focus:border-blue-300"
          >
            Reset Filters
          </button>
        </div>

        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
              <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
              <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action Type</th>
              <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b border-gray-200">{moment(log.timestamp.toDate()).format("YYYY-MM-DD HH:mm:ss")}</td>
                <td className="py-2 px-4 border-b border-gray-200">{log.userId}</td>
                <td className="py-2 px-4 border-b border-gray-200">{log.actionType}</td>
                <td className="py-2 px-4 border-b border-gray-200">{log.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Sidebar>
  );
}

export default AuditLogs;