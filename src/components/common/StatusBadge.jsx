import React from 'react';

const StatusBadge = ({ status, centered = true }) => {
  // Normalize status to lowercase for comparison
  const normalizedStatus = status ? status.toLowerCase() : '';

  const commonStyle = {
    minWidth: '93.6px',
    width: 'fit-content',
    height: '26px',
    borderRadius: '22.5px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#FFFFFF', 
    fontWeight: '500', 
    fontSize: '12px',
    textTransform: 'capitalize',
    opacity: 1,
    padding: '0 10px', // Add horizontal padding for longer text
    margin: centered ? '0 auto' : '0', // Allow pages to opt into left alignment
    whiteSpace: 'nowrap', // Prevent text wrapping
  };

  let background = '#6c757d'; // Default grey

  if (normalizedStatus === 'approved') {
    background = '#0BAA60';
  } else if (normalizedStatus === 'boarded') {
    background = '#0BAA60';
  } else if (normalizedStatus === 'pending') {
    background = '#E18A07';
  } else if (normalizedStatus === 'no show' || normalizedStatus === 'noshow') {
    background = '#FFECBA';
    commonStyle.color = '#E18A07';
  } else if (normalizedStatus === 'rejected') {
    background = '#F03D3D';
  } else if (normalizedStatus === 'cancelled') {
      background = '#F03D3D';
  } else if (normalizedStatus.includes('allocated')) {
      background = '#FFECBA';
      commonStyle.color = '#E18A07'; // Dark text for light background
      
  }


  const style = {
    ...commonStyle,
    background: background,
  };

  return (
    <div style={style}>
      {status}
    </div>
  );
};

export default StatusBadge;
