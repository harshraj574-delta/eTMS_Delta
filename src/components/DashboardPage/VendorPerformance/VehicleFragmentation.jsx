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

const VehicleFragmentation = ({ filter = {} }) => {
  const [vehicleData, setVehicleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

        // If API returned a JSON string, try to parse it.
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

        if (mounted) setVehicleData(mapped);
      } catch (err) {
        console.error("VehicleFragmentation fetch error:", err);
        if (mounted) setError(err.message || String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, [sDate, eDate, locationid, facilityid, vendorid, triptype]);

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

  return (
    <div className="cardx border-0 p-3 h-100">
      <h6>Vehicle Fragmentation</h6>
      <hr />
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div style={{ color: "red" }}>
          Error:{" "}
          {error?.message
            ? error.message
            : typeof error === "object"
            ? JSON.stringify(error)
            : String(error)}
        </div>
      ) : (
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
                //tickFormatter={(value) => `${value}%`}
              />
              {/* <Radar
                name="Vehicle Distribution"
                dataKey="current"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
                strokeWidth={2}
              /> */}
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
          {/* Labels row shown under the chart */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 8,
              flexWrap: "wrap",
              marginTop: 10,
            }}
          >
            {vehicleData && vehicleData.length
              ? vehicleData.map((d, i) => (
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
                      {d.skill} — {Number(d.current || 0).toLocaleString()}{" "}
                      routes
                      {d.routePer !== undefined ? ` — ${d.routePer}%` : ""}
                    </span>
                  </div>
                ))
              : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleFragmentation;
