import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  updateDoc,
  orderBy
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../components/AuthContext";
import Sidebar from "../components/Sidebar";
import moment from "moment";
import { motion, AnimatePresence } from 'framer-motion';
import ChatDesign from "../components/Chat/ChatDesign";
import UserChatDesign from "../components/Chat/UserChatDesign";
import {
  DocumentMagnifyingGlassIcon
} from "@heroicons/react/24/solid";

function ViewMessages() {
  const { currentUser } = useAuth();
  const [studentId, setStudentId] = useState(null);
  const [subjectInq, setSubjectInq] = useState(null);
  const [inquiryPage, setInquiryPage] = useState(false);
  const [inquiryData, setInquiryData] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [studentName, setStudentName] = useState(null);

  // Update read status function
  const markAsRead = async () => {
    try {
      if (!currentUser || !subjectInq) {
        console.log("Current user or subjectInq is null");
        return;
      }

      const inquiryCollectionRef = collection(db, 'inquiries');
      const q = query(inquiryCollectionRef,
        where('subject', '==', subjectInq),
        where('recipientId', '==', currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (doc) => {
        const docRef = doc.ref;
        await updateDoc(docRef, {
          read: true
        });
      });
    } catch (error) {
      console.error('Error marking inquiries as read:', error);
    }
  };

// Inbox Collection
useEffect(() => {
  if (!currentUser) return;

  const inboxRef = collection(db, 'inquiries');
  const q = query(inboxRef, where("fixedFacultyId", "==", currentUser.uid));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    try {
      const inbox = snapshot.docs.map((doc) => {
        const data = doc.data();
        const date = data.timestamp ? data.timestamp.toDate() : null;
        return { id: doc.id, ...data, date };
      });

      const subjectMap = new Map();
      inbox.forEach((inquiry) => {
        const key = `${inquiry.fixedStudentId}-${inquiry.subject}`;
        if (!subjectMap.has(key)) {
          subjectMap.set(key, inquiry);
        } else {
          const existingInquiry = subjectMap.get(key);
          if (existingInquiry.date < inquiry.date) {
            subjectMap.set(key, inquiry);
          }
        }
      });

      const formattedInbox = Array.from(subjectMap.values()).sort((a, b) => (b.date || 0) - (a.date || 0));

      setInquiries(formattedInbox);
    } catch (error) {
      console.error('Error fetching and processing inquiries:', error);
    }
  }, (error) => {
    console.error('Error subscribing to inbox query:', error);
  });

  return () => unsubscribe();
}, [currentUser]);


  

  // Inquiry
  useEffect(() => {
    if (!currentUser) return;
  
    const inboxRef = collection(db, 'inquiries');
    const q = query(inboxRef, 
      where("fixedStudentId", "==", studentId),
      where("subject", "==", subjectInq)
    );
  
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inbox = snapshot.docs.map((doc) => {
        const data = doc.data();
        const date = data.timestamp ? data.timestamp.toDate() : null;
        return { id: doc.id, ...data, date };
      });
  
      inbox.sort((a, b) => (a.date || 0) - (b.date || 0));
  
      const formattedInbox = inbox.map((inboxes) => ({
        ...inboxes,
      }));
  
      setInquiryData(formattedInbox);
    });
  
    return () => unsubscribe();
  }, [currentUser, subjectInq]);


  // Inquiry Modal
  const handleOpenModal = (subject, id, name) => {
    setStudentId(id);
    setStudentName(name);
    setInquiryPage(true);
    setSubjectInq(subject);
    
  }

  const handleCloseModal = () => {
    setInquiryPage(false);
    setSubjectInq(null);
    setStudentId(null);
    markAsRead();
    setInquiryData([]);
  }

  const getInitials = (email) => {
    if (!email) return "";
    const names = email.split("@")[0].split(/\.|_|-/);
    return names
      .map((n) => n[0].toUpperCase())
      .slice(0, 2)
      .join(""); 
  };

  return (
    <Sidebar>
      <div className="container mx-auto bg-blue-100 rounded pb-10 min-h-[90vh]">
        <div className="bg-blue-300 p-5 rounded flex justify-center items-center mb-10">
          <h2 className="text-3xl font-bold text-blue-950 text-center">Inquiries</h2>
        </div>

        <div className="p-5">
          <div className="bg-white p-1 rounded-xl overflow-auto">
            {inquiries.map(inquiry => (
              <div key={inquiry.id} className="px-3">
                <motion.div onClick={() => handleOpenModal(inquiry.subject, inquiry.fixedStudentId, inquiry.studentName)} className={`p-3 px-6 rounded-md my-3 shadow-md hover:cursor-pointer flex items-center gap-3 ${
                  inquiry.studentId === currentUser.uid
                    ? 'bg-[#fff6d4]'
                    : inquiry.read
                      ? 'bg-[#fff6d4]'
                      : 'bg-[#bcc9fb] border-[#6176c0] border-2'
                }`}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}>

                    
                  <div className="text-xl font-bold text-blue-950">
                    <div className="bg-blue-300 w-11 h-11 sm:w-14 sm:h-14 flex justify-center items-center rounded-full shadow-md">
                      {getInitials(inquiry.studentName || "?")}
                    </div>
                  </div>

                  <div className=" w-full">
                    <div className="flex justify-between items-cente">
                      <div className="w-[60%]">
                        <span className="break-words font-bold sm:text-lg text-sm">
                          {inquiry.subject}
                        </span>
                      </div>

                      <div>
                        <span className="sm:text-sm text-xs flex">
                          {inquiry.timestamp && moment(inquiry.timestamp.toDate()).fromNow()}
                        </span>
                      </div>

                    </div>

                    <div>
                      <span className="text-sm text-[#000000b6]">
                        {inquiry.facultyEmail}
                      </span>
                    </div>

                    <div className="">
                      <span className=" sm:text-lg text-sm">
                        {inquiry && inquiry.fileURLs && inquiry.fileURLs.map((url, index) => (
                            <div key={index} className='pb-2 w-fit'>
                                    <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#1d1c8b] hover:underline flex items-center"
                                    >
                                    <DocumentMagnifyingGlassIcon className='w-7 h-7'/>


                                        File {index + 1}
                                    </a>
                            </div>
                        ))}
                        {inquiry.studentId === currentUser.uid ? (
                          <>
                            <span className="text-sm sm:text-base">
                              You: {inquiry.message}
                            </span>
                          </>
                        ) : (
                          <div className="text-sm sm:text-base">
                            {inquiry.message}
                          </div>

                        )}

                      </span>
                    </div>

                    <div className="mt-3 flex justify-end">
                      {inquiry.studentId === currentUser.uid ? (
                        <span className="sm:text-sm text-xs text-[#000000b6] font-medium">
                          {inquiry.read ? "Read" : "Unread"}
                        </span>
                      ) : (
                        <>
                        </>
                      )}
                    </div>

                  </div>


                </motion.div>
              </div>
            ))}
            

          </div>
        </div>

        <AnimatePresence>

          {inquiryPage && (
            <>
              <ChatDesign handleClose={handleCloseModal}
                subject={subjectInq} facultyUid={studentId} inquiryData={inquiryData} studentName={studentName} defaultStudentId={studentId} defaultFacultyId={currentUser.uid}
              >
                {inquiryData.map((inquiry) => (
                  <div key={inquiry.id}>
                    <UserChatDesign
                      talkingTo={inquiry.studentName}
                      key={inquiry.id}
                      userType={inquiry.studentId === currentUser.uid ? "student" : "other"}
                      data={inquiry}
                    >
                      {inquiry.message}
                    </UserChatDesign>
                  </div>
                ))}
              </ChatDesign>
            </>
          )}

        </AnimatePresence>


      </div>
    </Sidebar>
  );
}

export default ViewMessages;
