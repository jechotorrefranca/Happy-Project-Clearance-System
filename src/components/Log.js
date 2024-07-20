import React, { useState, useEffect } from 'react';

const Log = ({ type, subject, date }) => {
    const [content, setContent] = useState(null);

    useEffect(() => {
        switch (type) {
            case 'submit':
                setContent(
                    <div className='bg-blue-300 mx-4 my-3 p-5 rounded-md shadow-md text-sm sm:text-base'>
                        <p className='sm:text-lg text-base font-bold'>
                            Request Submission
                        </p>
                        <p>
                            Your request for <strong>{subject}</strong> was submitted on <strong>{date}</strong>
                        </p>
                    </div>
                );
                break;
            case 'resubmit':
                setContent(
                    <div className='bg-yellow-100 mx-4 my-3 p-5 rounded-md shadow-md text-sm sm:text-base'>
                        <p className='sm:text-lg text-base font-bold'>
                            Request Resubmission
                        </p>
                        <p>
                            Your request for <strong>{subject}</strong> was resubmitted on <strong>{date}</strong>
                        </p>
                    </div>
                );
                break;
            case 'counseling':
                setContent(
                    <div className='bg-red-100 mx-4 my-3 p-5 rounded-md shadow-md text-sm sm:text-base'>
                        <p className='sm:text-lg text-base font-bold'>
                            Guidance Office
                        </p>
                        <p>
                            You requested a counseling session with <strong>{subject}</strong> on <strong>{date}</strong>
                        </p>
                    </div>
                );
                break;
            default:
                setContent(null);
        }
    }, [type, subject, date]);

    return (
        <>
            {content}
        </>
    );
};

export default Log;
