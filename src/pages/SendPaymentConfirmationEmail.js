import React, { useState, useRef, useCallback } from "react";
import Papa from "papaparse";
import emailjs from "@emailjs/browser";
import Sidebar from "../components/Sidebar";
import {
  Upload,
  FileSpreadsheet,
  Mail,
  CheckCircle,
  AlertCircle,
  XCircle,
  Send,
  X,
  Download,
  Eye,
  Users,
  DollarSign,
  Loader2,
  FileText,
  Info,
  ChevronRight,
  CheckCircle2,
  Clock,
  MailCheck,
} from "lucide-react";

const SendPaymentConfirmationEmail = () => {
  const [csvFile, setCsvFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [previewData, setPreviewData] = useState([]);
  const [isCanceled, setIsCanceled] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [emailsSent, setEmailsSent] = useState(0);
  const [emailsFailed, setEmailsFailed] = useState(0);
  const [failedEmails, setFailedEmails] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [statistics, setStatistics] = useState({
    totalRecords: 0,
    validEmails: 0,
    totalAmount: 0,
    averageAmount: 0,
  });
  
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const COLUMNS = [
    { key: "studentId", label: "Student ID", icon: <Users className="w-4 h-4" /> },
    { key: "studentName", label: "Student Name", icon: <Users className="w-4 h-4" /> },
    { key: "parentEmail", label: "Parent's Email", icon: <Mail className="w-4 h-4" /> },
    { key: "amount", label: "Amount", icon: <DollarSign className="w-4 h-4" /> },
  ];

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  }, []);

  const handleFile = (file) => {
    if (file && file.type === "text/csv") {
      setCsvFile(file);
      setError("");
      setSuccess("");
      setFailedEmails([]);
      
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const data = result.data;
          setPreviewData(data);
          
          const validEmails = data.filter(row => row.parentEmail && row.parentEmail.includes('@')).length;
          const amounts = data.map(row => parseFloat(row.amount) || 0);
          const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);
          
          setStatistics({
            totalRecords: data.length,
            validEmails: validEmails,
            totalAmount: totalAmount,
            averageAmount: data.length > 0 ? totalAmount / data.length : 0,
          });
        },
        error: (error) => {
          setError("Error parsing CSV file. Please check the format.");
          console.error("Parse error:", error);
        },
      });
    } else {
      setCsvFile(null);
      setError("Please select a valid CSV file.");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFile(file);
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
    setEmailsSent(0);
    setEmailsFailed(0);
    setFailedEmails([]);

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (result) => {
        const paymentData = result.data;
        const totalEmails = paymentData.length;
        let sentCount = 0;
        let failedCount = 0;
        const failed = [];

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
            console.error(`Missing data for row ${i + 1}. Skipping.`);
            failedCount++;
            failed.push({
              studentId: studentId || 'N/A',
              parentEmail: parentEmail || 'N/A',
              reason: 'Missing required data'
            });
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
            sentCount++;
            setEmailsSent(sentCount);
            console.log(`Email sent to ${parentEmail}`);
          } catch (error) {
            failedCount++;
            setEmailsFailed(failedCount);
            failed.push({
              studentId,
              parentEmail,
              reason: error.message || 'Failed to send'
            });
            console.error(`Error sending email to ${parentEmail}:`, error);
          }

          setProgress(Math.round(((i + 1) / totalEmails) * 100));
        }

        setFailedEmails(failed);
        
        if (!isCanceled) {
          if (failedCount === 0) {
            setSuccess(`All ${sentCount} payment confirmation emails sent successfully!`);
          } else {
            setSuccess(`Completed: ${sentCount} emails sent, ${failedCount} failed.`);
          }
        }
        
        setIsLoading(false);
      },
      error: (error) => {
        console.error("Error parsing CSV file:", error);
        setError("Error parsing CSV file. Please check the format.");
        setIsLoading(false);
      },
    });
  };

  const handleCancel = () => {
    setIsCanceled(true);
    setIsLoading(false);
    setProgress(0);
  };

  const resetForm = () => {
    setCsvFile(null);
    setPreviewData([]);
    setError("");
    setSuccess("");
    setProgress(0);
    setEmailsSent(0);
    setEmailsFailed(0);
    setFailedEmails([]);
    setStatistics({
      totalRecords: 0,
      validEmails: 0,
      totalAmount: 0,
      averageAmount: 0,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const downloadTemplate = () => {
    const template = 'studentId,studentName,parentEmail,amount\n2024001,John Doe,parent@email.com,500.00';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payment_confirmation_template.csv';
    a.click();
  };

  const downloadFailedReport = () => {
    if (failedEmails.length === 0) return;
    
    const csv = Papa.unparse(failedEmails);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'failed_emails_report.csv';
    a.click();
  };

  return (
    <Sidebar>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Payment Confirmation Emails</h1>
            <p className="mt-2 text-gray-600">Send bulk payment confirmation emails to parents</p>
          </div>

          {}
          {previewData.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Records</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{statistics.totalRecords}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                    <FileText className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Valid Emails</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{statistics.validEmails}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-100 text-green-600">
                    <MailCheck className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Amount</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      ₱{statistics.totalAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
                    <DollarSign className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Amount</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      ₱{statistics.averageAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                    <DollarSign className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6">
              {}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold text-sm">1</span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Upload CSV File</h2>
                </div>

                <div
                  ref={dropZoneRef}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                    isDragging 
                      ? "border-blue-500 bg-blue-50" 
                      : csvFile 
                      ? "border-green-500 bg-green-50" 
                      : "border-gray-300 bg-gray-50 hover:border-gray-400"
                  }`}
                >
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    ref={fileInputRef}
                  />
                  
                  {csvFile ? (
                    <div className="space-y-4">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                      <div>
                        <p className="text-lg font-medium text-gray-900">{csvFile.name}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {(csvFile.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <button
                        onClick={resetForm}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <X className="h-4 w-4" />
                        Remove File
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-lg font-medium text-gray-900">
                          Drop your CSV file here, or{" "}
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            browse
                          </button>
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Supports CSV files with payment data
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Info className="h-4 w-4" />
                    <span>Required columns: studentId, studentName, parentEmail, amount</span>
                  </div>
                  <button
                    onClick={downloadTemplate}
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Download className="h-4 w-4" />
                    Download Template
                  </button>
                </div>
              </div>

              {}
              {previewData.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">2</span>
                      </div>
                      <h2 className="text-lg font-semibold text-gray-900">Preview Data</h2>
                    </div>
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                      <Eye className="h-4 w-4" />
                      {showPreview ? "Hide" : "Show"} Preview
                    </button>
                  </div>

                  {showPreview && (
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {COLUMNS.map((column) => (
                              <th
                                key={column.key}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                <div className="flex items-center gap-2">
                                  {column.icon}
                                  {column.label}
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {previewData.slice(0, 5).map((row, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {row.studentId}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {row.studentName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {row.parentEmail}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                ₱{parseFloat(row.amount || 0).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {previewData.length > 5 && (
                        <div className="px-6 py-3 bg-gray-50 text-sm text-gray-600 text-center">
                          ... and {previewData.length - 5} more records
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {}
              {previewData.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">3</span>
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Send Emails</h2>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Ready to send emails</p>
                        <p>
                          This will send payment confirmation emails to {statistics.validEmails} parents.
                          Each email will include the student's name, ID, and payment amount.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleSendEmails}
                      disabled={isLoading || !csvFile}
                      className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send All Emails
                        </>
                      )}
                    </button>
                    
                    {isLoading && (
                      <button
                        onClick={handleCancel}
                        className="inline-flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Sending emails...</span>
                    <span className="text-sm font-medium text-gray-700">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-sm text-gray-600">
                    <span>Sent: {emailsSent}</span>
                    <span>Failed: {emailsFailed}</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Error</p>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {success && (
                <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Success</p>
                      <p className="text-sm text-green-700 mt-1">{success}</p>
                    </div>
                  </div>
                </div>
              )}

              {failedEmails.length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">
                          Some emails failed to send
                        </p>
                        <p className="text-sm text-yellow-700 mt-1">
                          {failedEmails.length} email(s) could not be delivered.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={downloadFailedReport}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm"
                    >
                      <Download className="h-4 w-4" />
                      Download Report
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  );
};

export default SendPaymentConfirmationEmail;