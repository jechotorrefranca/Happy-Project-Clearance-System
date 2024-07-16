import React, { useEffect, useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { db } from '../firebaseConfig';
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc
} from 'firebase/firestore';

import SidebarStudent from '../components/SidebarStudent';
import NotificationDesign from '../components/NotificationDesign';

const Notifications = () => {
  const { currentUser } = useAuth();
  const [notification, setNotification] = useState([])

  useEffect(() => {
    if (!currentUser) return;

    const notifCollectionRef = collection(db, 'studentNotification');
    const q = query(notifCollectionRef, where("studentId", "==", currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notif = snapshot.docs.map((doc) => {
        const data = doc.data();
        const date = data.notifTimestamp ? data.notifTimestamp.toDate() : null;
        return { id: doc.id, ...data, date };
      });

      notif.sort((a, b) => (b.date || 0) - (a.date || 0));

      const formattedNotif = notif.map((notifs) => ({
        ...notifs,
      }));

      setNotification(formattedNotif);

      // Update documents where isRead is false
      notif.forEach(async (notifItem) => {
        if (!notifItem.isRead) {
          const notifDocRef = doc(db, 'studentNotification', notifItem.id);
          await updateDoc(notifDocRef, { isRead: true });
        }
      });


    });

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <SidebarStudent>
      <div className="container mx-auto bg-blue-100 rounded pb-10 min-h-[90vh]">
        <div className="bg-blue-300 p-5 rounded flex justify-center items-center mb-10">
          <h2 className="text-3xl font-bold text-blue-950 text-center">Notifications</h2>
        </div>

        <div className="p-5">
          <div className="bg-white p-1 rounded-xl overflow-auto">
            <div className='max-h-[80vh] overflow-auto my-1'>
              {notification.map((item) => (
                <NotificationDesign key={item.id} type={item.status} data={item}/>
              ))}
              
            </div>

          </div>
        </div>



      </div>
    </SidebarStudent>
  );
};

export default Notifications;
