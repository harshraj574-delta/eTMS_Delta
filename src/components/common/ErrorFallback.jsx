import React from "react";
import { BiRefresh, BiXCircle } from "react-icons/bi";
import "./ErrorFallback.css";

const ErrorFallback = ({
  error,
  resetErrorBoundary,
  onRetry,
  title = "Oops! Something went wrong",
  showDetails = false,
}) => {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else if (resetErrorBoundary) {
      resetErrorBoundary();
    }
  };

  return (
    <div className="error-fallback-container">
      <div className="error-fallback-content">
        <div className="error-icon">
          <BiXCircle />
        </div>

        <h2 className="error-title">{title}</h2>

        <p className="error-message">
          We encountered an unexpected error. Please try again or contact support
          if the problem persists.
        </p>

        {error && showDetails && (
          <div className="error-details">
            <details>
              <summary>Error Details</summary>
              <pre>{error.toString()}</pre>
            </details>
          </div>
        )}

        <div className="error-actions">
          <button
            className="btn btn-primary btn-retry"
            onClick={handleRetry}
            aria-label="Retry loading"
          >
            <BiRefresh className="retry-icon" />
            Try Again
          </button>
          <button
            className="btn btn-secondary btn-home"
            onClick={() => (window.location.href = "/")}
            aria-label="Go to home"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorFallback;