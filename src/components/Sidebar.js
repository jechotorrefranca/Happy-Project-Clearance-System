import React, { useState, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import {
  getFirestore,
  collection,
  where,
  query,
  getDocs,
  addDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FileText,
  Calendar,
  MessageSquare,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Search,
  ClipboardList,
  UserCheck,
  Clock,
  CreditCard,
  BookOpen,
  AlertTriangle,
  School,
  ChevronLeft,
  Activity,
  FileCheck,
  UserPlus,
  Bell,
} from "lucide-react";

const auth = getAuth();
const db = getFirestore();

const getNavigationConfig = (
  userRole,
  unreadMessages,
  unreadNotifications,
  clearanceRequestsCount
) => {
  const baseNavigation = {
    dashboard: {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      badge: null,
    },
  };

  const navigationByRole = {
    "super-admin": [
      {
        category: "Overview",
        items: [
          baseNavigation.dashboard,
          { name: "Activity Log", href: "/audit-log", icon: Activity },
        ],
      },
      {
        category: "User Management",
        items: [{ name: "Users", href: "/user-management", icon: Users }],
      },
      {
        category: "Academic",
        items: [
          { name: "Classes", href: "/classes", icon: School },
          {
            name: "Students",
            href: "/student-master-list",
            icon: GraduationCap,
          },
          { name: "Teachers", href: "/teachers", icon: UserCheck },
          {
            name: "Disciplinary Records",
            href: "/disciplinary-records",
            icon: AlertTriangle,
          },
        ],
      },
      {
        category: "Events & Communication",
        items: [
          { name: "School Events", href: "/school-events", icon: Calendar },
          {
            name: "Messages",
            href: "/view-messages",
            icon: MessageSquare,
            badge: unreadMessages > 0 ? unreadMessages.toString() : null,
          },
        ],
      },
      {
        category: "Finance",
        items: [
          {
            name: "Payment Confirmation",
            href: "/send-payment-confirmation",
            icon: CreditCard,
          },
        ],
      },
    ],
    admin: [
      {
        category: "Overview",
        items: [
          baseNavigation.dashboard,
          { name: "Activity Log", href: "/audit-log", icon: Activity },
        ],
      },
      {
        category: "Academic Management",
        items: [
          { name: "Classes", href: "/classes", icon: School },
          {
            name: "Student Directory",
            href: "/student-master-list",
            icon: GraduationCap,
          },
          {
            name: "Disciplinary Records",
            href: "/disciplinary-records",
            icon: AlertTriangle,
          },
        ],
      },
      {
        category: "Events & Communication",
        items: [
          { name: "School Events", href: "/school-events", icon: Calendar },
          {
            name: "Messages",
            href: "/view-messages",
            icon: MessageSquare,
            badge: unreadMessages > 0 ? unreadMessages.toString() : null,
          },
        ],
      },
      {
        category: "Finance",
        items: [
          {
            name: "Payment Confirmation",
            href: "/send-payment-confirmation",
            icon: CreditCard,
          },
        ],
      },
    ],
    faculty: [
      {
        category: "Clearance Management",
        items: [
          {
            name: "Clearance Requests",
            href: "/approve-clearance-faculty",
            icon: FileCheck,
            badge:
              clearanceRequestsCount > 0
                ? clearanceRequestsCount.toString()
                : null,
          },
          {
            name: "Requirements",
            href: "/manage-requirements",
            icon: ClipboardList,
          },
        ],
      },
      {
        category: "Academic",
        items: [{ name: "My Classes", href: "/view-classes", icon: School }],
      },
      {
        category: "Communication",
        items: [
          {
            name: "Messages",
            href: "/view-messages",
            icon: MessageSquare,
            badge: unreadMessages > 0 ? unreadMessages.toString() : null,
          },
          { name: "School Events", href: "/school-events", icon: Calendar },
        ],
      },
    ],
    // modify this later
    student: [
      {
        category: "Overview",
        items: [
          baseNavigation.dashboard,
          { name: "Activity Log", href: "/activity-log", icon: Activity },
        ],
      },
      {
        category: "Clearance",
        items: [
          {
            name: "Clearance",
            href: "/student-clearance",
            icon: ClipboardList,
          },
        ],
      },
      {
        category: "Guidance",
        items: [
          {
            name: "Guidance Counseling",
            href: "/guidance-counseling",
            icon: UserCheck,
          },
        ],
      },
      {
        category: "Communication",
        items: [
          {
            name: "Messages",
            href: "/view-messages-student",
            icon: MessageSquare,
            badge: unreadMessages > 0 ? unreadMessages.toString() : null,
          },
          {
            name: "Notifications",
            href: "/notifications",
            icon: Bell,
            badge:
              unreadNotifications > 0 ? unreadNotifications.toString() : null,
          },
        ],
      },
    ],
  };

  const officeNavigation = [
    {
      category: "Clearance Management",
      items: [
        {
          name: "Clearance Requests",
          href: "/approve-clearance-office",
          icon: FileCheck,
          badge:
            clearanceRequestsCount > 0
              ? clearanceRequestsCount.toString()
              : null,
        },
        {
          name: "Office Requirements",
          href: "/manage-office-requirements",
          icon: ClipboardList,
        },
      ],
    },
    {
      category: "Communication",
      items: [
        {
          name: "Messages",
          href: "/view-messages",
          icon: MessageSquare,
          badge: unreadMessages > 0 ? unreadMessages.toString() : null,
        },
      ],
    },
  ];

  const enhancedOfficeNav = [...officeNavigation];

  if (
    [
      "Character Renewal Office",
      "Guidance Office",
      "OSAS",
      "Office of The Dean",
    ].includes(userRole)
  ) {
    let recordsCategory = enhancedOfficeNav.find(
      (cat) => cat.category === "Records"
    );
    if (!recordsCategory) {
      recordsCategory = { category: "Records", items: [] };
      enhancedOfficeNav.splice(1, 0, recordsCategory);
    }

    recordsCategory.items.push({
      name: "Disciplinary Records",
      href: "/disciplinary-records",
      icon: AlertTriangle,
    });
  }

  if (["Office of The Dean", "Student Council", "OSAS"].includes(userRole)) {
    enhancedOfficeNav[enhancedOfficeNav.length - 1].items.push({
      name: "School Events",
      href: "/school-events",
      icon: Calendar,
    });
  }

  if (userRole === "Finance") {
    enhancedOfficeNav.splice(enhancedOfficeNav.length - 1, 0, {
      category: "Finance",
      items: [
        {
          name: "Payment Confirmation",
          href: "/send-payment-confirmation",
          icon: CreditCard,
        },
      ],
    });
  }

  return navigationByRole[userRole] || enhancedOfficeNav;
};

export default function Sidebar({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [clearanceRequestsCount, setClearanceRequestsCount] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();

  const noPadding = location.pathname === "/view-messages";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userCollectionRef = collection(db, "users");
          const q = query(userCollectionRef, where("uid", "==", user.uid));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            setUserRole(userData.role);
          }
          setCurrentUser(user);
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
        navigate("/");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (currentUser && userRole) {
      let unsubscribe;

      if (userRole === "faculty") {
        const clearanceRequestsRef = collection(db, "clearanceRequests");
        const q = query(
          clearanceRequestsRef,
          where("facultyId", "==", currentUser.uid),
          where("status", "==", "pending")
        );

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            setClearanceRequestsCount(snapshot.size);
          },
          (error) => {
            console.error("Error fetching clearance requests:", error);
            getDocs(q)
              .then((snapshot) => {
                setClearanceRequestsCount(snapshot.size);
              })
              .catch((err) => {
                console.error(
                  "Error fetching clearance requests (fallback):",
                  err
                );
              });
          }
        );
      } else if (!["super-admin", "admin", "student"].includes(userRole)) {
        const clearanceRequestsRef = collection(db, "clearanceRequests");
        const q = query(
          clearanceRequestsRef,
          where("officerId", "==", currentUser.uid),
          where("status", "==", "pending")
        );

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            setClearanceRequestsCount(snapshot.size);
          },
          (error) => {
            console.error("Error fetching clearance requests:", error);
            getDocs(q)
              .then((snapshot) => {
                setClearanceRequestsCount(snapshot.size);
              })
              .catch((err) => {
                console.error(
                  "Error fetching clearance requests (fallback):",
                  err
                );
              });
          }
        );
      }

      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }
  }, [currentUser, userRole]);

  useEffect(() => {
    if (currentUser && userRole) {
      const inquiriesCollection = collection(db, "inquiries");
      const q = query(
        inquiriesCollection,
        where("recipientId", "==", currentUser.uid),
        where("read", "==", false)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          setUnreadMessages(snapshot.size);
        },
        (error) => {
          console.error("Error fetching unread messages:", error);
          getDocs(q)
            .then((snapshot) => {
              setUnreadMessages(snapshot.size);
            })
            .catch((err) => {
              console.error("Error fetching unread messages (fallback):", err);
            });
        }
      );

      return () => unsubscribe();
    }
  }, [currentUser, userRole]);

  useEffect(() => {
    if (currentUser && userRole) {
      const studNotifs = collection(db, "studentNotification");
      const q = query(
        studNotifs,
        where("studentId", "==", currentUser.uid),
        where("isRead", "==", false)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          setUnreadNotifications(snapshot.size);
          // console.log("aaa", snapshot.size); debugging stuff
        },
        (error) => {
          console.error("Error fetching unread notifications:", error);
          getDocs(q)
            .then((snapshot) => {
              setUnreadNotifications(snapshot.size);
            })
            .catch((err) => {
              console.error(
                "Error fetching unread notifications (fallback):",
                err
              );
            });
        }
      );

      return () => unsubscribe();
    }
  }, [currentUser, userRole]);

  // add unread notifs

  useEffect(() => {
    const savedCollapsed = localStorage.getItem("sidebarCollapsed") === "true";
    setSidebarCollapsed(savedCollapsed);
  }, []);

  const handleLogout = async () => {
    try {
      const auditLogsRef = collection(db, "auditLogs");
      await addDoc(auditLogsRef, {
        timestamp: serverTimestamp(),
        userId: currentUser.uid,
        actionType: "logout",
        email: currentUser.email,
      });
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  const toggleCategory = (categoryName) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryName]: !prev[categoryName],
    }));
  };

  const toggleSidebarCollapse = () => {
    const newCollapsed = !sidebarCollapsed;
    setSidebarCollapsed(newCollapsed);
    localStorage.setItem("sidebarCollapsed", newCollapsed);
  };

  const navigation = userRole
    ? getNavigationConfig(userRole, unreadMessages, clearanceRequestsCount)
    : [];

  const filteredNavigation = navigation
    .map((category) => ({
      ...category,
      items: category.items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.items.length > 0);

  const getInitials = (email) => {
    if (!email) return "U";
    const parts = email.split("@")[0].split(/[.\-_]/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const getRoleColor = (role) => {
    const colors = {
      "super-admin": "bg-purple-500",
      admin: "bg-blue-500",
      faculty: "bg-green-500",
      student: "bg-yellow-500",
    };
    return colors[role] || "bg-gray-500";
  };

  const getRoleLabel = (role) => {
    const labels = {
      "super-admin": "Super Admin",
      admin: "Administrator",
      faculty: "Faculty",
      student: "Student",
    };
    return labels[role] || role;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50 lg:hidden"
          onClose={setSidebarOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <X className="h-6 w-6 text-white" />
                    </button>
                  </div>
                </Transition.Child>

                {}
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
                  <div className="flex h-16 shrink-0 items-center">
                    <img
                      className="h-10 w-auto"
                      src="https://dyci.edu.ph/assets/logo/dyci-logo.webp"
                      alt="DYCI Logo"
                    />
                  </div>

                  {}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {}
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      {filteredNavigation.map((category, categoryIdx) => (
                        <li key={categoryIdx}>
                          <div className="text-xs font-semibold leading-6 text-gray-400">
                            {category.category}
                          </div>
                          <ul role="list" className="-mx-2 mt-2 space-y-1">
                            {category.items.map((item) => {
                              const isActive = location.pathname === item.href;
                              return (
                                <li key={item.name}>
                                  <NavLink
                                    to={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`
                                      group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold
                                      ${
                                        isActive
                                          ? "bg-blue-50 text-blue-600"
                                          : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                                      }
                                    `}
                                  >
                                    <item.icon
                                      className={`h-6 w-6 shrink-0 ${
                                        isActive
                                          ? "text-blue-600"
                                          : "text-gray-400 group-hover:text-blue-600"
                                      }`}
                                    />
                                    <span className="flex-1">{item.name}</span>
                                    {item.badge && (
                                      <span
                                        className={`
                                        ml-auto px-2 py-0.5 text-xs rounded-full
                                        ${
                                          item.badge === "!"
                                            ? "bg-red-100 text-red-600 animate-pulse"
                                            : parseInt(item.badge) > 0
                                            ? "bg-blue-100 text-blue-600"
                                            : "bg-gray-100 text-gray-600"
                                        }
                                      `}
                                      >
                                        {item.badge}
                                      </span>
                                    )}
                                  </NavLink>
                                </li>
                              );
                            })}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </nav>

                  {}
                  <div className="mt-auto -mx-6">
                    <div className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-gray-900">
                      <div
                        className={`relative h-10 w-10 rounded-full ${getRoleColor(
                          userRole
                        )} flex items-center justify-center text-white font-bold`}
                      >
                        {getInitials(currentUser?.email)}
                        <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {currentUser?.email?.split("@")[0]}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getRoleLabel(userRole)}
                        </p>
                      </div>
                    </div>
                    <hr className="my-2 border-gray-200" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-6 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {}
      <div
        className={`hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex ${
          sidebarCollapsed ? "lg:w-20" : "lg:w-72"
        } transition-all duration-300 lg:flex-col`}
      >
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
          {}
          <div className="flex h-16 shrink-0 items-center justify-between">
            <img
              className={`${
                sidebarCollapsed ? "h-8" : "h-10"
              } w-auto transition-all`}
              src="https://dyci.edu.ph/assets/logo/dyci-logo.webp"
              alt="DYCI"
            />
            <button
              onClick={toggleSidebarCollapse}
              className="p-1.5 rounded-lg hover:bg-gray-100"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronLeft className="h-5 w-5 text-gray-500" />
              )}
            </button>
          </div>

          {}
          {!sidebarCollapsed && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              {filteredNavigation.map((category, categoryIdx) => (
                <li key={categoryIdx}>
                  {!sidebarCollapsed && (
                    <button
                      onClick={() => toggleCategory(category.category)}
                      className="flex items-center justify-between w-full text-xs font-semibold leading-6 text-gray-400 hover:text-gray-600"
                    >
                      {category.category}
                      {collapsedCategories[category.category] ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  )}
                  {!collapsedCategories[category.category] && (
                    <ul role="list" className="-mx-2 mt-2 space-y-1">
                      {category.items.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                          <li key={item.name}>
                            <NavLink
                              to={item.href}
                              className={`
                                group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold
                                ${
                                  isActive
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                                }
                              `}
                              title={sidebarCollapsed ? item.name : ""}
                            >
                              <item.icon
                                className={`h-6 w-6 shrink-0 ${
                                  isActive
                                    ? "text-blue-600"
                                    : "text-gray-400 group-hover:text-blue-600"
                                }`}
                              />
                              {!sidebarCollapsed && (
                                <>
                                  <span className="flex-1">{item.name}</span>
                                  {item.badge && (
                                    <span
                                      className={`
                                      ml-auto px-2 py-0.5 text-xs rounded-full
                                      ${
                                        item.badge === "!"
                                          ? "bg-red-100 text-red-600 animate-pulse"
                                          : parseInt(item.badge) > 0
                                          ? "bg-blue-100 text-blue-600"
                                          : "bg-gray-100 text-gray-600"
                                      }
                                    `}
                                    >
                                      {item.badge}
                                    </span>
                                  )}
                                </>
                              )}
                              {sidebarCollapsed && item.badge && (
                                <span
                                  className={`
                                  absolute -top-1 -right-1 px-1.5 py-0.5 text-xs rounded-full
                                  ${
                                    item.badge === "!"
                                      ? "bg-red-100 text-red-600 animate-pulse"
                                      : parseInt(item.badge) > 0
                                      ? "bg-blue-100 text-blue-600"
                                      : "bg-gray-100 text-gray-600"
                                  }
                                `}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </NavLink>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {}
          <div className="relative -mx-6 mt-auto">
            <div className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-gray-900">
              <div
                className={`relative h-10 w-10 rounded-full ${getRoleColor(
                  userRole
                )} flex items-center justify-center text-white font-bold shrink-0`}
              >
                {getInitials(currentUser?.email)}
                <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></span>
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {currentUser?.email?.split("@")[0]}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getRoleLabel(userRole)}
                  </p>
                </div>
              )}
            </div>
            <hr className="my-2 mx-6 border-gray-200" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-6 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
            >
              <LogOut className="h-4 w-4" />
              {!sidebarCollapsed && "Logout"}
            </button>
          </div>
        </div>
      </div>

      {}
      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-sm sm:px-6 lg:hidden">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex-1 text-sm font-semibold leading-6 text-gray-900">
          {getRoleLabel(userRole)} Dashboard
        </div>
      </div>

      {}
      <main
        className={`${
          sidebarCollapsed ? "lg:pl-20" : "lg:pl-72"
        } transition-all duration-300`}
      >
        <div className={noPadding ? "" : "px-4 py-10 sm:px-6 lg:px-8"}>
          {children}
        </div>
      </main>
    </div>
  );
}
