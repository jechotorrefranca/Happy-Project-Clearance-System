import React, { useState, useEffect } from 'react'
import moment from "moment";

const NotificationDesign = ({ data, type}) => {
    const [typeS, setTypeS] = useState(null);

    useEffect(() => {
        if (type === 'approved') {
            setTypeS(true);
        } else if (type === 'rejected') {
            setTypeS(false);
        }
    }, [type]);

    const getInitials = (initial) => {
        if (!initial) return "";
        return initial[0].toUpperCase();
    };
    

    return (
        <>
            {typeS !== null && (
                typeS ? (
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
                ) : (
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
                )
            )}

        </>

    )
}

export default NotificationDesign
