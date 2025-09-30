import React, { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebaseConfig";
import Sidebar from "../components/Sidebar";
import moment from "moment";
import {
  Activity,
  Search,
  Filter,
  Calendar,
  Download,
  RefreshCw,
  User,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Eye,
  ChevronDown,
  ChevronUp,
  FileText,
  UserPlus,
  UserX,
  Edit,
  Trash,
  Mail,
  Lock,
  Unlock,
  Database,
  BarChart3,
  List,
  Grid,
} from "lucide-react";

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [originalLogs, setOriginalLogs] = useState([]);
  const [filterAction, setFilterAction] = useState("all");
  const [searchEmail, setSearchEmail] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState(null);
  const [viewMode, setViewMode] = useState("table");
  const [selectedTimeRange, setSelectedTimeRange] = useState("all");
  const [statistics, setStatistics] = useState({
    total: 0,
    today: 0,
    successfulLogins: 0,
    failedLogins: 0,
    recentActivity: [],
  });

  const actionTypes = [
    { value: "all", label: "All Actions", icon: <Activity className="w-4 h-4" /> },
    { value: "login_success", label: "Successful Login", icon: <CheckCircle className="w-4 h-4" />, color: "green" },
    { value: "login_failed", label: "Failed Login", icon: <XCircle className="w-4 h-4" />, color: "red" },
    { value: "create_user", label: "User Created", icon: <UserPlus className="w-4 h-4" />, color: "blue" },
    { value: "update_user", label: "User Updated", icon: <Edit className="w-4 h-4" />, color: "yellow" },
    { value: "delete_user", label: "User Deleted", icon: <UserX className="w-4 h-4" />, color: "red" },
    { value: "lock_account", label: "Account Locked", icon: <Lock className="w-4 h-4" />, color: "orange" },
    { value: "unlock_account", label: "Account Unlocked", icon: <Unlock className="w-4 h-4" />, color: "green" },
    { value: "data_export", label: "Data Export", icon: <Download className="w-4 h-4" />, color: "purple" },
  ];

  const timeRanges = [
    { value: "all", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "week", label: "Last 7 Days" },
    { value: "month", label: "Last 30 Days" },
    { value: "custom", label: "Custom Range" },
  ];

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const logsRef = collection(db, "auditLogs");
      const q = query(logsRef, orderBy("timestamp", "desc"));

      const logsSnapshot = await getDocs(q);
      const logsData = logsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayLogs = logsData.filter(log => {
        const logDate = log.timestamp.toDate();
        return logDate >= today;
      });

      const successfulLogins = logsData.filter(log => log.actionType === "login_success").length;
      const failedLogins = logsData.filter(log => log.actionType === "login_failed").length;

      setStatistics({
        total: logsData.length,
        today: todayLogs.length,
        successfulLogins,
        failedLogins,
        recentActivity: logsData.slice(0, 5),
      });

      setLogs(logsData);
      setOriginalLogs(logsData);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filteredLogs = [...originalLogs];

    if (filterAction !== "all") {
      filteredLogs = filteredLogs.filter(
        (log) => log.actionType === filterAction
      );
    }

    if (searchEmail) {
      filteredLogs = filteredLogs.filter((log) =>
        log.email?.toLowerCase().includes(searchEmail.toLowerCase())
      );
    }

    const now = new Date();
    if (selectedTimeRange === "today") {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filteredLogs = filteredLogs.filter(
        (log) => log.timestamp.toDate() >= today
      );
    } else if (selectedTimeRange === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredLogs = filteredLogs.filter(
        (log) => log.timestamp.toDate() >= weekAgo
      );
    } else if (selectedTimeRange === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredLogs = filteredLogs.filter(
        (log) => log.timestamp.toDate() >= monthAgo
      );
    } else if (selectedTimeRange === "custom") {
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
    }

    setLogs(filteredLogs);
  }, [filterAction, searchEmail, startDate, endDate, selectedTimeRange, originalLogs]);

  const handleReset = () => {
    setFilterAction("all");
    setSearchEmail("");
    setStartDate("");
    setEndDate("");
    setSelectedTimeRange("all");
  };

  const getActionIcon = (actionType) => {
    const action = actionTypes.find(a => a.value === actionType);
    return action ? action.icon : <Activity className="w-4 h-4" />;
  };

  const getActionColor = (actionType) => {
    const action = actionTypes.find(a => a.value === actionType);
    const colors = {
      green: "bg-green-100 text-green-800 border-green-200",
      red: "bg-red-100 text-red-800 border-red-200",
      blue: "bg-blue-100 text-blue-800 border-blue-200",
      yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
      orange: "bg-orange-100 text-orange-800 border-orange-200",
      purple: "bg-purple-100 text-purple-800 border-purple-200",
      indigo: "bg-indigo-100 text-indigo-800 border-indigo-200",
    };
    return action?.color ? colors[action.color] : "bg-gray-100 text-gray-800 border-gray-200";
  };

  const formatActionType = (actionType) => {
    const action = actionTypes.find(a => a.value === actionType);
    return action ? action.label : actionType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  const exportLogs = () => {
    const csvContent = [
      ["Timestamp", "User ID", "Email", "Action Type", "Details"],
      ...logs.map(log => [
        moment(log.timestamp.toDate()).format("YYYY-MM-DD HH:mm:ss"),
        log.userId,
        log.email,
        log.actionType,
        JSON.stringify(log.details || {})
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_logs_${moment().format("YYYY-MM-DD")}.csv`;
    a.click();
  };

  const StatCard = ({ icon, title, value, color, trend }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {trend}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const LogCard = ({ log }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg border ${getActionColor(log.actionType)}`}>
            {getActionIcon(log.actionType)}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{formatActionType(log.actionType)}</p>
            <p className="text-sm text-gray-500">
              {moment(log.timestamp.toDate()).format("MMM DD, YYYY HH:mm:ss")}
            </p>
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">User:</span>
          <span className="font-medium text-gray-900">{log.email}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Database className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">ID:</span>
          <span className="font-mono text-xs text-gray-900">{log.userId}</span>
        </div>
        {log.details && (
          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-medium text-gray-600 mb-1">Additional Details</p>
            <pre className="text-xs text-gray-700 whitespace-pre-wrap">
              {JSON.stringify(log.details, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <FileText className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No logs found</h3>
      <p className="text-gray-500 text-center max-w-sm">
        {searchEmail || filterAction !== "all" || selectedTimeRange !== "all"
          ? "Try adjusting your filters to see more results."
          : "No audit logs have been recorded yet."}
      </p>
    </div>
  );

  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-600">Loading audit logs...</p>
    </div>
  );

  return (
    <Sidebar>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
                <p className="mt-2 text-gray-600">Track system activity and user actions</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={fetchLogs}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
                <button
                  onClick={exportLogs}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>
            </div>
          </div>

          {}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard 
              icon={<Activity className="h-6 w-6" />}
              title="Total Logs"
              value={statistics.total}
              color="bg-blue-100 text-blue-600"
            />
            <StatCard 
              icon={<Clock className="h-6 w-6" />}
              title="Today's Activity"
              value={statistics.today}
              color="bg-green-100 text-green-600"
              trend={`${((statistics.today / Math.max(statistics.total, 1)) * 100).toFixed(0)}% of total`}
            />
            <StatCard 
              icon={<CheckCircle className="h-6 w-6" />}
              title="Successful Logins"
              value={statistics.successfulLogins}
              color="bg-emerald-100 text-emerald-600"
            />
            <StatCard 
              icon={<XCircle className="h-6 w-6" />}
              title="Failed Logins"
              value={statistics.failedLogins}
              color="bg-red-100 text-red-600"
            />
          </div>

          {}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search User
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    placeholder="Search by email..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action Type
                </label>
                <select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {actionTypes.map((action) => (
                    <option key={action.value} value={action.value}>
                      {action.label}
                    </option>
                  ))}
                </select>
              </div>

              {}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Range
                </label>
                <select
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {timeRanges.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>

              {}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  View Mode
                </label>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("table")}
                    className={`flex-1 py-1.5 px-3 rounded ${viewMode === "table" ? "bg-white shadow-sm" : ""}`}
                  >
                    <List className="h-5 w-5 mx-auto" />
                  </button>
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`flex-1 py-1.5 px-3 rounded ${viewMode === "grid" ? "bg-white shadow-sm" : ""}`}
                  >
                    <Grid className="h-5 w-5 mx-auto" />
                  </button>
                </div>
              </div>
            </div>

            {}
            {selectedTimeRange === "custom" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {}
            {(searchEmail || filterAction !== "all" || selectedTimeRange !== "all") && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Active filters:</span>
                  <div className="flex flex-wrap gap-2">
                    {searchEmail && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        Email: {searchEmail}
                      </span>
                    )}
                    {filterAction !== "all" && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {formatActionType(filterAction)}
                      </span>
                    )}
                    {selectedTimeRange !== "all" && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {timeRanges.find(r => r.value === selectedTimeRange)?.label}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleReset}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {}
          {loading ? (
            <LoadingState />
          ) : logs.length === 0 ? (
            <EmptyState />
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {logs.map((log) => (
                <LogCard key={log.id} log={log} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.map((log) => (
                      <React.Fragment key={log.id}>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <div>
                                <div className="text-sm text-gray-900">
                                  {moment(log.timestamp.toDate()).format("MMM DD, YYYY")}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {moment(log.timestamp.toDate()).format("HH:mm:ss")}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {log.email}
                              </div>
                              <div className="text-xs text-gray-500 font-mono">
                                {log.userId?.substring(0, 8)}...
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getActionColor(log.actionType)}`}>
                                {getActionIcon(log.actionType)}
                                {formatActionType(log.actionType)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {log.details ? (
                              <button
                                onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                              >
                                <Eye className="h-4 w-4" />
                                View
                                {expandedLog === log.id ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </button>
                            ) : (
                              <span className="text-sm text-gray-500">—</span>
                            )}
                          </td>
                        </tr>
                        {expandedLog === log.id && log.details && (
                          <tr>
                            <td colSpan="4" className="px-6 py-4 bg-gray-50">
                              <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <p className="text-sm font-medium text-gray-700 mb-2">Additional Details:</p>
                                <pre className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
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
          )}

          {}
          {!loading && logs.length > 0 && (
            <div className="mt-6 text-center text-sm text-gray-500">
              Showing {logs.length} of {originalLogs.length} logs
            </div>
          )}
        </div>
      </div>
    </Sidebar>
  );
}

export default AuditLogs;