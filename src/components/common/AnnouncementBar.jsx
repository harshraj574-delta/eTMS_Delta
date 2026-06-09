import React, { useState, useEffect } from "react";
import ScrollingMessagesService from "../../services/compliance/ScrollingMessagesService";
import sessionManager from "../../utils/SessionManager";

const STORAGE_KEY = "etms_dismissed_announcements";

function getDismissedKey(id, message) {
  return `${id}::${message}`;
}

function getDismissed() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function markDismissed(id, message) {
  const current = getDismissed();
  const key = getDismissedKey(id, message);
  if (!current.includes(key)) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...current, key]));
  }
}

// Returns white or near-black depending on background luminance
function getTextColor(hex) {
  try {
    const h = (hex || "").replace("#", "");
    if (h.length < 6) return "#ffffff";
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.55 ? "#1e293b" : "#ffffff";
  } catch {
    return "#ffffff";
  }
}

// Darken a hex color by a given ratio (0–1) so the banner always has visual depth
function darkenHex(hex, ratio = 0.15) {
  try {
    const h = (hex || "").replace("#", "");
    if (h.length < 6) return hex;
    const r = Math.max(0, Math.round(parseInt(h.substring(0, 2), 16) * (1 - ratio)));
    const g = Math.max(0, Math.round(parseInt(h.substring(2, 4), 16) * (1 - ratio)));
    const b = Math.max(0, Math.round(parseInt(h.substring(4, 6), 16) * (1 - ratio)));
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  } catch {
    return hex;
  }
}

const BAR_HEIGHT = 44;

const AnnouncementBar = ({ onHeightChange }) => {
  const [messages, setMessages] = useState([]);
  const [dismissing, setDismissing] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const userId = sessionManager.getUserSession()?.ID || 0;
        const response = await ScrollingMessagesService.GetAllMessages({ empid: userId });
        const data = typeof response === "string" ? JSON.parse(response) : response;
        const active = Array.isArray(data) ? data.filter((m) => m.Status === "Activated") : [];
        const dismissed = getDismissed();
        const visible = active.filter((m) => {
          const key = getDismissedKey(m.id ?? m.MessageId, m.Message);
          return !dismissed.includes(key);
        });
        setMessages(visible);
      } catch {
        // silently fail
      }
    };
    load();
  }, []);

  useEffect(() => {
    const h = messages.length * BAR_HEIGHT;
    document.documentElement.style.setProperty("--ann-bar-height", `${h}px`);
    onHeightChange?.(h);
    return () => {
      document.documentElement.style.setProperty("--ann-bar-height", "0px");
    };
  }, [messages.length, onHeightChange]);

  const dismiss = (msg) => {
    const id = msg.id ?? msg.MessageId;
    setDismissing((prev) => ({ ...prev, [id]: true }));
    setTimeout(() => {
      markDismissed(id, msg.Message);
      setMessages((prev) => prev.filter((m) => (m.id ?? m.MessageId) !== id));
      setDismissing((prev) => { const n = { ...prev }; delete n[id]; return n; });
    }, 300);
  };

  if (!messages.length) return null;

  return (
    <>
      <style>{`
        .ann-bar-wrap {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 99999;
        }
        .ann-bar-item {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          height: ${BAR_HEIGHT}px;
          padding: 0 52px 0 20px;
          position: relative;
          transition: opacity 0.3s ease, transform 0.3s ease;
        }
        .ann-bar-item.dismissing {
          opacity: 0;
          transform: translateY(-100%);
        }
        .ann-bar-icon {
          font-size: 15px !important;
          flex-shrink: 0;
        }
        .ann-bar-text {
          font-size: 12.5px;
          font-weight: 500;
          letter-spacing: 0.01em;
          line-height: 1.4;
        }
        .ann-bar-close {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(0,0,0,0.12);
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 4px;
          cursor: pointer;
          padding: 2px 4px;
          display: flex;
          align-items: center;
          transition: background 0.15s;
          line-height: 1;
        }
        .ann-bar-close:hover {
          background: rgba(0,0,0,0.22);
        }
        .ann-bar-close .material-icons {
          font-size: 14px !important;
        }
      `}</style>
      <div className="ann-bar-wrap">
        {messages.map((msg) => {
          const id = msg.id ?? msg.MessageId;
          const bg = msg.color || msg.Color || "#4a36ec";
          const borderColor = darkenHex(bg, 0.18);
          const textColor = getTextColor(bg);
          return (
            <div
              key={id}
              className={`ann-bar-item${dismissing[id] ? " dismissing" : ""}`}
              style={{
                background: bg,
                borderBottom: `2px solid ${borderColor}`,
              }}
            >
              <span
                className="material-icons ann-bar-icon"
                style={{ color: textColor }}
              >
                campaign
              </span>
              <span className="ann-bar-text" style={{ color: textColor }}>
                {msg.Message}
              </span>
              <button className="ann-bar-close" onClick={() => dismiss(msg)}>
                <span className="material-icons" style={{ color: textColor }}>close</span>
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default AnnouncementBar;
