import React, { useEffect, useState } from "react";
import { apiService } from "../../services/api";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import Loader from "../common/Loader";

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

const VpStats = ({ filter }) => {
  const [stats, setStats] = useState({});
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
        const effData = typeof effRes === "string" ? JSON.parse(effRes) : effRes;
        const effStats =
          Array.isArray(effData) && effData.length
            ? effData[0]
            : typeof effData === "object"
            ? effData
            : {};

        const overSpeedRes = await apiService.GetChart_OverSpeedcount(payload);
        setStats({ ...mainStats, ...effStats });
        setOverSpeed(overSpeedRes);

        setRetryCount(0);
        setError(null);
      } catch (err) {
        console.error("VpStats Error:", err);
        setError(
          err?.message || "API Error while fetching vehicle performance data"
        );

        if (retryCount < maxRetries) {
          console.log(
            `Auto-retrying VpStats... Attempt ${retryCount + 1}/${maxRetries}`
          );
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 2000);
        } else {
          setStats({});
          setOverSpeed(null);
        }
      }
      setLoading(false);
    };

    fetchStats();
  }, [filter, retryCount]);

  const StatCard = ({
    title,
    value,
    color = "primary",
    index = 0,
    decimals = 0,
    prefix = "",
    suffix = "",
  }) => (
    <motion.div
      className="vp-stat-card"
      data-color={color}
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay: index * 0.1,
        ease: "easeOut",
      }}
    >
      <div className="vp-stat-title">{title}</div>
      <div className="vp-stat-value">
        <AnimatedNumber
          value={value}
          duration={1.2}
          decimals={decimals}
          prefix={prefix}
          suffix={suffix}
        />
      </div>
    </motion.div>
  );

  if (error && retryCount >= maxRetries) {
    return (
      <div className="vp-stats-container">
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
        .vp-stats-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.25rem; 
          padding: 0; 
          margin-bottom: 1rem; 
          background-color: transparent; 
          width: 100%;
        }

        .vp-stat-card {
          background: linear-gradient(to right, #ffffff, #fafbfc);
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid rgba(229, 231, 235, 0.7);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05),
                      0 2px 4px -1px rgba(0,0,0,0.03);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .vp-stat-card::before {
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

        .vp-stat-card[data-color="primary"]::before {
          background: linear-gradient(to right, #6366f1, #8b5cf6);
        }
        .vp-stat-card[data-color="success"]::before {
          background: linear-gradient(to right, #10b981, #34d399);
        }
        .vp-stat-card[data-color="warning"]::before {
          background: linear-gradient(to right, #f59e0b, #fbbf24);
        }
        .vp-stat-card[data-color="danger"]::before {
          background: linear-gradient(to right, #ef4444, #f87171);
        }

        .vp-stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1),
                      0 4px 6px -2px rgba(0,0,0,0.05);
        }

        .vp-stat-card:hover::before {
          opacity: 1;
        }

        .vp-stat-title {
          font-size: 0.875rem;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.75rem;
        }

        .vp-stat-value {
          font-size: 2rem;
          color: #1e293b;
          font-family: "VT323", monospace;
          font-weight: 400;
          font-style: normal;
          line-height: 1.2;
        }

        @media (min-width: 1200px) {
          .vp-stats-container {
            grid-template-columns: repeat(2, minmax(200px, 1fr));
            grid-auto-flow: column;
          }
        }

        @media (max-width: 1199px) and (min-width: 768px) {
          .vp-stats-container {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 767px) {
          .vp-stats-container {
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            padding: 1rem;
          }
          .vp-stat-value {
            font-size: 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .vp-stats-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="vp-stats-container">
        {!loading && (
          <>
            <StatCard
              title="Total Trips"
              value={stats?.totalroute ?? 0}
              decimals={0}
              color="primary"
              index={0}
            />
            <StatCard
              title="On Time Performance"
              value={stats?.routeEffPer ?? 0}
              decimals={2}
              suffix="%"
              color="success"
              index={1}
            />
            <StatCard
              title="Overspeed"
              value={overSpeed?.Overspeedcount ?? 0}
              decimals={0}
              color="danger"
              index={2}
            />
            <StatCard
              title="Breakdown"
              value={stats?.Breakdowncount ?? 0}
              decimals={0}
              color="danger"
              index={3}
            />
            <StatCard
              title="Trips Rejected by Drivers"
              value={stats?.DriverRefusalCount ?? 0}
              decimals={0}
              color="warning"
              index={4}
            />
            <StatCard
              title="Trips Refused by Vendor"
              value={stats?.VendorRefusalCount ?? stats?.Breakdowncount ?? 0}
              decimals={0}
              color="warning"
              index={5}
            />
            <StatCard
              title="Total Vehicles Active"
              value={stats?.OperationalVehicle ?? 0}
              decimals={0}
              color="primary"
              index={6}
            />
          </>
        )}
      </div>
    </>
  );
};

export default React.memo(VpStats);