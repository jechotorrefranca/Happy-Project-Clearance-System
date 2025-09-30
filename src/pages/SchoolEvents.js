import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  where,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../components/AuthContext";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import moment from "moment";
import { useCSVReader } from "react-papaparse";
import Select from "react-select";
import {
  X,
  Plus,
  Edit,
  Trash,
  Upload,
  Eye,
  Calendar,
  Clock,
  MapPin,
  Users,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Grid,
  List,
  Download,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  UserPlus,
  CalendarDays,
  GraduationCap,
  School,
  UserMinus,
  Shield,
  Lock,
} from "lucide-react";

const auth = getAuth();

const educationLevels = [
  { value: "elementary", label: "Elementary", icon: "🎒", color: "bg-green-100 text-green-700" },
  { value: "junior high school", label: "Junior High School", icon: "📚", color: "bg-blue-100 text-blue-700" },
  { value: "senior high school", label: "Senior High School", icon: "🎓", color: "bg-purple-100 text-purple-700" },
  { value: "college", label: "College", icon: "🏛️", color: "bg-orange-100 text-orange-700" },
];

const gradeLevels = [
  { value: "1", label: "Grade 1", category: "elementary" },
  { value: "2", label: "Grade 2", category: "elementary" },
  { value: "3", label: "Grade 3", category: "elementary" },
  { value: "4", label: "Grade 4", category: "elementary" },
  { value: "5", label: "Grade 5", category: "elementary" },
  { value: "6", label: "Grade 6", category: "elementary" },
  { value: "7", label: "Grade 7", category: "junior high school" },
  { value: "8", label: "Grade 8", category: "junior high school" },
  { value: "9", label: "Grade 9", category: "junior high school" },
  { value: "10", label: "Grade 10", category: "junior high school" },
  { value: "11", label: "Grade 11", category: "senior high school" },
  { value: "12", label: "Grade 12", category: "senior high school" },
  { value: "Freshman", label: "Freshman", category: "college" },
  { value: "Sophomore", label: "Sophomore", category: "college" },
  { value: "Junior", label: "Junior", category: "college" },
  { value: "Senior", label: "Senior", category: "college" },
];

function SchoolEvents() {
  const { currentUser } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [userDataLoading, setUserDataLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [students, setStudents] = useState([]);
  const [advisorySection, setAdvisorySection] = useState(null);
  const [advisoryDataLoading, setAdvisoryDataLoading] = useState(false);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAttendeesModalOpen, setIsAttendeesModalOpen] = useState(false);
  const [isManualAddModalOpen, setIsManualAddModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    description: "",
    location: "",
    educationLevels: [],
    gradeLevels: [],
  });
  const [eventToEdit, setEventToEdit] = useState(null);
  const [eventToImport, setEventToImport] = useState(null);
  const [eventToView, setEventToView] = useState(null);
  const [eventForManualAdd, setEventForManualAdd] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("asc");
  const [attendeeFilter, setAttendeeFilter] = useState("");
  const [attendeeEducationFilter, setAttendeeEducationFilter] = useState("all");
  const [attendeeGradeFilter, setAttendeeGradeFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    total: 0,
    upcoming: 0,
    today: 0,
    totalAttendees: 0,
  });
  const [educationFilter, setEducationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { CSVReader } = useCSVReader();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser?.uid) {
        setUserDataLoading(false);
        return;
      }

      try {
        setUserDataLoading(true);
        
        const userCollectionRef = collection(db, "users");
        const q = query(userCollectionRef, where("uid", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);

        let role = null;
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();
          role = userData.role;
          setUserRole(role);
        } else {
          const studentsRef = collection(db, "students");
          const studentQuery = query(studentsRef, where("uid", "==", currentUser.uid));
          const studentSnapshot = await getDocs(studentQuery);
          
          if (!studentSnapshot.empty) {
            role = "student";
            setUserRole("student");
          }
        }

        if (role === 'faculty' || role === 'teacher') {
          setAdvisoryDataLoading(true);
          const classesRef = collection(db, "classes");
          const classQuery = query(classesRef, where("adviserUid", "==", currentUser.uid));
          const classSnapshot = await getDocs(classQuery);
          
          if (!classSnapshot.empty) {
            const advisoryClass = classSnapshot.docs[0].data();
            setAdvisorySection(advisoryClass.sectionName);
          }
          setAdvisoryDataLoading(false);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setUserDataLoading(false);
      }
    };

    fetchUserData();
  }, [currentUser]);

  const isAdmin = userRole === 'admin' || userRole === 'super-admin';
  const isFaculty = userRole === 'faculty' || userRole === 'teacher';

  useEffect(() => {
    if (!userDataLoading && userRole) {
      fetchEvents();
      
      if (isFaculty) {
        if (!advisoryDataLoading) {
          fetchStudents();
        }
      } else {
        fetchStudents();
      }
    }
  }, [userDataLoading, userRole, advisoryDataLoading, advisorySection, sortBy, sortOrder]);

  const fetchStudents = async () => {
    try {
      let studentsData = [];
      
      if (isFaculty && advisorySection) {
        const q = query(collection(db, "students"), where("section", "==", advisorySection));
        const studentsSnapshot = await getDocs(q);
        studentsData = studentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      } else if (isAdmin) {
        const studentsSnapshot = await getDocs(collection(db, "students"));
        studentsData = studentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
      }
      
      setStudents(studentsData);
    } catch (error) {
      console.error("Error fetching students: ", error);
      setStudents([]);
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const eventsRef = collection(db, "events");
      const q = query(eventsRef, orderBy(sortBy, sortOrder));
      const querySnapshot = await getDocs(q);
      const eventsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const stats = {
        total: eventsData.length,
        upcoming: eventsData.filter(e => new Date(e.date) > now).length,
        today: eventsData.filter(e => {
          const eventDate = new Date(e.date);
          return eventDate.toDateString() === today.toDateString();
        }).length,
        totalAttendees: eventsData.reduce((sum, e) => sum + (e.attendees?.length || 0), 0),
      };
      
      setStatistics(stats);
      setEvents(eventsData);
    } catch (error) {
      console.error("Error fetching events: ", error);
    } finally {
      setLoading(false);
    }
  };

  const canEditDeleteEvent = (event) => {
    if (isAdmin) return true;
    if (event.createdBy === currentUser?.uid) return true;
    return false;
  };

  const canManageAttendees = (event) => {
    if (isAdmin) return true;
    if (event.createdBy === currentUser?.uid) return true;
    if (isFaculty && advisorySection) return true;
    return false;
  };

  const canRemoveAttendee = (event, attendee) => {
    if (isAdmin) return true;
    if (event.createdBy === currentUser?.uid) return true;
    if (isFaculty && advisorySection && attendee.section === advisorySection) return true;
    return false;
  };

  const handleAddEvent = async () => {
    try {
      const docRef = await addDoc(collection(db, "events"), {
        ...newEvent,
        timestamp: serverTimestamp(),
        attendees: [],
        createdBy: currentUser?.uid,
        createdByEmail: currentUser?.email,
        createdByRole: userRole,
      });

      setIsAddEventModalOpen(false);
      setNewEvent({
        title: "",
        date: "",
        startTime: "",
        endTime: "",
        description: "",
        location: "",
        educationLevels: [],
        gradeLevels: [],
      });

      alert("Event added successfully!");
      fetchEvents();
    } catch (error) {
      console.error("Error adding event: ", error);
      alert("Error adding event. Please try again later.");
    }
  };

  const handleEditEvent = async () => {
    try {
      if (!eventToEdit) return;

      if (!canEditDeleteEvent(eventToEdit)) {
        alert("You don't have permission to edit this event.");
        return;
      }

      const { id, ...eventData } = eventToEdit;
      await updateDoc(doc(db, "events", id), eventData);

      setIsEditModalOpen(false);
      setEventToEdit(null);
      alert("Event updated successfully!");
      fetchEvents();
    } catch (error) {
      console.error("Error updating event: ", error);
      alert("Error updating event. Please try again later.");
    }
  };

  const handleDeleteEvent = async (event) => {
    if (!canEditDeleteEvent(event)) {
      alert("You don't have permission to delete this event.");
      return;
    }

    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await deleteDoc(doc(db, "events", event.id));
        alert("Event deleted successfully!");
        fetchEvents();
      } catch (error) {
        console.error("Error deleting event: ", error);
        alert("Error deleting event. Please try again later.");
      }
    }
  };

  const handleImportCSV = async (results) => {
    try {
      if (!canManageAttendees(eventToImport)) {
        alert("You don't have permission to import attendees to this event.");
        return;
      }

      let attendees = results.data.slice(1).map((row) => ({
        email: row[0],
        studentId: row[1],
        studentUid: row[2],
        studentName: row[3],
        gradeLevel: row[4],
        educationLevel: row[5],
        section: row[6] || "",
      }));

      if (isFaculty && advisorySection && !isAdmin && eventToImport.createdBy !== currentUser?.uid) {
        attendees = attendees.filter(a => a.section === advisorySection);
        if (attendees.length === 0) {
          alert("No students from your advisory section found in the CSV.");
          return;
        }
      }

      if (eventToImport) {
        await updateDoc(doc(db, "events", eventToImport.id), {
          attendees: arrayUnion(...attendees),
        });

        setEventToImport(null);
        setIsImportModalOpen(false);
        alert(`${attendees.length} attendees imported successfully!`);
        fetchEvents();
      }
    } catch (error) {
      console.error("Error importing attendees:", error);
      alert("Error importing attendees. Please try again later.");
    }
  };

  const handleManualAddStudents = async () => {
    try {
      if (!eventForManualAdd || selectedStudents.length === 0) return;

      if (!canManageAttendees(eventForManualAdd)) {
        alert("You don't have permission to add attendees to this event.");
        return;
      }

      let studentsToAdd = selectedStudents;

      if (isFaculty && advisorySection && !isAdmin && eventForManualAdd.createdBy !== currentUser?.uid) {
        studentsToAdd = selectedStudents.filter(s => s.section === advisorySection);
        if (studentsToAdd.length === 0) {
          alert("You can only add students from your advisory section.");
          return;
        }
      }

      const attendees = studentsToAdd.map(student => ({
        email: student.email || "",
        studentId: student.studentId || "",
        studentUid: student.uid || student.id,
        studentName: student.fullName || student.name || "",
        gradeLevel: student.gradeLevel || "",
        educationLevel: student.educationLevel || "",
        section: student.section || "",
      }));

      await updateDoc(doc(db, "events", eventForManualAdd.id), {
        attendees: arrayUnion(...attendees),
      });

      setIsManualAddModalOpen(false);
      setSelectedStudents([]);
      setEventForManualAdd(null);
      alert(`${attendees.length} students added successfully!`);
      fetchEvents();
    } catch (error) {
      console.error("Error adding students: ", error);
      alert("Error adding students. Please try again later.");
    }
  };

  const handleRemoveAttendee = async (eventId, attendee) => {
    const event = events.find(e => e.id === eventId);
    
    if (!canRemoveAttendee(event, attendee)) {
      alert("You don't have permission to remove this attendee.");
      return;
    }

    if (window.confirm(`Remove ${attendee.studentName} from this event?`)) {
      try {
        await updateDoc(doc(db, "events", eventId), {
          attendees: arrayRemove(attendee),
        });
        
        const updatedEvent = events.find(e => e.id === eventId);
        if (updatedEvent) {
          updatedEvent.attendees = updatedEvent.attendees.filter(
            a => a.studentUid !== attendee.studentUid
          );
          setEventToView({ ...updatedEvent });
        }
        
        fetchEvents();
      } catch (error) {
        console.error("Error removing attendee: ", error);
        alert("Error removing attendee. Please try again later.");
      }
    }
  };

  const getEventStatus = (event) => {
    const now = new Date();
    const eventDate = new Date(event.date);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (eventDate.toDateString() === today.toDateString()) return "today";
    if (eventDate > now) return "upcoming";
    return "past";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "today": return "bg-green-100 text-green-800";
      case "upcoming": return "bg-blue-100 text-blue-800";
      case "past": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "today": return "Today";
      case "upcoming": return "Upcoming";
      case "past": return "Past";
      default: return "";
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(filter.toLowerCase()) ||
                         event.location?.toLowerCase().includes(filter.toLowerCase());
    
    const matchesEducation = educationFilter === "all" || 
                            event.educationLevels?.includes(educationFilter);
    
    const status = getEventStatus(event);
    const matchesStatus = statusFilter === "all" || status === statusFilter;
    
    return matchesSearch && matchesEducation && matchesStatus;
  });

  const getFilteredStudentsForEvent = (event) => {
    if (!event) return [];
    
    let availableStudents = [...students];
    
    availableStudents = availableStudents.filter(student => {
      const matchesEducation = !event.educationLevels || event.educationLevels.length === 0 ||
                              event.educationLevels.includes(student.educationLevel);
      
      const matchesGrade = !event.gradeLevels || event.gradeLevels.length === 0 ||
                          event.gradeLevels.includes(student.gradeLevel);
      
      const notAttending = !event.attendees || !event.attendees.some(
        a => a.studentUid === (student.uid || student.id)
      );
      
      return matchesEducation && matchesGrade && notAttending;
    });

    if (isFaculty && advisorySection && !isAdmin && event.createdBy !== currentUser?.uid) {
      availableStudents = availableStudents.filter(s => s.section === advisorySection);
    }

    return availableStudents;
  };

  const getFilteredAttendees = (attendees) => {
    if (!attendees) return [];
    
    return attendees.filter(attendee => {
      const matchesSearch = !attendeeFilter || 
                           attendee.studentName?.toLowerCase().includes(attendeeFilter.toLowerCase()) ||
                           attendee.studentId?.toLowerCase().includes(attendeeFilter.toLowerCase()) ||
                           attendee.email?.toLowerCase().includes(attendeeFilter.toLowerCase());
      
      const matchesEducation = attendeeEducationFilter === "all" || 
                              attendee.educationLevel === attendeeEducationFilter;
      
      const matchesGrade = attendeeGradeFilter === "all" || 
                          attendee.gradeLevel === attendeeGradeFilter;
      
      return matchesSearch && matchesEducation && matchesGrade;
    });
  };

  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      borderColor: state.isFocused ? '#3B82F6' : '#E5E7EB',
      boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.1)' : 'none',
      '&:hover': {
        borderColor: '#3B82F6',
      },
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#EBF5FF',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: '#1E40AF',
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: '#1E40AF',
      '&:hover': {
        backgroundColor: '#3B82F6',
        color: 'white',
      },
    }),
  };

  const StatCard = ({ icon, title, value, color, trend }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <p className="text-xs text-gray-500 mt-1">{trend}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  const EventCard = ({ event }) => {
    const status = getEventStatus(event);
    const canEdit = canEditDeleteEvent(event);
    const canManage = canManageAttendees(event);
    
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{event.title}</h3>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                  {getStatusLabel(status)}
                </span>
                {event.createdBy === currentUser?.uid && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    <Shield className="mr-1 h-3 w-3" />
                    Created by you
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="mr-2 h-4 w-4" />
              {moment(new Date(event.date)).format("MMMM DD, YYYY")}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="mr-2 h-4 w-4" />
              {event.startTime} - {event.endTime}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="mr-2 h-4 w-4" />
              {event.location || "No location specified"}
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Users className="mr-2 h-4 w-4" />
              {event.attendees?.length || 0} attendees
            </div>
          </div>

          {event.educationLevels && event.educationLevels.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {event.educationLevels.map((level) => {
                  const eduLevel = educationLevels.find(e => e.value === level);
                  return (
                    <span key={level} className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${eduLevel?.color || 'bg-gray-100 text-gray-800'}`}>
                      {eduLevel?.icon} {eduLevel?.label || level}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex gap-2">
              {canEdit ? (
                <>
                  <button
                    onClick={() => {
                      setEventToEdit({ ...event });
                      setIsEditModalOpen(true);
                    }}
                    className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash size={18} />
                  </button>
                </>
              ) : (
                <div className="flex items-center text-xs text-gray-500">
                  <Lock className="mr-1 h-3 w-3" />
                  Read-only
                </div>
              )}
              
              {canManage && (
                <>
                  <button
                    onClick={() => {
                      setEventForManualAdd(event);
                      setIsManualAddModalOpen(true);
                    }}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Add Students"
                  >
                    <UserPlus size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setEventToImport(event);
                      setIsImportModalOpen(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Import Attendees"
                  >
                    <Upload size={18} />
                  </button>
                </>
              )}
            </div>
            <button
              onClick={() => {
                setEventToView(event);
                setIsAttendeesModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              <Eye size={16} />
              View Details
            </button>
          </div>
        </div>
      </div>
    );
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <CalendarDays className="h-12 w-12 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
      <p className="text-gray-500 text-center max-w-sm">
        {filter || educationFilter !== "all" || statusFilter !== "all"
          ? "Try adjusting your filters or search query."
          : "Get started by creating your first event."}
      </p>
      {!filter && educationFilter === "all" && statusFilter === "all" && (
        <button
          onClick={() => setIsAddEventModalOpen(true)}
          className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Create First Event
        </button>
      )}
    </div>
  );

  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
      <p className="text-gray-600">Loading events...</p>
    </div>
  );

  if (userDataLoading || (isFaculty && advisoryDataLoading)) {
    return (
      <Sidebar>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">
              {userDataLoading ? "Loading user data..." : "Loading advisory section..."}
            </p>
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
                <h1 className="text-3xl font-bold text-gray-900">School Events</h1>
                <p className="mt-2 text-gray-600">Manage and track school events and attendance</p>
              </div>
              <button
                onClick={() => setIsAddEventModalOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus size={20} />
                Add Event
              </button>
            </div>
          </div>

          {}
          {}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard 
              icon={<CalendarDays className="h-6 w-6" />}
              title="Total Events" 
              value={statistics.total}
              color="bg-blue-100 text-blue-600"
            />
            <StatCard 
              icon={<Calendar className="h-6 w-6" />}
              title="Upcoming Events" 
              value={statistics.upcoming}
              color="bg-green-100 text-green-600"
            />
            <StatCard 
              icon={<Clock className="h-6 w-6" />}
              title="Today's Events" 
              value={statistics.today}
              color="bg-yellow-100 text-yellow-600"
            />
            <StatCard 
              icon={<Users className="h-6 w-6" />}
              title="Total Attendees" 
              value={statistics.totalAttendees}
              color="bg-purple-100 text-purple-600"
            />
          </div>

          {}
          
          {}
          {}
          
          {}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search events by title or location..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <select
                  value={educationFilter}
                  onChange={(e) => setEducationFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Levels</option>
                  {educationLevels.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="today">Today</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="past">Past</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="date">Sort by Date</option>
                  <option value="title">Sort by Title</option>
                </select>

                <button
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {sortOrder === "asc" ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded ${viewMode === "grid" ? "bg-white shadow-sm" : ""}`}
                  >
                    <Grid size={20} />
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`p-2 rounded ${viewMode === "table" ? "bg-white shadow-sm" : ""}`}
                  >
                    <List size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {}
          {loading ? (
            <LoadingState />
          ) : filteredEvents.length === 0 ? (
            <EmptyState />
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Education Levels
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attendees
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEvents.map((event) => {
                      const status = getEventStatus(event);
                      const canEdit = canEditDeleteEvent(event);
                      const canManage = canManageAttendees(event);
                      
                      return (
                        <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {event.title}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                                  {getStatusLabel(status)}
                                </span>
                                {event.createdBy === currentUser?.uid && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    <Shield className="mr-1 h-3 w-3" />
                                    Owner
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {moment(new Date(event.date)).format("MMM DD, YYYY")}
                            </div>
                            <div className="text-sm text-gray-500">
                              {event.startTime} - {event.endTime}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {event.location || "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {event.educationLevels?.map((level) => {
                                const eduLevel = educationLevels.find(e => e.value === level);
                                return (
                                  <span key={level} className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${eduLevel?.color || 'bg-gray-100 text-gray-800'}`}>
                                    {eduLevel?.label || level}
                                  </span>
                                );
                              }) || "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {event.attendees?.length || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex justify-center gap-1">
                              {canEdit ? (
                                <>
                                  <button
                                    onClick={() => {
                                      setEventToEdit({ ...event });
                                      setIsEditModalOpen(true);
                                    }}
                                    className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                    title="Edit"
                                  >
                                    <Edit size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEvent(event)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete"
                                  >
                                    <Trash size={16} />
                                  </button>
                                </>
                              ) : (
                                <Lock className="p-1.5 text-gray-400" size={16} title="Read-only" />
                              )}
                              
                              {canManage && (
                                <>
                                  <button
                                    onClick={() => {
                                      setEventForManualAdd(event);
                                      setIsManualAddModalOpen(true);
                                    }}
                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="Add Students"
                                  >
                                    <UserPlus size={16} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEventToImport(event);
                                      setIsImportModalOpen(true);
                                    }}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Import Attendees"
                                  >
                                    <Upload size={16} />
                                  </button>
                                </>
                              )}
                              
                              <button
                                onClick={() => {
                                  setEventToView(event);
                                  setIsAttendeesModalOpen(true);
                                }}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="View Attendees"
                              >
                                <Eye size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {}
          {!loading && filteredEvents.length > 0 && (
            <div className="mt-6 text-center text-sm text-gray-500">
              Showing {filteredEvents.length} of {events.length} events
            </div>
          )}
        </div>
      </div>

      {}
      {}
      
      {}
      <Modal
        isOpen={isAddEventModalOpen}
        onClose={() => setIsAddEventModalOpen(false)}
      >
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Add New Event</h3>
            <button
              onClick={() => setIsAddEventModalOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          <form className="space-y-6">
            {}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter event title"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
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
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Event location"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={newEvent.startTime}
                  onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={newEvent.endTime}
                  onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="4"
                placeholder="Event description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Education Levels
              </label>
              <Select
                isMulti
                options={educationLevels}
                value={newEvent.educationLevels.map((level) => ({
                  value: level,
                  label: educationLevels.find(e => e.value === level)?.label || level,
                }))}
                onChange={(selected) =>
                  setNewEvent({
                    ...newEvent,
                    educationLevels: selected.map((option) => option.value),
                  })
                }
                styles={customSelectStyles}
                placeholder="Select education levels..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade Levels
              </label>
              <Select
                isMulti
                options={gradeLevels}
                value={newEvent.gradeLevels.map((level) => ({
                  value: level,
                  label: gradeLevels.find(g => g.value === level)?.label || level,
                }))}
                onChange={(selected) =>
                  setNewEvent({
                    ...newEvent,
                    gradeLevels: selected.map((option) => option.value),
                  })
                }
                styles={customSelectStyles}
                placeholder="Select grade levels..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <button
                type="button"
                onClick={() => setIsAddEventModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddEvent}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Event
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      >
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Edit Event</h3>
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          {eventToEdit && (
            <form className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={eventToEdit.title}
                  onChange={(e) => setEventToEdit({ ...eventToEdit, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={eventToEdit.date}
                    onChange={(e) => setEventToEdit({ ...eventToEdit, date: e.target.value })}
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
                    value={eventToEdit.location || ""}
                    onChange={(e) => setEventToEdit({ ...eventToEdit, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Event location"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={eventToEdit.startTime}
                    onChange={(e) => setEventToEdit({ ...eventToEdit, startTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={eventToEdit.endTime}
                    onChange={(e) => setEventToEdit({ ...eventToEdit, endTime: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={eventToEdit.description || ""}
                  onChange={(e) => setEventToEdit({ ...eventToEdit, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="4"
                  placeholder="Event description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Education Levels
                </label>
                <Select
                  isMulti
                  options={educationLevels}
                  value={(eventToEdit.educationLevels || []).map((level) => ({
                    value: level,
                    label: educationLevels.find(e => e.value === level)?.label || level,
                  }))}
                  onChange={(selected) =>
                    setEventToEdit({
                      ...eventToEdit,
                      educationLevels: selected.map((option) => option.value),
                    })
                  }
                  styles={customSelectStyles}
                  placeholder="Select education levels..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade Levels
                </label>
                <Select
                  isMulti
                  options={gradeLevels}
                  value={(eventToEdit.gradeLevels || []).map((level) => ({
                    value: level,
                    label: gradeLevels.find(g => g.value === level)?.label || level,
                  }))}
                  onChange={(selected) =>
                    setEventToEdit({
                      ...eventToEdit,
                      gradeLevels: selected.map((option) => option.value),
                    })
                  }
                  styles={customSelectStyles}
                  placeholder="Select grade levels..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleEditEvent}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {}
      <Modal
        isOpen={isManualAddModalOpen}
        onClose={() => {
          setIsManualAddModalOpen(false);
          setSelectedStudents([]);
        }}
      >
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Add Students Manually</h3>
              {eventForManualAdd && (
                <p className="mt-1 text-sm text-gray-600">
                  For event: <strong>{eventForManualAdd.title}</strong>
                </p>
              )}
              {isFaculty && advisorySection && !isAdmin && (
                <p className="mt-1 text-sm text-yellow-600">
                  Note: Showing students from your advisory section ({advisorySection})
                </p>
              )}
            </div>
            <button
              onClick={() => {
                setIsManualAddModalOpen(false);
                setSelectedStudents([]);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          {eventForManualAdd && (
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Students to Add
                </label>
                <Select
                  isMulti
                  options={getFilteredStudentsForEvent(eventForManualAdd).map(student => ({
                    value: student.id,
                    label: `${student.fullName || student.name} (${student.studentId}) - ${student.gradeLevel} - ${student.section || 'N/A'}`,
                    data: student
                  }))}
                  onChange={(selected) => {
                    setSelectedStudents(selected.map(option => option.data));
                  }}
                  styles={customSelectStyles}
                  placeholder="Search and select students..."
                  noOptionsMessage={() => 
                    isFaculty && advisorySection && !isAdmin && eventForManualAdd.createdBy !== currentUser?.uid
                      ? "No eligible students from your advisory section"
                      : "No eligible students found"
                  }
                />
                <p className="mt-2 text-xs text-gray-500">
                  Only showing students matching event criteria who are not already attendees
                  {isFaculty && advisorySection && !isAdmin && " from your advisory section"}
                </p>
              </div>

              {selectedStudents.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Selected Students ({selectedStudents.length})
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {selectedStudents.map(student => (
                      <div key={student.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">
                          {student.fullName || student.name} - {student.studentId} 
                          {student.section && ` - ${student.section}`}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedStudents(selectedStudents.filter(s => s.id !== student.id));
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setIsManualAddModalOpen(false);
                    setSelectedStudents([]);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleManualAddStudents}
                  disabled={selectedStudents.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add {selectedStudents.length} Student{selectedStudents.length !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Import Attendees</h3>
              {eventToImport && (
                <p className="mt-1 text-sm text-gray-600">
                  For event: <strong>{eventToImport.title}</strong>
                </p>
              )}
              {isFaculty && advisorySection && !isAdmin && (
                <p className="mt-1 text-sm text-yellow-600">
                  Note: Only students from your advisory section ({advisorySection}) will be imported
                </p>
              )}
            </div>
            <button
              onClick={() => setIsImportModalOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">CSV Format Required:</p>
                <p>Email, Student ID, Student UID, Student Name, Grade Level, Education Level, Section</p>
              </div>
            </div>
          </div>

          <CSVReader
            onUploadAccepted={handleImportCSV}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => event.preventDefault()}
          >
            {({
              getRootProps,
              acceptedFile,
              ProgressBar,
              getRemoveFileProps,
            }) => (
              <>
                <div
                  {...getRootProps()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors bg-gray-50"
                >
                  <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  {acceptedFile ? (
                    <div className="text-green-600 font-semibold">
                      <CheckCircle className="h-5 w-5 inline mr-2" />
                      {acceptedFile.name}
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-900 font-medium mb-1">
                        Drop CSV file here or click to upload
                      </p>
                      <p className="text-sm text-gray-500">
                        Supports .csv files only
                      </p>
                    </>
                  )}
                  <ProgressBar />
                </div>
                {acceptedFile && (
                  <div className="mt-4 flex justify-center">
                    <button
                      {...getRemoveFileProps()}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <X size={16} />
                      Remove File
                    </button>
                  </div>
                )}
              </>
            )}
          </CSVReader>
        </div>
      </Modal>

      {}
      <Modal
        isOpen={isAttendeesModalOpen}
        onClose={() => {
          setIsAttendeesModalOpen(false);
          setAttendeeFilter("");
          setAttendeeEducationFilter("all");
          setAttendeeGradeFilter("all");
        }}
      >
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Event Attendees</h3>
              {eventToView && (
                <p className="mt-1 text-sm text-gray-600">{eventToView.title}</p>
              )}
            </div>
            <button
              onClick={() => {
                setIsAttendeesModalOpen(false);
                setAttendeeFilter("");
                setAttendeeEducationFilter("all");
                setAttendeeGradeFilter("all");
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          {eventToView && (
            <div>
              {}
              <div className="space-y-4 mb-6">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search attendees by name, ID, or email..."
                    value={attendeeFilter}
                    onChange={(e) => setAttendeeFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-2">
                  <select
                    value={attendeeGradeFilter}
                    onChange={(e) => setAttendeeGradeFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Grade Levels</option>
                    {gradeLevels.map((grade) => (
                      <option key={grade.value} value={grade.value}>
                        {grade.label}
                      </option>
                    ))}
                  </select>

                  {canManageAttendees(eventToView) && (
                    <button
                      onClick={() => {
                        setEventForManualAdd(eventToView);
                        setIsAttendeesModalOpen(false);
                        setIsManualAddModalOpen(true);
                      }}
                      className="ml-auto inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <UserPlus size={16} />
                      Add Students
                    </button>
                  )}
                </div>
              </div>

              {}
              {eventToView.attendees && eventToView.attendees.length > 0 ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-gray-600">
                      Showing {getFilteredAttendees(eventToView.attendees).length} of {eventToView.attendees.length} attendees
                    </p>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {getFilteredAttendees(eventToView.attendees).map((attendee, index) => {
                      const canRemove = canRemoveAttendee(eventToView, attendee);
                      
                      return (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{attendee.studentName}</p>
                              <p className="text-sm text-gray-600 mt-1">
                                <span className="font-medium">ID:</span> {attendee.studentId} • 
                                <span className="font-medium ml-2">Email:</span> {attendee.email}
                              </p>
                              {attendee.section && (
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Section:</span> {attendee.section}
                                </p>
                              )}
                              <div className="flex gap-2 mt-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {attendee.gradeLevel}
                                </span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  {attendee.educationLevel}
                                </span>
                              </div>
                            </div>
                            {canRemove ? (
                              <button
                                onClick={() => handleRemoveAttendee(eventToView.id, attendee)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove attendee"
                              >
                                <UserMinus size={18} />
                              </button>
                            ) : (
                              <div className="p-2 text-gray-400" title="Cannot remove">
                                <Lock size={18} />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No attendees found for this event.</p>
                  {canManageAttendees(eventToView) && (
                    <div className="flex gap-3 justify-center mt-4">
                      <button
                        onClick={() => {
                          setEventForManualAdd(eventToView);
                          setIsAttendeesModalOpen(false);
                          setIsManualAddModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <UserPlus size={16} />
                        Add Students Manually
                      </button>
                      <button
                        onClick={() => {
                          setEventToImport(eventToView);
                          setIsAttendeesModalOpen(false);
                          setIsImportModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Upload size={16} />
                        Import CSV
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </Sidebar>
  );
}

export default SchoolEvents;