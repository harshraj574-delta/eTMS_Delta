import {
  Pie,
  PieChart,
  ResponsiveContainer,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { useState, useEffect } from "react";
import { apiService } from "../../services/api";
import Loader from "../common/Loader";
import React from "react";

const VpVehicleDistribution = ({ filter }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = {
          sDate: filter.sDate,
          eDate: filter.eDate,
          locationid: filter.locationid || "",
          facilityid: filter?.facilityid || "",
          vendorid: filter?.vendorid || "",
          triptype: filter?.triptype || "",
        };

        const result = await apiService.getchart_vehDist(params);
        const colorMap = [
          "#3182bd",
          "#e6550d",
          "#31a354",
          "#6baed6",
          "#fd8d3c",
          "#fdae6b",
          "#74c476",
          "#a1d99b",
          "#FFD700",
          "#FFA500",
        ];

        let arr = result;
        if (typeof arr === "string") {
          try {
            arr = JSON.parse(arr);
          } catch (e) {
            throw new Error("Failed to parse API response");
          }
        }

        const vehicleTypeMap = {};
        (Array.isArray(arr) ? arr : []).forEach((item) => {
          const vt = item.Vehicletype;
          const val = Number(item.totalvehicle);
          if (!vehicleTypeMap[vt]) vehicleTypeMap[vt] = 0;
          vehicleTypeMap[vt] += isNaN(val) ? 0 : val;
        });

        const vehicleTypeData = Object.entries(vehicleTypeMap).map(
          ([name, value], idx) => ({
            name,
            value,
            color: colorMap[idx % colorMap.length],
          })
        );

        const billingTypeMap = {};
        (Array.isArray(arr) ? arr : []).forEach((item) => {
          const bt = item.BillingType;
          const val = Number(item.totalvehicle);
          if (!billingTypeMap[bt]) billingTypeMap[bt] = 0;
          billingTypeMap[bt] += isNaN(val) ? 0 : val;
        });

        const billingTypeData = Object.entries(billingTypeMap).map(
          ([name, value], idx) => ({
            name,
            value,
            color: colorMap[(idx + 3) % colorMap.length],
          })
        );

        if (vehicleTypeData.length === 0 || billingTypeData.length === 0) {
          throw new Error("No data available");
        }

        setData({ vehicleTypeData, billingTypeData });
        setRetryCount(0);
        setError(null);
      } catch (err) {
        console.error("VehicleDistribution Error:", err);
        setError(err?.message || "Failed to load chart data");

        if (retryCount < maxRetries) {
          console.log(
            `Auto-retrying VehicleDistribution... Attempt ${retryCount + 1}/${maxRetries}`
          );
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 2000);
        } else {
          setData([]);
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [filter, retryCount]);

  if (error && retryCount >= maxRetries) {
    return (
      <div className="cardx border-0 p-3">
        <h6>Vehicle Distribution</h6>
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
            ⚠️ {error}
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
      <h6>Vehicle Distribution</h6>
      <hr />
      <style>{`
        .recharts-legend-wrapper {
          font-size: 11px !important;
          font-weight: 500 !important;
          padding-top: 10px !important;
        }
        .recharts-legend-item-text {
          font-size: 11px !important;
          color: #333 !important;
        }
      `}</style>
      {!loading && data?.vehicleTypeData && data?.billingTypeData ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data.vehicleTypeData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              innerRadius={50}
              startAngle={90}
              endAngle={450}
              label
            >
              {data.vehicleTypeData.map((entry, index) => (
                <Cell
                  key={`cell-outer-${index}`}
                  fill={entry.color || "#3182bd"}
                />
              ))}
            </Pie>
            <Pie
              data={data.billingTypeData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={45}
              innerRadius={20}
              startAngle={90}
              endAngle={450}
              label={false}
            >
              {data.billingTypeData.map((entry, index) => (
                <Cell
                  key={`cell-inner-${index}`}
                  fill={entry.color || "#e6550d"}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null;
                const p = payload[0];
                return (
                  <div
                    style={{
                      background: "#fff",
                      border: "1px solid #ccc",
                      borderRadius: 3,
                      padding: 8,
                      fontSize: 12,
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>
                      {p.name || p.payload.name}
                    </span>
                    <br />
                    <span>{p.value}</span>
                  </div>
                );
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              payload={
                (data.billingTypeData || []).map((entry, idx) => ({
                  value: `${entry.name} (${entry.value})`,
                  type: "circle",
                  color: entry.color,
                  id: `legend-billing-${idx}`,
                })) || []
              }
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        !loading && (
          <div className="text-center text-muted py-5">
            <p style={{ fontSize: "16px", marginBottom: "8px" }}>
              No data available
            </p>
            <p style={{ fontSize: "14px", color: "#999" }}>
              Try adjusting your filters to see data
            </p>
          </div>
        )
      )}
    </div>
  );
};

export default React.memo(VpVehicleDistribution);