import { useState, useEffect } from "react";
import { apiService } from "../../services/api";
import { FiTrendingUp, FiTrendingDown } from "react-icons/fi";
import React from "react";
import Loader from "../common/Loader";
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

const RiStats = ({ filter }) => {
  const [statsData, setStatsData] = useState({});
  const [cancelData, setCancelData] = useState([]);
  const [loading, setLoading] = useState(false);
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

        const response = await apiService.getchart_CancelReallocation(
          credentials
        );

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

  if (error && retryCount >= maxRetries) {
    return (
      <div className="row d-flex align-items-center" style={{ minHeight:
          "400px" }}>
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

  return (
    <>
      <Loader isVisible={loading} fullScreen={false} />

      <div className="row d-flex align-items-stretch">
        <div className="col-lg-12 col-xl-7 d-flex">
          <motion.div
            className="cardNew w-100"
            style={{
              display: "flex",
              justifyContent: "center",
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <ul className="py-2">
              <motion.li
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <h3>
                  <strong>
                    <AnimatedNumber
                      value={statsData.totalroute ?? 0}
                      duration={1.2}
                      decimals={0}
                    />
                  </strong>
                  <span className="subtitle_sm">Routes</span>
                </h3>
                <span
                  className={`overline_text d-flex align-items-center ${
                    statsData.routediffStatus === "down"
                      ? "text-danger"
                      : "text-success"
                  }`}
                >
                  {statsData.routediffStatus === "down" ? (
                    <FiTrendingDown className="me-1" />
                  ) : (
                    <FiTrendingUp className="me-1" />
                  )}
                  <AnimatedNumber
                    value={statsData.RouteDiffPer ?? 0}
                    duration={1.2}
                    decimals={2}
                    suffix=" %"
                  />
                </span>

                <span className="overline_text text-warning">
                  <AnimatedNumber
                    value={statsData.totalemployee ?? 0}
                    duration={1.2}
                    decimals={0}
                    suffix=" Employees"
                  />
                </span>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="badge bg-primary-subtle rounded-pill text-dark my-2 me-2">
                    <AnimatedNumber
                      value={statsData.malecount ?? 0}
                      duration={1.2}
                      decimals={0}
                      suffix=" Male"
                    />
                  </span>
                  <span className="badge bg-danger-subtle rounded-pill text-dark">
                    <AnimatedNumber
                      value={statsData.femalecount ?? 0}
                      duration={1.2}
                      decimals={0}
                      suffix=" Female"
                    />
                  </span>
                </div>
              </motion.li>
              <motion.li
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h3>
                  <strong>
                    <AnimatedNumber
                      value={statsData.AvgOccupancy ?? 0}
                      duration={1.2}
                      decimals={2}
                    />
                  </strong>
                </h3>
                <span className="subtitle_sm">Avg. Vehicle Occupancy</span>
                <span
                  className={`overline_text d-flex align-items-center ${
                    statsData.AvgOccupancyDiffStatus === "down"
                      ? "text-danger"
                      : "text-success"
                  }`}
                >
                  {statsData.AvgOccupancyDiffStatus === "down" ? (
                    <FiTrendingDown className="me-1" />
                  ) : (
                    <FiTrendingUp className="me-1" />
                  )}
                  <AnimatedNumber
                    value={statsData.AvgOccupancyDiff ?? 0}
                    duration={1.2}
                    decimals={2}
                    suffix=" %"
                  />
                </span>
              </motion.li>
              <motion.li
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h3>
                  <strong>
                    <AnimatedNumber
                      value={statsData.SeatUtilizePer || 0}
                      duration={1.2}
                      decimals={2}
                    />
                    <small className="fs-6 text-muted">%</small>
                  </strong>
                </h3>
                <span className="subtitle_sm">Seat Utilization</span>
              </motion.li>

              <motion.li
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <h3>
                  <strong>
                    <AnimatedNumber
                      value={statsData.guardCount ?? 0}
                      duration={1.2}
                      decimals={0}
                    />
                  </strong>
                </h3>
                <span className="subtitle_sm">Guards Deployed</span>

                <span
                  className={`overline_text d-flex align-items-center ${
                    statsData.gaurddiffstatus === "down"
                      ? "text-danger"
                      : "text-success"
                  }`}
                >
                  {statsData.gaurddiffstatus === "down" ? (
                    <FiTrendingDown className="me-1" />
                  ) : (
                    <FiTrendingUp className="me-1" />
                  )}
                  <AnimatedNumber
                    value={statsData.guarddiffper ?? 0}
                    duration={1.2}
                    decimals={2}
                    suffix=" %"
                  />
                </span>
              </motion.li>
            </ul>
          </motion.div>
        </div>
        <div
          className="col-lg-12 col-xl-5 d-flex mt-3 mt-xl-0"
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <motion.div
            className="cardNew w-100  p-0 mb-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
          >
            <ul className="mb-2 last_stats">
              {/* ---------- OTD ---------- */}
              <motion.li
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h3>
                  <strong>
                    {isDrop ? (
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
                    )}
                    <small className="fs-6 text-muted">%</small>
                  </strong>
                </h3>
                <span
                  className={`overline_text d-flex align-items-center ${
                    statsData.OTDDiffStatus === "down"
                      ? "text-danger"
                      : "text-success"
                  }`}
                >
                  {isDrop ? (
                    "N/A"
                  ) : isPick ? (
                    statsData?.OTDDiff > 0 ? (
                      <>
                        {statsData.OTDDiffStatus === "down" ? (
                          <FiTrendingDown className="me-1" />
                        ) : (
                          <FiTrendingUp className="me-1" />
                        )}
                        <AnimatedNumber
                          value={statsData.OTDDiff}
                          duration={1.2}
                          decimals={2}
                          suffix=" %"
                        />
                      </>
                    ) : (
                      "N/A"
                    )
                  ) : statsData?.OTDDiff != null ? (
                    <>
                      {statsData.OTDDiffStatus === "down" ? (
                        <FiTrendingDown className="me-1" />
                      ) : (
                        <FiTrendingUp className="me-1" />
                      )}
                      <AnimatedNumber
                        value={statsData.OTDDiff}
                        duration={1.2}
                        decimals={2}
                        suffix=" %"
                      />
                    </>
                  ) : (
                    "0 %"
                  )}
                </span>
                <span className="subtitle_sm">OTD</span>
              </motion.li>

              {/* ---------- OTA ---------- */}
              <motion.li
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h3>
                  <strong>
                    {isPick ? (
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
                    )}
                    <small className="fs-6 text-muted">%</small>
                  </strong>
                </h3>
                <span
                  className={`overline_text d-flex align-items-center ${
                    statsData.OTADiffStatus === "down"
                      ? "text-danger"
                      : "text-success"
                  }`}
                >
                  {isPick ? (
                    "N/A"
                  ) : isDrop ? (
                    statsData?.OTADiff > 0 ? (
                      <>
                        {statsData.OTADiffStatus === "down" ? (
                          <FiTrendingDown className="me-1" />
                        ) : (
                          <FiTrendingUp className="me-1" />
                        )}
                        <AnimatedNumber
                          value={statsData.OTADiff}
                          duration={1.2}
                          decimals={2}
                          suffix=" %"
                        />
                      </>
                    ) : (
                      "N/A"
                    )
                  ) : statsData?.OTADiff != null ? (
                    <>
                      {statsData.OTADiffStatus === "down" ? (
                        <FiTrendingDown className="me-1" />
                      ) : (
                        <FiTrendingUp className="me-1" />
                      )}
                      <AnimatedNumber
                        value={statsData.OTADiff}
                        duration={1.2}
                        decimals={2}
                        suffix=" %"
                      />
                    </>
                  ) : (
                    "0 %"
                  )}
                </span>
                <span className="subtitle_sm">OTA</span>
              </motion.li>
              <motion.li
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <h3>
                  <strong>
                    <AnimatedNumber
                      value={statsData.totalcompleted ?? 0}
                      duration={1.2}
                      decimals={0}
                    />
                  </strong>
                </h3>
                <span
                  className={`overline_text d-flex align-items-center ${
                    statsData.completedPerDiffStatus === "down"
                      ? "text-danger"
                      : "text-success"
                  }`}
                >
                  {statsData.completedPerDiffStatus === "down" ? (
                    <FiTrendingDown className="me-1" />
                  ) : (
                    <FiTrendingUp className="me-1" />
                  )}
                  <AnimatedNumber
                    value={statsData.completedPerDiff ?? 0}
                    duration={1.2}
                    decimals={2}
                    suffix=" %"
                  />
                </span>
                <span className="subtitle_sm">Completed</span>
              </motion.li>
            </ul>
          </motion.div>
          <motion.div
            className="cardNew w-100  p-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
          >
            <ul className="last_stats">
              <motion.li
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
              >
                <h3>
                  <strong>
                    <AnimatedNumber
                      value={statsData.AvgTripHour || 0}
                      duration={1.2}
                      decimals={2}
                    />
                  </strong>
                </h3>
                <span className="subtitle_sm text-primary">Avg Trip Time</span>
              </motion.li>

              <motion.li
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.45 }}
              >
                <h3>
                  <strong>
                    <AnimatedNumber
                      value={statsData.SingleEmpTrips || 0}
                      duration={1.2}
                      decimals={0}
                    />
                  </strong>
                </h3>
                <span
                  className={`overline_text d-flex align-items-center ${
                    statsData.SingleEmpTripPerDiffStatus === "down"
                      ? "text-danger"
                      : "text-success"
                  }`}
                >
                  {statsData.SingleEmpTripPerDiffStatus === "down" ? (
                    <FiTrendingDown className="me-1" />
                  ) : (
                    <FiTrendingUp className="me-1" />
                  )}
                  <AnimatedNumber
                    value={statsData.SingleEmpTripPerDiff ?? 0}
                    duration={1.2}
                    decimals={2}
                    suffix=" %"
                  />
                </span>
                <span className="subtitle_sm text-warning">
                  Single Emp. Trips
                </span>
              </motion.li>
              <motion.li
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.55 }}
              >
                <h3>
                  <strong>
                    <AnimatedNumber
                      value={statsData.totalnoshow ?? 0}
                      duration={1.2}
                      decimals={0}
                    />
                  </strong>
                </h3>
                <span className="subtitle_sm text-danger">No Shows</span>
              </motion.li>
            </ul>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default React.memo(RiStats);