import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      await sendPasswordResetEmail(auth, email);
      showSuccessToast("Password reset email sent. Please check your inbox");
      setEmail('');
    } catch (error) {
      showFailedToast("Failed to send password reset email. Please try again");
      console.error('Error sending password reset email:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100" style={{ backgroundImage: "url('https://scontent.fcrk3-2.fna.fbcdn.net/v/t1.6435-9/118802707_4386688541373004_6769550702385255298_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=13d280&_nc_eui2=AeF-UhkeyDDV_sdJ3IGn9Z31duFTBENvhZR24VMEQ2-FlG4q2lIMBjkQuyxWsF0zyP27PjYXLTna5IE5QuYrh9tU&_nc_ohc=Qr-BScnppdYQ7kNvgEqtQig&_nc_ht=scontent.fcrk3-2.fna&oh=00_AYDj0EUB-w8R94RVxK3ToUlIlxjqJUZ-1Rs9cHbLb5VTxQ&oe=66A3743D')", backgroundSize: "cover", backgroundRepeat: "no-repeat", backgroundPosition: "center" }}>
      <ToastContainer/>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-[#ffffffe5] p-8 rounded-lg shadow-md w-[90%] sm:max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Forgot Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your email"
              />
            </div>
          </div>
          <motion.button
            type="submit"
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoading ? 'Sending...' : 'Reset Password'}
          </motion.button>
        </form>
        {/* {message && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-sm text-green-600"
          >
            {message}
          </motion.p>
        )}
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-sm text-red-600"
          >
            {error}
          </motion.p>
        )} */}
        <div className="mt-6">
          <Link
            to="/"
            className="flex items-center justify-center text-sm text-blue-600 hover:text-blue-500"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;