/* Top-right error card for failed route loads. */
export default function MapErrorToast({ message }) {
  return (
    <div
      style={{
        position: "fixed",
        top: "24px",
        right: "24px",
        zIndex: 10001,
        background: "white",
        padding: "16px 20px",
        borderRadius: "12px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        maxWidth: "400px",
        borderLeft: "4px solid #ef4444",
        opacity: message ? 1 : 0,
        visibility: message ? "visible" : "hidden",
        transform: message ? "translateX(0)" : "translateX(100%)",
        transition: "all 0.3s ease-in-out",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            background: "#fee2e2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ef4444",
            fontWeight: "600",
          }}
        >
          !
        </div>
        <div>
          <h3
            style={{
              margin: "0 0 4px 0",
              fontSize: "16px",
              fontWeight: "600",
              color: "#1e293b",
            }}
          >
            Error Loading Routes
          </h3>
          <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
