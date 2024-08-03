import React, { useState, useEffect } from 'react'
import moment from "moment";

const NotificationDesign = ({ data, type}) => {
    const [content, setContent] = useState(null);

    const getInitials = (initial) => {
        if (!initial) return "";
        return initial[0].toUpperCase();
    };

    useEffect(() => {
        switch (type) {
            case 'approved':
                setContent(
                    <div className='bg-green-100 mx-4 my-3 p-5 rounded-md shadow-md flex justify-between gap-2 text-sm sm:text-base'>
                        <div className='flex justify-center items-center gap-3'>
                            <div>
                                <div className='w-10 h-10 rounded-full bg-green-300 flex justify-center items-center font-bold text-green-950'>
                                    {getInitials(data.subject || "Subject")}
                                </div>
                            </div>

                            <div>
                                <p className='font-bold'>
                                    Request Approved
                                </p>
                                <p>
                                    Your request for <strong>{data.subject}</strong> was <strong>{data.status}</strong>
                                </p>

                            </div>

                        </div>

                        <div className='w-auto max-w-[20%] justify-end flex'>
                            <span className='break-words text-xs sm:text-sm w-full'>
                                {moment(data.notifTimestamp.toDate()).fromNow()}
                            </span>

                        </div>
                    </div>
                );
                break;
            case 'rejected':
                setContent(
                    <div className='bg-red-100 mx-4 my-3 p-5 rounded-md shadow-md flex justify-between gap-2 text-sm sm:text-base'>
                        <div className='flex justify-center items-center gap-3 '>
                            <div>
                                <div className='w-10 h-10 rounded-full bg-red-300 flex justify-center items-center font-bold text-red-950'>
                                    {getInitials(data.subject || "Subject")}
                                </div>

                            </div>

                            <div>
                                <p className='font-bold'>
                                    Request Rejected
                                </p>
                                <p>
                                    Your request for <strong>{data.subject}</strong> was <strong>{data.status}</strong>
                                </p>

                                {data.reason && (
                                    <p className='font-bold text-red-800'>
                                        Reason: {data.reason}
                                    </p>

                                )}


                            </div>

                        </div>

                        <div className='w-auto max-w-[20%] justify-end flex'>
                            <span className='break-words text-xs sm:text-sm w-full'>
                                {moment(data.notifTimestamp.toDate()).fromNow()}
                            </span>

                        </div>
                    </div>
                );
                break;
            case 'gApproved':
                setContent(
                    <div className='bg-[#e4c7ff] mx-4 my-3 p-5 rounded-md shadow-md flex justify-between gap-2 text-sm sm:text-base'>
                        <div className='flex justify-center items-center gap-3 '>
                            <div>
                                <div className='w-10 h-10 rounded-full bg-[#bb9cd8] flex justify-center items-center font-bold text-[#543670]'>
                                    {getInitials(data.subject || "Subject")}
                                </div>

                            </div>

                            <div>
                                <p className='font-bold'>
                                    Counseling Appointment Approved
                                </p>
                                <p>
                                    Your counseling for <strong>{data.subject}</strong> was <strong>Approved</strong>
                                </p>

                                {data.reason && (
                                    <p className='font-bold text-[#563d6d]'>
                                        Message: {data.reason}
                                    </p>

                                )}


                            </div>

                        </div>

                        <div className='w-auto max-w-[20%] justify-end flex'>
                            <span className='break-words text-xs sm:text-sm w-full'>
                                {moment(data.notifTimestamp.toDate()).fromNow()}
                            </span>

                        </div>
                    </div>
                );
                break;
                case 'gRescheduled':
                    setContent(
                        <div className='bg-[#fffdb9] mx-4 my-3 p-5 rounded-md shadow-md flex justify-between gap-2 text-sm sm:text-base'>
                            <div className='flex justify-center items-center gap-3 '>
                                <div>
                                    <div className='w-10 h-10 rounded-full bg-[#e4e07c] flex justify-center items-center font-bold text-[#646225]'>
                                        {getInitials(data.subject || "Subject")}
                                    </div>
    
                                </div>
    
                                <div>
                                    <p className='font-bold'>
                                        Counseling Appointment Rescheduled
                                    </p>
                                    <p>
                                        Your counseling for <strong>{data.subject}</strong> was <strong>Rescheduled</strong>
                                    </p>
    
                                    {data.reason && (
                                        <p className='font-bold text-[#646225]'>
                                            Message: {data.reason}
                                        </p>
    
                                    )}
    
    
                                </div>
    
                            </div>
    
                            <div className='w-auto max-w-[20%] justify-end flex'>
                                <span className='break-words text-xs sm:text-sm w-full'>
                                    {moment(data.notifTimestamp.toDate()).fromNow()}
                                </span>
    
                            </div>
                        </div>
                    );
                    break;
            default:
                setContent(null);
        }
    }, [type, data]);
    

    return (
        <>
            {content}
        </>

    )
}

export default NotificationDesign
