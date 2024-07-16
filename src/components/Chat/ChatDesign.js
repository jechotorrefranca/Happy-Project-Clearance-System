import React, { useState, useEffect } from 'react';
import Backdrop from '../Backdrop'
import {
    PaperAirplaneIcon,
    XMarkIcon
  } from "@heroicons/react/24/solid";
import { useAuth } from '../AuthContext';
import { db, storage } from '../../firebaseConfig';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const ChatDesign = ({ handleClose, children, subject, facultyUid }) => {
    const { currentUser } = useAuth();
    const [message, setMessage] = useState('');
    const [inquiryFiles, setInquiryFiles] = useState([]);
    const [studentData, setStudentData] = useState(null);

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
  


    const handleInquiryFileChange = (e) => {
        setInquiryFiles(Array.from(e.target.files));
      };

    const handleSendInquiry = async () => {

        try {
          const inquiryFileURLs = [];
          for (const file of inquiryFiles) {
            const storageRef = ref(
              storage,
              `inquiries/${currentUser.uid}/${subject}/${file.name}`
            );
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);
            inquiryFileURLs.push(downloadURL);
          }
    
          const inquiriesRef = collection(db, "inquiries");
          await addDoc(inquiriesRef, {
            studentId: currentUser.uid,
            recipientId: facultyUid,
            subject: subject,
            message: message,
            fileURLs: inquiryFileURLs,
            timestamp: serverTimestamp(),
            read: false,
            fixedStudentId: currentUser.uid,
            fixedFacultyId: facultyUid,
            studentName: studentData.fullName,
          });
          setInquiryFiles([]);
          setMessage("");
        } catch (error) {
          console.error("Error sending inquiry:", error);
          showFailedToast("Error sending inquiry. Please try again later");
        }
      };

    const handleInputChange = (event) => {
        setMessage(event.target.value);
        autoResize(event.target);
    };

    const autoResize = (element) => {
        element.style.height = 'auto';
        element.style.height = `${element.scrollHeight}px`;

        const maxHeight = 6 * parseFloat(getComputedStyle(element).lineHeight);
        if (element.scrollHeight > maxHeight) {
            element.style.height = `${maxHeight}px`;
            element.style.overflowY = 'auto';
        }
    };

  return (
    <Backdrop>
      <ToastContainer/>
        <div className="bg-[#1d1c8b] w-[90%] sm:w-[60%] h-[90%] sm:h-[80%] flex flex-col p-2 rounded-lg">

            <div className="bg-[#5468b2] p-4 text-white text-xl font-bold flex justify-between items-center w-full">
                <span className='w-[80%] break-words'>Inquiry: {subject}</span>
                <button className="bg-[#fce27c] text-[#7D703E] rounded-full w-10 h-10 flex justify-center items-center" onClick={handleClose}>
                    <XMarkIcon className='w-5 h-5 text-black'/>
                </button>
            </div>

            <div className="bg-white flex-grow overflow-y-auto pb-10">
                <div className='pt-2'/>
                {children}
            </div>

            <div className="bg-[#5468b2] p-4 items-center">

                <input
                    type="file"
                    multiple
                    onChange={handleInquiryFileChange}
                    className="block w-full text-sm text-gray-900 bg-[#fff2c1] rounded-lg border p-1"
                />

                <div className='flex mt-3'>
                    <textarea
                            className='w-full rounded-3xl px-3 py-2 items-center resize-none'
                            placeholder='Type your inquiry here...'
                            value={message}
                            onChange={handleInputChange}
                            rows={1}
                            style={{ maxHeight: 'calc(6 * var(--line-height))' }}
                        />

                    {(message !== '' || inquiryFiles.length > 0) ?(
                        <PaperAirplaneIcon className='ml-3 w-10 h-10 text-[#fce27c] hover:cursor-pointer' onClick={handleSendInquiry}/>
                    ):(

                        <PaperAirplaneIcon className='ml-3 w-10 h-10 text-[#585858]'/>
                    )}

                </div>


            </div>

        </div>


    </Backdrop>

  )
}

export default ChatDesign