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

import React, { useEffect, useState } from "react";
import { apiService } from "../../../services/api";

const RouteBreakDuty = ({ filter = {} }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
        if (typeof arr === 'string') {
          try {
            arr = JSON.parse(arr);
          } catch (e) {
            arr = [];
          }
        }
        // Map API response to recharts format
        const chartData = (Array.isArray(arr) ? arr : []).map(item => ({
          month: item.MonthName || item.month || item.Month || "",
          routes: Number(item.completecount ?? item.routes ?? item.Routes ?? 0),
          breakdowns: Number(item.breakdowncount ?? item.breakdowns ?? item.Breakdowns ?? 0),
          dutyHours: Number(item.dutyhourcount ?? item.dutyHours ?? item.DutyHours ?? 0),
        }));
        setData(chartData);
      } catch (err) {
        setError(err?.message || 'Error fetching data');
      }
      setLoading(false);
    };
    fetchData();
  }, [filter]);

  return (
    <div className="cardx border-0 p-3">
      <h6>Routes vs Breakdowns vs Duty Hours</h6>
      <hr />
      {loading && <div>Loading...</div>}
      {error && <div style={{color:'red'}}>Error: {error}</div>}
      {!loading && !error && data && data.length > 0 && (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#666" }} axisLine={{ stroke: "#e0e0e0" }} />
            <YAxis tick={{ fontSize: 11, fill: "#666" }} axisLine={{ stroke: "#e0e0e0" }} />
            <Tooltip formatter={(value, name) => {
              if (name === "dutyHours") return [`${value} hrs`, "Duty Hours"];
              if (name === "routes") return [value, "Routes Completed"];
              if (name === "breakdowns") return [value, "Breakdowns"];
              return [value, name];
            }} />
            <Legend 
              wrapperStyle={{ fontSize: 12, paddingTop: 15 }} 
              iconType="line"
              formatter={(value, entry) => {
                // entry.dataKey gives the correct key for the legend item
                let count = 0;
                if (entry && entry.dataKey) {
                  count = data.reduce((a, b) => a + (b[entry.dataKey] || 0), 0);
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
            <Line type="monotone" dataKey="routes" stroke="#3b82f6" strokeWidth={3} dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }} activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2 }} name="Routes Completed" />
            <Line type="monotone" dataKey="breakdowns" stroke="#ef4444" strokeWidth={3} dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }} activeDot={{ r: 6, stroke: "#ef4444", strokeWidth: 2 }} name="Breakdowns" />
            <Line type="monotone" dataKey="dutyHours" stroke="#10b981" strokeWidth={3} dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }} activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2 }} name="Duty Hours" />
          </LineChart>
        </ResponsiveContainer>
      )}
      {!loading && !error && (!data || data.length === 0) && <div>No data available.</div>}
    </div>
  );
};

export default RouteBreakDuty;
