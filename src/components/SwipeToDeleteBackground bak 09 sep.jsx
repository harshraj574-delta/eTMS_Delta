import React from 'react';

// Helper Component for Swipe-to-Delete Background (RIGHT SWIPE VERSION)
const SwipeToDeleteBackground = ({ isActive, swipeProgress }) => {
    // Opacity is based on the absolute progress, so it works for right swipes too
    const opacity = Math.min(Math.abs(swipeProgress) / 100, 1);
    return (
      <div
        style={{
          position: 'absolute',
          top: '1px',
          left: '1px',
          right: '1px',
          bottom: '1px',
          backgroundColor: '#dc3545', // Bootstrap's danger color
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          // Align content to the START (left) for a right-swipe
          justifyContent: 'flex-start',
          // Add padding to the LEFT
          paddingLeft: '30px',
          opacity: isActive ? opacity : 0,
          transition: 'opacity 0.2s ease',
          zIndex: 1, // Behind the foreground
        }}
      >
        <i className="material-symbols-outlined me-2">delete</i>
        <strong>Delete</strong>
      </div>
    );
  };

export default SwipeToDeleteBackground;