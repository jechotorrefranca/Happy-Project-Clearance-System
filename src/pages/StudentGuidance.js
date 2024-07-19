import React, { useCallback, useState } from 'react';
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
            backgroundColor = 'blue';
            break;
        case 'approved':
            backgroundColor = 'pink';
            break;
        case 'finished':
            backgroundColor = 'green';
            break;
        case 'rescheduled':
            backgroundColor = 'yellow';
            break;
        case 'did not respond':
            backgroundColor = 'red';
            break;
        default:
            backgroundColor = 'gray';
    }

    const style = {
        backgroundColor,
        borderRadius: '0px',
        opacity: 0.8,
        color: 'black',
        display: 'block',
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
                    backgroundColor: 'red',
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
                    color: 'white',
                    opacity: 0.7,
                    pointerEvents: 'none',
                },
                title: 'Cannot Schedule Counseling outside office hours',
            };
        }
        return {};
    };

    const handleSelectSlot = useCallback((slotInfo) => {
        if ((view === Views.WEEK || view === Views.DAY) && isOutsideAllowedTime(slotInfo.start, slotInfo.end || new Date(slotInfo.start.getTime() + 60 * 60 * 1000))) {
            console.log('Selected slot is not available; no action taken.');
            return;
        }

        console.log('Selected Date:', slotInfo.start);
        setDate(slotInfo.start);

        if (view === Views.MONTH) {
            setView(Views.DAY);
        }

        if (!isOutsideAllowedTime(slotInfo.start, slotInfo.end || new Date(slotInfo.start.getTime() + 60 * 60 * 1000))) {
            setTemporaryEvent({
                title: 'Schedule Counseling: Insert name',
                start: slotInfo.start,
                end: slotInfo.end || new Date(slotInfo.start.getTime() + 60 * 60 * 1000),
                status: 'display'
            });
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
            start: new Date(2024, 6, 22, 9, 0),
            end: new Date(2024, 6, 22, 10, 0),
            status: 'pending'
        },
        {
            title: 'Project Presentation',
            start: new Date(2024, 6, 23, 11, 0),
            end: new Date(2024, 6, 23, 12, 0),
            color: '#33ff57',
            status: 'finished'
        },
        {
            title: 'Lunch with Client',
            start: new Date(2024, 6, 24, 13, 0),
            end: new Date(2024, 6, 24, 14, 0),
            color: '#3357ff',
            status: 'rescheduled'
        },
        {
            title: 'Workshop',
            start: new Date(2024, 6, 25, 15, 0),
            end: new Date(2024, 6, 25, 17, 0),
            color: '#f333ff',
            status: 'did not respond'
        },
        {
            title: 'Team Building Activity',
            start: new Date(2024, 6, 26, 10, 0),
            end: new Date(2024, 6, 26, 12, 0),
            color: '#ff33a1',
            status: 'approved'
        },
        temporaryEvent,
    ].filter(event => event);

    return (
        <SidebarStudent>
            <div className="container mx-auto bg-blue-100 rounded pb-10 min-h-[90vh]">
                <div className="bg-blue-300 p-5 rounded flex justify-center items-center mb-10">
                    <h2 className="text-3xl font-bold text-blue-950 text-center">Guidance Counseling</h2>
                </div>

                <div className="p-5">
                    <div className="bg-white p-5 rounded-xl overflow-auto">
                        <div className="h-[500px] sm:h-[500px]">
                            <Calendar
                                localizer={localizer}
                                events={events}
                                startAccessor="start"
                                endAccessor="end"
                                eventPropGetter={eventStyleGetter}
                                dayPropGetter={dayPropGetter}
                                style={{ height: '100%' }}
                                views={['month', 'week', 'day']}
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
                                    }
                                }}
                                slotPropGetter={slotPropGetter}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </SidebarStudent>
    );
};

export default StudentGuidance;
