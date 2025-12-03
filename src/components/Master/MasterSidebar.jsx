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
}) => {
  return (
    <>
      <div
        className={`offcanvas offcanvas-end ${show ? "show" : ""} ${className}`}
        tabIndex="-1"
        id={id}
        aria-labelledby={`${id}Label`}
        data-bs-backdrop={false}
        data-bs-scroll="true"
        style={{ width: width, maxWidth: "100%", visibility: show ? "visible" : "hidden" }}
        aria-modal={show ? "true" : undefined}
        role={show ? "dialog" : undefined}
      >
        <div className="offcanvas-header bg-secondary text-white offcanvas-header-lg">
          <h5 className="subtitle fw-normal" id={`${id}Label`}>
            {title}
          </h5>
          <button
            type="button"
            className="btn-close"
            data-bs-theme="dark"
            onClick={onClose}
            aria-label="Close"
          ></button>
        </div>

        <div className={`offcanvas-body ${bodyClassName}`} style={bodyStyle}>
          {children}
        </div>

        {footer}
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
