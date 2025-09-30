import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import Sidebar from "../components/Sidebar";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import moment from "moment";
import {
  Users,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  Calendar,
  Mail,
  Bell,
  Activity,
  BookOpen,
  Award,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  UserCheck,
  UserX,
  FileCheck,
  FileClock,
  FileX,
  Briefcase,
  GraduationCap,
  School,
  Building,
  DollarSign,
  Shield,
  Settings,
  LogOut,
  ChevronRight,
  Filter,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Menu,
  X,
  XCircle,
  Sun,
  Moon,
  RefreshCw,
  HelpCircle,
  MessageSquare,
  Zap,
  Target,
  TrendingDown,
  Database,
  Folder,
  Star,
  Heart,
  ThumbsUp,
  Flag,
  Info,
  CheckSquare,
  Square,
  Circle,
  MoreVertical,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function Dashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [statistics, setStatistics] = useState({});
  const [recentActivities, setRecentActivities] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [quickStats, setQuickStats] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [refreshing, setRefreshing] = useState(false);

  const COLORS = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
  ];

  useEffect(() => {
    if (currentUser) {
      fetchDashboardData();
    }
  }, [currentUser, selectedPeriod]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("uid", "==", currentUser.uid));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        setUserData(userData);
        setUserRole(userData.role);

        await fetchRoleSpecificData(userData.role, userData);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoleSpecificData = async (role, userData) => {
    let stats = {};
    let activities = [];
    let chartData = [];
    let quickStats = [];
    let deadlines = [];

    switch (role) {
      case "student":
        stats = await fetchStudentStats(userData);
        activities = await fetchStudentActivities(userData);
        chartData = generateStudentChartData(stats);
        quickStats = generateStudentQuickStats(stats);
        deadlines = await fetchStudentDeadlines(userData);
        break;

      case "faculty":
        stats = await fetchFacultyStats(userData);
        activities = await fetchFacultyActivities(userData);
        chartData = generateFacultyChartData(stats);
        quickStats = generateFacultyQuickStats(stats);
        break;

      case "super-admin":
      case "admin":
        stats = await fetchAdminStats();
        activities = await fetchAdminActivities();
        chartData = generateAdminChartData(stats);
        quickStats = generateAdminQuickStats(stats);
        break;

      default:
        stats = await fetchOfficeStats(userData);
        activities = await fetchOfficeActivities(userData);
        chartData = generateOfficeChartData(stats);
        quickStats = generateOfficeQuickStats(stats);
        break;
    }

    setStatistics(stats);
    setRecentActivities(activities);
    setChartData(chartData);
    setQuickStats(quickStats);
    setUpcomingDeadlines(deadlines);
  };

  const fetchStudentStats = async (userData) => {
    try {
      const clearanceRef = collection(db, "clearances");
      const clearanceQuery = query(
        clearanceRef,
        where("studentId", "==", userData.uid)
      );
      const clearanceSnapshot = await getDocs(clearanceQuery);

      let totalRequirements = 0;
      let completedRequirements = 0;

      if (!clearanceSnapshot.empty) {
        const clearanceData = clearanceSnapshot.docs[0].data();
        if (clearanceData.clearance) {
          totalRequirements = Object.keys(clearanceData.clearance).length;
          completedRequirements = Object.values(clearanceData.clearance).filter(
            (status) => status === true
          ).length;
        }
      }

      const messagesRef = collection(db, "inquiries");
      const messagesQuery = query(
        messagesRef,
        where("studentId", "==", userData.uid)
      );
      const messagesSnapshot = await getDocs(messagesQuery);

      return {
        totalRequirements,
        completedRequirements,
        pendingRequirements: totalRequirements - completedRequirements,
        completionPercentage:
          totalRequirements > 0
            ? Math.round((completedRequirements / totalRequirements) * 100)
            : 0,
        totalMessages: messagesSnapshot.size,
        unreadMessages: messagesSnapshot.docs.filter((doc) => !doc.data().read)
          .length,
      };
    } catch (error) {
      console.error("Error fetching student stats:", error);
      return {};
    }
  };

  const fetchStudentActivities = async (userData) => {
    try {
      const activities = [];

      const clearanceRef = collection(db, "clearanceUpdates");
      const clearanceQuery = query(
        clearanceRef,
        where("studentId", "==", userData.uid),
        orderBy("timestamp", "desc"),
        limit(5)
      );
      const clearanceSnapshot = await getDocs(clearanceQuery);

      clearanceSnapshot.forEach((doc) => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          type: "clearance",
          title: `Clearance ${data.status}`,
          description: `${data.requirement} has been ${data.status}`,
          timestamp: data.timestamp,
          icon: data.status === "approved" ? CheckCircle : Clock,
          color:
            data.status === "approved" ? "text-green-600" : "text-yellow-600",
        });
      });

      return activities.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error("Error fetching student activities:", error);
      return [];
    }
  };

  const fetchStudentDeadlines = async (userData) => {
    return [
      {
        id: 1,
        title: "Library Clearance",
        date: moment().add(3, "days").toDate(),
        status: "pending",
      },
      {
        id: 2,
        title: "Finance Clearance",
        date: moment().add(7, "days").toDate(),
        status: "pending",
      },
    ];
  };

  const fetchFacultyStats = async (userData) => {
    try {
      const studentsRef = collection(db, "students");
      const studentsSnapshot = await getDocs(studentsRef);

      return {
        totalStudents: studentsSnapshot.size,
        pendingApprovals: Math.floor(Math.random() * 20),
        approvedToday: Math.floor(Math.random() * 10),
        rejectedToday: Math.floor(Math.random() * 5),
      };
    } catch (error) {
      console.error("Error fetching faculty stats:", error);
      return {};
    }
  };

  const fetchFacultyActivities = async (userData) => {
    return [
      {
        id: 1,
        type: "approval",
        title: "Approved Clearance",
        description: "John Doe's clearance approved",
        timestamp: new Date(),
        icon: CheckCircle,
        color: "text-green-600",
      },
    ];
  };

  const fetchAdminStats = async () => {
    try {
      const usersRef = collection(db, "users");
      const studentsRef = collection(db, "students");
      const auditRef = collection(db, "auditLogs");

      const usersSnapshot = await getDocs(usersRef);
      const studentsSnapshot = await getDocs(studentsRef);
      const auditSnapshot = await getDocs(
        query(auditRef, orderBy("timestamp", "desc"), limit(100))
      );

      return {
        totalUsers: usersSnapshot.size,
        totalStudents: studentsSnapshot.size,
        activeUsers: usersSnapshot.docs.filter((doc) => !doc.data().isLocked)
          .length,
        lockedUsers: usersSnapshot.docs.filter((doc) => doc.data().isLocked)
          .length,
        todayLogins: auditSnapshot.docs.filter((doc) => {
          const data = doc.data();
          return (
            data.actionType === "login_success" &&
            moment(data.timestamp?.toDate()).isSame(moment(), "day")
          );
        }).length,
      };
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      return {};
    }
  };

  const fetchAdminActivities = async () => {
    try {
      const auditRef = collection(db, "auditLogs");
      const auditQuery = query(
        auditRef,
        orderBy("timestamp", "desc"),
        limit(5)
      );
      const auditSnapshot = await getDocs(auditQuery);

      return auditSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.actionType,
          title: formatActionType(data.actionType),
          description: `${data.email} - ${data.actionType}`,
          timestamp: data.timestamp?.toDate(),
          icon: getActionIcon(data.actionType),
          color: getActionColor(data.actionType),
        };
      });
    } catch (error) {
      console.error("Error fetching admin activities:", error);
      return [];
    }
  };

  const fetchOfficeStats = async (userData) => {
    try {
      const clearancesRef = collection(db, "clearances");
      const clearancesSnapshot = await getDocs(clearancesRef);

      let pending = 0;
      let approved = 0;
      let rejected = 0;

      clearancesSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.clearance && data.clearance[userData.role]) {
          approved++;
        } else {
          pending++;
        }
      });

      return {
        totalRequests: clearancesSnapshot.size,
        pendingRequests: pending,
        approvedRequests: approved,
        rejectedRequests: rejected,
        todayProcessed: Math.floor(Math.random() * 10),
      };
    } catch (error) {
      console.error("Error fetching office stats:", error);
      return {};
    }
  };

  const fetchOfficeActivities = async (userData) => {
    return [];
  };

  const generateStudentChartData = (stats) => {
    return [
      { name: "Completed", value: stats.completedRequirements || 0 },
      { name: "Pending", value: stats.pendingRequirements || 0 },
    ];
  };

  const generateFacultyChartData = (stats) => {
    return [
      { name: "Mon", approved: 12, rejected: 2 },
      { name: "Tue", approved: 15, rejected: 3 },
      { name: "Wed", approved: 18, rejected: 1 },
      { name: "Thu", approved: 14, rejected: 4 },
      { name: "Fri", approved: 20, rejected: 2 },
    ];
  };

  const generateAdminChartData = (stats) => {
    return [
      { name: "Active", value: stats.activeUsers || 0 },
      { name: "Locked", value: stats.lockedUsers || 0 },
    ];
  };

  const generateOfficeChartData = (stats) => {
    return [
      { name: "Pending", value: stats.pendingRequests || 0 },
      { name: "Approved", value: stats.approvedRequests || 0 },
      { name: "Rejected", value: stats.rejectedRequests || 0 },
    ];
  };

  const generateStudentQuickStats = (stats) => {
    return [
      {
        title: "Completion Rate",
        value: `${stats.completionPercentage}%`,
        icon: TrendingUp,
        change: "+5%",
        changeType: "positive",
        color: "bg-blue-100 text-blue-600",
      },
      {
        title: "Pending Items",
        value: stats.pendingRequirements,
        icon: Clock,
        change: "-2",
        changeType: "positive",
        color: "bg-yellow-100 text-yellow-600",
      },
      {
        title: "Completed",
        value: stats.completedRequirements,
        icon: CheckCircle,
        change: "+3",
        changeType: "positive",
        color: "bg-green-100 text-green-600",
      },
      {
        title: "Messages",
        value: stats.totalMessages,
        icon: Mail,
        change: `${stats.unreadMessages} unread`,
        changeType: "neutral",
        color: "bg-purple-100 text-purple-600",
      },
    ];
  };

  const generateFacultyQuickStats = (stats) => {
    return [
      {
        title: "Total Students",
        value: stats.totalStudents,
        icon: Users,
        change: "+12",
        changeType: "positive",
        color: "bg-blue-100 text-blue-600",
      },
      {
        title: "Pending Approvals",
        value: stats.pendingApprovals,
        icon: Clock,
        change: "-5",
        changeType: "positive",
        color: "bg-yellow-100 text-yellow-600",
      },
      {
        title: "Approved Today",
        value: stats.approvedToday,
        icon: CheckCircle,
        change: "+8",
        changeType: "positive",
        color: "bg-green-100 text-green-600",
      },
      {
        title: "Rejected Today",
        value: stats.rejectedToday,
        icon: XCircle,
        change: "-2",
        changeType: "negative",
        color: "bg-red-100 text-red-600",
      },
    ];
  };

  const generateAdminQuickStats = (stats) => {
    return [
      {
        title: "Total Users",
        value: stats.totalUsers,
        icon: Users,
        change: "+5%",
        changeType: "positive",
        color: "bg-blue-100 text-blue-600",
      },
      {
        title: "Active Users",
        value: stats.activeUsers,
        icon: UserCheck,
        change: `${Math.round((stats.activeUsers / stats.totalUsers) * 100)}%`,
        changeType: "neutral",
        color: "bg-green-100 text-green-600",
      },
      {
        title: "Today's Logins",
        value: stats.todayLogins,
        icon: Activity,
        change: "+12",
        changeType: "positive",
        color: "bg-purple-100 text-purple-600",
      },
      {
        title: "Total Students",
        value: stats.totalStudents,
        icon: GraduationCap,
        change: "+8",
        changeType: "positive",
        color: "bg-emerald-100 text-emerald-600",
      },
    ];
  };

  const generateOfficeQuickStats = (stats) => {
    return [
      {
        title: "Total Requests",
        value: stats.totalRequests,
        icon: FileText,
        change: "+10",
        changeType: "positive",
        color: "bg-blue-100 text-blue-600",
      },
      {
        title: "Pending",
        value: stats.pendingRequests,
        icon: Clock,
        change: "Needs attention",
        changeType: "warning",
        color: "bg-yellow-100 text-yellow-600",
      },
      {
        title: "Approved",
        value: stats.approvedRequests,
        icon: CheckCircle,
        change: "+15",
        changeType: "positive",
        color: "bg-green-100 text-green-600",
      },
      {
        title: "Today Processed",
        value: stats.todayProcessed,
        icon: Activity,
        change: "On track",
        changeType: "positive",
        color: "bg-purple-100 text-purple-600",
      },
    ];
  };

  const formatActionType = (actionType) => {
    return actionType
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getActionIcon = (actionType) => {
    const icons = {
      login_success: CheckCircle,
      login_failed: XCircle,
      create_user: UserCheck,
      delete_user: UserX,
      update_user: Edit,
    };
    return icons[actionType] || Activity;
  };

  const getActionColor = (actionType) => {
    const colors = {
      login_success: "text-green-600",
      login_failed: "text-red-600",
      create_user: "text-blue-600",
      delete_user: "text-red-600",
      update_user: "text-yellow-600",
    };
    return colors[actionType] || "text-gray-600";
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getRoleBasedWelcome = () => {
    const welcomeMessages = {
      student: "Track your clearance progress",
      faculty: "Manage student clearances",
      "super-admin": "System administration overview",
      admin: "System administration overview",
    };
    return welcomeMessages[userRole] || "Manage clearance requests";
  };

  const getRoleIcon = () => {
    const icons = {
      student: GraduationCap,
      faculty: BookOpen,
      "super-admin": Shield,
      admin: Shield,
    };
    return icons[userRole] || Briefcase;
  };

  const getQuickActions = () => {
    const baseActions = {
      student: [
        {
          label: "View Clearance",
          icon: FileText,
          path: "/student-clearance",
          color: "bg-blue-600",
        },
        {
          label: "Send Message",
          icon: Mail,
          path: "/send-message",
          color: "bg-purple-600",
        },
        {
          label: "View Requirements",
          icon: CheckSquare,
          path: "/student-clearance",
          color: "bg-green-600",
        },
        {
          label: "Download Forms",
          icon: Download,
          path: "/forms",
          color: "bg-yellow-600",
        },
      ],
      faculty: [
        {
          label: "Approve Clearances",
          icon: CheckCircle,
          path: "/approve-clearance-faculty",
          color: "bg-green-600",
        },
        {
          label: "View Students",
          icon: Users,
          path: "/students",
          color: "bg-blue-600",
        },
        {
          label: "Messages",
          icon: Mail,
          path: "/messages",
          color: "bg-purple-600",
        },
      ],
      "super-admin": [
        {
          label: "User Management",
          icon: Users,
          path: "/user-management",
          color: "bg-blue-600",
        },
        {
          label: "Audit Logs",
          icon: Shield,
          path: "/audit-log",
          color: "bg-purple-600",
        },
      ],
      admin: [
        {
          label: "Audit Logs",
          icon: Shield,
          path: "/audit-log",
          color: "bg-purple-600",
        },
      ],
      office: [
        {
          label: "Process Clearances",
          icon: FileCheck,
          path: "/approve-clearance-office",
          color: "bg-blue-600",
        },
        {
          label: "View Requests",
          icon: Eye,
          path: "/requests",
          color: "bg-purple-600",
        },
        {
          label: "Messages",
          icon: Mail,
          path: "/messages",
          color: "bg-green-600",
        },
      ],
    };

    return baseActions[userRole] || baseActions.office;
  };

  if (loading) {
    return (
      <Sidebar>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
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
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div
                  className={`p-3 rounded-xl ${
                    quickStats[0]?.color || "bg-blue-100"
                  }`}
                >
                  {React.createElement(getRoleIcon(), { className: "h-8 w-8" })}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Welcome back,{" "}
                    {userData?.name || userData?.email?.split("@")[0]}!
                  </h1>
                  <p className="mt-1 text-gray-600">{getRoleBasedWelcome()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  className={`p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors ${
                    refreshing ? "animate-spin" : ""
                  }`}
                >
                  <RefreshCw className="h-5 w-5 text-gray-600" />
                </button>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>
            </div>
          </div>

          {}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {quickStats.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    {React.createElement(stat.icon, { className: "h-6 w-6" })}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      stat.changeType === "positive"
                        ? "text-green-600"
                        : stat.changeType === "negative"
                        ? "text-red-600"
                        : stat.changeType === "warning"
                        ? "text-yellow-600"
                        : "text-gray-600"
                    }`}
                  >
                    {stat.change}
                    {stat.changeType === "positive" && (
                      <ArrowUp className="inline h-3 w-3 ml-1" />
                    )}
                    {stat.changeType === "negative" && (
                      <ArrowDown className="inline h-3 w-3 ml-1" />
                    )}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {getQuickActions().map((action, index) => (
                <button
                  key={index}
                  onClick={() => navigate(action.path)}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all group"
                >
                  <div
                    className={`inline-flex p-3 rounded-lg ${action.color} bg-opacity-10 group-hover:bg-opacity-20 transition-colors mb-3`}
                  >
                    {React.createElement(action.icon, {
                      className: `h-6 w-6 ${action.color.replace(
                        "bg-",
                        "text-"
                      )}`,
                    })}
                  </div>
                  <p className="text-sm font-medium text-gray-900">
                    {action.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {}
            <div className="lg:col-span-3 space-y-8">
              {}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {userRole === "student"
                      ? "Clearance Progress"
                      : userRole === "faculty"
                      ? "Weekly Approvals"
                      : userRole === "super-admin" || userRole === "admin"
                      ? "User Distribution"
                      : "Request Status"}
                  </h2>
                  <button className="text-gray-400 hover:text-gray-600">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>

                {userRole === "faculty" ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="approved"
                        stackId="1"
                        stroke="#10B981"
                        fill="#10B981"
                      />
                      <Area
                        type="monotone"
                        dataKey="rejected"
                        stackId="1"
                        stroke="#EF4444"
                        fill="#EF4444"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <RePieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RePieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Recent Activities
                  </h2>
                  <button
                    onClick={() =>
                      navigate(
                        userRole === "student" ? "/activity-log" : "/audit-log"
                      )
                    }
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    View all
                  </button>
                </div>
                <div className="space-y-4">
                  {recentActivities.length > 0 ? (
                    recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-4">
                        <div
                          className={`p-2 rounded-lg bg-gray-50 ${activity.color}`}
                        >
                          {React.createElement(activity.icon, {
                            className: "h-5 w-5",
                          })}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.title}
                          </p>
                          <p className="text-sm text-gray-600">
                            {activity.description}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {moment(activity.timestamp).fromNow()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      No recent activities
                    </p>
                  )}
                </div>
              </div>
            </div>

            {}
            <div className="space-y-8">
              {}
              {userRole === "student" && upcomingDeadlines.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Upcoming Deadlines
                    </h2>
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="space-y-3">
                    {upcomingDeadlines.map((deadline) => (
                      <div
                        key={deadline.id}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {deadline.title}
                          </p>
                          <p className="text-xs text-gray-600">
                            {moment(deadline.date).format("MMM DD, YYYY")}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            deadline.status === "urgent"
                              ? "bg-red-100 text-red-600"
                              : "bg-yellow-100 text-yellow-600"
                          }`}
                        >
                          {moment(deadline.date).fromNow()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}

export default Dashboard;
