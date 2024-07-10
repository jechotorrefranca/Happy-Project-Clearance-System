import React from "react";
import Sidebar from "../components/Sidebar";

const Dashboard = () => {
  return (
    <Sidebar>
      <div className="container mx-auto bg-blue-100 rounded pb-10 min-h-[90vh]">
        <div className="bg-blue-300 p-5 rounded flex justify-center items-center mb-10">
          <h2 className="text-3xl font-bold text-blue-950">Welcome to the Dashboard</h2>
        </div>

        <div className="flex justify-center text-xl">
          <p>
            Please navigate through the pages to begin.
          </p>
        </div>
      </div>
    </Sidebar>
  );
};

export default Dashboard;
