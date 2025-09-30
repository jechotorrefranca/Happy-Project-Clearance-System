import { motion } from "framer-motion";
import Backdrop from "../Backdrop";
import { XMarkIcon } from "@heroicons/react/24/solid";
import "./modal.css";

const dropIn = {
  hidden: { opacity: 0, y: -20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.25, ease: "easeOut" },
  },
  exit: { opacity: 0, y: 20, scale: 0.98, transition: { duration: 0.2 } },
};

const ModalSubject = ({ children, handleClose, text }) => {
  return (
    <Backdrop
      onClick={handleClose}
      className="bg-black/40" // 🔹 Blur + dim overlay
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        className="modal relative bg-white rounded-xl shadow-2xl max-w-2xl w-[90%] sm:w-[600px] p-6 flex flex-col "
        variants={dropIn}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Close Button - top right */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <XMarkIcon className="w-5 h-5 text-gray-500" />
        </motion.button>

        {/* Header */}
        {text && (
          <h2 className="text-xl font-semibold text-gray-900 border-b pb-3 mb-4">
            {text}
          </h2>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto max-h-[70vh] text-gray-700 leading-relaxed">
          {children}
        </div>
      </motion.div>
    </Backdrop>
  );
};

export default ModalSubject;
