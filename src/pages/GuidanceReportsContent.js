import React, { forwardRef } from 'react';
import moment from 'moment';

const GuidanceReportsContent = forwardRef(({ sched }, ref) => (
    <div className="w-full overflow-auto" ref={ref}>
        <div className="hidden show-on-print">
        <div className="flex justify-center py-3 text-xl font-bold bg-gray-300 mb-2">
            <p>Guidance Reports</p>

        </div>
        </div>

        <table className="min-w-full bg-white border border-gray-200">
        <thead>
            <tr className="bg-blue-200 border-b border-blue-300 text-gray-500 text-xs header">
            <th className="py-3 px-4 text-left font-medium uppercase tracking-wider ">Appointment Date</th>
            <th className="py-3 px-4 text-left font-medium uppercase tracking-wider">Student No.</th>
            <th className="py-3 px-4 text-left font-medium uppercase tracking-wider">Student</th>
            <th className="py-3 px-4 text-left font-medium uppercase tracking-wider">Department</th>
            <th className="py-3 px-4 text-left font-medium uppercase tracking-wider">Grade Level</th>
            <th className="py-3 px-4 text-left font-medium uppercase tracking-wider">Section</th>
            <th className="py-3 px-4 text-left font-medium uppercase tracking-wider">Status</th>
            <th className="py-3 px-4 text-left font-medium uppercase tracking-wider">Counselor</th>
            </tr>
        </thead>
        <tbody>
            {sched.map((sched) => (
            <tr key={sched.id} className="hover:bg-blue-100 bg-blue-50 row">
                <td className="py-2 px-4 border border-gray-200">{moment(sched.start.toDate()).format("YYYY-MM-DD")}</td>
                <td className="py-2 px-4 border border-gray-200">{sched.studentNo}</td>
                <td className="py-2 px-4 border border-gray-200">{sched.fullName}</td>
                <td className="py-2 px-4 border border-gray-200">{sched.department || "N/A"}</td>
                <td className="py-2 px-4 border border-gray-200">{sched.gradeLevel}</td>
                <td className="py-2 px-4 border border-gray-200">{sched.section}</td>
                <td className="py-2 px-4 border border-gray-200">{sched.status}</td>
                <td className="py-2 px-4 border border-gray-200">{sched.counselorName}</td>
            </tr>
            ))}
        </tbody>
        </table>


    </div>
));

export default GuidanceReportsContent;
