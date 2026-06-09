import { useEffect } from "react";
import { toast } from "react-toastify";
import ScrollingMessagesService from "../services/compliance/ScrollingMessagesService";
import sessionManager from "../utils/SessionManager";

const STORAGE_KEY = "etms_dismissed_announcements";

// Module-level: persists across page navigations for the entire JS session
const shownInSession = new Set();

export function clearAnnouncementSession() {
  shownInSession.clear();
  sessionStorage.removeItem(STORAGE_KEY);
  toast.dismiss({ containerId: "announcements" });
}

// Key includes message content so updated messages re-show even if same ID
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

// Returns light or dark background so the text color is always readable
function getContrastBg(hex) {
  try {
    const h = (hex || "").replace("#", "");
    if (h.length < 6) return "#1e293b";
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.45 ? "#1e293b" : "#f8fafc";
  } catch {
    return "#1e293b";
  }
}

const useAnnouncementToasts = () => {
  useEffect(() => {
    const show = async () => {
      try {
        const userId = sessionManager.getUserSession()?.ID || 0;
        const response = await ScrollingMessagesService.GetAllMessages({ empid: userId });
        const data = typeof response === "string" ? JSON.parse(response) : response;
        const active = Array.isArray(data) ? data.filter((m) => m.Status === "Activated") : [];
        const dismissed = getDismissed();

        active.forEach((msg) => {
          const id = msg.id ?? msg.MessageId;
          const key = getDismissedKey(id, msg.Message);
          // Skip if already dismissed this session or already showing
          if (dismissed.includes(key)) return;
          if (shownInSession.has(key)) return;
          shownInSession.add(key);

          const color = msg.color || msg.Color || "#1e293b";
          const bg = getContrastBg(color);
          const isDark = bg === "#1e293b";

          toast(
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
              <span className="material-icons" style={{ fontSize: "18px", color, flexShrink: 0, marginTop: "1px" }}>
                campaign
              </span>
              <span style={{ fontSize: "13px", lineHeight: "1.5", color, fontWeight: 500 }}>
                {msg.Message}
              </span>
            </div>,
            {
              toastId: `announcement-${id}`,
              containerId: "announcements",
              autoClose: false,
              closeOnClick: false,
              draggable: false,
              theme: isDark ? "dark" : "light",
              style: { background: bg, border: `1px solid ${color}22`, borderLeft: `4px solid ${color}` },
              onClose: () => {
                shownInSession.delete(key);
                markDismissed(id, msg.Message);
              },
              icon: false,
            }
          );
        });
      } catch (err) {
        console.error("Failed to load announcements:", err);
      }
    };

    show();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

export default useAnnouncementToasts;
