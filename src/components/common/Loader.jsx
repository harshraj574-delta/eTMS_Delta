import React from 'react';
import loaderGif from '../../assets/loader.gif';
import './Loader.css';

const Loader = ({ isVisible = true, fullScreen = false }) => {
  if (!isVisible) return null;

  if (fullScreen) {
    return (
      <div className="loader-overlay">
        <img src={loaderGif} alt="Loading..." className="loader-gif" />
      </div>
    );
  }

  return (
    <div className="loader-inline">
      <img src={loaderGif} alt="Loading..." className="loader-gif-inline" />
    </div>
  );
};

export default Loader;