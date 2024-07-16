import { motion } from 'framer-motion';
import Backdrop from '../Backdrop';
import './modal.css';
import {
    XMarkIcon
  } from "@heroicons/react/24/solid";

const dropIn = {
    hidden: {
        y: '-100vh',
        opacity: 0,
    },
    visible: {
        y: '0',
        opacity: 1,
        transition: {
            duration: 0.1,
            type: 'spring',
            damping: 25,
            stiffness: 500
        }
    },
    exit: {
        y: '100vh',
        opacity: 0,
    }
}

const ModalSubject = ({ children, handleClose, text }) => {

    return (
        <Backdrop onClick={handleClose}>

            <motion.div
                onClick={(e) => e.stopPropagation()}
                className='modal bg-[#bcc9fb]'
                variants={dropIn}
                initial="hidden"
                animate="visible"
                exit="exit"
            >
                <div className='flex-col items-center'>
                    <div className=' '>
                        {text &&(
                        <div className='flex justify-center text-xl font-bold p-3'>
                            <div className='bg-[#fff2c1] w-[80%] p-3 flex justify-center rounded-md'>
                                <p className='text-[#494124] text-center'>
                                    {text}
                                </p>

                            </div>
                        </div>

                        )}

                        {children}

                    </div>

                    <div className='flex justify-center items-center'>
                        <motion.button 
                         whileHover={{scale: 1.03}}
                         whileTap={{scale: 0.95}}
                         onClick={handleClose} className='bg-red-400 p-2 z-50 rounded-full mt-5 shadow-red-950 shadow-sm'>
                            <XMarkIcon className='w-5 h-5 text-red-900'/>
                        </motion.button>

                    </div>


                </div>

            </motion.div>

        </Backdrop>

    )

};

export default ModalSubject;