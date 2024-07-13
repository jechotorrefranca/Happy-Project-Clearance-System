import React, { useState, useRef } from "react";
import Papa from "papaparse";
import emailjs from "@emailjs/browser";
import Sidebar from "../components/Sidebar";
import { motion } from 'framer-motion';

const SendPaymentConfirmationEmail = () => {
  const [csvFile, setCsvFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [previewData, setPreviewData] = useState([]);
  const [isCanceled, setIsCanceled] = useState(false);
  const fileInputRef = useRef(null);
  
  const COLUMNS = [
    "Student ID",
    "Student Name",
    "Parent's Email",
    "Amount",
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "text/csv") {
      setCsvFile(file);
      setError("");
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          setPreviewData(result.data);
        },
        error: (error) => {
          setError("Error parsing CSV file. Please check the format.");
        },
      });
    } else {
      setCsvFile(null);
      setError("Please select a valid CSV file.");
    }
  };

  const handleSendEmails = async () => {
    if (!csvFile) {
      setError("Please select a CSV file.");
      return;
    }

    setIsLoading(true);
    setProgress(0);
    setError("");
    setSuccess("");
    setIsCanceled(false);

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        const paymentData = result.data;
        const totalEmails = paymentData.length;

        for (let i = 0; i < totalEmails; i++) {
          if (isCanceled) {
            setError("Email sending canceled.");
            break;
          }

          const data = paymentData[i];
          const {
            studentId,
            studentName,
            parentEmail,
            amount,
          } = data;

          if (!studentId || !parentEmail || !amount) {
            console.error(`Missing data for student ${studentId}. Skipping.`);
            continue;
          }

          try {
            await emailjs.send(
              "service_qp5j2a7",
              "template_koow7fe",
              {
                to_email: parentEmail,
                student_id: studentId,
                student_name: studentName,
                amount: amount,
              },
              "CNHycKmcSVKvylnMl"
            );
            console.log(`Email sent to ${parentEmail}`);
          } catch (error) {
            console.error(`Error sending email to ${parentEmail}:`, error);
          }

          setProgress(Math.round(((i + 1) / totalEmails) * 100));
        }

        if (!isCanceled) {
          setSuccess("Payment confirmation emails sent successfully!");
        }
      },
      error: (error) => {
        console.error("Error parsing CSV file:", error);
        setError("Error parsing CSV file. Please check the format.");
      },
    });

    setIsLoading(false);
    setCsvFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCancel = () => {
    setIsCanceled(true);
    setIsLoading(false);
    setProgress(0);
  };

  return (
    <Sidebar>
      <div className="container mx-auto bg-blue-100 rounded pb-10 min-h-[90vh]">
        <div className="bg-blue-300 p-5 rounded flex justify-center items-center mb-10">
          <h2 className="text-3xl font-bold text-blue-950">Send Payment Confirmation Emails</h2>
        </div>

        <div className="p-5">
          <div className="bg-white p-5 rounded-xl overflow-auto">
            <div className="mb-6">

              <p className="text-sm text-gray-500 mb-2">
                Upload a CSV file with columns: studentId, studentName, parentEmail, amount
              </p>

              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-900 p-2 bg-blue-300 rounded-lg border border-gray-300 cursor-pointer focus:outline-none focus:border-blue-500"
                ref={fileInputRef}
              />
            </div>

            {previewData.length > 0 && (
              <div className="mb-6 overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      {COLUMNS.map((key) => (
                        <th key={key} className="py-2 px-4 border-b">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, index) => (
                      <tr key={index} className="border-b">
                        {Object.values(row).slice(0, 4).map((value, idx) => (
                          <td key={idx} className="py-2 px-4">
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex space-x-4 justify-center">
              <motion.button
                whileHover={{scale: 1.03}}
                whileTap={{scale: 0.95}}              
                onClick={handleSendEmails}
                disabled={isLoading || !csvFile}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {isLoading ? "Sending..." : "Send Emails"}
              </motion.button>

              {isLoading && (
                <motion.button
                  whileHover={{scale: 1.03}}
                  whileTap={{scale: 0.95}}
                  onClick={handleCancel}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Cancel
                </motion.button>
              )}
            </div>

            {isLoading && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 mt-2 text-center">
                  {progress}% complete
                </p>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 text-red-700 bg-red-100 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-4 p-4 text-green-700 bg-green-100 rounded-lg">
                {success}
              </div>
            )}

          </div>
        </div>


      </div>
    </Sidebar>
  );
};

export default SendPaymentConfirmationEmail;