import React from 'react';

const TripTypeBadge = ({ type }) => {
  // Normalize type input to check for Pick Up variations
  const isPick = ['Pick Up', 'P', 'Pick', 'Pickup', 'PickUp'].includes(type);
  const isDrop = ['Drop', 'D'].includes(type);

  // Common styles
  const commonStyle = {
    width: '44px',
    height: '15.18px', // Using the precise height provided
    borderRadius: '7px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '9px', // Small font to fit in 44px width
    fontWeight: 'bold',
    color: '#FFFFFF', // Assuming white text ensures readability on colored backgrounds
    textTransform: 'uppercase',
    opacity: 1,
  };

  const pickStyle = {
    ...commonStyle,
    background: '#3377FF',
  };

  const dropStyle = {
    ...commonStyle,
    background: '#F03D3D',
  };

  if (isPick) {
    return (
      <div style={pickStyle} title={type}>
        Pick
      </div>
    );
  }

  if (isDrop) {
    return (
      <div style={dropStyle} title={type}>
        Drop
      </div>
    );
  }

  // Fallback for unknown types
  return <span>{type}</span>;
};

export default TripTypeBadge;
