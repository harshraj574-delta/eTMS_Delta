// src/components/Unauthorized.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import useSessionStore from "../store/useSessionStore";
import unauthorizedImg from "../assets/unauthorized.png";

const Unauthorized = () => {
  const navigate = useNavigate();
  const refreshRights = useSessionStore((state) => state.refreshRights);

  const handleGoHome = async () => {
    await refreshRights();
    navigate("/MySchedule");
  };

  return (
    <div className="unauthorized-container">
      <div className="logo-container" onClick={handleGoHome}>
        <img src="images/logo.svg" alt="eTMS Logo" className="app-logo" />
      </div>
      <img 
        src={unauthorizedImg} 
        alt="Unauthorized Access" 
        className="unauthorized-img"
      />
      <h2 className="unauthorized-title">
        401 UNAUTHORIZED
      </h2>
      <p className="unauthorized-text">
        Access denied due to invalid credentials.
      </p>
      <button 
        onClick={handleGoHome}
        className="unauthorized-btn"
      >
        Go to Home
      </button>
    </div>
  );
};

export default Unauthorized;