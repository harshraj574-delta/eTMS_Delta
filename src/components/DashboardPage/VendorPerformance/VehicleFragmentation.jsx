import React, { useState, useEffect } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { apiService } from "../../../services/api.js";
import Loader from "../../common/Loader";

const VehicleFragmentation = ({ filter = {} }) => {
  const [vehicleData, setVehicleData] = useState([]);
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

    const fetchData = async () => {
      if (!mounted) return;
      setLoading(true);
      setError(null);

      try {
        const params = {
          sDate,
          eDate,
          locationid,
          facilityid,
          vendorid,
          triptype,
        };

        let data = await apiService.getchart_VehFrag(params);

        if (typeof data === "string") {
          try {
            data = JSON.parse(data);
          } catch (parseErr) {
            throw new Error("Invalid JSON returned from API");
          }
        }

        if (!Array.isArray(data))
          throw new Error("API did not return an array");

        const mapped = data.map((item) => ({
          skill: item.Vehicletype,
          current: Number(item.totalroute) || 0,
          routePer:
            item.routePer !== undefined ? Number(item.routePer) : undefined,
        }));

        if (mapped.length === 0) throw new Error("No data available");

        if (mounted) {
          setVehicleData(mapped);
          setRetryCount(0);
          setError(null);
        }
      } catch (err) {
        console.error("VehicleFragmentation fetch error:", err);
        setError(err.message || String(err));

        if (retryCount < maxRetries) {
          console.log(
            `Auto-retrying VehicleFragmentation... Attempt ${retryCount + 1}/${maxRetries}`
          );
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 2000);
        } else {
          if (mounted) setVehicleData([]);
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

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const p = payload[0].payload || {};
    return (
      <div
        style={{
          background: "#fff",
          border: "1px solid rgba(0,0,0,0.12)",
          padding: 8,
          borderRadius: 4,
          minWidth: 140,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 6 }}>{p.skill}</div>
        <div style={{ fontSize: 13 }}>{payload[0].value} routes</div>
        {p.routePer !== undefined && (
          <div style={{ fontSize: 12, color: "#666" }}>{p.routePer}%</div>
        )}
      </div>
    );
  };

  if (error && retryCount >= maxRetries) {
    return (
      <div className="cardx border-0 p-3 h-100">
        <h6>Vehicle Fragmentation</h6>
        <hr />
        <div
          style={{
            padding: "2rem",
            background: "#fff3cd",
            borderRadius: "8px",
            textAlign: "center",
            border: "1px solid #ffc107",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "240px",
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
    <div className="cardx border-0 p-3 h-100">
      <Loader isVisible={loading} fullScreen={false} />
      <h6>Vehicle Fragmentation</h6>
      <hr />
      {!loading && vehicleData.length > 0 && (
        <>
          <div style={{ height: "240px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart
                data={vehicleData}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <PolarGrid gridType="polygon" />
                <PolarAngleAxis
                  dataKey="skill"
                  tick={{ fontSize: 11, fill: "#666", textAnchor: "middle" }}
                  className="text-muted"
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[
                    0,
                    Math.max(
                      100,
                      ...(vehicleData.length
                        ? vehicleData.map((d) => d.current)
                        : [0])
                    ),
                  ]}
                  tick={{ fontSize: 10, fill: "#999" }}
                />
                <Radar
                  dataKey="current"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ display: "none" }}
                  verticalAlign="bottom"
                  align="center"
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              flexWrap: "wrap",
              marginTop: 10,
            }}
          >
            {vehicleData.map((d, i) => (
              <div
                key={i}
                title={`${d.skill} - ${d.current} routes${
                  d.routePer !== undefined ? ` - ${d.routePer}%` : ""
                }`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "4px 8px",
                  borderRadius: 12,
                  background: "#f5f5f5",
                  fontSize: 12,
                  color: "#333",
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    background: "#3b82f6",
                    borderRadius: 2,
                    display: "inline-block",
                  }}
                />
                <span style={{ whiteSpace: "nowrap" }}>
                  {d.skill} — {Number(d.current || 0).toLocaleString()} routes
                  {d.routePer !== undefined ? ` — ${d.routePer}%` : ""}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
      {!loading && vehicleData.length === 0 && (
        <div className="text-center text-muted py-5">
          <p>No data available.</p>
        </div>
      )}
    </div>
  );
};

export default VehicleFragmentation;