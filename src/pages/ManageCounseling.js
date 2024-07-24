import React, { useCallback, useState, useEffect } from 'react';
import { collection, query, where, getDocs, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, setDoc, } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from "../components/AuthContext";
import Sidebar from '../components/Sidebar';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarStyles.css';
import Modal from '../components/Modal';
import { motion } from 'framer-motion';
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThumbsUpIcon, CalendarClock, Pencil } from 'lucide-react';


const localizer = momentLocalizer(moment);

const eventStyleGetter = (event) => {
    let backgroundColor;

    switch (event.status) {
        case 'pending':
            backgroundColor = '#98CAFF';
            break;
        case 'approved':
            backgroundColor = '#98FF9D';
            break;
        case 'finished':
            backgroundColor = '#C88CFF';
            break;
        case 'rescheduled':
            backgroundColor = '#FFFB98';
            break;
        case 'did not respond':
            backgroundColor = '#FF9898';
            break;
        default:
            backgroundColor = 'gray';
    }

    const style = {
        backgroundColor,
        borderRadius: '0px',
        opacity: 0.8,
        color: 'black',
        display: 'flex',
        fontWeight: 'bold',
        fontSize: '13px',
    };
    return {
        style,
    };
};

const ManageCounseling = () => {
    const { currentUser } = useAuth();
    const [view, setView] = useState(Views.MONTH);
    const [date, setDate] = useState(new Date());
    const [counselorSched, setCounselorSched] = useState([]);
    const [counselorDisabledDate, setCounselorDisabledDate] = useState([]);
    const [filteredStudentSched, setFilteredStudentSched] = useState([]);
    const [filterTodaySched, settFilterTodaySched] = useState([]);
    const [submitModal, setSubmitModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [disabledButton, setDisabledButton] = useState(false);
    const [unDate, setUnDate] = useState(new Date());
    const [statusModal, setStatusModal] = useState(false);
    const [confirmationModal, setConfirmationModal] = useState(false);
    const [editModal, setEditModal] = useState(false);
    const [initialDates, setInitialDates] = useState([]);
    const [status, setStatus] = useState(null);
    const [confirmationData, setConfirmationData] = useState(null);
    const [message, setMessage] = useState('');
    const [newMessage, setNewMessage] = useState(confirmationData?.reason || '');

    useEffect(() => {
        if (confirmationData?.message) {
            setNewMessage(confirmationData.message);
        }

    }, [confirmationData?.reason]);

    // student sched fetch and update status if past time
    useEffect(() => {
        if (!currentUser) {
            return;
        }
    
        const usersCollection = collection(db, 'guidanceAppointments');
        const q = query(usersCollection, where('counselorId', '==', currentUser.uid));
    
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const now = Date.now();
    
            querySnapshot.docs.forEach(doc => {
                const data = doc.data();
                const end = data.end.seconds * 1000;
    
                if (end < now) {
                    if (data.status === "pending") {
                        updateDoc(doc.ref, { status: "did not respond" })
                            .then(() => console.log("did not respond"))
                            .catch(error => console.error("Error updating status:", error));
                    } else if (data.status === "approved") {
                        updateDoc(doc.ref, { status: "finished" })
                            .then(() => console.log("finished"))
                            .catch(error => console.error("Error updating status:", error));
                    }
                }
            });
    
            const counselorSched = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
    
            setCounselorSched(counselorSched);
    
        }, (error) => {
            console.error("Error fetching student schedule: ", error);
        });
    
        return () => unsubscribe();
    }, [currentUser]);
    
    // unavailableCounselor dates
    useEffect(() => {
        if (!currentUser) {
          return;
        }
      
        const usersCollection = collection(db, 'users');
        const q = query(usersCollection, where('uid', '==', currentUser.uid));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          if (!querySnapshot.empty) {

            const doc = querySnapshot.docs[0];
            const data = doc.data();

            const unavailableDates = data.unavailableDates || [];
            setCounselorDisabledDate(unavailableDates);

          } else {
            console.log('No matching documents found.');
            setCounselorDisabledDate([]);
          }
        }, (error) => {
          console.error("Error fetching schedule: ", error);
        });
      
        return () => unsubscribe();
    }, [currentUser]);

    //handle appointment
    const handleAppointment = async (docId, studentId, gStatus, subject) => {
        setDisabledButton(true);
        try {
          const guidanceStatus =
            gStatus === 'gApproved'
              ? 'approved'
              : gStatus === 'gRescheduled'
              ? 'rescheduled'
              : null;
      
          if (status) {

              const notificationsRef = collection(db, "studentNotification");
              const docRef = await addDoc(notificationsRef, {
                isRead: false,
                notifTimestamp: serverTimestamp(),
                status: gStatus,
                studentId: studentId,
                subject: subject,
                reason: message,
            });
            
            const notificationId = docRef.id;
            
            await updateDoc(doc(db, "guidanceAppointments", docId), {
              status: guidanceStatus,
              message: message,
              notificationId: notificationId,
            });
              
            showSuccessToast("Appointement status sent successfully!");
          } else {
            showWarnToast("Invalid Status");
          }

          setMessage('');
          setConfirmationModal(false);
          setStatus(null);
          setConfirmationData(null);
          setStatusModal(false);
        } catch (error) {
          console.error("Error sending appointment:", error);
          showFailedToast("Error sending appointment status");
        } finally {
            setDisabledButton(false);
        }
    };

    //handle edit appointment
    const handleEditAppointment = async ( notifId, aptId, newStatus ) => {
        setDisabledButton(true);
        try {
          const guidanceStatus =
            newStatus === 'gApproved'
              ? 'approved'
              : newStatus === 'gRescheduled'
              ? 'rescheduled'
              : null;
      
          if (guidanceStatus) {
            
            await updateDoc(doc(db, "guidanceAppointments", aptId), {
                status: guidanceStatus,
                message: newMessage
            });

            await updateDoc(doc(db, "studentNotification", notifId), {
                status: newStatus,
                reason: newMessage,
                isRead: false,
            });
              
            showSuccessToast("Appointment status edited successfully");
          } else {
            showWarnToast("Invalid status");
          }

          setNewMessage('');
          setEditModal(false);
          setStatus(null);
          setConfirmationData(null);
          setStatusModal(false);
        } catch (error) {
          console.error("Error editing appointment:", error);
          showFailedToast("Error editing appointment status");
        } finally {
            setDisabledButton(false);
        }
    };
      
    // Filters
    useEffect(() => {
        let sched = [...counselorSched];
    
        if (filterStatus !== 'all') {
            sched = sched.filter(sched => sched.status === filterStatus);
        }
    
        sched.sort((a, b) => {
            const dateA = a.start.seconds * 1000;
            const dateB = b.start.seconds * 1000;
            return dateA - dateB;
        });
    
        const today = new Date();
        const startOfToday = new Date(today.setHours(0, 0, 0, 0));
        const endOfToday = new Date(today.setHours(23, 59, 59, 999));
    
        const todaySched = counselorSched.filter(sched => {
            const schedDate = new Date(sched.start.seconds * 1000);
            return schedDate >= startOfToday && schedDate <= endOfToday;
        });

        todaySched.sort((a, b) => {
            const dateA = a.start.seconds * 1000;
            const dateB = b.start.seconds * 1000;
            return dateA - dateB;
        });
    
        setFilteredStudentSched(sched);
        settFilterTodaySched(todaySched);
    
    }, [filterStatus, counselorSched]);
    
    const disabledDates = [
        ...counselorDisabledDate.map(date => new Date(date)),
    ];

    const isWeekend = (date) => {
        const day = date.getDay();
        return day === 0 || day === 6;
    };

    const isDisabledDate = (date) => {
        return disabledDates.some(disabledDate => disabledDate.toDateString() === date.toDateString());
    };

    const isOutsideAllowedTime = (start, end) => {
        const startHour = start.getHours();
        const endHour = end ? end.getHours() : startHour;
        const endMinutes = end ? end.getMinutes() : 0;

        return (
            startHour < 8 || 
            startHour > 16 || 
            (startHour === 16 && endMinutes > 30)
        );
    };

    const dayPropGetter = (date) => {
        if (isDisabledDate(date)) {
            return {
                style: {
                    backgroundColor: '#FF9899',
                    pointerEvents: 'none',
                    opacity: 0.5,
                }
            };
        }
        if (isWeekend(date)) {
            return {
                style: {
                    backgroundColor: 'lightgray',
                    pointerEvents: 'none',
                    opacity: 0.5,
                }
            };
        }
        return {};
    };

    const slotPropGetter = (date) => {
        if (isOutsideAllowedTime(date, new Date(date.getTime() + 60 * 60 * 1000))) {
            return {
                style: {
                    backgroundColor: 'lightgray',
                    color: 'black',
                    opacity: 0.7,
                    pointerEvents: 'none',
                },
                title: 'Cannot Schedule Counseling outside office hours',
            };
        }
        return {};
    };

    const handleSelectSlot = useCallback((slotInfo) => {
    
        if (isWeekend(slotInfo.start)) {
            showWarnToast("Weekends not available");
            return;
        }

        if (isDisabledDate(slotInfo.start)) {
            showWarnToast("Counselor not available");
            return;
        }
    
        if ((view === Views.DAY) && isOutsideAllowedTime(slotInfo.start, slotInfo.end || new Date(slotInfo.start.getTime() + 60 * 60 * 1000))) {
            showWarnToast("The selected slot is outside of permissible hours");
            return;
        }
    
        if (view === Views.MONTH) {
            setView(Views.DAY);
        }
    
        setDate(slotInfo.start);

    }, [view, disabledDates]);
    
    const handleSelectEvent = useCallback((event) => {
        const selectedEvent = event;
    
        setDate(selectedEvent.start);
    
        if (view === Views.DAY) {
            setConfirmationData(selectedEvent);
            handleSetStatusModal(selectedEvent);
        } else {
            setView(Views.DAY);
        }


    }, [view]);
    
    
    
    // events
    const events = [
        ...counselorSched.map(appointment => ({
            title: view === Views.MONTH ? `${appointment.fullName}` : `- ${appointment.fullName} - ${appointment.gradeLevel} ${appointment.section}`, 
            start: appointment.start.toDate(),
            end: appointment.end.toDate(),
            status: appointment.status,
            counselorId: appointment.counselorId,
            counselorName: appointment.counselorName,
            department: appointment.department,
            fullName: appointment.fullName,
            gradeLevel: appointment.gradeLevel,
            reason: appointment.reason,
            section: appointment.section,
            studentEmail: appointment.studentEmail,
            studentId: appointment.studentId,
            message: appointment.message,
            notificationId: appointment.notificationId,
            id: appointment.id
        })),
    ].filter(event => event);
    
    //edit to real uid
      const updateUnavailableDates = async () => {
        setDisabledButton(true);
      
        try {
          const userRef = collection(db, 'users');
          const q = query(userRef, where('uid', '==', currentUser.uid));

          const querySnapshot = await getDocs(q);
      
          if (!querySnapshot.empty) {
            const docSnapshot = querySnapshot.docs[0];
            const docRef = doc(db, 'users', docSnapshot.id);
            await updateDoc(docRef, {
              unavailableDates: counselorDisabledDate,
            });
      
            showSuccessToast('Unavailable schedules saved successfully!');
            setSubmitModal(false);
          }
          
        } catch (error) {
          console.error('Error updating documents: ', error);
          showFailedToast("Error saving unavailable schedules");
        } finally {
            setDisabledButton(false);
        }
      };
    
    const handleSubmitModal = () => {
        setSubmitModal(prevState => !prevState);
        setInitialDates(counselorDisabledDate);
    }

    const handleCancelModal = () => {
        setSubmitModal(false);
        setCounselorDisabledDate(initialDates);
    }

    const handleSetStatusModal = (data) => {
        setStatusModal(prevState => !prevState);
        setConfirmationData(data);
    }

    const handleSetStatusModalCancel = () => {
        setStatusModal(prevState => !prevState);
        setConfirmationData(null);
    }

    const handleConfirmationModal = (sched, status) => {
        setConfirmationModal(prevState => !prevState);
        setConfirmationData(sched);
        setStatus(status);
    }

    const handleEditModal = (data) => {
        setEditModal(prevState => !prevState);
        setConfirmationData(data);
    }

    const handleEditModalCancel = () => {
        setEditModal(prevState => !prevState);
        setConfirmationData(null);
        setStatusModal(false);
    }

    const handleConfirmationModalCancel = () => {
        setConfirmationModal(prevState => !prevState);
        setConfirmationData(null);
    }

    const handleDateClick = (value) => {

        const dateStr = moment(value).startOf('day').format('YYYY-MM-DD');
        setCounselorDisabledDate((prev) => {
          const dateExists = prev.includes(dateStr);
          const updatedDates = dateExists
            ? prev.filter((d) => d !== dateStr)
            : [...prev, dateStr];
            
          return updatedDates;
        });
      };
      

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
  
      const showWarnToast = (msg) => toast.warn(msg, {
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
  
    return (
        <Sidebar>
            <ToastContainer/>
            <div className="container mx-auto bg-blue-100 rounded pb-10 min-h-[90vh]">
                <div className="bg-blue-300 p-5 rounded flex justify-center items-center mb-10">
                    <h2 className="text-3xl font-bold text-blue-950 text-center">Manage Counseling</h2>
                </div>

                <div className="p-5">
                    <div className="bg-white p-5 rounded-xl overflow-auto">
                        <div className='p-1 mb-4 flex items-stretch justify-around sm:text-base text-sm gap-2'>

                            <div className='w-full flex-1'>
                                <span className='font-semibold flex justify-center mb-2 text-blue-900'>
                                    Disabled Dates
                                </span>

                                <div className='h-[85%] flex flex-col gap-1 bg-blue-50 px-5 p-3 rounded justify-center'>
                                    <div className='flex gap-4 items-center'>
                                        <div className='bg-gray-400 rounded-full w-2 h-2'/>
                                        <span>Weekends</span>
                                    </div>

                                    <div className='flex gap-4 items-center'>
                                        <div className='bg-[#FF9899] rounded-full p-1'/>
                                        <span>Counselor not available</span>
                                    </div>

                                </div>
                            </div>

                            <div className='w-full flex-1'>
                                <span className='font-semibold flex justify-center mb-2 text-blue-900'>
                                    Schedule Status
                                </span>
                                <div className='h-[85%] flex flex-col gap-1 bg-blue-50 px-5 p-3 rounded'>
                                    <div className='flex gap-4 items-center'>
                                        <div className='bg-[#98CAFF] rounded-full w-2 h-2'/>
                                        <span>Pending</span>
                                    </div>

                                    <div className='flex gap-4 items-center'>
                                        <div className='bg-[#98FF9D] rounded-full p-1'/>
                                        <span>Approved</span>
                                    </div>

                                    <div className='flex gap-4 items-center'>
                                        <div className='bg-[#FFFB98] rounded-full w-2 h-2'/>
                                        <span>Rescheduled</span>
                                    </div>

                                    <div className='flex gap-4 items-center'>
                                        <div className='bg-[#C88CFF] rounded-full p-1'/>
                                        <span>Finished</span>
                                    </div>

                                    <div className='flex gap-4 items-center'>
                                        <div className='bg-[#FF9898] rounded-full p-1'/>
                                        <span>Did not respond</span>
                                    </div>
                                </div>

                            </div>

                        </div>

                        <div className='border-b-2 border-blue-300 my-4'/>

                        <div className="h-[500px] sm:h-[500px]">
                            <Calendar
                                localizer={localizer}
                                events={events}
                                startAccessor="start"
                                endAccessor="end"
                                eventPropGetter={eventStyleGetter}
                                dayPropGetter={dayPropGetter}
                                style={{ height: '100%' }}
                                views={['month', 'day']}
                                selectable
                                onSelectSlot={handleSelectSlot}
                                onSelectEvent={handleSelectEvent}
                                date={date}
                                view={view}
                                onNavigate={(newDate) => setDate(newDate)}
                                onView={(newView) => {
                                    setView(newView);
                                }}
                                slotPropGetter={slotPropGetter}
                            />
                        </div>

                        <div className='flex justify-center mt-4'>
                            <motion.button
                             whileHover={{scale: 1.03}}
                             whileTap={{scale: 0.95}}
                             className='w-full sm:w-[85%] p-5 bg-[#ffd1dc] text-[#584549] font-semibold rounded' onClick={handleSubmitModal}>
                                Set Unavailable Dates
                            </motion.button>
                        </div>

                        <div className='border-b-2 border-green-300 my-4'/>

                        <div className='mt-4 xl:flex gap-2 justify-between'>


                            <div className='bg-green-100 w-full rounded'>
                                <div>
                                    <p className='text-xl font-semibold flex justify-center text-center bg-green-200 p-3 rounded'>Your Schedules</p>
                                </div>

                                <div className="w-full p-5 rounded my-4">
                                    <label htmlFor="filterCounselor" className="block text-gray-700 mb-1">
                                        Filter by Status:
                                    </label>

                                    <select
                                    id="filterStatus"
                                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-green-300"
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    >
                                        <option value="all">All</option>
                                        <option value="approved">Approved</option>
                                        <option value="pending">Pending</option>
                                        <option value="rescheduled">Rescheduled</option>
                                        <option value="finished">Finished</option>
                                        <option value="did not respond">Did not respond</option>

                                    </select>

                                    <div className='mt-4 overflow-auto max-h-[40vh]'>
                                        {filteredStudentSched.map(sched => {
                                            let bgColor;
                                            switch (sched.status) {
                                                case "pending":
                                                bgColor = "#C8E3FF";
                                                break;
                                                case "approved":
                                                bgColor = "#C1FFC4";
                                                break;
                                                case "rescheduled":
                                                bgColor = "#FFFCBF";
                                                break;
                                                case "finished":
                                                bgColor = "#DDBAFE";
                                                break;
                                                case "did not respond":
                                                bgColor = "#FFBFBF";
                                                break;
                                                default:
                                                bgColor = "#C0C0C0";
                                            }

                                            return (
                                                    <div className='my-3 p-4 rounded-md shadow-md text-xs sm:text-base flex justify-between' key={sched.id} style={{ backgroundColor: bgColor }}>
                                                        <div>
                                                            <p className='sm:text-lg text-sm font-bold '>
                                                                Student: {sched.fullName} - {sched.gradeLevel} {sched.section}
                                                            </p>
                                                            <p>Status: {sched.status}</p>
                                                            <p>Date: {new Date(sched.start.seconds * 1000).toDateString("en-US")}</p>
                                                            <p>Time: {sched.start && sched.end ? 
                                                                `${new Date(sched.start.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(sched.end.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
                                                                : 'N/A'}
                                                            </p>

                                                        </div>

                                                        {sched.status === 'pending' ? (
                                                            <div className='flex flex-col gap-2 justify-center'>
                                                                <motion.button 
                                                                whileHover={{ scale: 1.03 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                className='p-3 bg-green-500 hover:bg-green-600 rounded-full flex justify-center items-center h-fit w-fit hover:cursor-pointer' onClick={() => handleConfirmationModal(sched, 'gApproved')}>
                                                                    <ThumbsUpIcon className='sm:w-4 sm:h-4 w-3 h-3 text-white'/>
                                                                </motion.button>

                                                                <motion.button 
                                                                whileHover={{ scale: 1.03 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                className='p-3 bg-red-500 hover:bg-red-700 rounded-full flex justify-center items-center h-fit w-fit hover:cursor-pointer' onClick={() => handleConfirmationModal(sched, 'gRescheduled')}>
                                                                    <CalendarClock className='sm:w-4 sm:h-4 w-3 h-3 text-white'/>
                                                                </motion.button>
                                                            </div>
                                                        ) : (sched.status === 'approved' || sched.status === 'rescheduled') ? (
                                                            <div className='flex flex-col gap-2 justify-center'>
                                                                <motion.button 
                                                                whileHover={{ scale: 1.03 }}
                                                                whileTap={{ scale: 0.95 }}    
                                                                className='p-3 bg-white hover:bg-gray-300 rounded-full flex justify-center items-center h-fit w-fit hover:cursor-pointer' onClick={() => handleEditModal(sched)}>
                                                                    <Pencil className='sm:w-4 sm:h-4 w-3 h-3 text-black'/>
                                                                </motion.button>
                                                            </div>
                                                        ) : null}




                                                    </div>
                                            );
                                            })}

                                    </div>
                                </div>
                            </div>

                            <div className='bg-green-100 w-full rounded'>
                                <div>
                                    <p className='text-xl font-semibold flex justify-center text-center bg-green-200 p-3 rounded'>Schedules Today</p>
                                </div>

                                <div className="w-full p-5 rounded mb-4">

                                    <div className='mt-4 overflow-auto max-h-[46.6vh]'>
                                        {filterTodaySched.map(sched => {
                                            let bgColor;
                                            switch (sched.status) {
                                                case "pending":
                                                bgColor = "#C8E3FF";
                                                break;
                                                case "approved":
                                                bgColor = "#C1FFC4";
                                                break;
                                                case "rescheduled":
                                                bgColor = "#FFFCBF";
                                                break;
                                                case "finished":
                                                bgColor = "#DDBAFE";
                                                break;
                                                case "did not respond":
                                                bgColor = "#FFBFBF";
                                                break;
                                                default:
                                                bgColor = "#C0C0C0";
                                            }

                                            return (
                                                    <div className='my-3 p-4 rounded-md shadow-md text-xs sm:text-base flex justify-between' key={sched.id} style={{ backgroundColor: bgColor }}>
                                                        <div>
                                                            <p className='sm:text-lg text-sm font-bold '>
                                                                Student: {sched.fullName} - {sched.gradeLevel} {sched.section}
                                                            </p>
                                                            <p>Status: {sched.status}</p>
                                                            <p>Date: {new Date(sched.start.seconds * 1000).toDateString("en-US")}</p>
                                                            <p>Time: {sched.start && sched.end ? 
                                                                `${new Date(sched.start.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(sched.end.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
                                                                : 'N/A'}
                                                            </p>

                                                        </div>

                                                        {sched.status === 'pending' ? (
                                                            <div className='flex flex-col gap-2 justify-center'>
                                                                <motion.button 
                                                                whileHover={{ scale: 1.03 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                className='p-3 bg-green-500 hover:bg-green-600 rounded-full flex justify-center items-center h-fit w-fit hover:cursor-pointer' onClick={() => handleConfirmationModal(sched, 'gApproved')}>
                                                                    <ThumbsUpIcon className='sm:w-4 sm:h-4 w-3 h-3 text-white'/>
                                                                </motion.button>

                                                                <motion.button 
                                                                whileHover={{ scale: 1.03 }}
                                                                whileTap={{ scale: 0.95 }}
                                                                className='p-3 bg-red-500 hover:bg-red-700 rounded-full flex justify-center items-center h-fit w-fit hover:cursor-pointer' onClick={() => handleConfirmationModal(sched, 'gRescheduled')}>
                                                                    <CalendarClock className='sm:w-4 sm:h-4 w-3 h-3 text-white'/>
                                                                </motion.button>
                                                            </div>
                                                        ) : (sched.status === 'approved' || sched.status === 'rescheduled') ? (
                                                            <div className='flex flex-col gap-2 justify-center'>
                                                                <motion.button 
                                                                whileHover={{ scale: 1.03 }}
                                                                whileTap={{ scale: 0.95 }}    
                                                                className='p-3 bg-white hover:bg-gray-300 rounded-full flex justify-center items-center h-fit w-fit hover:cursor-pointer' onClick={() => handleEditModal(sched)}>
                                                                    <Pencil className='sm:w-4 sm:h-4 w-3 h-3 text-black'/>
                                                                </motion.button>
                                                            </div>
                                                        ) : null}


                                                    </div>
                                            );
                                            })}

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal isOpen={submitModal} onClose={handleCancelModal}>
                <div className='p-6'>
                    <h3 className="text-lg font-bold mb-4 text-center">
                        Select Unavailable Schedule
                    </h3>
                    <div className="p-4 max-w-md mx-auto flex justify-center">
                        <ReactCalendar
                            onChange={setUnDate}
                            value={unDate}
                            tileClassName={({ date }) =>
                            counselorDisabledDate.includes(moment(date).startOf('day').format('YYYY-MM-DD'))
                                ? 'unavailable'
                                : null
                            }
                            onClickDay={handleDateClick}
                            tileDisabled={({ date }) => isWeekend(date)}
                            className=""
                        />
                        <style>
                            {`
                            .unavailable {
                                background: red !important;
                                color: white;
                            }
                            `}
                        </style>
                    </div>

                    <div className="mt-6 flex justify-around">
                        <motion.button
                        whileHover={{scale: 1.03}}
                        whileTap={{scale: 0.95}}
                        
                        onClick={handleCancelModal}
                        className="mr-2 px-4 py-2 bg-gray-400 text-white font-semibold rounded hover:bg-gray-500 w-full"
                        >
                        Cancel
                        </motion.button>

                        <motion.button
                        whileHover={{scale: 1.03}}
                        whileTap={{scale: 0.95}}
                        onClick={updateUnavailableDates}
                        className={`px-4 py-2 rounded  text-[#584549] font-semibold w-full bg-[#ffd1dc] ${
                            disabledButton
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-[#ffd1dc]"
                          }`}
                        disabled={disabledButton}
                        >
                        Submit
                        </motion.button>
                    </div>

                </div>
            </Modal>

            <Modal isOpen={statusModal} onClose={handleSetStatusModalCancel}>
                <div
                    className='my-3 p-4 rounded-md shadow-md text-xs sm:text-base flex justify-between'
                    style={{
                    backgroundColor:
                        confirmationData?.status === 'pending'
                        ? '#C8E3FF'
                        : confirmationData?.status === 'approved'
                        ? '#C1FFC4'
                        : confirmationData?.status === 'rescheduled'
                        ? '#FFFCBF'
                        : confirmationData?.status === 'finished'
                        ? '#DDBAFE'
                        : confirmationData?.status === 'did not respond'
                        ? '#FFBFBF'
                        : '#C0C0C0',
                    }}
                >
                    <div>
                    <p className='sm:text-lg text-sm font-bold'>
                        Student: {confirmationData?.fullName || 'N/A'} - {confirmationData?.gradeLevel}{' '}
                        {confirmationData?.section}
                    </p>
                    <p>Status: {confirmationData?.status}</p>
                    {statusModal && (
                        <>
                        <p>Date: {confirmationData?.start?.toLocaleDateString()}</p>
                        <p>
                            Time: {confirmationData?.start?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                            {confirmationData?.end?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        </>
                    )}
                    </div>

                    {confirmationData?.status === 'pending' ? (
                    <div className='flex flex-col gap-2 justify-center'>
                        <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.95 }}
                        className='p-3 bg-green-500 hover:bg-green-600 rounded-full flex justify-center items-center h-fit w-fit hover:cursor-pointer'
                        onClick={() => handleAppointment(confirmationData?.id, confirmationData?.studentId, 'gApproved', 'Guidance Counseling')}
                        >
                        <ThumbsUpIcon className='sm:w-4 sm:h-4 w-3 h-3 text-white' />
                        </motion.button>

                        <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.95 }}
                        className='p-3 bg-red-500 hover:bg-red-700 rounded-full flex justify-center items-center h-fit w-fit hover:cursor-pointer'
                        onClick={() => handleAppointment(confirmationData?.id, confirmationData?.studentId, 'gRescheduled', 'Guidance Counseling')}
                        >
                        <CalendarClock className='sm:w-4 sm:h-4 w-3 h-3 text-white' />
                        </motion.button>
                    </div>
                    ) : confirmationData?.status === 'approved' || confirmationData?.status === 'rescheduled' ? (
                    <div className='flex flex-col gap-2 justify-center'>
                        <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.95 }}
                        className='p-3 bg-white hover:bg-gray-300 rounded-full flex justify-center items-center h-fit w-fit hover:cursor-pointer'
                        onClick={() => handleEditModal(confirmationData)}
                        >
                        <Pencil className='sm:w-4 sm:h-4 w-3 h-3 text-black' />
                        </motion.button>
                    </div>
                    ) : null}
                </div>
                <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSetStatusModalCancel}
                    className='mr-2 px-4 py-2 bg-gray-400 text-white font-semibold rounded hover:bg-gray-500 w-full'
                >
                    Cancel
                </motion.button>
            </Modal>

            <Modal isOpen={confirmationModal} onClose={handleConfirmationModalCancel}>
                <div className="p-6">
                        {status === 'gApproved' ?(
                            <h3 className="text-lg font-bold mb-4 text-center">
                                Approve Counseling?
                            </h3>
                        ): (status === 'gRescheduled') ? (
                            <h3 className="text-lg font-bold mb-4 text-center">
                                Reschedule Counseling?
                            </h3>
                        ): null}
                       

                    <div className='border-2 border-blue-50 rounded p-5 bg-blue-200 sm:text-base text-sm'>
                        <p className='font-semibold pb-1'>
                            Schedule Information:
                        </p>

                        <div className='ml-4'>
                            {confirmationData?.department &&(
                                <p>
                                    Department: {confirmationData?.department}
                                </p>

                            )}
                            <p>Name: {confirmationData?.fullName || 'N/A'} - {confirmationData?.gradeLevel} {confirmationData?.section}</p>
                            <p>Date: {confirmationData?.start ? new Date(confirmationData.start.seconds * 1000).toDateString("en-US") : 'N/A'}</p>
                            <p>
                                Time: {" "}
                                {confirmationData?.start && confirmationData?.end ? 
                                `${new Date(confirmationData.start.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(confirmationData.end.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
                                : 'N/A'}
                            </p>
                            {confirmationData?.reason &&(
                                <p>Reason: {confirmationData?.reason}</p>
                            )}
                        </div>

                    </div>

                    <div className="mt-4">
                        <label
                        htmlFor="counselorMsg"
                        className="block text-gray-700 mb-1"
                        >
                        Message:
                        </label>
                        <textarea
                        id="counselorMsg"
                        value={message}
                        placeholder='(Optional)'
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                        required
                        />
                    </div>

                    <div className="mt-6 flex justify-around">
                        <motion.button
                        whileHover={{scale: 1.03}}
                        whileTap={{scale: 0.95}}
                        
                        onClick={handleConfirmationModalCancel}
                        className="mr-2 px-4 py-2 bg-gray-400 text-white font-semibold rounded hover:bg-gray-500 w-full"
                        >
                        Cancel
                        </motion.button>

                        <motion.button
                        whileHover={{scale: 1.03}}
                        whileTap={{scale: 0.95}}
                        onClick={() => handleAppointment( confirmationData?.id, confirmationData?.studentId, status, 'Guidance Counseling')}
                        className={`px-4 py-2 rounded  text-[#584549] font-semibold w-full bg-[#ffd1dc] ${
                            disabledButton
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-[#ffd1dc]"
                          }`}
                        disabled={disabledButton}
                        >
                        Submit
                        </motion.button>
                    </div>
                </div>

            </Modal>

            <Modal isOpen={editModal} onClose={handleEditModalCancel}>
                <div className="p-6">

                    <h3 className="text-lg font-bold mb-4 text-center">
                        Edit Status?
                    </h3>

                    <h3 className="text-lg font-bold mb-4 text-center">
                        Current Status: {" "}
                            {confirmationData?.status === 'approved' ? (
                                <span className='text-[#1c9222]'>{confirmationData?.status.toUpperCase()}</span>

                            ):(
                                <span className='text-[#9c9a1f]'>{confirmationData?.status.toUpperCase()}</span>
                            )}
                    </h3>

                       

                    <div className='border-2 border-blue-50 rounded p-5 bg-blue-200 sm:text-base text-sm'>
                        <p className='font-semibold pb-1'>
                            Schedule Information:
                        </p>

                        <div className='ml-4'>
                            {confirmationData?.department &&(
                                <p>
                                    Department: {confirmationData?.department}
                                </p>

                            )}
                            <p>Name: {confirmationData?.fullName || 'N/A'} - {confirmationData?.gradeLevel} {confirmationData?.section}</p>
                            <p>Date: {confirmationData?.start ? new Date(confirmationData.start.seconds * 1000).toDateString("en-US") : 'N/A'}</p>
                            {statusModal ? (
                                <>
                                <p>Date: {confirmationData?.start?.toLocaleDateString()}</p>
                                <p>
                                    Time: {confirmationData?.start?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                                    {confirmationData?.end?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                </>
                            ):(

                                <p>
                                    Time: 
                                    {confirmationData?.start && confirmationData?.end ? 
                                    `${new Date(confirmationData.start.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(confirmationData.end.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
                                    : 'N/A'}
                                </p>
                            )}
                            
                            {confirmationData?.reason &&(
                                <p>Reason: {confirmationData?.reason}</p>
                            )}
                        </div>

                    </div>

                    <div className="mt-4">
                        <label
                        htmlFor="counselorMsg"
                        className="block text-gray-700 mb-1"
                        >
                        Message:
                        </label>
                        <textarea
                        id="counselorMsg"
                        value={newMessage}
                        placeholder='(Optional)'
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                        required
                        />
                    </div>

                    <div className="mt-6 flex justify-around gap-2">
                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={confirmationData?.status === 'approved'}
                            className={`p-3 w-full rounded flex justify-center items-center h-fit ${
                            confirmationData?.status === 'approved'
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-green-500 hover:bg-green-600 cursor-pointer'
                            }`}
                            onClick={() => handleEditAppointment(confirmationData?.notificationId, confirmationData?.id, 'gApproved')}
                        >
                            <ThumbsUpIcon className='w-6 h-6 text-white' />
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.95 }}
                            disabled={confirmationData?.status === 'rescheduled'}
                            className={`p-3 w-full rounded flex justify-center items-center h-fit ${
                            confirmationData?.status === 'rescheduled'
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-red-500 hover:bg-red-700 cursor-pointer'
                            }`}
                            onClick={() => handleEditAppointment(confirmationData?.notificationId, confirmationData?.id, 'gRescheduled')}
                        >
                            <CalendarClock className='w-6 h-6 text-white' />
                        </motion.button>
                    </div>


                    <div className="mt-6 flex justify-around">
                        <motion.button
                        whileHover={{scale: 1.03}}
                        whileTap={{scale: 0.95}}
                        onClick={handleEditModalCancel}
                        className="mr-2 px-4 py-2 bg-gray-400 text-white font-semibold rounded hover:bg-gray-500 w-full"
                        >
                        Cancel
                        </motion.button>
                    </div>
                </div>

            </Modal>

        </Sidebar>
    );
};

export default ManageCounseling;
