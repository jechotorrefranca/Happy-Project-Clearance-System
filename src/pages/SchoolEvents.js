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
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import Sidebar from "../components/Sidebar";
import Modal from "../components/Modal";
import moment from "moment";
import { useCSVReader } from "react-papaparse";
import Select from "react-select";
import { Link } from "react-router-dom";
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
} from "lucide-react";

const educationLevels = [
  { value: "elementary", label: "Elementary" },
  { value: "junior", label: "Junior High School" },
  { value: "senior", label: "High School" },
  { value: "college", label: "College" },
];

const gradeLevels = [
  { value: "1", label: "1st Grade" },
  { value: "2", label: "2nd Grade" },
  { value: "3", label: "3rd Grade" },
  { value: "4", label: "4th Grade" },
  { value: "5", label: "5th Grade" },
  { value: "6", label: "6th Grade" },
  { value: "7", label: "7th Grade" },
  { value: "8", label: "8th Grade" },
  { value: "9", label: "9th Grade" },
  { value: "10", label: "10th Grade" },
  { value: "11", label: "11th Grade" },
  { value: "12", label: "12th Grade" },
  { value: "freshman", label: "Freshman" },
  { value: "sophomore", label: "Sophomore" },
  { value: "junior", label: "Junior" },
  { value: "senior", label: "Senior" },
];

function SchoolEvents() {
  const [events, setEvents] = useState([]);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAttendeesModalOpen, setIsAttendeesModalOpen] = useState(false);
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
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("asc");
  const [attendeeFilter, setAttendeeFilter] = useState("");

  const { CSVReader } = useCSVReader();

  useEffect(() => {
    fetchEvents();
  }, [sortBy, sortOrder]);

  const fetchEvents = async () => {
    try {
      const eventsRef = collection(db, "events");
      const q = query(eventsRef, orderBy(sortBy, sortOrder));
      const querySnapshot = await getDocs(q);
      const eventsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEvents(eventsData);
    } catch (error) {
      console.error("Error fetching events: ", error);
    }
  };

  const handleAddEvent = async () => {
    try {
      const docRef = await addDoc(collection(db, "events"), {
        ...newEvent,
        timestamp: serverTimestamp(),
      });

      setNewEvent({
        ...newEvent,
        id: docRef.id,
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

      await updateDoc(doc(db, "events", eventToEdit.id), {
        ...eventToEdit,
      });

      setIsEditModalOpen(false);
      setEventToEdit(null);
      alert("Event updated successfully!");
      fetchEvents();
    } catch (error) {
      console.error("Error updating event: ", error);
      alert("Error updating event. Please try again later.");
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await deleteDoc(doc(db, "events", eventId));
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
      const attendees = results.data.slice(1).map((row) => ({
        email: row[0],
        studentId: row[1],
        studentUid: row[2],
        studentName: row[3],
        gradeLevel: row[4],
        educationLevel: row[5],
      }));

      if (eventToImport) {
        await updateDoc(doc(db, "events", eventToImport.id), {
          attendees: arrayUnion(...attendees),
        });

        setEventToImport(null);
        setIsImportModalOpen(false);
        alert("Attendees imported successfully!");
        fetchEvents();
      } else {
        console.error("Error: No event selected for import.");
        alert("Error importing attendees: No event selected.");
      }
    } catch (error) {
      console.error("Error importing attendees:", error);
      alert("Error importing attendees. Please try again later.");
    }
  };

  const filteredEvents = events.filter((event) =>
    event.title.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <Sidebar>
      <div className="container mx-auto p-4">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">School Events</h2>

        <div className="flex justify-between mb-6">
          <button
            onClick={() => setIsAddEventModalOpen(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300 ease-in-out flex items-center"
          >
            <Plus className="mr-2" size={18} />
            Add Event
          </button>
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Filter events..."
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <select
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date">Sort by Date</option>
              <option value="title">Sort by Title</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition duration-300 ease-in-out"
            >
              {sortOrder === "asc" ? "↑" : "↓"}
            </button>
          </div>
        </div>

        <div className="bg-white overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left">Title</th>
                <th className="py-3 px-4 text-left">Date</th>
                <th className="py-3 px-4 text-left">Time</th>
                <th className="py-3 px-4 text-left">Location</th>
                <th className="py-3 px-4 text-left">Education Levels</th>
                <th className="py-3 px-4 text-left">Grade Levels</th>
                <th className="py-3 px-4 text-left">Attendees</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => (
                <tr key={event.id} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-4">{event.title}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <Calendar className="mr-2" size={16} />
                      {moment(new Date(event.date)).format("LL")}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <Clock className="mr-2" size={16} />
                      {event.startTime} - {event.endTime}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <MapPin className="mr-2" size={16} />
                      {event.location}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {event.educationLevels?.join(", ") || "N/A"}
                  </td>
                  <td className="py-4 px-4">
                    {event.gradeLevels?.join(", ") || "N/A"}
                  </td>
                  <td className="py-4 px-4">
                    {event.attendees ? event.attendees.length : 0}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEventToEdit({ ...event });
                          setIsEditModalOpen(true);
                        }}
                        className="p-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition duration-300 ease-in-out"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition duration-300 ease-in-out"
                        title="Delete"
                      >
                        <Trash size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setEventToImport(event);
                          setIsImportModalOpen(true);
                        }}
                        className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition duration-300 ease-in-out"
                        title="Import Attendees"
                      >
                        <Upload size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setEventToView(event);
                          setIsAttendeesModalOpen(true);
                        }}
                        className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition duration-300 ease-in-out"
                        title="View Attendees"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Modal
          isOpen={isAddEventModalOpen}
          onClose={() => setIsAddEventModalOpen(false)}
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-semibold">Add New Event</h3>
              <button
                onClick={() => setIsAddEventModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <form className="space-y-4">
              <div>
                <label
                  htmlFor="title"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Title:
                </label>
                <input
                  type="text"
                  id="title"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newEvent.title}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="date"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    Date:
                  </label>
                  <input
                    type="date"
                    id="date"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newEvent.date}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, date: e.target.value })
                    }
                    required
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
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newEvent.location}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, location: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="startTime"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    Start Time:
                  </label>
                  <input
                    type="time"
                    id="startTime"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newEvent.startTime}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, startTime: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="endTime"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    End Time:
                  </label>
                  <input
                    type="time"
                    id="endTime"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newEvent.endTime}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, endTime: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-gray-700 text-sm font-bold mb-2"
                >
                  Description:
                </label>
                <textarea
                  id="description"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newEvent.description}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, description: e.target.value })
                  }
                  rows="4"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Education Levels:
                </label>
                <Select
                  isMulti
                  options={educationLevels}
                  value={newEvent.educationLevels.map((level) => ({
                    value: level,
                    label: level,
                  }))}
                  onChange={(selected) =>
                    setNewEvent({
                      ...newEvent,
                      educationLevels: selected.map((option) => option.value),
                    })
                  }
                  className="basic-multi-select"
                  classNamePrefix="select"
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Grade Levels:
                </label>
                <Select
                  isMulti
                  options={gradeLevels}
                  value={newEvent.gradeLevels.map((level) => ({
                    value: level,
                    label: level,
                  }))}
                  onChange={(selected) =>
                    setNewEvent({
                      ...newEvent,
                      gradeLevels: selected.map((option) => option.value),
                    })
                  }
                  className="basic-multi-select"
                  classNamePrefix="select"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddEventModalOpen(false)}
                  className="mr-2 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition duration-300 ease-in-out"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddEvent}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300 ease-in-out"
                >
                  Add Event
                </button>
              </div>
            </form>
          </div>
        </Modal>

        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-semibold">Edit Event</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            {eventToEdit && (
              <form className="space-y-4">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    Title:
                  </label>
                  <input
                    type="text"
                    id="title"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={eventToEdit.title}
                    onChange={(e) =>
                      setEventToEdit({ ...eventToEdit, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="date"
                      className="block text-gray-700 text-sm font-bold mb-2"
                    >
                      Date:
                    </label>
                    <input
                      type="date"
                      id="date"
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={eventToEdit.date}
                      onChange={(e) =>
                        setEventToEdit({ ...eventToEdit, date: e.target.value })
                      }
                      required
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
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={eventToEdit.location}
                      onChange={(e) =>
                        setEventToEdit({
                          ...eventToEdit,
                          location: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="startTime"
                      className="block text-gray-700 text-sm font-bold mb-2"
                    >
                      Start Time:
                    </label>
                    <input
                      type="time"
                      id="startTime"
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={eventToEdit.startTime}
                      onChange={(e) =>
                        setEventToEdit({
                          ...eventToEdit,
                          startTime: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="endTime"
                      className="block text-gray-700 text-sm font-bold mb-2"
                    >
                      End Time:
                    </label>
                    <input
                      type="time"
                      id="endTime"
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={eventToEdit.endTime}
                      onChange={(e) =>
                        setEventToEdit({
                          ...eventToEdit,
                          endTime: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-gray-700 text-sm font-bold mb-2"
                  >
                    Description:
                  </label>
                  <textarea
                    id="description"
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={eventToEdit.description}
                    onChange={(e) =>
                      setEventToEdit({
                        ...eventToEdit,
                        description: e.target.value,
                      })
                    }
                    rows="4"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Education Levels:
                  </label>
                  <Select
                    isMulti
                    options={educationLevels}
                    value={eventToEdit.educationLevels.map((level) => ({
                      value: level,
                      label: level,
                    }))}
                    onChange={(selected) =>
                      setEventToEdit({
                        ...eventToEdit,
                        educationLevels: selected.map((option) => option.value),
                      })
                    }
                    className="basic-multi-select"
                    classNamePrefix="select"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Grade Levels:
                  </label>
                  <Select
                    isMulti
                    options={gradeLevels}
                    value={eventToEdit.gradeLevels.map((level) => ({
                      value: level,
                      label: level,
                    }))}
                    onChange={(selected) =>
                      setEventToEdit({
                        ...eventToEdit,
                        gradeLevels: selected.map((option) => option.value),
                      })
                    }
                    className="basic-multi-select"
                    classNamePrefix="select"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="mr-2 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition duration-300 ease-in-out"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleEditEvent}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300 ease-in-out"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>
        </Modal>

        <Modal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-semibold">Import Attendees</h3>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            {eventToImport && (
              <p className="mb-4">
                Importing attendees for event:{" "}
                <strong>{eventToImport.title}</strong>
              </p>
            )}
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
                    className="border-2 border-dashed border-gray-300 p-8 text-center cursor-pointer rounded-lg hover:border-blue-500 transition duration-300 ease-in-out"
                  >
                    {acceptedFile ? (
                      <div className="text-green-600 font-semibold">
                        {acceptedFile.name}
                      </div>
                    ) : (
                      <p className="text-gray-500">
                        Drop CSV file here or click to upload.
                      </p>
                    )}
                    <ProgressBar />
                  </div>
                  {acceptedFile && (
                    <div className="mt-4 flex justify-center">
                      <button
                        {...getRemoveFileProps()}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-300 ease-in-out"
                      >
                        Remove File
                      </button>
                    </div>
                  )}
                </>
              )}
            </CSVReader>
          </div>
        </Modal>

        <Modal
          isOpen={isAttendeesModalOpen}
          onClose={() => setIsAttendeesModalOpen(false)}
        >
          <div className="p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-semibold">Attendees</h3>
              <button
                onClick={() => setIsAttendeesModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            {eventToView ? (
              <div>
                <h4 className="text-lg font-semibold mb-2">
                  {eventToView.title}
                </h4>

                <div className="mb-4"> 
                  <input
                    type="text"
                    placeholder="Search attendees..."
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                    value={attendeeFilter}
                    onChange={(e) => setAttendeeFilter(e.target.value)}
                  />
                </div>

                {eventToView.attendees && eventToView.attendees.length > 0 ? (
                  <ul className="space-y-2">
                    {eventToView.attendees
                      .filter((attendee) =>
                        attendee.studentName.toLowerCase().includes(attendeeFilter.toLowerCase())
                      ) 
                      .map((attendee, index) => (
                        <li key={index} className="bg-gray-100 p-3 rounded-lg">
                        <p className="font-semibold">{attendee.studentName}</p>
                        <p className="text-sm text-gray-600">
                          ID: {attendee.studentId} | UID: {attendee.studentUid}
                        </p>
                        <p className="text-sm text-gray-600">
                          Email: {attendee.email}
                        </p>
                        <p className="text-sm text-gray-600">
                          Grade: {attendee.gradeLevel} | Level:{" "}
                          {attendee.educationLevel}
                        </p>
                        </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">
                    No attendees found for this event.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Loading attendees...</p>
            )}
          </div>
        </Modal>
      </div>
    </Sidebar>
  );
}

export default SchoolEvents;
