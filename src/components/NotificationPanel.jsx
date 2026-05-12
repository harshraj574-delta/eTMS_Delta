import React, { useState, forwardRef } from 'react';
import { OverlayPanel } from 'primereact/overlaypanel';
import { sosService } from '../services/compliance/SOSService';
import useSOSStore from '../store/useSOSStore';
import sessionManager from '../utils/SessionManager';

const formatRelativeTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const NotificationPanel = forwardRef((_, ref) => {
  const sosAlerts = useSOSStore((state) => state.sosAlerts);
  const acknowledgeAlert = useSOSStore((state) => state.acknowledgeAlert);

  const [acknowledgingId, setAcknowledgingId] = useState(null);
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const startAcknowledge = (sosid) => {
    setAcknowledgingId(sosid);
    setRemark('');
    setError('');
  };

  const cancelAcknowledge = () => {
    setAcknowledgingId(null);
    setRemark('');
    setError('');
  };

  const handleConfirm = async (sosid) => {
    if (!remark.trim()) {
      setError('Remark is required.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const userId = sessionManager.getUserSession().ID;
      await sosService.updateSOS({ sosid, remark: remark.trim(), actionby: userId });
      acknowledgeAlert(sosid);
      setAcknowledgingId(null);
      setRemark('');
    } catch {
      setError('Failed to acknowledge. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <OverlayPanel
      ref={ref}
      dismissable
      appendTo={document.body}
      baseZIndex={9999}
      className="notif-panel-op"
      style={{ padding: 0, width: 380, maxWidth: '95vw', borderRadius: 12, boxShadow: '0 10px 40px rgba(0,0,0,0.15)', border: '1px solid #e5e7eb' }}
    >
      <style>{`
        .notif-panel-op {
          z-index: 9999 !important;
          overflow: hidden;
        }
        .notif-panel-op::before,
        .notif-panel-op::after {
          display: none !important;
        }
        .notif-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 16px 12px;
          border-bottom: 1px solid #f3f4f6;
        }
        .notif-panel-title {
          font-size: 15px;
          font-weight: 700;
          color: #1a1a2e;
          margin: 0;
        }
        .notif-section-label {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px 6px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: #9ca3af;
        }
        .notif-section-count {
          background: #ef4444;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 999px;
          min-width: 18px;
          text-align: center;
        }
        .notif-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 16px;
          gap: 10px;
          color: #9ca3af;
        }
        .notif-empty .material-icons {
          font-size: 36px;
          color: #d1d5db;
        }
        .notif-empty-text {
          font-size: 13px;
        }
        .sos-list {
          max-height: 420px;
          overflow-y: auto;
          padding: 0 0 8px;
        }
        .sos-list::-webkit-scrollbar {
          width: 4px;
        }
        .sos-list::-webkit-scrollbar-track {
          background: transparent;
        }
        .sos-list::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 4px;
        }
        .sos-item {
          display: flex;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid #f9fafb;
          transition: background 0.15s;
        }
        .sos-item:last-child {
          border-bottom: none;
        }
        .sos-item:hover {
          background: #fef2f2;
        }
        .sos-icon-wrap {
          flex-shrink: 0;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .sos-icon-wrap .material-icons {
          font-size: 18px;
          color: #ef4444;
        }
        .sos-body {
          flex: 1;
          min-width: 0;
        }
        .sos-badge {
          display: inline-block;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          color: #ef4444;
          background: rgba(239, 68, 68, 0.08);
          padding: 1px 7px;
          border-radius: 4px;
          margin-bottom: 4px;
        }
        .sos-msg {
          font-size: 13px;
          color: #374151;
          line-height: 1.5;
          word-break: break-word;
        }
        .sos-time {
          font-size: 11px;
          color: #9ca3af;
          margin-top: 3px;
        }
        .ack-btn {
          margin-top: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #ef4444;
          background: transparent;
          border: 1px solid rgba(239, 68, 68, 0.35);
          border-radius: 6px;
          padding: 4px 12px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .ack-btn:hover {
          background: rgba(239, 68, 68, 0.06);
          border-color: #ef4444;
        }
        .ack-form {
          margin-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .ack-remark-input {
          font-size: 13px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 6px 10px;
          outline: none;
          width: 100%;
          transition: border-color 0.15s;
        }
        .ack-remark-input:focus {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08);
        }
        .ack-actions {
          display: flex;
          gap: 6px;
        }
        .ack-confirm-btn {
          flex: 1;
          font-size: 12px;
          font-weight: 600;
          background: #ef4444;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 5px 12px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .ack-confirm-btn:hover:not(:disabled) {
          background: #dc2626;
        }
        .ack-confirm-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .ack-cancel-btn {
          font-size: 12px;
          font-weight: 500;
          background: #f3f4f6;
          color: #374151;
          border: none;
          border-radius: 6px;
          padding: 5px 12px;
          cursor: pointer;
          transition: background 0.15s;
        }
        .ack-cancel-btn:hover:not(:disabled) {
          background: #e5e7eb;
        }
        .ack-cancel-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .ack-error {
          font-size: 11px;
          color: #ef4444;
          margin-top: 2px;
        }
      `}</style>

      <div className="notif-panel-header">
        <span className="notif-panel-title">Notifications</span>
      </div>

      <div className="notif-section-label">
        <span>SOS Alerts</span>
        {sosAlerts.length > 0 && (
          <span className="notif-section-count">{sosAlerts.length}</span>
        )}
      </div>

      {sosAlerts.length === 0 ? (
        <div className="notif-empty">
          <span className="material-icons">notifications_none</span>
          <span className="notif-empty-text">No active SOS alerts</span>
        </div>
      ) : (
        <div className="sos-list">
          {sosAlerts.map((alert) => (
            <div key={alert.sosid} className="sos-item">
              <div className="sos-icon-wrap">
                <span className="material-icons">warning</span>
              </div>
              <div className="sos-body">
                <span className="sos-badge">SOS</span>
                <div className="sos-msg">{alert.msg?.trim()}</div>
                {alert.updatedat && (
                  <div className="sos-time">{formatRelativeTime(alert.updatedat)}</div>
                )}
                {acknowledgingId === alert.sosid ? (
                  <div className="ack-form">
                    <input
                      type="text"
                      className="ack-remark-input"
                      placeholder="Remark *"
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !submitting) handleConfirm(alert.sosid);
                        if (e.key === 'Escape') cancelAcknowledge();
                      }}
                      autoFocus
                    />
                    {error && <span className="ack-error">{error}</span>}
                    <div className="ack-actions">
                      <button
                        className="ack-confirm-btn"
                        onClick={() => handleConfirm(alert.sosid)}
                        disabled={submitting}
                      >
                        {submitting ? 'Submitting…' : 'Confirm'}
                      </button>
                      <button
                        className="ack-cancel-btn"
                        onClick={cancelAcknowledge}
                        disabled={submitting}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button className="ack-btn" onClick={() => startAcknowledge(alert.sosid)}>
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </OverlayPanel>
  );
});

NotificationPanel.displayName = 'NotificationPanel';
export default NotificationPanel;
