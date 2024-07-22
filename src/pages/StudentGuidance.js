import React, { useCallback, useState, useEffect } from 'react';
import { collection, query, where, getDocs, onSnapshot, addDoc, serverTimestamp, updateDoc, } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useAuth } from "../components/AuthContext";
import SidebarStudent from '../components/SidebarStudent';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarStyles.css';
import Modal from '../components/Modal';
import { motion } from 'framer-motion';
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


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

const StudentGuidance = () => {
    const { currentUser } = useAuth();
    const [view, setView] = useState(Views.MONTH);
    const [date, setDate] = useState(new Date());
    const [temporaryEvent, setTemporaryEvent] = useState(null);
    const [counselors, setCounselors] = useState([]);
    const [counselorSched, setCounselorSched] = useState([]);
    const [counselorDisabledDate, setCounselorDisabledDate] = useState([]);
    const [studentSched, setStudentSched] = useState([]);
    const [filteredStudentSched, setFilteredStudentSched] = useState([]);
    const [selectedCounselor, setSelectedCounselor] = useState(null);
    const [startTime, setStartTime] = useState(null);
    const [endTime, setEndTime] = useState(null);
    const [studentData, setStudentData] = useState(null);
    const [submitModal, setSubmitModal] = useState(false);
    const [reason, setReason] = useState("");
    const [filterStatus, setFilterStatus] = useState('all');
    const [disabledButton, setDisabledButton] = useState(false);

    // Fetch Student Data
    useEffect(() => {
      if (!currentUser) return;
  
      const fetchStudentData = async () => {
        try {
          const studentsRef = collection(db, "students");
          const q = query(studentsRef, where("uid", "==", currentUser.uid));
  
          const unsubscribe = onSnapshot(q, (querySnapshot) => {
            querySnapshot.forEach((doc) => {
              setStudentData(doc.data());
            });
          });
  
          return () => {
            unsubscribe();
          };
        } catch (error) {
          console.error("Error fetching student data:", error);
        }
      };
  
      fetchStudentData();
    }, [currentUser, setStudentData]);

    useEffect(() => {
        const fetchCounselors = async () => {
            if (!studentData) return;
    
            try {
                const usersCollection = collection(db, 'users');
                let q = query(usersCollection, where('role', '==', 'Guidance Office'));
                
                if (studentData.educationLevel === 'elementary') {
                    q = query(q, where('educationLevel', '==', 'elementary'));
                } else if (studentData.educationLevel === 'junior high school' || studentData.educationLevel === 'senior high school') {
                    q = query(q, where('educationLevel', 'in', ['junior high school', 'senior high school']));
                } else if (studentData.educationLevel === 'college') {
                    q = query(q, where('educationLevel', '==', 'college'));
                }
    
                const querySnapshot = await getDocs(q);
                
                const usersList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                setCounselors(usersList);
            } catch (error) {
                console.error("Error fetching users: ", error);
            }
        };
    
        fetchCounselors();
    }, [studentData]);
    
    //guidance appointments fetch
    useEffect(() => {
        if (!selectedCounselor) {
            setCounselorSched([]);
            return;
        }
    
        const usersCollection = collection(db, 'guidanceAppointments');
        const q = query(usersCollection, where('counselorId', '==', selectedCounselor.uid));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const counselorSched = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            setCounselorSched(counselorSched);
        }, (error) => {
            console.error("Error fetching schedule: ", error);
        });
    
        return () => unsubscribe();
    }, [selectedCounselor?.uid]);

    // modify this when guidance side is done

    //disabled date
    // useEffect(() => {
    //     if (!selectedCounselor) {
    //         setCounselorSched([]);
    //         return;
    //     }
    
    //     const usersCollection = collection(db, 'users');
    //     const q = query(usersCollection, where('uid', '==', selectedCounselor.uid));
        
    //     const unsubscribe = onSnapshot(q, (querySnapshot) => {
    //         const counselorSched = querySnapshot.docs.map(doc => ({
    //             id: doc.id,
    //             ...doc.data()
    //         }));
            
    //         setCounselorDisabledDate(counselorSched);
    //     }, (error) => {
    //         console.error("Error fetching schedule: ", error);
    //     });
    
    //     return () => unsubscribe();
    // }, [selectedCounselor?.uid]);
 
// student sched fetch and update status if past time
useEffect(() => {
    if (!currentUser) {
        return;
    }

    const usersCollection = collection(db, 'guidanceAppointments');
    const q = query(usersCollection, where('studentId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const now = new Date();

        querySnapshot.docs.forEach(doc => {
            const data = doc.data();
            const start = new Date(data.start);
            const end = new Date(data.end);

            if (data.status === "pending" && start.toDateString() === now.toDateString() && end < now) {
                updateDoc(doc.ref, { status: "did not respond" });
            } else if (data.status === "approved" && start.toDateString() === now.toDateString() && end < now) {
                updateDoc(doc.ref, { status: "finished" });
            }
        });

        const studentSched = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        setStudentSched(studentSched);

    }, (error) => {
        console.error("Error fetching student schedule: ", error);
    });

    return () => unsubscribe();
}, [currentUser?.uid]);

    
  // Filters
  useEffect(() => {
    let sched = [...studentSched];

    // Status
    if (filterStatus === 'approved') {
      sched = sched.filter(sched =>
        sched.status === 'approved'
      );
    } else if (filterStatus === 'pending') {
      sched = sched.filter(sched =>
        sched.status === 'pending'
      );
    } else if (filterStatus === 'finished') {
        sched = sched.filter(sched =>
          sched.status === 'finished'
        );
    } else if (filterStatus === 'rescheduled') {
        sched = sched.filter(sched =>
          sched.status === 'rescheduled'
        );
    } else if (filterStatus === 'pending') {
        sched = sched.filter(sched =>
          sched.status === 'did not respond'
        );
    }

    // all
    if (filterStatus !== 'all') {
      sched = sched.filter(sched =>
        sched.status === filterStatus
      );
    }

    setFilteredStudentSched(sched);
  }, [filterStatus, studentSched]);
    

    const disabledDates = [
        // replace with data in firebase later
        new Date(2024, 6, 22),
        new Date(2024, 6, 24),
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
        const today = new Date();
        today.setHours(0, 0, 0, 0);
    
        const isPastDate = slotInfo.start < today;
        const isToday = slotInfo.start.toDateString() === today.toDateString();
        const isPastTime = slotInfo.start < new Date();
    
        if (isWeekend(slotInfo.start)) {
            showWarnToast("Cannot schedule on weekends");
            return;
        }

        if (isDisabledDate(slotInfo.start)) {
            showWarnToast("Counselor not available");
            return;
        }
    
        if ((view === Views.DAY) && isOutsideAllowedTime(slotInfo.start, slotInfo.end || new Date(slotInfo.start.getTime() + 60 * 60 * 1000))) {
            showWarnToast("The selected slot is outside of permissible hours");
            setStartTime(null);
            setEndTime(null);
            setTemporaryEvent(null);
            return;
        }

        if (isPastDate) {
            showWarnToast("Scheduling in the past is not allowed");
            return;
        }
    
        if (isToday && isPastTime) {
            showWarnToast("Cannot schedule for a past time today");
            setStartTime(null);
            setEndTime(null);
            setTemporaryEvent(null);
            return;
        }
    
        if (view === Views.MONTH) {
            setView(Views.DAY);
        }
    
        setDate(slotInfo.start);
    
        const add30Minutes = (date) => {
            return new Date(date.getTime() + 30 * 60 * 1000);
        };

        if (!isOutsideAllowedTime(slotInfo.start, add30Minutes(slotInfo.start))) {
            setTemporaryEvent({
                title: '- You',
                start: slotInfo.start,
                end: add30Minutes(slotInfo.start),
                status: 'display'
            });

            setStartTime(slotInfo.start);
            setEndTime(add30Minutes(slotInfo.start));
    
        } else {
            setTemporaryEvent(null);

        }
    }, [view, disabledDates]);
    
    const handleSelectEvent = useCallback((event) => {
        if (event.status === 'display') {
            setTemporaryEvent(null);
            setStartTime(null);
            setEndTime(null);
            return;
        }
        setDate(event.start);
        setView(Views.DAY);

    }, []);
    
    // delete mock events later
    const events = [
        ...counselorSched.map(appointment => ({
            title: appointment.studentId === currentUser.uid 
                ? (view === Views.MONTH ? "You" : "- You") 
                : (view === Views.MONTH ? "Anonymous" : "- Anonymous"), 
            start: appointment.start.toDate(),
            end: appointment.end.toDate(),
            status: appointment.status
        })),
        temporaryEvent,
    ].filter(event => event);
    

    const handleGotoDay = () => {

        const today = new Date();
    
        if (isWeekend(today)) {
            showWarnToast("Scheduling is not available on weekends. Please select alternative dates");
            return;
        }

        if (isDisabledDate(today)) {
            showWarnToast("Counselor not available. Please select alternative dates");
            return;
        }

        if (isDisabledDate(today)) {
            showWarnToast("Counselor not available today");
            return;
        }

        setView(Views.DAY);
        setDate(today);
    };

    const handleCounselorChange = (e) => {
        const counselorId = e.target.value;
        const selected = counselors.find(counselor => counselor.id === counselorId);
        setSelectedCounselor(selected);
    };

    const handleSubmitSchedule = async () => {
        setDisabledButton(true);
        try {
          await addDoc(collection(db, 'guidanceAppointments'), {
            start: new Date(startTime),
            end: new Date(endTime),
            reason: "reason",
            counselorName: selectedCounselor.counselorName,
            status: "pending",
            studentId: currentUser.uid,
            counselorId: selectedCounselor.uid,
            section: studentData.section,
            department: studentData.department,
            gradeLevel: studentData.gradeLevel,
            fullName: studentData.fullName,
            studentEmail: studentData.email,
            reason: reason,
            timestamp: serverTimestamp(),
          });
          showSuccessToast("Schedule submitted successfully");

          // Add to activityLog collection
          const activityLogRef = collection(db, "activityLog");
          await addDoc(activityLogRef, {
              date: serverTimestamp(),
              subject: selectedCounselor.counselorName,
              type: 'counseling',
              studentId: currentUser.uid
          });

          setTemporaryEvent(null);
          setStartTime(null);
          setEndTime(null);
          setSelectedCounselor(null);
          setReason('');
          setSubmitModal(false);
          setDisabledButton(false);

        } catch (error) {
          console.error("Error submitting schedule:", error);
          showFailedToast("Error submitting schedule");
        }
      };
    
    const handleSubmitModal = () => {
        setSubmitModal(prevState => !prevState);
    }

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
        <SidebarStudent>
            <ToastContainer/>
            <div className="container mx-auto bg-blue-100 rounded pb-10 min-h-[90vh]">
                <div className="bg-blue-300 p-5 rounded flex justify-center items-center mb-10">
                    <h2 className="text-3xl font-bold text-blue-950 text-center">Guidance Counseling</h2>
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
                                    if (newView !== Views.DAY) {
                                        setTemporaryEvent(null);
                                        setStartTime(null);
                                        setEndTime(null);
                                    }
                                }}
                                slotPropGetter={slotPropGetter}
                            />
                        </div>

                        <div className="w-full bg-blue-100 p-5 rounded my-4">
                            <label htmlFor="filterCounselor" className="block text-gray-700 mb-1 font-semibold">
                                Counselor: {selectedCounselor?.counselorName}
                            </label>
                            <select
                                id="filterCounselor"
                                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                                value={selectedCounselor ? selectedCounselor.id : ''}
                                onChange={handleCounselorChange}
                            >
                                <option value="">Select a counselor</option>
                                {counselors.map(counselor => (
                                    <option key={counselor.id} value={counselor.id}>
                                        {counselor.counselorName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className='mt-4'>
                            {view === Views.DAY ? (
                                <>
                                    {!selectedCounselor &&(
                                        <div className='flex justify-center text-gray-500 font-semibold items-center text-center'>
                                            <span>Select a counselor to view available schedules</span>
                                        </div>
                                    )}

                                    {(startTime && endTime) && selectedCounselor ? (
                                        <div className='flex justify-center'>
                                            <motion.button
                                             whileHover={{scale: 1.03}}
                                             whileTap={{scale: 0.95}}
                                             className='w-full sm:w-[85%] p-5 bg-[#ffd1dc] text-[#584549] font-semibold rounded' onClick={handleSubmitModal}>
                                                Set schedule
                                            </motion.button>
                                        </div>
                                        
                                    ) : (
                                        <>
                                        {!temporaryEvent &&(
                                            <div className='flex justify-center text-gray-500 font-semibold items-center text-center'>
                                                <span>Hold and Drag Down to Select Time </span>
                                            </div>

                                        )}


                                        </>
                                    )}
                                
                                </>

                            ) : (
                                <>
                                    {!selectedCounselor &&(
                                        <div className='flex justify-center text-gray-500 font-semibold mb-4 items-center text-center'>
                                            <span>Select a counselor to view available schedules</span>
                                        </div>
                                    )}

                                    <div className='w-full flex justify-center'>

                                        
                                        <motion.button
                                         whileHover={{scale: 1.03}}
                                         whileTap={{scale: 0.95}}
                                         className='w-full sm:w-[85%] p-5 bg-[#ffd1dc] text-[#584549] font-semibold rounded' onClick={handleGotoDay}>
                                            Schedule Counseling Today
                                        </motion.button>
                                    </div>
                                </>
                            )}

                            <div className='border-b-2 border-green-300 my-4'/>

                            <div className='bg-green-100'>
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
                                                case "reschedule":
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
                                                <div className='my-3 p-4 rounded-md shadow-md text-xs sm:text-base' key={sched.id} style={{ backgroundColor: bgColor }}>
                                                <p className='sm:text-lg text-sm font-bold '>
                                                    Counselor: {sched.counselorName}
                                                </p>
                                                <p>Status: {sched.status}</p>
                                                <p>Date: {new Date(sched.start.seconds * 1000).toDateString("en-US")}</p>
                                                        <p>Time: {sched.start && sched.end ? 
                                                            `${new Date(sched.start.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(sched.end.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
                                                            : 'N/A'}
                                                        </p>
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

            <Modal isOpen={submitModal} onClose={handleSubmitModal}>
                <div className="p-6">
                    <h3 className="text-lg font-bold mb-4 text-center">
                        Counseling Schedule
                    </h3>

                    <div className='border-2 border-blue-50 rounded p-5 bg-blue-200 sm:text-base text-sm'>
                        <p className='font-semibold pb-1'>
                            Schedule Information:
                        </p>

                        <div className='ml-4'>
                            <p>Counselor: {selectedCounselor?.counselorName}</p>
                            <p>Name: {studentData?.fullName}</p>
                            <p>Date: {startTime?.toDateString()}</p>
                            <p>Time: {startTime && endTime ? 
                                `${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
                                : ''}
                            </p>
                        </div>

                    </div>

                    <div className="mt-4">
                        <label
                        htmlFor="rejectionReason"
                        className="block text-gray-700 mb-1"
                        >
                        Reason:
                        </label>
                        <textarea
                        id="rejectionReason"
                        value={reason}
                        placeholder='Optional'
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                        required
                        />
                    </div>

                    <div className="mt-6 flex justify-around">
                        <motion.button
                        whileHover={{scale: 1.03}}
                        whileTap={{scale: 0.95}}
                        
                        onClick={handleSubmitModal}
                        className="mr-2 px-4 py-2 bg-gray-400 text-white font-semibold rounded hover:bg-gray-500 w-full"
                        >
                        Cancel
                        </motion.button>

                        <motion.button
                        whileHover={{scale: 1.03}}
                        whileTap={{scale: 0.95}}
                        onClick={handleSubmitSchedule}
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
        </SidebarStudent>
    );
};

export default StudentGuidance;
