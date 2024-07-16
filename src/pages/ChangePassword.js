import React, { useState } from 'react';
import SidebarStudent from '../components/SidebarStudent';
import { getAuth, signInWithEmailAndPassword, updatePassword } from 'firebase/auth';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const showSuccessToast = (msg) => toast.success(msg, {
    position: "top-center",
    autoClose: 2500,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: false,
    draggable: true,
    progress: undefined,
    theme: "colored",
    transition: Bounce,
    });

    const showFailedToast = (msg) => toast.error(msg, {
      position: "top-center",
      autoClose: 2500,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: true,
      progress: undefined,
      theme: "colored",
      transition: Bounce,
      });

      const showWarningToast = (msg) => toast.warn(msg, {
        position: "top-center",
        autoClose: 2500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: "colored",
        transition: Bounce,
        });


  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      showWarningToast('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showWarningToast('New passwords do not match');
      return;
    }

    const auth = getAuth();
    const user = auth.currentUser;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, user.email, currentPassword);
      await updatePassword(userCredential.user, newPassword);
      showSuccessToast('Password changed successfully')

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (error) {
      showFailedToast(error.message);
    } finally {

    }
  };

  return (
    <SidebarStudent>
      <ToastContainer/>
      <div className="container mx-auto bg-blue-100 rounded pb-10 min-h-[90vh]">
        <div className="bg-blue-300 p-5 rounded flex justify-center items-center mb-10">
          <h2 className="text-3xl font-bold text-blue-950">Change Password</h2>
        </div>

        <div className="p-5">
          <div className="bg-white p-5 rounded-xl overflow-auto">
            <div className="px-5">

              <form onSubmit={handleChangePassword} className="">
              

                <div className=' flex flex-col justify-center sm:items-center'>
                  <div>
                    <label className="mb-2 text-blue-950 font-semibold" htmlFor="currentPassword">
                      Current Password
                    </label>

                    <div className="relative mb-5 w-full sm:max-w-xs flex justify-center">
                      
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        id="currentPassword"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="p-2 border border-blue-300 rounded w-full "
                      />
                      
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-2 top-2 text-blue-500"
                      >
                        {showCurrentPassword ? <EyeIcon className="h-5 w-5" /> : <EyeSlashIcon className="h-5 w-5" />}
                      </button>
                    
                    </div>

                  </div>
                  
                </div>
                
                <div className='sm:flex justify-center items-center gap-5'>
                  <div className=''>
                    <label className="mb-2 text-blue-950 font-semibold" htmlFor="newPassword">
                      New Password
                    </label>

                    <div className="relative mb-5 w-full">
                      
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="p-2 border border-blue-300 rounded w-full"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2 top-2 text-blue-500"
                      >
                        {showNewPassword ? <EyeIcon className="h-5 w-5" /> : <EyeSlashIcon className="h-5 w-5" /> }
                      </button>
                    </div>

                  </div>

                  <div>
                    <label className="mb-2 text-blue-950 font-semibold" htmlFor="confirmNewPassword">
                      Confirm New Password
                    </label>

                    <div className="relative mb-5 w-full max">

                      <input
                        type={showConfirmNewPassword ? 'text' : 'password'}
                        id="confirmNewPassword"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="p-2 border border-blue-300 rounded w-full"
                      />

                      <button
                        type="button"
                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                        className="absolute right-2 top-2 text-blue-500"
                      >
                        {showConfirmNewPassword ? <EyeIcon className="h-5 w-5" /> : <EyeSlashIcon className="h-5 w-5" /> }
                      </button>

                    </div>

                  </div>


                </div>

                <div className='flex justify-center'>
                  <motion.button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded"
                  whileHover={{scale: 1.03}}
                  whileTap={{scale: 0.95}}
                  >
                    Change Password
                  </motion.button>

                </div>


              </form>

            </div>

          </div>
        </div>



      </div>
    </SidebarStudent>
  );
};

export default ChangePassword;
