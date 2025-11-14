import React, { useEffect, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { apiService } from "../../../services/api";
import Loader from "../../common/Loader";

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const p = payload[0].payload || {};
  const isPercent = p.skill && p.skill.includes("%");
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid rgba(0,0,0,0.12)",
        padding: 8,
        borderRadius: 4,
        minWidth: 160,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{p.skill}</div>
      <div style={{ fontSize: 13 }}>
        {isPercent ? `${payload[0].value}%` : `${payload[0].value} count`}
      </div>
    </div>
  );
};

const DriverFragmentation = ({ filter = {} }) => {
  const [driverData, setDriverData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const {
    sDate = "",
    eDate = "",
    locationid = "",
    facilityid = "",
    vendorid = "",
    triptype = "",
  } = filter;

  useEffect(() => {
    let mounted = true;

    const requestWithTimeout = (promise, ms = 8000) => {
      let timeoutId;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error("Request timed out")),
          ms
        );
      });
      return Promise.race([promise, timeoutPromise]).finally(() =>
        clearTimeout(timeoutId)
      );
    };

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await requestWithTimeout(
          apiService.getchart_Efficiency({
            sDate: filter.sDate,
            eDate: filter.eDate,
            locationid: filter.locationid || null,
            facilityid: filter.facilityid || null,
            vendorid: filter.vendorid || null,
            triptype: filter.triptype || null,
          })
        );

        let payload = res?.data ?? res;
        if (typeof payload === "string") {
          try {
            payload = JSON.parse(payload);
          } catch (e) {
            /* ignore */
          }
        }

        const obj = Array.isArray(payload) ? payload[0] : payload || {};

        const formattedData = [
          {
            skill: "On-time Count",
            current: Number(
              obj.ontimecount ??
                obj.OnTimeCount ??
                obj.onTimeCount ??
                0
            ),
          },
          {
            skill: "BGC Done",
            current: Number(
              obj.BGCDone ?? obj.BGCDoneCount ?? obj.bgcdone ?? 0
            ),
          },
          {
            skill: "Driver Refusal Count",
            current: Number(
              obj.DriverRefusalCount ??
                obj.DriverRefusal ??
                obj.driverRefusalCount ??
                0
            ),
          },
          {
            skill: "Drivers 50+ (%)",
            current: Number(
              obj.DriverfifthyAbovePer ??
                obj.DriverFiftyAbovePer ??
                obj.Driver50AbovePer ??
                0
            ),
          },
          {
            skill: "Duty Hour >12 Count",
            current: Number(
              obj.dutyhourAboveTwelvecount ??
                obj.DutyHourAbove12Count ??
                obj.dutyHourAbove12Count ??
                0
            ),
          },
        ];

        if (mounted) {
          setDriverData(formattedData);
          setRetryCount(0);
          setError(null);
        }
      } catch (err) {
        console.error("API Error:", err);
        setError(err?.message || "Failed to load data");

        if (retryCount < maxRetries) {
          console.log(
            `Auto-retrying DriverFragmentation... Attempt ${retryCount + 1}/${maxRetries}`
          );
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 2000);
        } else {
          if (mounted) setDriverData([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, [sDate, eDate, locationid, facilityid, vendorid, triptype, retryCount]);

  if (error && retryCount >= maxRetries) {
    return (
      <div className="cardx border-0 p-3">
        <h6>Driver Fragmentation</h6>
        <hr />
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
            ⚠️ Failed to load chart data
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
    <div className="cardx border-0 p-3">
      <Loader isVisible={loading} fullScreen={false} />
      <h6>Driver Fragmentation</h6>
      <hr />
      {!loading && driverData.length > 0 && (
        <>
          <div style={{ height: "300px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                data={driverData}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <PolarGrid gridType="polygon" />
                <PolarAngleAxis
                  dataKey="skill"
                  tick={{ fontSize: 11, fill: "#666", textAnchor: "middle" }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[
                    0,
                    Math.max(100, ...driverData.map((d) => d.current)),
                  ]}
                  tick={{ fontSize: 10, fill: "#999" }}
                  tickFormatter={(value) => `${value}`}
                />
                <Radar
                  name="Driver Metrics"
                  dataKey="current"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginTop: 12,
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {driverData.map((d, i) => {
              const isPercent = d.skill && d.skill.includes("%");
              return (
                <div
                  key={i}
                  style={{
                    flex: "1 1 18%",
                    minWidth: 110,
                    textAlign: "center",
                    padding: "6px 8px",
                    borderRadius: 6,
                    background: "#fafafa",
                    border: "1px solid rgba(0,0,0,0.04)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: "#555",
                      marginBottom: 4,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {d.skill}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#222" }}>
                    {isPercent ? `${d.current}%` : d.current}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default DriverFragmentation;