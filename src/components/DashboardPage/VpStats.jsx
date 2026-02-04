import React, { useEffect, useState } from "react";
import { apiService } from "../../services/api";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

// Animated Number Component
const AnimatedNumber = ({
  value = 0,
  duration = 0.8,
  decimals,
  prefix = "",
  suffix = "",
}) => {
  const inferredDecimals =
    typeof value === "number" && value % 1 !== 0 ? 2 : 0;
  const precision = decimals ?? inferredDecimals;

  const motionValue = useMotionValue(0);
  const springValue = useTransform(motionValue, (latest) =>
    Number(latest).toFixed(precision)
  );

  useEffect(() => {
    const controls = animate(motionValue, Number(value) || 0, {
      duration,
      ease: "easeOut",
    });
    return controls.stop;
  }, [value, duration, motionValue]);

  return (
    <motion.span>
      {prefix}
      <motion.span>{springValue}</motion.span>
      {suffix}
    </motion.span>
  );
};

// Compact Skeleton
const SkeletonCard = () => (
  <div className="vp-card vp-card--skeleton">
    <div className="vp-card__top">
      <div className="vp-skeleton vp-skeleton--icon" />
      <div className="vp-skeleton vp-skeleton--trend" />
    </div>
    <div className="vp-skeleton vp-skeleton--value" />
    <div className="vp-skeleton vp-skeleton--label" />
  </div>
);

// Trend Component
const Trend = ({ value, status }) => {
  if (value === undefined || value === null) return null;

  const isPositive = status !== "down";

  return (
    <span
      className={`vp-trend ${isPositive ? "vp-trend--up" : "vp-trend--down"}`}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path
          d={isPositive ? "M6 3L10 8H2L6 3Z" : "M6 9L2 4H10L6 9Z"}
          fill="currentColor"
        />
      </svg>
      <AnimatedNumber value={Math.abs(value)} decimals={2} suffix="%" />
    </span>
  );
};

// Mini Bar for visual interest
const MiniBar = ({ value, max = 100, color = "#6366f1" }) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="vp-mini-bar">
      <motion.div
        className="vp-mini-bar__fill"
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ backgroundColor: color }}
      />
    </div>
  );
};

// Stat Card Component
const StatCard = ({
  label,
  value,
  suffix,
  trend,
  trendStatus,
  icon,
  color = "#6366f1",
  showBar,
  barValue,
  barMax,
  index = 0,
}) => {
  return (
    <motion.div
      className="vp-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
    >
      <div className="vp-card__top">
        <span
          className="vp-card__icon"
          style={{ color, backgroundColor: `${color}12` }}
        >
          {icon}
        </span>
        <Trend value={trend} status={trendStatus} />
      </div>

      <div className="vp-card__value">
        {value}
        {suffix && <span className="vp-card__suffix">{suffix}</span>}
      </div>

      <div className="vp-card__label">{label}</div>

      {showBar && <MiniBar value={barValue} max={barMax} color={color} />}
    </motion.div>
  );
};

// Icons
const Icons = {
  Routes: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="6" cy="19" r="3" />
      <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
      <circle cx="18" cy="5" r="3" />
    </svg>
  ),
  Clock: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Speed: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
      <path d="M12 12L19.5 4.5" />
    </svg>
  ),
  Alert: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  UserX: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="17" x2="22" y1="8" y2="13" />
      <line x1="22" x2="17" y1="8" y2="13" />
    </svg>
  ),
  XCircle: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  Vehicle: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-1.6-3.2C16 6.3 15.5 6 15 6H9c-.5 0-1 .3-1.4.8L6 10l-2.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  ),
};

const VpStats = ({ filter }) => {
  const [statsData, setStatsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overSpeed, setOverSpeed] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);

      try {
        const payload = {
          sDate: filter.sDate,
          eDate: filter.eDate,
          locationid: filter?.locationid || 1,
          facilityid: filter?.facilityid || "",
          vendorid: filter?.vendorid || "",
          triptype: filter?.triptype || "",
        };

        const routeRes = await apiService.get_VProutecount(payload);
        const routeData =
          typeof routeRes === "string" ? JSON.parse(routeRes) : routeRes;
        const mainStats = Array.isArray(routeData) ? routeData[0] || {} : {};

        const effRes = await apiService.getchart_Efficiency(payload);
        const effData =
          typeof effRes === "string" ? JSON.parse(effRes) : effRes;
        const effStats =
          Array.isArray(effData) && effData.length
            ? effData[0]
            : typeof effData === "object"
              ? effData
              : {};

        const overSpeedRes = await apiService.GetChart_OverSpeedcount(payload);
        setStatsData({ ...mainStats, ...effStats });
        setOverSpeed(overSpeedRes);

        setRetryCount(0);
        setError(null);
      } catch (err) {
        console.error("VpStats Error:", err);
        setError(
          err?.message || "API Error while fetching vehicle performance data"
        );

        if (retryCount < maxRetries) {
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 2000);
        } else {
          setStatsData({});
          setOverSpeed(null);
        }
      }
      setLoading(false);
    };

    fetchStats();
  }, [filter, retryCount]);

  // Error state
  if (error && retryCount >= maxRetries) {
    return (
      <>
        <style>{styles}</style>
        <div className="vp-error">
          <div className="vp-error__icon">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <span>Failed to load statistics</span>
          <button onClick={() => setRetryCount(0)} className="vp-error__btn">
            Retry
          </button>
        </div>
      </>
    );
  }

  // Loading state
  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <div className="vp-stats">
          {[...Array(7)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </>
    );
  }

  const stats = [
    {
      label: "Total Trips",
      value: <AnimatedNumber value={statsData.totalroute ?? 0} decimals={0} />,
      icon: <Icons.Routes />,
      color: "#6366f1",
    },
    {
      label: "On Time Performance",
      value: (
        <AnimatedNumber value={statsData.routeEffPer ?? 0} decimals={2} />
      ),
      suffix: "%",
      icon: <Icons.Clock />,
      color: "#10b981",
      showBar: true,
      barValue: statsData.routeEffPer || 0,
      barMax: 100,
    },
    {
      label: "Overspeed",
      value: (
        <AnimatedNumber value={overSpeed?.Overspeedcount ?? 0} decimals={0} />
      ),
      icon: <Icons.Speed />,
      color: "#ef4444",
    },
    {
      label: "Breakdown",
      value: (
        <AnimatedNumber value={statsData.Breakdowncount ?? 0} decimals={0} />
      ),
      icon: <Icons.Alert />,
      color: "#ef4444",
    },
    {
      label: "Trips Rejected by Drivers",
      value: (
        <AnimatedNumber
          value={statsData.DriverRefusalCount ?? 0}
          decimals={0}
        />
      ),
      icon: <Icons.UserX />,
      color: "#f59e0b",
    },
    {
      label: "Trips Refused by Vendor",
      value: (
        <AnimatedNumber
          value={statsData.VendorRefusalCount ?? statsData.Breakdowncount ?? 0}
          decimals={0}
        />
      ),
      icon: <Icons.XCircle />,
      color: "#f59e0b",
    },
    {
      label: "Total Vehicles Active",
      value: (
        <AnimatedNumber
          value={statsData.OperationalVehicle ?? 0}
          decimals={0}
        />
      ),
      icon: <Icons.Vehicle />,
      color: "#8b5cf6",
    },
  ];

  return (
    <>
      <style>{styles}</style>
      <div className="vp-stats">
        {stats.map((stat, index) => (
          <StatCard key={stat.label} index={index} {...stat} />
        ))}
      </div>
    </>
  );
};

const styles = `
  .vp-stats {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 12px;
  }

  @media (max-width: 1600px) {
    .vp-stats { 
      grid-template-columns: repeat(4, 1fr); 
    }
  }

  @media (max-width: 1200px) {
    .vp-stats { 
      grid-template-columns: repeat(4, 1fr); 
    }
  }

  @media (max-width: 992px) {
    .vp-stats { 
      grid-template-columns: repeat(3, 1fr); 
    }
  }

  @media (max-width: 768px) {
    .vp-stats { 
      grid-template-columns: repeat(2, 1fr); 
      gap: 10px; 
    }
  }

  @media (max-width: 480px) {
    .vp-stats { 
      grid-template-columns: 1fr; 
    }
  }

  /* Card */
  .vp-card {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 16px;
    transition: all 0.2s ease;
    position: relative;
  }

  .vp-card:hover {
    border-color: #d1d5db;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .vp-card__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .vp-card__icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .vp-card__value {
    font-size: 26px;
    font-weight: 700;
    color: #111827;
    line-height: 1.1;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
  }

  .vp-card__suffix {
    font-size: 14px;
    font-weight: 500;
    color: #6b7280;
    margin-left: 2px;
  }

  .vp-card__label {
    font-size: 12px;
    font-weight: 500;
    color: #6b7280;
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  /* Trend */
  .vp-trend {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 12px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 6px;
    font-variant-numeric: tabular-nums;
  }

  .vp-trend--up {
    color: #059669;
    background: #ecfdf5;
  }

  .vp-trend--down {
    color: #dc2626;
    background: #fef2f2;
  }

  /* Mini Bar */
  .vp-mini-bar {
    height: 4px;
    background: #f3f4f6;
    border-radius: 2px;
    margin-top: 12px;
    overflow: hidden;
  }

  .vp-mini-bar__fill {
    height: 100%;
    border-radius: 2px;
  }

  /* Skeleton */
  .vp-card--skeleton .vp-card__top,
  .vp-card--skeleton .vp-skeleton {
    pointer-events: none;
  }

  .vp-skeleton {
    background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
    background-size: 200% 100%;
    animation: vp-shimmer 1.5s infinite;
    border-radius: 6px;
  }

  .vp-skeleton--icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }

  .vp-skeleton--trend {
    width: 52px;
    height: 22px;
  }

  .vp-skeleton--value {
    width: 70px;
    height: 28px;
    margin-bottom: 6px;
  }

  .vp-skeleton--label {
    width: 90px;
    height: 14px;
  }

  @keyframes vp-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* Error */
  .vp-error {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 16px 24px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 12px;
    color: #dc2626;
    font-size: 14px;
    font-weight: 500;
  }

  .vp-error__icon {
    display: flex;
  }

  .vp-error__btn {
    padding: 6px 14px;
    background: #dc2626;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }

  .vp-error__btn:hover {
    background: #b91c1c;
  }
`;

export default React.memo(VpStats);