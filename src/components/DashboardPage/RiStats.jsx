import { useState, useEffect } from "react";
import { apiService } from "../../services/api";
import React from "react";
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
  <div className="ri-card ri-card--skeleton">
    <div className="ri-card__top">
      <div className="ri-skeleton ri-skeleton--icon" />
      <div className="ri-skeleton ri-skeleton--trend" />
    </div>
    <div className="ri-skeleton ri-skeleton--value" />
    <div className="ri-skeleton ri-skeleton--label" />
  </div>
);

// Trend Component
const Trend = ({ value, status }) => {
  if (value === undefined || value === null) return null;
  
  const isPositive = status !== "down";
  
  return (
    <span className={`ri-trend ${isPositive ? "ri-trend--up" : "ri-trend--down"}`}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path
          d={isPositive 
            ? "M6 3L10 8H2L6 3Z" 
            : "M6 9L2 4H10L6 9Z"
          }
          fill="currentColor"
        />
      </svg>
      <AnimatedNumber value={Math.abs(value)} decimals={2} suffix="%" />
    </span>
  );
};

// Mini Sparkline for visual interest
const MiniBar = ({ value, max = 100, color = "#6366f1" }) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  return (
    <div className="ri-mini-bar">
      <motion.div
        className="ri-mini-bar__fill"
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
  subItems,
  showBar,
  barValue,
  barMax,
  index = 0,
}) => {
  return (
    <motion.div
      className="ri-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
    >
      <div className="ri-card__top">
        <span className="ri-card__icon" style={{ color, backgroundColor: `${color}12` }}>
          {icon}
        </span>
        <Trend value={trend} status={trendStatus} />
      </div>
      
      <div className="ri-card__value">
        {value}
        {suffix && <span className="ri-card__suffix">{suffix}</span>}
      </div>
      
      <div className="ri-card__label">{label}</div>
      
      {showBar && (
        <MiniBar value={barValue} max={barMax} color={color} />
      )}
      
      {subItems && (
        <div className="ri-card__sub">
          {subItems.map((item, idx) => (
            <span 
              key={idx} 
              className="ri-card__tag"
              style={{ 
                color: item.color,
                backgroundColor: `${item.color}10`,
                borderColor: `${item.color}20`
              }}
            >
              {item.label}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// Icons
const Icons = {
  Routes: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>
    </svg>
  ),
  Vehicle: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-1.6-3.2C16 6.3 15.5 6 15 6H9c-.5 0-1 .3-1.4.8L6 10l-2.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2"/>
      <circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>
    </svg>
  ),
  Chart: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
    </svg>
  ),
  Shield: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>
    </svg>
  ),
  Clock: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Arrival: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/>
    </svg>
  ),
  Check: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  Timer: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/>
    </svg>
  ),
  User: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/>
    </svg>
  ),
  UserX: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="17" x2="22" y1="8" y2="13"/><line x1="22" x2="17" y1="8" y2="13"/>
    </svg>
  ),
};

const RiStats = ({ filter }) => {
  const [statsData, setStatsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    const fetchRouteCount = async () => {
      setLoading(true);
      setError(null);

      try {
        const obj = {
          sDate: filter.sDate,
          eDate: filter.eDate,
          locationid: filter.locationid || "",
          facilityid: filter?.facilityid || "",
          vendorid: filter?.vendorid || "",
          triptype: filter?.triptype || "",
        };
        const res = await apiService.Getchart_RouteCount(obj);
        let data = [];
        if (Array.isArray(res)) {
          data = res;
        } else if (typeof res === "string") {
          try {
            data = JSON.parse(res);
          } catch (e) {
            data = [];
          }
        }
        if (Array.isArray(data) && data.length > 0) {
          setStatsData(data[0]);
        } else {
          setStatsData({});
        }
        setRetryCount(0);
        setError(null);
      } catch (err) {
        console.error("Route Count Error", err);
        setError(err?.message || "Failed to load stats");
        if (retryCount < maxRetries) {
          setTimeout(() => setRetryCount((prev) => prev + 1), 2000);
        } else {
          setStatsData({});
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRouteCount();
  }, [filter, retryCount]);

  const isPick = filter?.triptype?.toLowerCase() === "p";
  const isDrop = filter?.triptype?.toLowerCase() === "d";

  // Error state
  if (error && retryCount >= maxRetries) {
    return (
      <>
        <style>{styles}</style>
        <div className="ri-error">
          <div className="ri-error__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <span>Failed to load statistics</span>
          <button onClick={() => setRetryCount(0)} className="ri-error__btn">
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
        <div className="ri-stats">
          {[...Array(10)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </>
    );
  }

  const stats = [
    {
      label: "Total Routes",
      value: <AnimatedNumber value={statsData.totalroute ?? 0} decimals={0} />,
      trend: statsData.RouteDiffPer,
      trendStatus: statsData.routediffStatus,
      icon: <Icons.Routes />,
      color: "#6366f1",
      subItems: [
        { label: `${statsData.malecount ?? 0} Male`, color: "#3b82f6" },
        { label: `${statsData.femalecount ?? 0} Female`, color: "#ec4899" },
      ],
    },
    {
      label: "Avg. Occupancy",
      value: <AnimatedNumber value={statsData.AvgOccupancy ?? 0} decimals={2} />,
      trend: statsData.AvgOccupancyDiff,
      trendStatus: statsData.AvgOccupancyDiffStatus,
      icon: <Icons.Vehicle />,
      color: "#8b5cf6",
    },
    {
      label: "Seat Utilization",
      value: <AnimatedNumber value={statsData.SeatUtilizePer || 0} decimals={1} />,
      suffix: "%",
      icon: <Icons.Chart />,
      color: "#06b6d4",
      showBar: true,
      barValue: statsData.SeatUtilizePer || 0,
      barMax: 100,
    },
    {
      label: "Guards Deployed",
      value: <AnimatedNumber value={statsData.guardCount ?? 0} decimals={0} />,
      trend: statsData.guarddiffper,
      trendStatus: statsData.gaurddiffstatus,
      icon: <Icons.Shield />,
      color: "#10b981",
    },
    {
      label: "OTD",
      value: isDrop ? "—" : <AnimatedNumber value={statsData.OTD ?? 0} decimals={2} />,
      suffix: !isDrop && statsData.OTD ? "%" : "",
      trend: !isDrop ? statsData.OTDDiff : undefined,
      trendStatus: statsData.OTDDiffStatus,
      icon: <Icons.Clock />,
      color: "#f59e0b",
    },
    {
      label: "OTA",
      value: isPick ? "—" : <AnimatedNumber value={statsData.OTA ?? 0} decimals={2} />,
      suffix: !isPick && statsData.OTA ? "%" : "",
      trend: !isPick ? statsData.OTADiff : undefined,
      trendStatus: statsData.OTADiffStatus,
      icon: <Icons.Arrival />,
      color: "#f97316",
    },
    {
      label: "Completed",
      value: <AnimatedNumber value={statsData.totalcompleted ?? 0} decimals={0} />,
      trend: statsData.completedPerDiff,
      trendStatus: statsData.completedPerDiffStatus,
      icon: <Icons.Check />,
      color: "#22c55e",
    },
    {
      label: "Avg Trip Time",
      value: <AnimatedNumber value={statsData.AvgTripHour || 0} decimals={1} />,
      suffix: "h",
      icon: <Icons.Timer />,
      color: "#0ea5e9",
    },
    {
      label: "Single Emp. Trips",
      value: <AnimatedNumber value={statsData.SingleEmpTrips || 0} decimals={0} />,
      trend: statsData.SingleEmpTripPerDiff,
      trendStatus: statsData.SingleEmpTripPerDiffStatus,
      icon: <Icons.User />,
      color: "#a855f7",
    },
    {
      label: "No Shows",
      value: <AnimatedNumber value={statsData.totalnoshow ?? 0} decimals={0} />,
      icon: <Icons.UserX />,
      color: "#ef4444",
    },
  ];

  return (
    <>
      <style>{styles}</style>
      <div className="ri-stats">
        {stats.map((stat, index) => (
          <StatCard key={stat.label} index={index} {...stat} />
        ))}
      </div>
    </>
  );
};

const styles = `
  .ri-stats {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 12px;
  }

  @media (max-width: 1400px) {
    .ri-stats { grid-template-columns: repeat(5, 1fr); }
  }

  @media (max-width: 1200px) {
    .ri-stats { grid-template-columns: repeat(4, 1fr); }
  }

  @media (max-width: 992px) {
    .ri-stats { grid-template-columns: repeat(3, 1fr); }
  }

  @media (max-width: 768px) {
    .ri-stats { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  }

  @media (max-width: 480px) {
    .ri-stats { grid-template-columns: 1fr; }
  }

  /* Card */
  .ri-card {
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 16px;
    transition: all 0.2s ease;
    position: relative;
  }

  .ri-card:hover {
    border-color: #d1d5db;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .ri-card__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .ri-card__icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ri-card__value {
    font-size: 26px;
    font-weight: 700;
    color: #111827;
    line-height: 1.1;
    letter-spacing: -0.02em;
    font-variant-numeric: tabular-nums;
  }

  .ri-card__suffix {
    font-size: 14px;
    font-weight: 500;
    color: #6b7280;
    margin-left: 2px;
  }

  .ri-card__label {
    font-size: 12px;
    font-weight: 500;
    color: #6b7280;
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .ri-card__sub {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #f3f4f6;
  }

  .ri-card__tag {
    font-size: 11px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 6px;
    border: 1px solid;
  }

  /* Trend */
  .ri-trend {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 12px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 6px;
    font-variant-numeric: tabular-nums;
  }

  .ri-trend--up {
    color: #059669;
    background: #ecfdf5;
  }

  .ri-trend--down {
    color: #dc2626;
    background: #fef2f2;
  }

  /* Mini Bar */
  .ri-mini-bar {
    height: 4px;
    background: #f3f4f6;
    border-radius: 2px;
    margin-top: 12px;
    overflow: hidden;
  }

  .ri-mini-bar__fill {
    height: 100%;
    border-radius: 2px;
  }

  /* Skeleton */
  .ri-card--skeleton .ri-card__top,
  .ri-card--skeleton .ri-skeleton {
    pointer-events: none;
  }

  .ri-skeleton {
    background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 6px;
  }

  .ri-skeleton--icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }

  .ri-skeleton--trend {
    width: 52px;
    height: 22px;
  }

  .ri-skeleton--value {
    width: 70px;
    height: 28px;
    margin-bottom: 6px;
  }

  .ri-skeleton--label {
    width: 90px;
    height: 14px;
  }

  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* Error */
  .ri-error {
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

  .ri-error__icon {
    display: flex;
  }

  .ri-error__btn {
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

  .ri-error__btn:hover {
    background: #b91c1c;
  }
`;

export default React.memo(RiStats);