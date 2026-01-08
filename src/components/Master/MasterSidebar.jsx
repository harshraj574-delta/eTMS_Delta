import React from "react";

const MasterSidebar = ({
  show,
  onClose,
  title,
  width,
  children,
  footer,
  className = "",
  bodyClassName = "",
  bodyStyle = {},
  backdrop = "static",
  id = "offcanvasRight",
  backdropOpacity = 0.5,
  backdropBlur = "10px",
  headerBgColor = "bg-secondary",
  headerTextColor = "text-white",
  headerClassName = "",
  headerStyle = {},
  footerButtons,
  footerClassName = "",
  footerStyle = {},
  showLeftBorder = true,
  leftBorderColor = "var(--secondary-color, #0000)",
  leftBorderWidth = "0.1px",
}) => {
  
  const renderFooter = () => {
    if (footer) return footer;
    
    if (footerButtons && footerButtons.length > 0) {
      return (
        <div className={`offcanvas-footer ${footerClassName}`} style={footerStyle}>
          {footerButtons.map((btn, index) => (
            <button
              key={index}
              type={btn.type || "button"}
              className={btn.className || "btn btn-secondary"}
              onClick={btn.onClick}
              disabled={btn.disabled}
              style={btn.style}
            >
              {btn.icon && <span className={`me-1 ${btn.icon}`}></span>}
              {btn.label}
            </button>
          ))}
        </div>
      );
    }
    
    return null;
  };

  return (
    <>
      <style>
        {`
          .offcanvas {
            transition: transform 0.3s ease-in-out, visibility 0s linear 0.3s;
          }
          .offcanvas.show {
            transition: transform 0.3s ease-in-out, visibility 0s linear 0s;
          }
          
          /* Footer Styling */
          .offcanvas-footer {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 1rem;
            background-color: #f9fafb;
            border-top: 1px solid #e5e7eb;
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 0.75rem;
            height: auto;
            z-index: 10;
          }

          .offcanvas-footer .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            white-space: nowrap;
            min-width: 85px;
            height: 38px;
            padding: 0.4rem 0.75rem !important;
            font-size: 0.85rem !important;
            vertical-align: middle;
            line-height: 1;
            transition: all 0.3s ease !important;
          }

          .offcanvas-footer .btn-outline-secondary {
            border: 1px solid #d1d5db !important;
            color: #4b5563 !important;
            background-color: white !important;
          }

          .offcanvas-footer .btn-outline-secondary:hover {
            background-color: #1f2937 !important;
            border-color: #1f2937 !important;
            color: white !important;
          }

          .offcanvas-footer .btn-success {
            background-color: #22c55e !important;
            border-color: #22c55e !important;
            color: white !important;
          }

          .offcanvas-footer .btn-success:hover {
            background-color: #16a34a !important;
            border-color: #16a34a !important;
            color: white !important;
          }

          .offcanvas-body {
            padding-bottom: 7rem !important; /* Ensure content doesn't get hidden behind footer */
          }

          @media (max-width: 576px) {
            .offcanvas-footer {
              padding: 0.75rem;
              gap: 0.5rem;
              flex-wrap: wrap;
            }

            .offcanvas-footer .btn {
              flex: 1;
              min-width: auto;
              height: 36px;
              font-size: 0.8rem !important;
              padding: 0.35rem 0.6rem !important;
            }
          }

          /* Ensure PrimeReact dropdown panels appear above sidebar */
          .p-dropdown-panel {
            z-index: 9999 !important;
          }
        `}
      </style>
      <div
        className={`offcanvas offcanvas-end ${show ? "show" : ""} ${className}`}
        tabIndex="-1"
        id={id}
        aria-labelledby={`${id}Label`}
        data-bs-backdrop={false}
        data-bs-scroll="true"
        style={{ 
          width: width, 
          maxWidth: "100%", 
          borderLeft: showLeftBorder ? `${leftBorderWidth} solid ${leftBorderColor}` : "none"
        }}
        aria-modal={show ? "true" : undefined}
        role={show ? "dialog" : undefined}
      >
        <div 
          className={`offcanvas-header ${headerBgColor} ${headerTextColor} offcanvas-header-lg ${headerClassName}`}
          style={headerStyle}
        >
          <h5 className="subtitle fw-normal" id={`${id}Label`}>
            {title}
          </h5>
          <button
            type="button"
            className="btn-close"
            data-bs-theme={headerTextColor.includes("white") ? "dark" : "light"}
            onClick={onClose}
            aria-label="Close"
            style={{ opacity: 1 }}
          ></button>
        </div>

        <div className={`offcanvas-body p-0 ${bodyClassName}`} style={bodyStyle}>
          {children}
        </div>

        {renderFooter()}
      </div>
      {show && (
        <div
          className="offcanvas-backdrop show"
          onClick={backdrop === "static" ? undefined : onClose}
          style={{
            backdropFilter: `blur(${backdropBlur})`,
            WebkitBackdropFilter: `blur(${backdropBlur})`,
            backgroundColor: `rgba(0, 0, 0, ${backdropOpacity})`,
            zIndex: 1040,
            opacity: 0.9,
          }}
        />
      )}
    </>
  );
};

export default MasterSidebar;
