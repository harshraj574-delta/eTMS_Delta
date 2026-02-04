import React, { useState, useCallback, useEffect } from "react";
import { Dialog } from "primereact/dialog";
import { BiExpand, BiCollapse, BiFullscreen, BiExitFullscreen } from "react-icons/bi";
import { Tooltip } from "primereact/tooltip";

/**
 * EnterpriseDialog - A professional fullscreen dialog component
 * Features:
 * - Modal dialog with enterprise styling
 * - True browser fullscreen toggle
 * - Smooth animations and transitions
 * - Responsive design
 */
const EnterpriseDialog = ({
  visible,
  onHide,
  title,
  children,
  expandTooltip = "Expand",
  className = "",
  style = {},
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Toggle browser fullscreen
  const toggleFullscreen = useCallback(() => {
    const dialogElement = document.querySelector(".enterprise-dialog-content");
    
    if (!document.fullscreenElement) {
      if (dialogElement) {
        dialogElement.requestFullscreen().then(() => {
          setIsFullscreen(true);
        }).catch((err) => {
          console.log("Fullscreen not supported:", err);
        });
      }
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Exit fullscreen when dialog closes
  useEffect(() => {
    if (!visible && isFullscreen) {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  }, [visible, isFullscreen]);

  // Custom header with fullscreen toggle and close button
  const headerTemplate = (
    <div className="enterprise-dialog-header">
      <h5 className="enterprise-dialog-title">{title}</h5>
      <div className="enterprise-dialog-actions">
        <Tooltip target=".fullscreen-toggle-btn" position="bottom" />
        <button
          className="fullscreen-toggle-btn enterprise-icon-btn"
          onClick={toggleFullscreen}
          data-pr-tooltip={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <BiExitFullscreen /> : <BiFullscreen />}
        </button>
        <Tooltip target=".close-btn" position="bottom" />
        <button
          className="close-btn enterprise-close-btn"
          onClick={onHide}
          data-pr-tooltip="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        /* Enterprise Dialog Styling */
        .enterprise-dialog .p-dialog {
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          border: none;
          animation: dialogSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes dialogSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .enterprise-dialog .p-dialog-mask {
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          background: rgba(15, 23, 42, 0.6);
        }

        .enterprise-dialog .p-dialog-header {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          padding: 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .enterprise-dialog .p-dialog-header-icons {
          display: none;
        }

        .enterprise-dialog-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          width: 100%;
        }

        .enterprise-dialog-title {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #fff;
          letter-spacing: -0.01em;
        }

        .enterprise-dialog-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .enterprise-icon-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 1.15rem;
        }

        .enterprise-icon-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.25);
          transform: scale(1.05);
        }

        .enterprise-dialog .p-dialog-content {
          padding: 1.5rem;
          background: #fff;
        }

        .enterprise-dialog-content {
          height: 100%;
          background: #fff;
        }

        /* Close button styling */
        .enterprise-dialog .p-dialog-header .p-dialog-header-close {
          display: none;
        }

        /* Custom close button in actions */
        .enterprise-close-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 1.15rem;
        }

        .enterprise-close-btn:hover {
          background: rgba(239, 68, 68, 0.4);
          border-color: rgba(239, 68, 68, 0.4);
          color: #fff;
        }

        /* Fullscreen mode adjustments */
        .enterprise-dialog-content:fullscreen {
          background: #fff;
          padding: 0;
        }

        .enterprise-dialog-content:fullscreen .fullscreen-chart-area {
          height: 100vh !important;
          padding: 1rem;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .enterprise-dialog .p-dialog {
            margin: 0.5rem;
            border-radius: 16px;
          }

          .enterprise-dialog-header {
            padding: 0.875rem 1rem;
          }

          .enterprise-dialog-title {
            font-size: 1rem;
          }

          .enterprise-dialog .p-dialog-content {
            padding: 1rem;
          }
        }
      `}</style>

      <Dialog
        visible={visible}
        onHide={onHide}
        header={headerTemplate}
        modal
        closable={false}
        className={`enterprise-dialog ${className}`}
        style={{
          width: "95vw",
          maxWidth: "1600px",
          height: "92vh",
          ...style,
        }}
        contentStyle={{
          height: "calc(100% - 70px)",
          overflow: "hidden",
        }}
        breakpoints={{ "1400px": "96vw", "768px": "98vw" }}
      >
        <div className="enterprise-dialog-content">
          <div className="fullscreen-chart-area" style={{ height: "100%" }}>
            {children}
          </div>
        </div>
      </Dialog>
    </>
  );
};

/**
 * ExpandButton - Reusable expand button for chart cards
 */
export const ExpandButton = ({ id, onClick, tooltip = "Expand" }) => (
  <>
    <Tooltip target={`#${id}`} content={tooltip} position="left" />
    <span id={id} className="icon-btn" onClick={onClick}>
      <BiExpand />
    </span>
  </>
);

export default EnterpriseDialog;
