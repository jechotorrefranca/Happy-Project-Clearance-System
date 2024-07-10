import React, { useState, useRef } from "react";
import Papa from "papaparse";
import emailjs from "@emailjs/browser";
import Sidebar from "../components/Sidebar";

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
    "Items",
    "Remaining Balance",
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
            items,
            remainingBalance,
          } = data;

          if (!studentId || !parentEmail || !amount || !items) {
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
                items: items,
                remaining_balance: remainingBalance,
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
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4">
          Send Payment Confirmation Emails
        </h2>

        <div className="mb-6">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 cursor-pointer focus:outline-none focus:border-blue-500"
            ref={fileInputRef}
          />
          <p className="text-sm text-gray-500 mt-2">
            Upload a CSV file with columns: studentId, studentName, parentEmail, amount, items, remainingBalance; here
          </p>
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
                    {Object.values(row).map((value, idx) => (
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

        <div className="flex space-x-4">
          <button
            onClick={handleSendEmails}
            disabled={isLoading || !csvFile}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? "Sending..." : "Send Emails"}
          </button>
          {isLoading && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Cancel
            </button>
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
    </Sidebar>
  );
};

export default SendPaymentConfirmationEmail;
