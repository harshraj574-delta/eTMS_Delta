// src/components/Unauthorized.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white shadow-lg rounded-2xl p-10 max-w-md text-center">
        <div className="text-red-500 text-5xl mb-4" style={{fontSize: '100px'}}>⚠️</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Unauthorized Access
        </h2>
        <p className="text-gray-600 mb-6" style={{fontSize: '18px'}}>
          You do not have permission to access this page.
        </p>
        <button style={{fontSize: '18px'}} 
          onClick={() => navigate("/MySchedule")}
          className="btn btn-primary ms-auto"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
};

export default Unauthorized;