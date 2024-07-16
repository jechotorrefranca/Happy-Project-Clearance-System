import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const Modal = ({ isOpen, onClose, children }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[51] flex items-center justify-center bg-black bg-opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="bg-blue-100 rounded-lg shadow-lg p-4 sm:max-w-md w-full max-w-[90%]">
            <button
              onClick={onClose}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
