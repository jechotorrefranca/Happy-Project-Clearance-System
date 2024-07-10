import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../components/AuthContext";
import Sidebar from "../components/Sidebar";
import { useNavigate } from "react-router-dom";

function ViewClasses() {
  const { currentUser } = useAuth();
  const [teachingClasses, setTeachingClasses] = useState([]);
  const [advisoryClasses, setAdvisoryClasses] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClasses = async () => {
      if (currentUser) {
        try {
          const allClassesSnapshot = await getDocs(collection(db, "classes"));

          const teachingClasses = allClassesSnapshot.docs.filter((classDoc) => {
            const subjects = classDoc.data().subjects || [];
            return subjects.some(
              (subject) => subject.teacherUid === currentUser.uid
            );
          });
          setTeachingClasses(
            teachingClasses.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
          );

          const advisoryClasses = allClassesSnapshot.docs.filter((classDoc) => {
            return classDoc.data().adviserUid === currentUser.uid;
          });
          setAdvisoryClasses(
            advisoryClasses.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
          );
        } catch (error) {
          console.error("Error fetching classes:", error);
        }
      }
    };

    fetchClasses();
  }, [currentUser]);

  const handleRowClick = (path) => {
    navigate(path);
  };

  return (
    <Sidebar>
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">Your Classes</h2>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-2">Teaching</h3>
          {teachingClasses.length === 0 ? (
            <p>You are not currently assigned to any teaching classes.</p>
          ) : (
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  <th className="py-2 border-b border-gray-200">Section Name</th>
                  <th className="py-2 border-b border-gray-200">Education Level</th>
                  <th className="py-2 border-b border-gray-200">Grade Level</th>
                </tr>
              </thead>
              <tbody>
                {teachingClasses.map((classItem) => (
                  <tr
                    key={classItem.id}
                    onClick={() => handleRowClick(`/class-details/${classItem.id}`)}
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    <td className="border px-4 py-2">{classItem.sectionName}</td>
                    <td className="border px-4 py-2">{classItem.educationLevel}</td>
                    <td className="border px-4 py-2">{classItem.gradeLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">Advisory</h3>
          {advisoryClasses.length === 0 ? (
            <p>You are not currently an adviser for any classes.</p>
          ) : (
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr>
                  <th className="py-2 border-b border-gray-200">Section Name</th>
                  <th className="py-2 border-b border-gray-200">Education Level</th>
                  <th className="py-2 border-b border-gray-200">Grade Level</th>
                </tr>
              </thead>
              <tbody>
                {advisoryClasses.map((classItem) => (
                  <tr
                    key={classItem.id}
                    onClick={() => handleRowClick(`/class-details-adviser/${classItem.id}`)}
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    <td className="border px-4 py-2">{classItem.sectionName}</td>
                    <td className="border px-4 py-2">{classItem.educationLevel}</td>
                    <td className="border px-4 py-2">{classItem.gradeLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Sidebar>
  );
}

export default ViewClasses;
