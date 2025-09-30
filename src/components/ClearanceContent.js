import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faExclamationCircle,
  faPaperclip,
  faComments,
} from "@fortawesome/free-solid-svg-icons";
import { DocumentMagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

const ClearanceContent = ({
  title,
  requirements,
  modalKey,
  clearanceRequests,
  reason,
  isUploading,
  files,
  handleRequestClearance,
  openResubmitModal,
  handleFileChange,
  setInquiryModal,
  type,
}) => {
  const request = clearanceRequests[modalKey];

  return (
    <>
      <table className="w-full">
        <tbody>
          <tr className="bg-white">
            <td colSpan={3} className="border px-6 py-4">
              <h4 className="text-md font-semibold mb-2 text-slate-800">
                Requirements:
              </h4>
              <ul className="list-disc list-inside text-slate-600 mb-4">
                {requirements.map((req, index) => (
                  <li key={index}>
                    <strong>{req.name}:</strong> {req.description}
                  </li>
                ))}
              </ul>

              <div className="mt-4">
                {request ? (
                  <div>
                    <div
                      className={`flex items-start gap-2 p-3 rounded-lg mb-3 border ${
                        request.status === "approved"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : request.status === "rejected"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      <FontAwesomeIcon
                        icon={faExclamationCircle}
                        className="mt-1 text-lg"
                      />
                      <div className="text-sm">
                        <p>
                          Your clearance request is currently{" "}
                          <strong className="capitalize">
                            {request.status}
                          </strong>
                        </p>
                        {reason?.reason && (
                          <p>
                            <span className="font-bold">Reason:</span>{" "}
                            {reason.reason}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Submitted Files */}
                    {request.fileURLs?.length > 0 && (
                      <div className="mt-3 mb-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 bg-slate-100 px-3 py-2 rounded-t-lg">
                          Submitted Files
                        </p>
                        <ul className="divide-y divide-slate-200">
                          {request.fileURLs.map((url, index) => (
                            <li key={index} className="p-2 flex items-center">
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-indigo-600 hover:underline"
                              >
                                <DocumentMagnifyingGlassIcon className="w-5 h-5" />
                                File {index + 1}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Resubmit Button */}
                    {request.status !== "approved" && (
                      <div className="flex flex-wrap gap-3 items-center">
                        <button
                          onClick={() => openResubmitModal(modalKey, type)}
                          className="px-5 py-2 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition disabled:opacity-50"
                          disabled={isUploading}
                        >
                          {isUploading
                            ? "Resubmitting..."
                            : "Resubmit Clearance"}
                        </button>

                        {/* Upload Input */}
                        <div className="flex items-center gap-2">
                          <label className="flex items-center justify-center p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                            <FontAwesomeIcon
                              icon={faPaperclip}
                              className="text-slate-600 text-lg"
                            />
                            <input
                              type="file"
                              multiple
                              onChange={handleFileChange}
                              className="hidden"
                            />
                          </label>
                          {files?.length > 0 && (
                            <span className="text-xs text-slate-500">
                              {files.length} file(s) selected
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Optional: Attach supporting documents
                    </label>
                    <div className="flex flex-wrap gap-3 items-center">
                      <button
                        onClick={() => handleRequestClearance(modalKey, type)}
                        className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                        disabled={isUploading}
                      >
                        {isUploading ? "Requesting..." : "Request Clearance"}
                      </button>

                      <div className="flex items-center gap-2">
                        <label className="flex items-center justify-center p-2 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                          <FontAwesomeIcon
                            icon={faPaperclip}
                            className="text-gray-600 text-lg"
                          />
                          <input
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>

                        {files?.length > 0 && (
                          <ul className="mt-2 text-sm text-gray-600">
                            {files.map((file, index) => (
                              <li
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <DocumentMagnifyingGlassIcon className="w-4 h-4 text-gray-500" />
                                {file.name}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="flex justify-center p-4 w-full">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() =>
            setInquiryModal(
              requirements[0]?.teacherUid || requirements[0]?.officeUid
            )
          }
          className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white font-medium rounded-lg shadow hover:bg-indigo-700 transition"
        >
          <FontAwesomeIcon icon={faComments} className="text-lg" />
          Send Inquiry
        </motion.button>
      </div>
    </>
  );
};

export default ClearanceContent;
