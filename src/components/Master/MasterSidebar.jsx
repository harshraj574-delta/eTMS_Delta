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
          visibility: show ? "visible" : "hidden",
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

        <div className={`offcanvas-body ${bodyClassName}`} style={bodyStyle}>
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
