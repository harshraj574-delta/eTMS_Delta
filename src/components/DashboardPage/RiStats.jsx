import { useState, useEffect } from "react";
import { apiService } from "../../services/api";
import { FiTrendingUp, FiTrendingDown } from "react-icons/fi";
import {
  BsSignpost2,
  BsTruck,
  BsBarChartLine,
  BsShieldCheck,
  BsClock,
  BsClockHistory,
  BsCheckCircle,
  BsStopwatch,
  BsPerson,
  BsPersonX,
} from "react-icons/bs";
import React from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

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
  }, [value, duration, motionValue]);

  return (
    <motion.span style={{ display: "inline-block" }}>
      {prefix}
      <motion.span style={{ display: "inline" }}>{springValue}</motion.span>
      {suffix}
    </motion.span>
  );
};

// Skeleton Card Component for loading state
const SkeletonCard = () => (
  <div className="col">
    <div
      className="bg-white rounded-4 shadow-sm h-100 p-3"
      style={{ minHeight: "140px" }}
    >
      <div className="placeholder-glow d-flex flex-column h-100">
        <div className="d-flex justify-content-between mb-2">
          <span
            className="placeholder col-4 rounded"
            style={{ height: "28px" }}
          />
          <span
            className="placeholder rounded"
            style={{ width: "40px", height: "40px" }}
          />
        </div>
        <span
          className="placeholder col-6 rounded mb-2"
          style={{ height: "12px" }}
        />
        <div className="mt-auto">
          <span
            className="placeholder col-5 rounded"
            style={{ height: "14px" }}
          />
        </div>
      </div>
    </div>
  </div>
);

const RiStats = ({ filter }) => {
  const [statsData, setStatsData] = useState({});
  const [cancelData, setCancelData] = useState([]);
  const [loading, setLoading] = useState(true); // Start with true
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Fetch Route Count Stats
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

  // Fetch Cancel Reallocation
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

        const response =
          await apiService.getchart_CancelReallocation(credentials);

        let parsed = [];

        if (typeof response === "string") {
          try {
            parsed = JSON.parse(response);
          } catch (e) {
            console.error("Failed to parse string response:", e);
            setCancelData(null);
            return;
          }
        } else {
          parsed = response;
        }

        if (Array.isArray(parsed) && parsed.length > 0) {
          setCancelData(parsed[0]);
        } else {
          setCancelData(null);
        }
      } catch (error) {
        console.error("API Error:", error);
        setCancelData(null);
      }
    };

    fetchCancelData();
  }, [filter]);

  const cancellationPer = cancelData?.CancellationPer ?? 0;
  const reallocationPer = cancelData?.reallocationPer ?? 0;
  const isPick = filter?.triptype?.toLowerCase() === "pick";
  const isDrop = filter?.triptype?.toLowerCase() === "drop";

  // Error state render
  if (error && retryCount >= maxRetries) {
    return (
      <div
        className="row d-flex align-items-center"
        style={{ minHeight: "180px" }}
      >
        <div className="col-12">
          <div
            style={{
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
      </div>
    );
  }

  // Loading state - show skeleton cards
  if (loading) {
    return (
      <div className="row g-3 row-cols-1 row-cols-sm-2 row-cols-lg-5">
        {[...Array(10)].map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  // Hover effect style
  const cardHoverStyle = {
    transition: "all 0.3s ease",
    cursor: "default",
  };

  const handleMouseEnter = (e) => {
    e.currentTarget.style.transform = "translateY(-5px)";
    e.currentTarget.style.boxShadow = "0 1rem 3rem rgba(0,0,0,.175)";
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "0 .125rem .25rem rgba(0,0,0,.075)";
  };

  const StatCard = ({
    title,
    value,
    suffix,
    diff,
    diffStatus,
    diffSuffix,
    subtext,
    subtextClass,
    badge1,
    badge2,
    icon: Icon,
  }) => (
    <div className="col">
      <div
        className="bg-white rounded-4 shadow-sm h-100 position-relative overflow-hidden p-3"
        style={cardHoverStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Icon at top right */}
        {Icon && (
          <div
            className="position-absolute d-flex align-items-center justify-content-center"
            style={{
              top: "12px",
              right: "12px",
              width: "40px",
              height: "40px",
              backgroundColor: "#f5f5f5",
              borderRadius: "10px",
            }}
          >
            <Icon size={20} color="#1a1a1a" />
          </div>
        )}

        <div className="d-flex flex-column h-100 justify-content-between">
          <div>
            <div className="d-flex justify-content-between align-items-start mb-2">
              <h3 className="mb-0" style={{ paddingRight: Icon ? "50px" : 0 }}>
                <strong className="fs-4 fw-bold">
                  {value}
                  {suffix && (
                    <small className="fs-6 text-muted ms-1">{suffix}</small>
                  )}
                </strong>
              </h3>
            </div>
            <div
              className="small fw-bold text-uppercase text-muted mb-2"
              style={{ letterSpacing: "0.5px", fontSize: "0.75rem" }}
            >
              {title}
            </div>
          </div>

          <div>
            {diff !== undefined && (
              <div
                className={`d-flex align-items-center small fw-bold ${diffStatus === "down" ? "text-danger" : "text-success"}`}
              >
                {diffStatus === "down" ? (
                  <FiTrendingDown className="me-1" />
                ) : (
                  <FiTrendingUp className="me-1" />
                )}
                <AnimatedNumber
                  value={diff}
                  duration={1.2}
                  decimals={2}
                  suffix={diffSuffix || " %"}
                />
              </div>
            )}

            {subtext && (
              <div className={`small mt-1 ${subtextClass}`}>{subtext}</div>
            )}

            {(badge1 || badge2) && (
              <div className="d-flex gap-2 mt-2">
                {badge1}
                {badge2}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Main render - only shows after data is loaded
  return (
    <div className="row g-3 row-cols-1 row-cols-sm-2 row-cols-lg-5">
      {/* Routes */}
      <StatCard
        title="Routes"
        icon={BsSignpost2}
        value={
          <AnimatedNumber
            value={statsData.totalroute ?? 0}
            duration={1.2}
            decimals={0}
          />
        }
        diff={statsData.RouteDiffPer ?? 0}
        diffStatus={statsData.routediffStatus}
        subtext={
          <span className="text-warning">
            <AnimatedNumber
              value={statsData.totalemployee ?? 0}
              duration={1.2}
              decimals={0}
              suffix=" Employees"
            />
          </span>
        }
        badge1={
          <span className="badge bg-primary-subtle rounded-pill text-dark border border-primary-subtle">
            <AnimatedNumber
              value={statsData.malecount ?? 0}
              duration={1.2}
              decimals={0}
              suffix=" Male"
            />
          </span>
        }
        badge2={
          <span className="badge bg-danger-subtle rounded-pill text-dark border border-danger-subtle">
            <AnimatedNumber
              value={statsData.femalecount ?? 0}
              duration={1.2}
              decimals={0}
              suffix=" Female"
            />
          </span>
        }
      />

      {/* Avg. Vehicle Occupancy */}
      <StatCard
        title="Avg. Vehicle Occupancy"
        icon={BsTruck}
        value={
          <AnimatedNumber
            value={statsData.AvgOccupancy ?? 0}
            duration={1.2}
            decimals={2}
          />
        }
        diff={statsData.AvgOccupancyDiff ?? 0}
        diffStatus={statsData.AvgOccupancyDiffStatus}
        subtextClass="text-danger"
      />

      {/* Seat Utilization */}
      <StatCard
        title="Seat Utilization"
        icon={BsBarChartLine}
        value={
          <AnimatedNumber
            value={statsData.SeatUtilizePer || 0}
            duration={1.2}
            decimals={2}
          />
        }
        suffix="%"
      />

      {/* Guards Deployed */}
      <StatCard
        title="Guards Deployed"
        icon={BsShieldCheck}
        value={
          <AnimatedNumber
            value={statsData.guardCount ?? 0}
            duration={1.2}
            decimals={0}
          />
        }
        diff={statsData.guarddiffper ?? 0}
        diffStatus={statsData.gaurddiffstatus}
      />

      {/* OTD */}
      <StatCard
        title="OTD"
        icon={BsClock}
        value={
          isDrop ? (
            "N/A"
          ) : isPick ? (
            statsData?.OTD > 0 ? (
              <AnimatedNumber
                value={statsData.OTD}
                duration={1.2}
                decimals={2}
              />
            ) : (
              "N/A"
            )
          ) : statsData?.OTD != null ? (
            <AnimatedNumber
              value={statsData.OTD}
              duration={1.2}
              decimals={2}
            />
          ) : (
            "0"
          )
        }
        suffix={
          !isDrop && (isPick ? statsData?.OTD > 0 : statsData?.OTD != null)
            ? "%"
            : ""
        }
        diff={
          !isDrop &&
          (isPick ? statsData?.OTDDiff > 0 : statsData?.OTDDiff != null)
            ? statsData.OTDDiff
            : undefined
        }
        diffStatus={statsData.OTDDiffStatus}
      />

      {/* OTA */}
      <StatCard
        title="OTA"
        icon={BsClockHistory}
        value={
          isPick ? (
            "N/A"
          ) : isDrop ? (
            statsData?.OTA > 0 ? (
              <AnimatedNumber
                value={statsData.OTA}
                duration={1.2}
                decimals={2}
              />
            ) : (
              "N/A"
            )
          ) : statsData?.OTA != null ? (
            <AnimatedNumber
              value={statsData.OTA}
              duration={1.2}
              decimals={2}
            />
          ) : (
            "0"
          )
        }
        suffix={
          !isPick && (isDrop ? statsData?.OTA > 0 : statsData?.OTA != null)
            ? "%"
            : ""
        }
        diff={
          !isPick &&
          (isDrop ? statsData?.OTADiff > 0 : statsData?.OTADiff != null)
            ? statsData.OTADiff
            : undefined
        }
        diffStatus={statsData.OTADiffStatus}
      />

      {/* Completed */}
      <StatCard
        title="Completed"
        icon={BsCheckCircle}
        value={
          <AnimatedNumber
            value={statsData.totalcompleted ?? 0}
            duration={1.2}
            decimals={0}
          />
        }
        diff={statsData.completedPerDiff ?? 0}
        diffStatus={statsData.completedPerDiffStatus}
      />

      {/* Avg Trip Time */}
      <StatCard
        title="Avg Trip Time"
        icon={BsStopwatch}
        value={
          <AnimatedNumber
            value={statsData.AvgTripHour || 0}
            duration={1.2}
            decimals={2}
            suffix=" hrs"
          />
        }
        subtext="Avg Trip Time"
        subtextClass="text-primary fw-bold"
      />

      {/* Single Emp. Trips */}
      <StatCard
        title="Single Emp. Trips"
        icon={BsPerson}
        value={
          <AnimatedNumber
            value={statsData.SingleEmpTrips || 0}
            duration={1.2}
            decimals={0}
          />
        }
        diff={statsData.SingleEmpTripPerDiff ?? 0}
        diffStatus={statsData.SingleEmpTripPerDiffStatus}
        subtext="Single Emp. Trips"
        subtextClass="text-warning fw-bold"
      />

      {/* No Shows */}
      <StatCard
        title="No Shows"
        icon={BsPersonX}
        value={
          <AnimatedNumber
            value={statsData.totalnoshow ?? 0}
            duration={1.2}
            decimals={0}
          />
        }
        subtext="No Shows"
        subtextClass="text-danger fw-bold"
      />
    </div>
  );
};

export default React.memo(RiStats);