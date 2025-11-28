// src/components/NotFound.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import notFoundImg from "../assets/404_notfound.png";

const NotFound = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate("/MySchedule");
  };

  return (
    <div className="unauthorized-container">
      <div className="logo-container" onClick={handleGoHome}>
        <img src="images/logo.svg" alt="eTMS Logo" className="app-logo" />
      </div>
      <img 
        src={notFoundImg} 
        alt="404 Not Found" 
        className="unauthorized-img"
      />
      <h2 className="unauthorized-title">
        404 PAGE NOT FOUND
      </h2>
      <p className="unauthorized-text">
        The page you are looking for does not exist.
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

export default NotFound;
