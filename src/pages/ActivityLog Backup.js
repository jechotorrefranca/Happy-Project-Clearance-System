import React, { useEffect, useState } from 'react'
import { useAuth } from "../components/AuthContext";
import { db } from "../firebaseConfig";
import {
  collection,
  query,
  where,
  onSnapshot
} from "firebase/firestore";

import SidebarStudent from '../components/SidebarStudent'
import Log from '../components/Log'

const ActivityLog = () => {
  const { currentUser } = useAuth();
  const [logData, setLogData] = useState([])

  // Fetch User Activity Log
  useEffect(() => {
    if (!currentUser) return;

    const logsCollectionRef = collection(db, 'activityLog');
    const q = query(logsCollectionRef, where("studentId", "==", currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map((doc) => {
        const data = doc.data();
        const date = data.date.toDate();
        return { id: doc.id, ...data, date };
      });

      logs.sort((a, b) => b.date - a.date);

      const formattedLogs = logs.map((log) => ({
        ...log,
        date: log.date.toLocaleString()
      }));

      setLogData(formattedLogs);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <SidebarStudent>
      <div className="container mx-auto bg-blue-100 rounded pb-10 min-h-[90vh]">
        <div className="bg-blue-300 p-5 rounded flex justify-center items-center mb-10">
          <h2 className="text-3xl font-bold text-blue-950 text-center">Activity Log</h2>
        </div>

          <div className="p-5">
            <div className="bg-white p-5 rounded-xl overflow-auto">
              <div className='max-h-[80vh] my-1  overflow-auto'>
                {logData.map((logs) => (
                  <Log key={logs.id} type={logs.type} subject={logs.subject} date={logs.date}/>
                ))}

              </div>

            </div>
          </div>
        </div>


    </SidebarStudent>
  )
}

export default ActivityLog