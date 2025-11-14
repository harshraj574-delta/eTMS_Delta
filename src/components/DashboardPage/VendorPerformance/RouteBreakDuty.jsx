import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { apiService } from "../../../services/api";
import Loader from "../../common/Loader";

const RouteBreakDuty = ({ filter = {} }) => {
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
          facilityid: filter.facilityid || "",
          vendorid: filter.vendorid || "",
          triptype: filter.triptype || "",
        };
        const result = await apiService.getchart_monthlyRoutedetails(params);
        let arr = result;
        if (typeof arr === "string") {
          try {
            arr = JSON.parse(arr);
          } catch (e) {
            arr = [];
          }
        }

        const chartData = (Array.isArray(arr) ? arr : []).map((item) => ({
          month: item.MonthName || item.month || item.Month || "",
          routes: Number(
            item.completecount ?? item.routes ?? item.Routes ?? 0
          ),
          breakdowns: Number(
            item.breakdowncount ?? item.breakdowns ?? item.Breakdowns ?? 0
          ),
          dutyHours: Number(
            item.dutyhourcount ?? item.dutyHours ?? item.DutyHours ?? 0
          ),
        }));

        if (chartData.length === 0) throw new Error("No data available");

        setData(chartData);
        setRetryCount(0);
        setError(null);
      } catch (err) {
        console.error("RouteBreakDuty Error:", err);
        setError(err?.message || "Error fetching data");

        if (retryCount < maxRetries) {
          console.log(
            `Auto-retrying RouteBreakDuty... Attempt ${retryCount + 1}/${maxRetries}`
          );
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 2000);
        } else {
          setData([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filter, retryCount]);

  if (error && retryCount >= maxRetries) {
    return (
      <div className="cardx border-0 p-3">
        <h6>Routes vs Breakdowns vs Duty Hours</h6>
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
      <h6>Routes vs Breakdowns vs Duty Hours</h6>
      <hr />
      {!loading && data.length > 0 && (
        <ResponsiveContainer width="100%" height={320}>
          <LineChart
            data={data}
            margin={{ top: 20, right: 60, left: 20, bottom: 50 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "#666" }}
              axisLine={{ stroke: "#e0e0e0" }}
            />

            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: "#666" }}
              axisLine={{ stroke: "#e0e0e0" }}
              label={{
                value: "Routes / Duty Hours",
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle" },
              }}
            />

            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11, fill: "#666" }}
              axisLine={{ stroke: "#e0e0e0" }}
              label={{
                value: "Breakdowns",
                angle: 90,
                position: "insideRight",
                style: { textAnchor: "middle" },
              }}
            />

            <Tooltip
              formatter={(value, name) => {
                if (name === "dutyHours")
                  return [`${value} hrs`, "Duty Hours"];
                if (name === "routes") return [value, "Routes Completed"];
                if (name === "breakdowns") return [value, "Breakdowns"];
                return [value, name];
              }}
            />

            <Legend
              verticalAlign="bottom"
              align="center"
              height={36}
              wrapperStyle={{
                fontSize: 12,
                marginTop: 10,
              }}
              iconType="line"
              formatter={(value, entry) => {
                let count = 0;
                if (entry && entry.dataKey) {
                  count = data.reduce(
                    (a, b) => a + (b[entry.dataKey] || 0),
                    0
                  );
                }
                return `${
                  value === "routes"
                    ? "Routes Completed"
                    : value === "breakdowns"
                    ? "Breakdowns"
                    : value === "dutyHours"
                    ? "Duty Hours"
                    : value
                } (${count})`;
              }}
            />

            <Line
              yAxisId="left"
              type="monotone"
              dataKey="routes"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2 }}
              name="Routes Completed"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="breakdowns"
              stroke="#ef4444"
              strokeWidth={3}
              dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#ef4444", strokeWidth: 2 }}
              name="Breakdowns"
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="dutyHours"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2 }}
              name="Duty Hours"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
      {!loading && data.length === 0 && (
        <div className="text-center text-muted py-5">
          <p>No data available.</p>
        </div>
      )}
    </div>
  );
};

export default RouteBreakDuty;