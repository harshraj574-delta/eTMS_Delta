import React from "react";
import { Button } from "primereact/button";

/**
 * ReportButton - A reusable button component with consistent styling
 * Based on the "Run Report" button design from RepVehUsgVen.jsx
 * 
 * @param {string} label - Button text
 * @param {function} onClick - Click handler
 * @param {boolean} disabled - Whether the button is disabled
 * @param {string} icon - Optional PrimeReact icon class
 * @param {string} className - Additional CSS classes
 * @param {boolean} fullWidth - Whether the button should take full width (defaults to true)
 */
const ReportButton = ({ 
  label, 
  onClick, 
  disabled = false, 
  icon, 
  className = "",
  fullWidth = true
}) => {
  return (
    <>
      <style>
        {`
          .report-button {
            background-color: #1C1D20 !important;
            border-color: #1C1D20 !important;
            transition: background-color 0.3s, border-color 0.3s;
          }
          .report-button:hover:not(:disabled) {
            background-color: #0d6efd !important;
            border-color: #0d6efd !important;
          }
          .report-button:disabled {
            opacity: 0.6;
            cursor: not-allowed !important;
          }
        `}
      </style>
      <Button
        label={label}
        icon={icon}
        className={`btn btn-primary ${fullWidth ? 'w-100' : ''} report-button ${className}`}
        onClick={onClick}
        disabled={disabled}
      />
    </>
  );
};

export default ReportButton;
