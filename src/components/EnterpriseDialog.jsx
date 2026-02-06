import React, { useEffect, useRef } from "react";
import { Dialog } from "primereact/dialog";
import { BiX } from "react-icons/bi";

const EnterpriseDialog = ({
  visible,
  onHide,
  title,
  children,
  headerExtra,
  width = "95vw",
  height = "90vh",
}) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  const headerTemplate = (
    <div className="enterprise-dialog-header">
      <div className="enterprise-dialog-title-section">
        <h2 className="enterprise-dialog-title">{title}</h2>
      </div>
      <div className="enterprise-dialog-actions">
        {headerExtra}
        <button
          className="enterprise-dialog-close"
          onClick={onHide}
          aria-label="Close dialog"
        >
          <BiX />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        .enterprise-dialog-overlay {
          background: rgba(15, 23, 42, 0.6) !important;
          backdrop-filter: blur(8px) !important;
        }

        .enterprise-dialog {
          border: none !important;
          border-radius: 20px !important;
          box-shadow: 
            0 25px 50px -12px rgba(0, 0, 0, 0.25),
            0 0 0 1px rgba(255, 255, 255, 0.1) !important;
          overflow: hidden !important;
          animation: dialogEnter 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }

        @keyframes dialogEnter {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .enterprise-dialog .p-dialog-header {
          padding: 0 !important;
          border: none !important;
          background: transparent !important;
        }

        .enterprise-dialog .p-dialog-content {
          padding: 0 !important;
          background: #f8fafc !important;
          overflow: hidden !important;
        }

        .enterprise-dialog-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background: white;
          border-bottom: 1px solid #e2e8f0;
        }

        .enterprise-dialog-title-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .enterprise-dialog-title {
          margin: 0;
          font-size: 1.125rem;
          font-weight: 700;
          color: #1e293b;
          letter-spacing: -0.02em;
        }

        .enterprise-dialog-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .enterprise-dialog-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: none;
          background: #f1f5f9;
          border-radius: 10px;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .enterprise-dialog-close:hover {
          background: #fee2e2;
          color: #dc2626;
        }

        .enterprise-dialog-close svg {
          width: 20px;
          height: 20px;
        }

        .enterprise-dialog-body {
          height: calc(100% - 65px);
          padding: 16px;
          overflow: hidden;
        }

        .enterprise-dialog-map-wrapper {
          height: 100%;
          width: 100%;
          border-radius: 16px;
          overflow: hidden;
          background: white;
          box-shadow: 
            0 4px 6px -1px rgba(0, 0, 0, 0.05),
            0 2px 4px -1px rgba(0, 0, 0, 0.03),
            0 0 0 1px rgba(0, 0, 0, 0.03);
        }

        /* Dropdown in dialog header */
        .enterprise-dialog-actions .map-type-selector .p-dropdown {
          min-width: 130px !important;
          height: 36px !important;
          border-radius: 10px !important;
          border: 1px solid #e2e8f0 !important;
          background: #f8fafc !important;
        }

        .enterprise-dialog-actions .map-type-selector .p-dropdown:hover {
          border-color: #6366f1 !important;
          background: white !important;
        }

        .enterprise-dialog-actions .map-type-selector .p-dropdown .p-dropdown-label {
          padding: 8px 12px !important;
          font-size: 0.8125rem !important;
          font-weight: 600 !important;
        }
      `}</style>

      <Dialog
        ref={dialogRef}
        visible={visible}
        onHide={onHide}
        header={headerTemplate}
        modal
        dismissableMask
        draggable={false}
        resizable={false}
        className="enterprise-dialog"
        maskClassName="enterprise-dialog-overlay"
        style={{ width, height }}
        contentStyle={{ height: "100%" }}
        closable={false}
      >
        <div className="enterprise-dialog-body">
          <div className="enterprise-dialog-map-wrapper">{children}</div>
        </div>
      </Dialog>
    </>
  );
};

export default EnterpriseDialog;