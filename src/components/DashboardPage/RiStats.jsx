import { useState, useEffect } from "react";
import { apiService } from "../../services/api";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import React from "react";
import Loader from "../common/Loader";

// ============ CUSTOM TREND ICONS ============
const FiTrendingUp = ({ className }) => (
  <svg
    className={className}
    stroke="currentColor"
    fill="none"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);

const FiTrendingDown = ({ className }) => (
  <svg
    className={className}
    stroke="currentColor"
    fill="none"
    strokeWidth="2"
    viewBox="0 0 24 24"
    strokeLinecap="round"
    strokeLinejoin="round"
    height="1em"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
    <polyline points="17 18 23 18 23 12"></polyline>
  </svg>
);

// ============ ANIMATED NUMBER COMPONENT ============
const AnimatedNumber = ({
  value = 0,
  duration = 1,
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
  }, [value, duration]);

  return (
    <motion.span style={{ display: "inline-block" }}>
      {prefix}
      <motion.span style={{ display: "inline" }}>{springValue}</motion.span>
      {suffix}
    </motion.span>
  );
};

// ============ MAIN COMPONENT ============
const RiStats = ({ filter }) => {
  const [statsData, setStatsData] = useState({});
  const [cancelData, setCancelData] = useState([]);
  const [loading, setLoading] = useState(false);
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
        if (Array.isArray(res)) data = res;
        else if (typeof res === "string") {
          try {
            data = JSON.parse(res);
          } catch {
            data = [];
          }
        }
        setStatsData(Array.isArray(data) && data.length ? data[0] : {});
        setRetryCount(0);
        setError(null);
      } catch (err) {
        console.error("Route Count Error", err);
        setError(err?.message || "Failed to load stats");

        if (retryCount < maxRetries) {
          console.log(
            `Auto-retrying RouteCount... Attempt ${retryCount + 1}/${maxRetries}`
          );
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 2000);
        } else {
          setStatsData({});
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRouteCount();
  }, [filter, retryCount]);

  useEffect(() => {
    const fetchCancelData = async () => {
      try {
        const credentials = {
          sDate: filter.sDate,
          eDate: filter.eDate,
          locationid: filter.locationid || "",
          facilityid: filter?.facilityid || "",
          vendorid: filter?.vendorid || "",
          triptype: filter?.triptype || "",
        };
        const response = await apiService.getchart_CancelReallocation(
          credentials
        );
        let parsed =
          typeof response === "string" ? JSON.parse(response) : response;
        setCancelData(
          Array.isArray(parsed) && parsed.length ? parsed[0] : null
        );
      } catch (error) {
        console.error("API Error:", error);
        setCancelData(null);
      }
    };
    fetchCancelData();
  }, [filter]);

  const isPick = filter?.triptype?.toLowerCase() === "p";
  const isDrop = filter?.triptype?.toLowerCase() === "d";

  const StatCard = ({
    title,
    value,
    trend,
    trendStatus,
    subValue,
    subValueLabel,
    badge1,
    badge2,
    icon,
    color = "primary",
    index = 0,
    decimals = 0,
    prefix = "",
    suffix = "",
    large = false,
  }) => (
    <motion.div
      className={`stat-card ${large ? "stat-card-large" : ""}`}
      data-color={color}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: "easeOut",
      }}
    >
      <div className="stat-card-header">
        {icon && <div className="stat-card-icon">{icon}</div>}
        <div className="stat-card-title">{title}</div>
      </div>

      <div className="stat-card-body">
        <div className="stat-value">
          <AnimatedNumber
            value={Number(value) || 0}
            duration={1.2}
            decimals={decimals}
            prefix={prefix}
            suffix={suffix}
          />
        </div>

        {trend !== undefined && trend !== null && (
          <div className={`stat-trend stat-trend-${trendStatus}`}>
            {trendStatus === "down" ? <FiTrendingDown /> : <FiTrendingUp />}
            <span>{trend}%</span>
          </div>
        )}

        {subValue && (
          <div className="stat-sub-value">
            {subValueLabel}: <strong>{subValue}</strong>
          </div>
        )}
      </div>

      {(badge1 || badge2) && (
        <div className="stat-badges">
          {badge1 && <span className="badge badge-primary">{badge1}</span>}
          {badge2 && <span className="badge badge-danger">{badge2}</span>}
        </div>
      )}
    </motion.div>
  );

  if (error && retryCount >= maxRetries) {
    return (
      <div className="ri-stats-container mb-3">
        <div
          style={{
            gridColumn: "1 / -1",
            padding: "2rem",
            background: "#fff3cd",
            borderRadius: "8px",
            textAlign: "center",
            border: "1px solid #ffc107",
          }}
        >
          <p style={{ color: "#856404", marginBottom: "1rem" }}>
            ⚠️ Failed to load statistics data
          </p>
          <button
            onClick={() => setRetryCount(0)}
            style={{
              padding: "0.5rem 1rem",
              background: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Loader isVisible={loading} fullScreen={false} />

      <style>{`
        .ri-stats-container {
          display: grid;
          grid-template-columns: 1.8fr repeat(5, 1fr);
          grid-template-rows: repeat(2, 1fr);
          gap: 1rem;
          padding: 0;
          margin-bottom: 1rem;
          background-color: transparent;
          width: 100%;
          min-height: 280px;
        }

        .stat-card {
          background: linear-gradient(to right, #ffffff, #fafbfc);
          border-radius: 16px;
          padding: 1.25rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05),
            0 2px 4px -1px rgba(0, 0, 0, 0.03);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(229, 231, 235, 0.7);
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        /* Large card for ROUTES - spans 2 rows and first column */
        .stat-card-large {
          grid-row: span 2;
          grid-column: 1;
        }

        .stat-card::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(to right, #6366f1, #8b5cf6);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .stat-card[data-color="primary"]::before {
          background: linear-gradient(to right, #6366f1, #8b5cf6);
        }

        .stat-card[data-color="success"]::before {
          background: linear-gradient(to right, #10b981, #34d399);
        }

        .stat-card[data-color="warning"]::before {
          background: linear-gradient(to right, #f59e0b, #fbbf24);
        }

        .stat-card[data-color="danger"]::before {
          background: linear-gradient(to right, #ef4444, #f87171);
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
            0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }

        .stat-card:hover::before {
          opacity: 1;
        }

        .stat-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }

        .stat-card-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .stat-card-title {
          font-size: 0.8rem;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          line-height: 1.3;
        }

        .stat-card-large .stat-card-title {
          font-size: 1rem;
        }

        .stat-card-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .stat-value {
          font-size: 1.75rem;
          color: #1e293b;
          line-height: 1.2;
          margin-bottom: 0.5rem;
          font-family: "VT323", monospace;
          font-weight: 400;
          font-style: normal;
        }

        .stat-card-large .stat-value {
          font-size: 3rem;
        }

        .stat-trend {
          display: inline-flex;
          align-items: center;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          width: fit-content;
          margin-bottom: 0.5rem;
        }

        .stat-trend svg {
          margin-right: 0.25rem;
          width: 14px;
          height: 14px;
        }

        .stat-trend-up {
          background-color: rgba(16, 185, 129, 0.1);
          color: #059669;
        }

        .stat-trend-down {
          background-color: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }

        .stat-sub-value {
          font-size: 0.8rem;
          color: #475569;
          margin-bottom: 0.5rem;
        }

        .stat-sub-value strong {
          display: block;
          font-weight: 600;
          color: #1e293b;
          font-size: 0.95rem;
          margin-top: 0.25rem;
        }

        .stat-badges {
          display: flex;
          gap: 0.5rem;
          margin-top: auto;
          flex-wrap: wrap;
        }

        .badge {
          padding: 0.25rem 0.65rem;
          border-radius: 9999px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .badge-primary {
          background-color: rgba(99, 102, 241, 0.1);
          color: #4f46e5;
        }

        .badge-danger {
          background-color: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }

        

        /* Responsive Breakpoints */
        @media (max-width: 1600px) {
          .ri-stats-container {
            grid-template-columns: 1.8fr repeat(4, 1fr);
          }
        }

        @media (max-width: 1400px) {
          .ri-stats-container {
            grid-template-columns: 1.5fr repeat(3, 1fr);
            gap: 0.875rem;
          }
          .stat-card {
            padding: 1rem;
          }
          .stat-value {
            font-size: 1.5rem;
          }
          .stat-card-large .stat-value {
            font-size: 2.5rem;
          }
        }

        @media (max-width: 1200px) {
          .ri-stats-container {
            grid-template-columns: repeat(3, 1fr);
            grid-template-rows: auto;
            gap: 1rem;
          }
          .stat-card-large {
            grid-row: span 1;
            grid-column: auto;
          }
          .stat-card-large .stat-value {
            font-size: 2rem;
          }
        }

        @media (max-width: 992px) {
          .ri-stats-container {
            grid-template-columns: repeat(2, 1fr);
            grid-template-rows: auto;
            gap: 1rem;
          }
          .stat-card {
            padding: 1rem;
          }
          .stat-value {
            font-size: 1.5rem;
          }
          .stat-card-large {
            grid-row: span 1;
            grid-column: auto;
          }
          .stat-card-large .stat-value {
            font-size: 1.75rem;
          }
        }

        @media (max-width: 768px) {
          .ri-stats-container {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.875rem;
            min-height: auto;
          }
          .stat-card {
            padding: 1rem;
          }
          .stat-value {
            font-size: 1.5rem;
          }
          .stat-card-title {
            font-size: 0.75rem;
          }
          .stat-card-icon {
            width: 36px;
            height: 36px;
          }
          .stat-card-large .stat-value {
            font-size: 1.75rem;
          }
        }

        @media (max-width: 576px) {
          .ri-stats-container {
            grid-template-columns: 1fr;
            gap: 0.75rem;
          }
          .stat-card {
            padding: 1rem;
          }
          .stat-value {
            font-size: 1.5rem;
          }
          .stat-card-large .stat-value {
            font-size: 1.75rem;
          }
        }
      `}</style>

      <div className="ri-stats-container">
        {!loading && (
          <>
            {/* ROUTES - Large card spanning 2 rows in first column */}
            <StatCard
              title="Routes"
              value={statsData.totalroute ?? 0}
              trend={statsData.RouteDiffPer ?? 0}
              trendStatus={statsData.routediffStatus}
              subValue={statsData.totalemployee ?? 0}
              subValueLabel="Employees"
              badge1={`${statsData.malecount ?? 0} MALE`}
              badge2={`${statsData.femalecount ?? 0} FEMALE`}
              color="primary"
              index={0}
              decimals={0}
              large={true}
            />

            {/* Row 1 - 5 cards */}
            <StatCard
              title="Avg. Vehicle Occupancy"
              value={statsData.AvgOccupancy ?? 0}
              trend={statsData.AvgOccupancyDiff ?? 0}
              trendStatus={statsData.AvgOccupancyDiffStatus}
              color="success"
              index={1}
              decimals={2}
            />

            <StatCard
              title="Seat Utilization"
              value={statsData.SeatUtilizePer ?? 0}
              color="warning"
              index={2}
              decimals={2}
              suffix="%"
            />

            <StatCard
              title="Guards Deployed"
              value={statsData.guardCount ?? 0}
              trend={statsData.guarddiffper ?? 0}
              trendStatus={statsData.gaurddiffstatus}
              color="primary"
              index={3}
              decimals={0}
            />

            <StatCard
              title="OTD"
              value={
                isDrop ? 0 : isPick ? statsData?.OTD || 0 : statsData?.OTD ?? 0
              }
              trend={statsData.OTDDiff}
              trendStatus={statsData.OTDDiffStatus}
              color="success"
              index={4}
              decimals={2}
              suffix="%"
            />

            {/* Row 2 - 5 cards */}
            <StatCard
              title="OTA"
              value={
                isPick ? 0 : isDrop ? statsData?.OTA || 0 : statsData?.OTA ?? 0
              }
              trend={statsData.OTADiff}
              trendStatus={statsData.OTADiffStatus}
              color="success"
              index={5}
              decimals={2}
              suffix="%"
            />

            <StatCard
              title="Completed"
              value={statsData.totalcompleted ?? 0}
              trend={statsData.completedPerDiff ?? 0}
              trendStatus={statsData.completedPerDiffStatus}
              color="primary"
              index={6}
              decimals={0}
            />

            <StatCard
              title="Avg Trip Time"
              value={statsData.AvgTripHour ?? 0}
              color="warning"
              index={7}
              decimals={2}
              suffix=" hrs"
            />

            <StatCard
              title="Single Emp. Trips"
              value={statsData.SingleEmpTrips ?? 0}
              trend={statsData.SingleEmpTripPerDiff ?? 0}
              trendStatus={statsData.SingleEmpTripPerDiffStatus}
              color="danger"
              index={8}
              decimals={0}
            />

            <StatCard
              title="No Shows"
              value={statsData.totalnoshow ?? 0}
              color="danger"
              index={9}
              decimals={0}
            />
            <StatCard
              title="Adhoc Trips"
              value={statsData.totalAdhocTrip ?? 0}
              color="danger"
              index={8}
              decimals={0}
            />
          </>
        )}
      </div>
    </>
  );
};

export default React.memo(RiStats);