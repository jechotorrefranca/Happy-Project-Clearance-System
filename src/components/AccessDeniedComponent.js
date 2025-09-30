import React from "react";
import { useNavigate } from "react-router-dom";
import { ShieldOff, Home, ArrowLeft, Lock } from "lucide-react";

function AccessDenied() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-full mb-4">
            <ShieldOff className="h-12 w-12 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-8">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => navigate(-1)}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Go Back
          </button>
          
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Home className="h-5 w-5" />
            Go to Dashboard
          </button>
        </div>

        <div className="mt-8 p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-start">
            <Lock className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
            <div className="text-left">
              <p className="text-sm font-medium text-red-800 mb-1">
                Insufficient Permissions
              </p>
              <p className="text-xs text-red-700">
                Your account role doesn't have the necessary permissions to view this content.
                If you need access, please contact your system administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccessDenied;