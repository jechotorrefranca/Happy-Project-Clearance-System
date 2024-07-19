import React, { useCallback, useState, useEffect } from 'react';
import { collection, query, where, getDocs, startAfter } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import SidebarStudent from '../components/SidebarStudent';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarStyles.css';

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
        fontWeight: 'bold'
    };
    return {
        style,
    };
};

const StudentGuidance = () => {
    const [view, setView] = useState(Views.MONTH);
    const [date, setDate] = useState(new Date());
    const [temporaryEvent, setTemporaryEvent] = useState(null);
    const [counselors, setCounselors] = useState([]);
    const [startTime, setStartTime] = useState(null);
    const [endTime, setEndTime] = useState(null);

    useEffect(() => {
      const fetchCounselors = async () => {
        try {
          const usersCollection = collection(db, 'users');
          const q = query(usersCollection, where('role', '==', 'Guidance Office'));
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
    }, []);

    const disabledDates = [
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
    
        if (isWeekend(slotInfo.start) || isDisabledDate(slotInfo.start)) {
            console.log("Cannont schedule on weekends");
            return;
        }
    
        if ((view === Views.DAY) && isOutsideAllowedTime(slotInfo.start, slotInfo.end || new Date(slotInfo.start.getTime() + 60 * 60 * 1000))) {
            console.log("The selected slot is outside of permissible hours; no action will be taken.");
            return;
        }

        if (isPastDate) {
            console.log("Scheduling in the past is not allowed.");
            return;
        }
    
        if (isToday && isPastTime) {
            console.log("Cannot schedule for a past time today.");
            return;
        }
    
        if (view === Views.MONTH) {
            setView(Views.DAY);
        }
    
        console.log("Selected Date:", slotInfo.start);
        setDate(slotInfo.start);
    
        const add30Minutes = (date) => {
            return new Date(date.getTime() + 30 * 60 * 1000);
        };


    
        if (!isOutsideAllowedTime(slotInfo.start, add30Minutes(slotInfo.start))) {
            setTemporaryEvent({
                title: 'Schedule Counseling: Insert name',
                start: slotInfo.start,
                end: add30Minutes(slotInfo.start),
                status: 'display'
            });

            setStartTime(slotInfo.start);
            setEndTime(add30Minutes(slotInfo.start));


    
            console.log("Temporary event created.");
        } else {
            setTemporaryEvent(null);
        }
    }, [view, disabledDates]);
    
    

    const handleSelectEvent = useCallback((event) => {
        console.log('Clicked Event:', event);
        setDate(event.start);
        setView(Views.DAY);
        setTemporaryEvent(null);
    }, []);

    const events = [
        {
            title: 'Team Meeting',
            start: new Date(2024, 6, 29, 9, 0),
            end: new Date(2024, 6, 29, 10, 0),
            status: 'pending'
        },
        {
            title: 'Project Presentation',
            start: new Date(2024, 6, 23, 11, 0),
            end: new Date(2024, 6, 23, 12, 0),
            status: 'finished'
        },
        {
            title: 'Lunch with Client',
            start: new Date(2024, 6, 17, 13, 0),
            end: new Date(2024, 6, 17, 14, 0),
            status: 'rescheduled'
        },
        {
            title: 'Workshop',
            start: new Date(2024, 6, 25, 15, 0),
            end: new Date(2024, 6, 25, 17, 0),
            status: 'did not respond'
        },
        {
            title: 'Team Building Activity',
            start: new Date(2024, 6, 26, 10, 0),
            end: new Date(2024, 6, 26, 12, 0),
            status: 'approved'
        },
        temporaryEvent,
    ].filter(event => event);

    const handleGotoDay = () => {
        console.log("start: ", startTime)
        console.log("end: ", endTime)

        const today = new Date();
    
        if (isWeekend(today) || isDisabledDate(today)) {
            console.log("Can't schedule on weekends");
            return;
        }

        if (isDisabledDate(today)) {
            console.log("Counselor not available today");
            return;
        }

        setView(Views.DAY);
        setDate(today);
    };
    
    return (
        <SidebarStudent>
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

                        <div className='mt-4'>
                            {view === Views.DAY ? (
                                <>
                                    <div className='flex justify-center'>
                                        options here for counselor
                                    </div>

                                    {(startTime && endTime) ?(
                                        <div>
                                            you selected a date yay
                                        </div>
                                        
                                    ):(

                                        <div className='flex justify-center'>
                                            <span>Hold and Drag Down to Select Time </span>
                                        </div>
                                    )}

                                
                                </>

                            ):(

                                <div className='w-full'>
                                    <button className='w-full p-5 bg-blue-500 rounded' onClick={() => handleGotoDay()}>
                                        Schedule Counseling Today
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </SidebarStudent>
    );
};

export default StudentGuidance;
